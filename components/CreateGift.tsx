'use client';

import { useState, useEffect } from 'react';
import { signTx } from '@/lib/wallet';
import { encodeForURL } from '@/lib/keypair';
import { createGiftOnChain, fetchBalance } from '@/lib/stellar';

interface CreateGiftProps {
  senderAddress: string;
  onSuccess: (giftLink: string, txHash: string) => void;
}

export default function CreateGift({ senderAddress, onSuccess }: CreateGiftProps) {
  const [amount, setAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Load balance when senderAddress changes
  useEffect(() => {
    if (senderAddress) {
      handleRefreshBalance();
    }
  }, [senderAddress]);

  async function handleRefreshBalance() {
    try {
      const bal = await fetchBalance(senderAddress);
      setBalance(bal);
    } catch (e: any) {
      console.error('Error fetching balance:', e);
    }
  }

  async function handleCreateGift(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusMsg(null);
    setLoading(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0.1) {
        setError('Minimum gift amount is 0.1 XLM.');
        setLoading(false);
        return;
      }

      // Fetch latest balance and verify sufficient funds
      const latestBalance = await fetchBalance(senderAddress);
      setBalance(latestBalance);
      const balanceFloat = parseFloat(latestBalance);

      // Verify the sender has enough funds to cover the gift + some fee margin
      if (balanceFloat < parsedAmount + 0.5) {
        setError(`Insufficient balance. You need at least ${(parsedAmount + 0.5).toFixed(2)} XLM (includes contract execution fee buffer).`);
        setLoading(false);
        return;
      }

      setStatusMsg('⏳ Generating secure on-chain Gift ID...');
      // Generate a unique alphanumeric ID
      const giftId = 'G_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      setStatusMsg('⏳ Preparing smart contract call. Please sign the transaction in your wallet...');
      
      const txHash = await createGiftOnChain(
        senderAddress,
        giftId,
        amount,
        message,
        async (xdr: string) => {
          return await signTx(xdr);
        }
      );

      setStatusMsg('⏳ Awaiting transaction block confirmation...');
      
      // Build the shareable link with base64 encoded gift ID in the path
      const encodedId = encodeForURL(giftId);
      const giftLink = `${window.location.origin}/claim/${encodedId}`;

      setStatusMsg('✅ Gift card created successfully on-chain!');
      
      // Refresh balance
      handleRefreshBalance();

      // Trigger success callback
      onSuccess(giftLink, txHash);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('User declined') || e.message?.includes('cancelled') || e.message?.includes('declined')) {
        setError('Transaction was cancelled. Please try again.');
      } else {
        setError(e.message || 'Something went wrong. Check your network.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-2 gap-8 items-start">
      {/* Form Controls */}
      <div className="w-full">
        {/* Balance Display */}
        <div className="bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-[12px] p-5 mb-6 flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6B6558] mb-1 font-semibold">Your Balance</div>
            <div className="font-serif text-3xl font-bold text-[#1C1A16]">{parseFloat(balance).toFixed(4)}</div>
            <div className="text-[13px] text-[#9E7A3F] font-medium">XLM · Testnet</div>
          </div>
          <button
            type="button"
            onClick={handleRefreshBalance}
            className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-lg px-3.5 py-2 text-[13px] cursor-pointer hover:bg-[#EDE8DF] transition-all font-medium text-[#3D3A32]"
          >
            Refresh
          </button>
        </div>

        <form onSubmit={handleCreateGift} className="space-y-5">
          <div className="form-row">
            <label className="form-label text-[13px] font-medium text-[#3D3A32] mb-1.5 block">Amount to Gift (XLM)</label>
            <input
              className="form-input w-full px-4 py-3 bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-lg text-base text-[#1C1A16] outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[rgba(201,169,110,0.12)] transition-all font-sans"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10"
              min="0.1"
              step="0.00001"
              required
              disabled={loading}
            />
            <span className="text-xs text-[#6B6558] mt-1 block">Minimum 0.1 XLM. Funds will be held in the smart contract escrow.</span>
          </div>

          <div className="form-row">
            <label className="form-label text-[13px] font-medium text-[#3D3A32] mb-1.5 block">Personal Message (optional)</label>
            <input
              className="form-input w-full px-4 py-3 bg-[#F2EDE4] border border-[rgba(28,26,22,0.1)] rounded-lg text-base text-[#1C1A16] outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[rgba(201,169,110,0.12)] transition-all font-sans"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Happy birthday! 🎉"
              maxLength={80}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-action w-full py-3.5 bg-[#1C1A16] text-[#F8F4EE] hover:bg-[#3D3A32] disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-lg text-[15px] font-medium cursor-pointer transition-all mt-2"
          >
            {loading ? 'Processing Transaction...' : 'Generate Gift Link'}
          </button>
        </form>

        {/* Status / Error Boxes */}
        {statusMsg && (
          <div className="status-box bg-[#FBF5E0] text-[#8A6D1A] border border-[rgba(138,109,26,0.2)] rounded-lg px-4.5 py-3.5 text-[14px] mt-4 line-height-relaxed animate-pulse">
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="status-box bg-[#FAEDEB] text-[#9B3B2E] border border-[rgba(155,59,46,0.25)] rounded-lg px-4.5 py-3.5 text-[14px] mt-4 line-height-relaxed">
            {error}
          </div>
        )}
      </div>

      {/* Gift Preview Card */}
      <div className="w-full flex flex-col justify-start">
        <span className="text-[13px] font-medium text-[#3D3A32] mb-3 block">Gift Card Preview</span>
        <div className="gift-preview max-w-[320px] w-full relative">
          <div className="gift-card bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-7 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3]"></div>
            <div className="gift-card-label text-[11px] tracking-widest uppercase text-[#9B968C] mb-2 font-medium">Gift Amount</div>
            <div className="gift-card-amount font-serif text-5xl font-bold text-[#1C1A16] mb-1 leading-none">{amount || '—'}</div>
            <div className="gift-card-unit text-sm text-[#9E7A3F] font-medium mb-5">XLM on Stellar Testnet</div>
            <div className="gift-card-from text-[13px] text-[#6B6558] mb-1">
              From <strong>{senderAddress ? `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}` : '—'}</strong>
            </div>
            <div className="gift-card-msg text-sm text-[#3D3A32] italic font-serif mt-2">
              {message ? `"${message}"` : '"Your message will appear here"'}
            </div>
            <div className="gift-card-footer mt-6 pt-4 border-t border-[rgba(28,26,22,0.1)] flex justify-between items-center">
              <div className="gift-card-status text-[12px] font-semibold text-[#4A7C59] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#4A7C59] rounded-full animate-ping"></span>
                <span>● Escrowed on Smart Contract</span>
              </div>
              <div className="gift-card-logo font-serif text-[13px] text-[#9B968C]">StellarGift</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
