import {
  Networks,
  TransactionBuilder,
  Asset,
  Horizon,
  BASE_FEE,
  Keypair,
  rpc,
  Contract,
  Address,
  xdr,
  Account,
  scValToNative
} from '@stellar/stellar-sdk';

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK === 'PUBLIC'
  ? Networks.PUBLIC
  : Networks.TESTNET;

export const server = new Horizon.Server(HORIZON_URL);
export const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NATIVE_TOKEN_ID = process.env.NEXT_PUBLIC_NATIVE_TOKEN_ID!;

/**
 * Fetch native XLM balance of an address.
 */
export async function fetchBalance(address: string): Promise<string> {
  try {
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    return nativeBalance?.balance || '0';
  } catch (e: any) {
    if (e.response?.status === 404) {
      return '0';
    }
    throw e;
  }
}

function bigIntToI128ScVal(value: bigint): xdr.ScVal {
  const hi = value >> BigInt(64);
  const lo = value & BigInt("18446744073709551615");
  return xdr.ScVal.scvI128(
    new xdr.Int128Parts({
      hi: new xdr.Int64(hi),
      lo: new xdr.Uint64(lo),
    })
  );
}

/**
 * Create a gift card on-chain using the Soroban smart contract.
 */
export async function createGiftOnChain(
  senderAddress: string,
  giftId: string,
  amount: string,
  message: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  // Load source account details from RPC
  const account = await rpcServer.getAccount(senderAddress);
  const contract = new Contract(CONTRACT_ID);

  // Convert amount to stroops (7 decimals)
  const stroops = BigInt(Math.round(parseFloat(amount) * 10000000));

  // Build the call operation
  const callOp = contract.call(
    'create_gift',
    xdr.ScVal.scvSymbol(giftId),
    new Address(senderAddress).toScVal(),
    new Address(NATIVE_TOKEN_ID).toScVal(),
    bigIntToI128ScVal(stroops),
    xdr.ScVal.scvString(message)
  );

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(callOp)
    .setTimeout(180)
    .build();

  // Simulate transaction to estimate resource fees
  const simulation = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  // Assemble transaction with estimated fees
  tx = rpc.assembleTransaction(tx, simulation).build();

  const signedXdr = await signTransaction(tx.toXDR());
  if (!signedXdr) {
    throw new Error('Transaction signing was cancelled.');
  }

  // Submit transaction to Soroban RPC
  const result = await rpcServer.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  );

  if (result.status === 'ERROR') {
    throw new Error(`Transaction failed to submit: ${JSON.stringify(result.errorResult)}`);
  }

  // Poll for result
  let status: string = result.status;
  let txHash = result.hash;
  
  // Wait up to 30 seconds for transaction finalization
  for (let i = 0; i < 15; i++) {
    if (status === 'SUCCESS') break;
    if (status === 'FAILED') throw new Error('Transaction execution failed.');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    const poll = await rpcServer.getTransaction(txHash);
    status = poll.status;
  }

  return txHash;
}

/**
 * Claim a gift card on-chain using the Soroban smart contract.
 */
export async function claimGiftOnChain(
  recipientAddress: string,
  giftId: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  const account = await rpcServer.getAccount(recipientAddress);
  const contract = new Contract(CONTRACT_ID);

  const callOp = contract.call(
    'claim_gift',
    xdr.ScVal.scvSymbol(giftId),
    new Address(recipientAddress).toScVal()
  );

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(callOp)
    .setTimeout(180)
    .build();

  const simulation = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  tx = rpc.assembleTransaction(tx, simulation).build();

  const signedXdr = await signTransaction(tx.toXDR());
  if (!signedXdr) {
    throw new Error('Transaction signing was cancelled.');
  }

  const result = await rpcServer.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  );

  if (result.status === 'ERROR') {
    throw new Error(`Transaction submission failed: ${JSON.stringify(result.errorResult)}`);
  }

  let status: string = result.status;
  let txHash = result.hash;

  for (let i = 0; i < 15; i++) {
    if (status === 'SUCCESS') break;
    if (status === 'FAILED') throw new Error('Transaction execution failed.');

    await new Promise(resolve => setTimeout(resolve, 2000));
    const poll = await rpcServer.getTransaction(txHash);
    status = poll.status;
  }

  return txHash;
}

/**
 * Fetch gift card details from the contract.
 */
export async function getGiftFromContract(giftId: string) {
  const contract = new Contract(CONTRACT_ID);
  const dummySource = 'GBY67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T';

  try {
    const account = new Account(dummySource, '0');
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_gift', xdr.ScVal.scvSymbol(giftId)))
      .setTimeout(30)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      const scVal = sim.result.retval;
      const native = scValToNative(scVal);
      if (native === undefined || native === null) {
        return null; // Gift does not exist
      }

      return {
        sender: native.sender,
        token: native.token,
        amount: (Number(native.amount) / 10000000).toString(),
        message: native.message,
        claimed: native.claimed,
        recipient: native.recipient || null,
      };
    }
    return null;
  } catch (e) {
    console.error('Error fetching gift from contract:', e);
    return null;
  }
}
