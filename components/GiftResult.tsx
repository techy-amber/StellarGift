'use client';

import { useState } from 'react';

interface GiftResultProps {
  giftLink: string;
  txHash: string;
  onReset: () => void;
}

export default function GiftResult({ giftLink, txHash, onReset }: GiftResultProps) {
  const [copied, setCopied] = useState<boolean>(false);

  function handleCopy() {
    navigator.clipboard.writeText(giftLink).catch((err) => {
      console.error('Failed to copy text: ', err);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#FDFCF9] border border-[#C9A96E]/40 rounded-[20px] p-6 md:p-8 max-w-xl mx-auto shadow-md">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EBF4EE] border border-[rgba(74,124,89,0.3)] text-[#4A7C59] text-2xl mb-3">
          ✓
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#1C1A16]">Gift Link Generated!</h3>
        <p className="text-sm text-[#6B6558] mt-1">Share the link below with your recipient to let them claim their XLM.</p>
      </div>

      <div className="gift-link-box bg-[#F2EDE4] border border-[#C9A96E]/40 rounded-lg p-4.5 mb-6">
        <div className="gift-link-label text-[11px] uppercase tracking-wider text-[#9E7A3F] font-semibold mb-2">🔗 Shareable Gift Link</div>
        <div className="gift-link-url font-mono text-[13px] text-[#3D3A32] word-break-all break-all select-all mb-4">
          {giftLink}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="btn-copy bg-[#1C1A16] text-[#F8F4EE] hover:bg-[#3D3A32] border-none rounded-lg px-4.5 py-2 text-xs font-semibold cursor-pointer transition-all"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="border-t border-[rgba(28,26,22,0.1)] pt-4 mb-6">
        <div className="text-[12px] text-[#9B968C] uppercase font-semibold tracking-wide mb-1">Transaction Proof</div>
        <div className="tx-hash font-mono text-xs text-[#6B6558] bg-[#EDE8DF] px-3 py-2 rounded-md word-break-all break-all mb-3 select-all">
          {txHash}
        </div>
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tx-link text-[12px] font-semibold text-[#9E7A3F] hover:underline"
        >
          View on Stellar Expert Explorer →
        </a>
      </div>

      <button
        onClick={onReset}
        className="w-full py-3 border border-[rgba(28,26,22,0.15)] rounded-lg text-sm text-[#3D3A32] hover:border-[#C9A96E] hover:text-[#9E7A3F] cursor-pointer transition-all font-semibold bg-transparent"
      >
        Create Another Gift
      </button>
    </div>
  );
}
