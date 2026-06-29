'use client';

import { useState, useEffect } from 'react';
import { openWalletModal, signTx } from '@/lib/wallet';
import { fetchBalance, claimGiftOnChain, getGiftFromContract, expireGiftOnChain, getNFTReceiptFromContract } from '@/lib/stellar';
import ExpiryCountdown from './ExpiryCountdown';
import GiftNFTReceipt from './GiftNFTReceipt';
import MobileGiftCard from './MobileGiftCard';

interface ClaimGiftProps {
  secretKey: string; // Decoded giftId
}

export default function ClaimGift({ secretKey: giftId }: ClaimGiftProps) {
  const [giftDetails, setGiftDetails] = useState<{
    sender: string;
    token: string;
    amount: string;
    message: string;
    status: number; // 0: Pending, 1: Claimed, 2: Expired
    recipient: string | null;
    expiresAt: number;
    nftContract: string;
  } | null>(null);

  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [nftReceipt, setNftReceipt] = useState<{
    owner: string;
    giftId: string;
    amountXlm: string;
    claimedAt: number;
  } | null>(null);

  // Fetch gift details from the smart contract on load
  useEffect(() => {
    async function loadGiftDetails() {
      try {
        setError(null);
        setChecking(true);
        
        const details = await getGiftFromContract(giftId);
        if (details) {
          setGiftDetails(details);
          // If already claimed, fetch the NFT receipt
          if (details.status === 1 && details.recipient) {
            const receipt = await getNFTReceiptFromContract(details.recipient, giftId);
            if (receipt) setNftReceipt(receipt);
          }
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
    setStatusMsg(null);
    setLoading(true);

    try {
      if (!recipientAddress.startsWith('G') || recipientAddress.length !== 56) {
        setError('Please enter a valid Stellar public key (starting with G).');
        setLoading(false);
        return;
      }

      setStatusMsg('⏳ Initiating claim on ledger. Please sign in your wallet...');

      // Execute on-chain contract claim call
      const hash = await claimGiftOnChain(recipientAddress, giftId, async (xdr) => {
        return await signTx(xdr);
      });
      
      setSuccessHash(hash);
      setStatusMsg('✅ Claim transaction confirmed! Minting NFT Receipt...');
      
      // Update local state
      if (giftDetails) {
        setGiftDetails({ ...giftDetails, status: 1, recipient: recipientAddress });
      }

      // Fetch the newly minted NFT receipt
      try {
        const receipt = await getNFTReceiptFromContract(recipientAddress, giftId);
        if (receipt) {
          setNftReceipt(receipt);
        }
      } catch (err) {
        console.error('Failed to load NFT receipt:', err);
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

  async function handleRefund() {
    setError(null);
    setStatusMsg(null);
    setLoading(true);
    
    try {
      const activeAddress = recipientAddress || giftDetails?.sender;
      if (!activeAddress) {
        setError('Connect a wallet to process the refund transaction.');
        setLoading(false);
        return;
      }

      setStatusMsg('⏳ Triggering contract expiry refund. Please sign in your wallet...');
      
      const hash = await expireGiftOnChain(activeAddress, giftId, async (xdr) => {
        return await signTx(xdr);
      });

      setStatusMsg('✅ Refund confirmed! XLM returned to the sender.');
      if (giftDetails) {
        setGiftDetails({ ...giftDetails, status: 2 }); // Expired
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Escrow refund transaction failed.');
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

  if (error && !giftDetails) {
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

  if (!giftDetails) return null;

  const now = Math.floor(Date.now() / 1000);
  const isExpired = giftDetails.status === 2 || (giftDetails.status === 0 && giftDetails.expiresAt < now);
  const isClaimed = giftDetails.status === 1;

  if (isClaimed) {
    return (
      <div className="space-y-6">
        <div className="bg-[#FDFCF9] border border-[rgba(74,124,89,0.3)] rounded-[20px] p-6 md:p-8 max-w-xl mx-auto shadow-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBF4EE] text-[#4A7C59] text-2xl mb-4 font-bold">
            ✓
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#1C1A16]">Gift Claimed Successfully!</h3>
          <p className="text-sm text-[#6B6558] mt-2 mb-6">
            The funds have been transferred from the smart contract escrow directly to the recipient address.
          </p>

          <MobileGiftCard
            amount={giftDetails.amount}
            senderAddress={giftDetails.sender}
            message={giftDetails.message}
            expiresAt={giftDetails.expiresAt}
            statusText="✓ Claimed & Released"
          />

          {successHash && (
            <div className="border-t border-[rgba(28,26,22,0.1)] pt-5 text-left mt-6">
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
          )}
        </div>

        {nftReceipt && <GiftNFTReceipt receipt={nftReceipt} />}
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-8 max-w-md mx-auto shadow-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAEDEB] text-[#9B3B2E] text-2xl mb-4">
          ✕
        </div>
        <h3 className="font-serif text-xl font-bold text-[#1C1A16]">Gift Card Expired</h3>
        <p className="text-sm text-[#6B6558] mt-2 mb-6 leading-relaxed">
          This gift card expired on {new Date(giftDetails.expiresAt * 1000).toLocaleString()} and can no longer be claimed by the recipient.
        </p>

        <MobileGiftCard
          amount={giftDetails.amount}
          senderAddress={giftDetails.sender}
          message={giftDetails.message}
          expiresAt={giftDetails.expiresAt}
          statusText="❌ Expired"
          isExpired={true}
        />

        <div className="mt-6 border-t border-[rgba(28,26,22,0.1)] pt-6">
          <p className="text-xs text-[#6B6558] mb-4">
            If you are the creator of this gift card, you can reclaim the locked XLM back to your address.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={connectRecipientWallet}
              className="text-xs text-[#9E7A3F] font-semibold hover:underline bg-transparent border-none cursor-pointer block mx-auto"
            >
              {recipientAddress ? `Connected: ${recipientAddress.slice(0,6)}...${recipientAddress.slice(-4)}` : 'Connect Sender Wallet'}
            </button>

            <button
              onClick={handleRefund}
              disabled={loading}
              className="btn-action w-full py-3 bg-[#1C1A16] text-[#F8F4EE] hover:bg-[#3D3A32] disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-lg text-sm font-semibold cursor-pointer transition-all"
            >
              {loading ? 'Processing Refund...' : 'Reclaim Escrowed XLM'}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="status-box bg-[#FBF5E0] text-[#8A6D1A] border border-[rgba(138,109,26,0.2)] rounded-lg px-4.5 py-3 text-[13px] mt-4 line-height-relaxed text-left">
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="status-box bg-[#FAEDEB] text-[#9B3B2E] border border-[rgba(155,59,46,0.25)] rounded-lg px-4.5 py-3 text-[13px] mt-4 line-height-relaxed text-left">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Pending and within lifetime
  return (
    <div className="flex flex-col md:grid md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto w-full">
      {/* Expiry Countdown & Main Form */}
      <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-6 md:p-8 shadow-md w-full text-left">
        <div className="text-center mb-6">
          <div className="font-serif text-sm tracking-wider uppercase text-[#9E7A3F] font-semibold mb-1">You received a gift</div>
          <div className="gift-card-amount font-serif text-5xl font-bold text-[#1C1A16] mb-2 leading-none text-center">
            {parseFloat(giftDetails.amount).toFixed(2)}
          </div>
          <div className="text-sm text-[#6B6558] mb-4">XLM on Stellar Testnet</div>
          
          <ExpiryCountdown expiresAt={giftDetails.expiresAt} />
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
          <div className="form-row text-left">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="recipient-address" className="form-label text-[13px] font-semibold text-[#3D3A32] m-0 text-left">Destination Address (G...)</label>
              <button
                type="button"
                onClick={connectRecipientWallet}
                className="text-xs text-[#9E7A3F] font-semibold hover:underline bg-transparent border-none cursor-pointer"
              >
                Select Wallet
              </button>
            </div>
            
            <input
              id="recipient-address"
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

        {statusMsg && (
          <div className="status-box bg-[#FBF5E0] text-[#8A6D1A] border border-[rgba(138,109,26,0.2)] rounded-lg px-4.5 py-3.5 text-[14px] mt-4 line-height-relaxed">
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="status-box bg-[#FAEDEB] text-[#9B3B2E] border border-[rgba(155,59,46,0.25)] rounded-lg px-4.5 py-3.5 text-[14px] mt-4 line-height-relaxed">
            {error}
          </div>
        )}
      </div>

      {/* Reusable Mobile Card Display */}
      <div className="w-full flex flex-col justify-start">
        <span className="text-[13px] font-semibold text-[#3D3A32] mb-3 block">Gift Details</span>
        <MobileGiftCard
          amount={giftDetails.amount}
          senderAddress={giftDetails.sender}
          message={giftDetails.message}
          expiresAt={giftDetails.expiresAt}
          statusText="● Ready to Claim"
        />
      </div>
    </div>
  );
}
