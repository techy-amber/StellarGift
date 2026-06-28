'use client';

import { isConnected, getAddress, requestAccess } from '@stellar/freighter-api';
import { useState, useEffect } from 'react';

interface WalletConnectProps {
  address: string | null;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

export default function WalletConnect({ address, onConnect, onDisconnect }: WalletConnectProps) {
  const [error, setError] = useState<string | null>(null);
  const [isWalletInstalled, setIsWalletInstalled] = useState<boolean | null>(null);

  // Check if Freighter is installed and authorized on mount
  useEffect(() => {
    async function checkFreighter() {
      try {
        const result = await isConnected();
        setIsWalletInstalled(!!result.isConnected);
        if (result.isConnected) {
          const addrResult = await getAddress();
          if (addrResult.address) {
            onConnect(addrResult.address);
          }
        }
      } catch (e) {
        setIsWalletInstalled(false);
      }
    }
    checkFreighter();
  }, [onConnect]);

  async function handleConnect() {
    setError(null);
    try {
      const result = await isConnected();
      if (!result.isConnected) {
        setError('Freighter wallet not found. Please install the Freighter extension.');
        return;
      }
      
      // Request wallet access (triggers Freighter authorization prompt)
      const addrResult = await requestAccess();
      if (addrResult.error) {
        throw new Error(addrResult.error);
      }

      if (addrResult.address) {
        onConnect(addrResult.address);
      } else {
        setError('Access denied. Please authorize your wallet.');
      }
    } catch (e: any) {
      setError(e.message || 'Connection failed.');
    }
  }

  function handleDisconnect() {
    onDisconnect();
  }

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="wallet-pill flex items-center gap-2 bg-[#EBF4EE] border border-[rgba(74,124,89,0.3)] rounded-[24px] px-3.5 py-1.5 text-[13px] font-medium text-[#4A7C59]">
          <div className="wallet-dot w-2 height w-2 h-2 bg-[#4A7C59] rounded-full animate-pulse"></div>
          <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-[#9B3B2E] hover:text-[#faedeb] hover:bg-[#9B3B2E] px-2 py-1 rounded transition-all"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleConnect}
        className="btn-connect bg-[#1C1A16] text-[#F8F4EE] hover:bg-[#3D3A32] hover:-translate-y-0.5 border-none rounded-lg px-5 py-2.5 text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
      >
        Connect Wallet
      </button>
      {error && <span className="text-xs text-[#9B3B2E] bg-[#FAEDEB] px-2 py-1 rounded border border-[rgba(155,59,46,0.2)]">{error}</span>}
    </div>
  );
}
