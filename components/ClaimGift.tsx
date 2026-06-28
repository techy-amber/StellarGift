'use client';

import { useState, useEffect } from 'react';
import { isConnected, getAddress } from '@stellar/freighter-api';
import { fetchBalance, claimGift } from '@/lib/stellar';
import { Keypair } from '@stellar/stellar-sdk';

interface ClaimGiftProps {
  secretKey: string;
}

export default function ClaimGift({ secretKey }: ClaimGiftProps) {
  const [giftAddress, setGiftAddress] = useState<string>('');
  const [giftBalance, setGiftBalance] = useState<string>('0');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Derive gift address from secret key and fetch balance on load
  useEffect(() => {
    async function loadGiftDetails() {
      try {
        setError(null);
        setChecking(true);
        
        // Derive address
        const kp = Keypair.fromSecret(secretKey);
        const pubKey = kp.publicKey();
        setGiftAddress(pubKey);

        // Fetch balance
        const balance = await fetchBalance(pubKey);
        setGiftBalance(balance);
      } catch (e: any) {
        console.error('Failed to load gift:', e);
        setError('Invalid gift secret key or problem loading gift account.');
      } finally {
        setChecking(false);
      }
    }
    if (secretKey) {
      loadGiftDetails();
    }
  }, [secretKey]);

  async function connectRecipientWallet() {
    setWalletError(null);
    try {
      const result = await isConnected();
      if (!result.isConnected) {
        setWalletError('Freighter wallet not found.');
        return;
      }
      
      const addrResult = await getAddress();
      if (addrResult.error) {
        throw new Error(addrResult.error);
      }

      if (addrResult.address) {
        setRecipientAddress(addrResult.address);
      } else {
        setWalletError('Access denied.');
      }
    } catch (e: any) {
      setWalletError(e.message || 'Connection failed.');
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessHash(null);
    setLoading(true);

    try {
      if (!recipientAddress.startsWith('G') || recipientAddress.length !== 56) {
        setError('Please enter a valid Stellar public key (starting with G).');
        setLoading(false);
        return;
      }

      // Execute sweep
      const hash = await claimGift(secretKey, recipientAddress);
      setSuccessHash(hash);
      
      // Update balance to 0 (or remaining reserve)
      setGiftBalance('0');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Something went wrong. Check the recipient address.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-[#C9A96E] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#6B6558] font-medium text-sm">Verifying gift link and checking balance...</p>
      </div>
    );
  }

  const giftVal = parseFloat(giftBalance);

  if (successHash) {
    return (
      <div className="bg-[#FDFCF9] border border-[rgba(74,124,89,0.3)] rounded-[20px] p-6 md:p-8 max-w-xl mx-auto shadow-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBF4EE] text-[#4A7C59] text-2xl mb-4 font-bold">
          ✓
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#1C1A16]">Gift Claimed Successfully!</h3>
        <p className="text-sm text-[#6B6558] mt-2 mb-6">
          The funds have been swept to the recipient address.
        </p>

        <div className="border-t border-[rgba(28,26,22,0.1)] pt-5 text-left mb-6">
          <div className="text-[12px] text-[#9B968C] uppercase font-semibold tracking-wide mb-1">Transaction Proof</div>
          <div className="tx-hash font-mono text-xs text-[#6B6558] bg-[#EDE8DF] px-3 py-2 rounded-md word-break-all break-all mb-3 select-all">
            {successHash}
          </div>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${successHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link text-[12px] font-semibold text-[#9E7A3F] hover:underline"
          >
            View on Stellar Expert Explorer →
          </a>
        </div>
      </div>
    );
  }

  if (giftVal <= 1.01) {
    return (
      <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-8 max-w-md mx-auto shadow-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAEDEB] text-[#9B3B2E] text-2xl mb-4">
          ✕
        </div>
        <h3 className="font-serif text-xl font-bold text-[#1C1A16]">Gift Already Claimed or Empty</h3>
        <p className="text-sm text-[#6B6558] mt-2 mb-4 leading-relaxed">
          This gift link has already been swept, or contains less than the minimum balance required to sweep (1.01 XLM).
        </p>
        <div className="text-xs font-mono text-[#9B968C] bg-[#F2EDE4] py-2 px-3 rounded break-all">
          Account: {giftAddress}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-6 md:p-8 max-w-xl mx-auto shadow-md">
      <div className="text-center mb-6">
        <div className="font-serif text-sm tracking-wider uppercase text-[#9E7A3F] font-semibold mb-1">You received a gift</div>
        <div className="gift-card-amount font-serif text-5xl font-bold text-[#1C1A16] mb-1 leading-none">{(giftVal - 1.01).toFixed(4)}</div>
        <div className="text-sm text-[#6B6558]">XLM on Stellar Testnet (after reserve & fee deduction)</div>
      </div>

      <div className="bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-[12px] p-4.5 mb-6 text-sm">
        <div className="flex justify-between py-1 border-b border-[rgba(28,26,22,0.06)]">
          <span className="text-[#6B6558]">Total Raw Gift Balance</span>
          <span className="font-semibold text-[#1C1A16]">{giftVal.toFixed(4)} XLM</span>
        </div>
        <div className="flex justify-between py-1 border-b border-[rgba(28,26,22,0.06)]">
          <span className="text-[#6B6558]">Stellar Ledger Minimum Reserve</span>
          <span className="font-semibold text-[#9B3B2E]">-1.00 XLM</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-[#6B6558]">Transaction Network Fee Margin</span>
          <span className="font-semibold text-[#9B3B2E]">-0.01 XLM</span>
        </div>
      </div>

      <form onSubmit={handleClaim} className="space-y-4">
        <div className="form-row">
          <div className="flex justify-between items-center mb-1.5">
            <label className="form-label text-[13px] font-medium text-[#3D3A32] m-0">Destination Address (G...)</label>
            <button
              type="button"
              onClick={connectRecipientWallet}
              className="text-xs text-[#9E7A3F] font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              Auto-fill from Freighter
            </button>
          </div>
          
          <input
            className="form-input w-full px-4 py-3 bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-lg text-base text-[#1C1A16] outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[rgba(201,169,110,0.12)] transition-all font-sans"
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="e.g. GABC3KX7Q..."
            required
            disabled={loading}
          />
          {walletError && <span className="text-xs text-[#9B3B2E] mt-1 block">{walletError}</span>}
        </div>

        <button
          type="submit"
          disabled={loading || !recipientAddress}
          className="btn-action w-full py-3.5 bg-[#1C1A16] text-[#F8F4EE] hover:bg-[#3D3A32] disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all"
        >
          {loading ? 'Sweeping Funds...' : 'Claim Gift'}
        </button>
      </form>

      {error && (
        <div className="status-box bg-[#FAEDEB] text-[#9B3B2E] border border-[rgba(155,59,46,0.25)] rounded-lg px-4.5 py-3.5 text-[14px] mt-4 line-height-relaxed">
          {error}
        </div>
      )}
    </div>
  );
}
