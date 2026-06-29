import ClaimGift from '@/components/ClaimGift';
import { decodeFromURL } from '@/lib/keypair';

interface ClaimPageProps {
  params: Promise<{
    secret: string;
  }>;
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  // Await async params in Next.js 16
  const { secret } = await params;
  let decodedSecret = '';
  let decodeError = false;

  try {
    decodedSecret = decodeFromURL(secret);
    // Basic validation of Gift ID format (starts with G_)
    if (!decodedSecret.startsWith('G_') || decodedSecret.length < 5 || decodedSecret.length > 20) {
      decodeError = true;
    }
  } catch {
    decodeError = true;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4EE]">
      {/* Header */}
      <nav className="h-16 px-6 border-b border-[rgba(28,26,22,0.1)] flex justify-between items-center bg-[#F8F4EE]/90 backdrop-blur-md sticky top-0 z-50">
        <span className="nav-logo font-serif text-xl font-bold flex items-center gap-2 text-[#1C1A16]">
          <span className="text-[#C9A96E]">✦</span> StellarGift
        </span>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-6">
        {decodeError ? (
          <div className="bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-8 max-w-md mx-auto shadow-md text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAEDEB] text-[#9B3B2E] text-2xl mb-4">
              ✕
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1C1A16]">Invalid Gift Link</h3>
            <p className="text-sm text-[#6B6558] mt-2 leading-relaxed">
              The link appears to be malformed or invalid. Please check the URL and try again.
            </p>
          </div>
        ) : (
          <ClaimGift secretKey={decodedSecret} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[rgba(28,26,22,0.1)] text-center bg-[#F8F4EE]">
        <p className="text-xs text-[#9B968C]">Built for the Stellar Frontend Challenge · Testnet only</p>
      </footer>
    </div>
  );
}
