'use client';

interface GiftNFTReceiptProps {
  receipt: {
    owner: string;
    giftId: string;
    amountXlm: string;
    claimedAt: number;
  };
}

export default function GiftNFTReceipt({ receipt }: GiftNFTReceiptProps) {
  const claimDate = new Date(receipt.claimedAt * 1000).toLocaleString();

  return (
    <div className="bg-[#FDFCF9] border-2 border-dashed border-[#C9A96E]/50 rounded-[20px] p-6 max-w-xl mx-auto shadow-md relative overflow-hidden mt-6">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9A96E]/10 rounded-full blur-xl -mr-6 -mt-6"></div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">🖼️</div>
        <div>
          <h4 className="font-serif text-lg font-bold text-[#1C1A16] text-left">NFT Claim Receipt Minted</h4>
          <p className="text-[11px] text-[#9E7A3F] font-semibold uppercase tracking-wider text-left">Proof of Claim · SEP-41 Equivalent Receipt</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-[rgba(28,26,22,0.1)] pt-4 text-sm text-[#3D3A32]">
        <div className="flex justify-between items-center">
          <span className="text-[#6B6558] font-medium text-xs">Receipt Owner</span>
          <span className="font-mono text-xs text-[#1C1A16] bg-[#F2EDE4] px-2 py-0.5 rounded">
            {receipt.owner.slice(0, 8)}...{receipt.owner.slice(-6)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#6B6558] font-medium text-xs">Gift On-chain ID</span>
          <span className="font-mono text-xs text-[#1C1A16]">{receipt.giftId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#6B6558] font-medium text-xs">Amount Claimed</span>
          <span className="font-semibold text-[#4A7C59]">{parseFloat(receipt.amountXlm).toFixed(2)} XLM</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#6B6558] font-medium text-xs">Minted Timestamp</span>
          <span className="text-xs text-[#1C1A16]">{claimDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#6B6558] font-medium text-xs">NFT Receipt Contract</span>
          <span className="font-mono text-[10px] text-[#6B6558] bg-[#EDE8DF] px-2 py-0.5 rounded truncate max-w-[200px]" title={process.env.NEXT_PUBLIC_NFT_CONTRACT_ID}>
            {process.env.NEXT_PUBLIC_NFT_CONTRACT_ID?.slice(0, 8)}...{process.env.NEXT_PUBLIC_NFT_CONTRACT_ID?.slice(-8)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-dashed border-[rgba(28,26,22,0.1)] text-center">
        <span className="text-[10px] text-[#9B968C] font-semibold uppercase tracking-wider">
          ✦ Minted directly by StellarGift Smart Contract ✦
        </span>
      </div>
    </div>
  );
}
