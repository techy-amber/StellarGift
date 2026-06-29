/* eslint-disable @typescript-eslint/no-explicit-any */
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { selectedModuleId } from '@creit.tech/stellar-wallets-kit/state';

let isInitialized = false;

if (typeof window !== 'undefined') {
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    selectedWalletId: 'freighter',
    modules: [
      new FreighterModule(),
      new xBullModule(),
      new AlbedoModule(),
      new LobstrModule(),
    ],
  });
  isInitialized = true;
}

export function getActiveWalletId(): string | null {
  return selectedModuleId.value || null;
}

export async function openWalletModal(
  onWalletSelected: (address: string, walletId: string) => void
): Promise<void> {
  if (!isInitialized) throw new Error('StellarWalletsKit is not initialized.');

  try {
    const { address } = await StellarWalletsKit.authModal();
    const walletId = selectedModuleId.value || 'freighter';
    onWalletSelected(address, walletId);
  } catch (e: any) {
    console.error('Wallet connection failed:', e);
    throw new Error(e.message || 'Failed to connect wallet');
  }
}

export async function signTx(xdr: string): Promise<string> {
  if (!isInitialized) throw new Error('StellarWalletsKit is not initialized.');
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr);
  return signedTxXdr;
}
export async function disconnectWallet(): Promise<void> {
  if (!isInitialized) return;
  await StellarWalletsKit.disconnect();
}
