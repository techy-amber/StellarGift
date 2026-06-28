'use client';

import { useState, useEffect } from 'react';
import { openWalletModal, signTx } from '@/lib/wallet';
import { fetchBalance, claimGiftOnChain, getGiftFromContract } from '@/lib/stellar';

interface ClaimGiftProps {
  secretKey: string; // Decoded giftId
}

export default function ClaimGift({ secretKey: giftId }: ClaimGiftProps) {
  const [giftDetails, setGiftDetails] = useState<{
    sender: string;
    token: string;
    amount: string;
    message: string;
    claimed: boolean;
    recipient: string | null;
  } | null>(null);

  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Fetch gift details from the smart contract on load
  useEffect(() => {
    async function loadGiftDetails() {
      try {
        setError(null);
        setChecking(true);
        
        const details = await getGiftFromContract(giftId);
        if (details) {
          setGiftDetails(details);
        } else {
          setError('Gift card not found. Please verify the URL.');
        }
      } catch (e: any) {
        console.error('Failed to load gift:', e);
        setError('Error connecting to the Stellar network.');
      } finally {
        setChecking(false);
      }
    }
    if (giftId) {
      loadGiftDetails();
    }
  }, [giftId]);

  async function connectRecipientWallet() {
    setWalletError(null);
    try {
      await openWalletModal((addr) => {
        setRecipientAddress(addr);
      });
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

      // Execute on-chain contract claim call
      const hash = await claimGiftOnChain(recipientAddress, giftId, async (xdr) => {
        return await signTx(xdr);
      });
      
      setSuccessHash(hash);
      
      // Update state
      if (giftDetails) {
        setGiftDetails({ ...giftDetails, claimed: true, recipient: recipientAddress });
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('User declined') || e.message?.includes('cancelled') || e.message?.includes('declined')) {
        setError('Transaction was cancelled. Please try again.');
      } else {
        setError(e.message || 'Something went wrong during claim processing.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-[#C9A96E] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#6B6558] font-medium text-sm">Querying smart contract ledger...</p>
      </div>
    );
  }

  if (successHash) {
    return (
      <div className="bg-[#FDFCF9] border border-[rgba(74,124,89,0.3)] rounded-[20px] p-6 md:p-8 max-w-xl mx-auto shadow-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBF4EE] text-[#4A7C59] text-2xl mb-4 font-bold">
          ✓
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#1C1A16]">Gift Claimed Successfully!</h3>
        <p className="text-sm text-[#6B6558] mt-2 mb-6">
          The funds have been transferred from the smart contract escrow directly to your address.
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

  if (error || !giftDetails) {
    return (
      <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-8 max-w-md mx-auto shadow-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAEDEB] text-[#9B3B2E] text-2xl mb-4">
          ✕
        </div>
        <h3 className="font-serif text-xl font-bold text-[#1C1A16]">{error ? 'Error' : 'Gift Not Found'}</h3>
        <p className="text-sm text-[#6B6558] mt-2 mb-4 leading-relaxed">
          {error || 'This gift card does not exist or has been deleted.'}
        </p>
        <div className="text-xs font-mono text-[#9B968C] bg-[#F2EDE4] py-2 px-3 rounded break-all">
          ID: {giftId}
        </div>
      </div>
    );
  }

  if (giftDetails.claimed) {
    return (
      <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-8 max-w-md mx-auto shadow-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAEDEB] text-[#9B3B2E] text-2xl mb-4">
          ✕
        </div>
        <h3 className="font-serif text-xl font-bold text-[#1C1A16]">Gift Already Claimed</h3>
        <p className="text-sm text-[#6B6558] mt-2 mb-4 leading-relaxed">
          This gift has already been claimed and swept to the recipient address.
        </p>
        <div className="text-xs font-mono text-[#9B968C] bg-[#F2EDE4] py-2 px-3 rounded break-all">
          Claimed by: {giftDetails.recipient}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-6 md:p-8 max-w-xl mx-auto shadow-md w-full">
      <div className="text-center mb-6">
        <div className="font-serif text-sm tracking-wider uppercase text-[#9E7A3F] font-semibold mb-1">You received a gift</div>
        <div className="gift-card-amount font-serif text-5xl font-bold text-[#1C1A16] mb-1 leading-none">{parseFloat(giftDetails.amount).toFixed(2)}</div>
        <div className="text-sm text-[#6B6558]">XLM on Stellar Testnet</div>
        {giftDetails.message && (
          <p className="text-sm italic font-serif text-[#3D3A32] bg-[#F2EDE4] rounded-lg px-4 py-3 mt-4 text-center">
            "{giftDetails.message}"
          </p>
        )}
      </div>

      <div className="bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-[12px] p-4.5 mb-6 text-sm">
        <div className="flex justify-between py-1 border-b border-[rgba(28,26,22,0.06)]">
          <span className="text-[#6B6558]">Sender</span>
          <span className="font-mono text-xs text-[#1C1A16]">{giftDetails.sender.slice(0, 10)}...{giftDetails.sender.slice(-8)}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-[rgba(28,26,22,0.06)]">
          <span className="text-[#6B6558]">On-chain Escrow ID</span>
          <span className="font-mono text-xs text-[#1C1A16]">{giftId}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-[#6B6558]">Asset</span>
          <span className="font-semibold text-[#4A7C59]">Native XLM (Stellar Asset Contract)</span>
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
              Select Wallet
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
          {loading ? 'Claiming Funds on Ledger...' : 'Claim Gift'}
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
