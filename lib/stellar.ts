import {
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Horizon,
  BASE_FEE,
  Keypair
} from '@stellar/stellar-sdk';

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_NETWORK === 'PUBLIC'
  ? Networks.PUBLIC
  : Networks.TESTNET;

export const server = new Horizon.Server(HORIZON_URL);

/**
 * Fetch native XLM balance of an address.
 * Returns '0' if the account does not exist or has no native balance.
 */
export async function fetchBalance(address: string): Promise<string> {
  try {
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    return nativeBalance?.balance || '0';
  } catch (e: any) {
    if (e.response?.status === 404) {
      return '0'; // Account not funded yet
    }
    throw e;
  }
}

/**
 * Funds a new gift address from a sender Freighter wallet.
 * Uses Operation.createAccount to activate the new keypair.
 */
export async function sendGift(
  fromAddress: string,
  toAddress: string,
  amount: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  // Load account to get sequence number
  const account = await server.loadAccount(fromAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.createAccount({
        destination: toAddress,
        startingBalance: amount,
      })
    )
    .setTimeout(180) // 3 minutes timeout
    .build();

  const xdr = tx.toXDR();
  const signedXdr = await signTransaction(xdr);
  
  if (!signedXdr) {
    throw new Error('Transaction signing was cancelled.');
  }

  const result = await server.submitTransaction(
    TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  );

  return result.hash;
}

/**
 * Sweeps native XLM from a gift keypair to a recipient address.
 * Signs with the gift's secret key directly.
 */
export async function claimGift(secretKey: string, recipientAddress: string): Promise<string> {
  const giftKeypair = Keypair.fromSecret(secretKey);
  const giftAddress = giftKeypair.publicKey();

  const account = await server.loadAccount(giftAddress);
  const balance = account.balances.find(b => b.asset_type === 'native')?.balance || '0';
  
  // Account must have enough balance. Since it must retain 1 XLM reserve and cover BASE_FEE
  // (which is 100 stroops = 0.00001 XLM, but we keep 1.01 XLM to be extremely safe).
  const balanceFloat = parseFloat(balance);
  const reserveAndFee = 1.01;
  
  if (balanceFloat <= reserveAndFee) {
    throw new Error(`Insufficient funds in the gift account to cover the reserve (needs at least ${reserveAndFee} XLM).`);
  }

  const sendAmount = (balanceFloat - reserveAndFee).toFixed(7);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: recipientAddress,
        asset: Asset.native(),
        amount: sendAmount,
      })
    )
    .setTimeout(180)
    .build();

  tx.sign(giftKeypair);
  const result = await server.submitTransaction(tx);
  return result.hash;
}
