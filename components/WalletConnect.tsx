'use client';

import { useState, useEffect } from 'react';
import { openWalletModal } from '@/lib/wallet';

interface WalletConnectProps {
  address: string | null;
  walletId: string | null;
  onConnect: (address: string, walletId: string) => void;
  onDisconnect: () => void;
}

export default function WalletConnect({ address, walletId, onConnect, onDisconnect }: WalletConnectProps) {
  const [error, setError] = useState<string | null>(null);
  const [isWalletInstalled, setIsWalletInstalled] = useState<boolean>(true);

  // Auto-connect if already authorized on mount
  useEffect(() => {
    async function checkAutoConnect() {
      if (typeof window !== 'undefined') {
        try {
          const { StellarWalletsKit } = await import('@creit.tech/stellar-wallets-kit');
          const { getActiveWalletId } = await import('@/lib/wallet');
          const { address: savedAddress } = await StellarWalletsKit.getAddress();
          if (savedAddress) {
            onConnect(savedAddress, getActiveWalletId() || 'freighter');
          }
        } catch (e) {
          // Silently ignore failed auto-connect
        }
      }
    }
    checkAutoConnect();
  }, [onConnect]);

  async function handleConnect() {
    setError(null);
    try {
      await openWalletModal((addr, id) => {
        onConnect(addr, id);
      });
    } catch (e: any) {
      setError(e.message || 'Connection failed.');
    }
  }

  async function handleDisconnect() {
    try {
      const { disconnectWallet } = await import('@/lib/wallet');
      await disconnectWallet();
    } catch (e) {
      console.error(e);
    }
    onDisconnect();
  }

  // Get a readable wallet name
  const getWalletName = (id: string | null) => {
    if (!id) return '';
    if (id.toLowerCase().includes('freighter')) return '🪐 Freighter';
    if (id.toLowerCase().includes('xbull')) return '🐂 xBull';
    if (id.toLowerCase().includes('albedo')) return '🌤 Albedo';
    if (id.toLowerCase().includes('lobstr')) return '🦞 Lobstr';
    return `👛 ${id.charAt(0).toUpperCase() + id.slice(1)}`;
  };

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="wallet-pill flex items-center gap-2 bg-[#EBF4EE] border border-[rgba(74,124,89,0.3)] rounded-[24px] px-3.5 py-1.5 text-[13px] font-medium text-[#4A7C59]">
          <span className="w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse"></span>
          <span>{getWalletName(walletId)} Connected</span>
          <span className="text-[12px] opacity-75 font-mono ml-1.5 border-l border-[rgba(74,124,89,0.2)] pl-2">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="btn-disconnect font-serif text-sm font-semibold text-[#9B3B2E] bg-transparent border-none cursor-pointer transition-all hover:text-[#c54e3f]"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        className="btn-connect font-serif text-sm font-semibold text-[#1C1A16] border border-[#1C1A16] bg-transparent rounded-[24px] px-6 py-2 cursor-pointer transition-all hover:bg-[#1C1A16] hover:text-[#F8F4EE]"
      >
        Connect Wallet
      </button>
      {error && (
        <div className="absolute right-0 top-[45px] z-50 bg-[#FAEDEB] border border-[rgba(155,59,46,0.3)] text-[#9B3B2E] text-xs px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
