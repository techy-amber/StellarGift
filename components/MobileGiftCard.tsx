'use client';

interface MobileGiftCardProps {
  amount: string;
  senderAddress: string;
  message: string;
  expiresAt?: number;
  statusText?: string;
  isExpired?: boolean;
}

export default function MobileGiftCard({
  amount,
  senderAddress,
  message,
  expiresAt,
  statusText = 'Awaiting Claim',
  isExpired = false
}: MobileGiftCardProps) {
  const formattedSender = senderAddress
    ? `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}`
    : '—';

  return (
    <div className="w-full max-w-[320px] mx-auto relative select-none">
      <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-6 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3]"></div>
        
        <div className="flex justify-between items-start mb-4">
          <div className="gift-card-label text-[11px] tracking-widest uppercase text-[#9B968C] font-semibold">
            Gift Amount
          </div>
          {isExpired && (
            <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">
              Expired
            </span>
          )}
        </div>

        <div className="gift-card-amount font-serif text-5xl font-bold text-[#1C1A16] mb-1 leading-none">
          {amount || '—'}
        </div>
        
        <div className="gift-card-unit text-xs text-[#9E7A3F] font-semibold tracking-wide mb-6">
          XLM on Stellar Testnet
        </div>

        <div className="space-y-2 border-t border-[rgba(28,26,22,0.06)] pt-4">
          <div className="gift-card-from text-[12px] text-[#6B6558] flex justify-between">
            <span className="font-medium text-left">From:</span>
            <span className="font-mono text-[#1C1A16] text-right">{formattedSender}</span>
          </div>

          {expiresAt && (
            <div className="gift-card-expires text-[11px] text-[#6B6558] flex justify-between">
              <span className="font-medium text-left">Expires:</span>
              <span className="font-mono text-[#1C1A16] text-right">
                {new Date(expiresAt * 1000).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="gift-card-msg text-sm text-[#3D3A32] italic font-serif mt-5 py-3 px-4 bg-[#F2EDE4]/50 border border-[rgba(28,26,22,0.05)] rounded-lg min-h-[48px] flex items-center justify-center text-center">
          {message ? `"${message}"` : '"Your message will appear here"'}
        </div>

        <div className="gift-card-footer mt-6 pt-4 border-t border-[rgba(28,26,22,0.1)] flex justify-between items-center text-[11px]">
          <div className={`font-semibold flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-[#4A7C59]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-[#4A7C59] animate-pulse'}`}></span>
            <span className="text-left">{statusText}</span>
          </div>
          <div className="font-serif text-[#9B968C] text-right">StellarGift</div>
        </div>
      </div>
    </div>
  );
}
