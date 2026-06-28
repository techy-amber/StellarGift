'use client';

import { useState, useCallback } from 'react';
import WalletConnect from '@/components/WalletConnect';
import CreateGift from '@/components/CreateGift';
import GiftResult from '@/components/GiftResult';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'landing' | 'dashboard'>('landing');

  // Success result from CreateGift
  const [giftResult, setGiftResult] = useState<{ giftLink: string; txHash: string } | null>(null);

  // Stable callbacks using useCallback to prevent react reconciler size warning
  const handleConnect = useCallback((address: string) => {
    setWalletAddress(address);
    setActivePage('dashboard');
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    setGiftResult(null);
    setActivePage('landing');
  }, []);

  // Switch to page helper
  const navigateToDashboard = () => {
    if (!walletAddress) {
      handleConnect('GABC3KX7QMNA9DHZY3KX7QMNA9DHZY3KX7QMN7XYZ');
    } else {
      setActivePage('dashboard');
    }
  };

  return (
    <>
      {/* LANDING PAGE */}
      {activePage === 'landing' && (
        <div id="landing" className="page active">
          <nav className="h-16 px-6 border-b border-[rgba(28,26,22,0.1)] flex justify-between items-center bg-[#F8F4EE]/90 backdrop-blur-md sticky top-0 z-50">
            <a className="nav-logo font-serif text-xl font-bold flex items-center gap-2 text-[#1C1A16]" href="#">
              <span className="text-[#C9A96E]">✦</span> StellarGift
            </a>
            <div className="nav-right">
              <WalletConnect
                address={walletAddress}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>
          </nav>

          <section className="hero hero-section flex flex-col justify-center items-center text-center py-20 px-6 relative overflow-hidden">
            <div className="hero-badge inline-flex items-center gap-1.5 bg-[#FDFCF9] border border-[rgba(201,169,110,0.4)] rounded-[24px] px-4 py-1.5 text-xs font-semibold text-[#9E7A3F] tracking-wider uppercase mb-8">
              ✦ Built on Stellar Testnet
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight text-[#1C1A16] max-w-[900px] mb-6">
              Send XLM as a<br /><em className="italic text-[#C9A96E] font-normal">gift link</em>
            </h1>
            <p className="hero-sub text-lg md:text-xl text-[#6B6558] max-w-[560px] font-light leading-relaxed mb-12">
              Generate a one-time secret link that holds XLM. Anyone with the link can claim it — no account needed to receive.
            </p>
            <div className="hero-actions flex gap-3 flex-wrap justify-center">
              <button
                className="btn-primary bg-[#1C1A16] text-[#F8F4EE] hover:bg-[#3D3A32] hover:-translate-y-0.5 border-none rounded-lg px-8 py-4 text-base font-semibold cursor-pointer transition-all shadow-md"
                onClick={navigateToDashboard}
              >
                {walletAddress ? 'Go to Dashboard' : 'Connect Wallet to Start'}
              </button>
              <button
                className="btn-secondary border border-[rgba(28,26,22,0.1)] text-[#1C1A16] hover:border-[#C9A96E] hover:text-[#9E7A3F] hover:-translate-y-0.5 bg-transparent rounded-lg px-8 py-4 text-base font-semibold cursor-pointer transition-all"
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See how it works
              </button>
            </div>

            <div className="gift-preview mt-16 max-w-[320px] w-full">
              <div className="gift-card bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] p-7 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3]"></div>
                <div className="gift-card-label text-[11px] tracking-widest uppercase text-[#9B968C] mb-2 font-medium">Gift Amount</div>
                <div className="gift-card-amount font-serif text-5xl font-bold text-[#1C1A16] mb-1 leading-none">25</div>
                <div className="gift-card-unit text-sm text-[#9E7A3F] font-medium mb-5">XLM on Stellar Testnet</div>
                <div className="gift-card-from text-[13px] text-[#6B6558] mb-1">From <strong>GABC...7XYZ</strong></div>
                <div className="gift-card-msg text-sm text-[#3D3A32] italic font-serif mt-2">"Happy birthday! 🎉"</div>
                <div className="gift-card-footer mt-6 pt-4 border-t border-[rgba(28,26,22,0.1)] flex justify-between items-center">
                  <div className="gift-card-status text-[12px] font-semibold text-[#4A7C59] flex items-center gap-1">
                    ● Awaiting Claim
                  </div>
                  <div className="gift-card-logo font-serif text-[13px] text-[#9B968C]">StellarGift</div>
                </div>
              </div>
            </div>
          </section>

          <div className="divider"></div>

          <section className="section py-20 px-6 max-w-[1100px] mx-auto" id="how">
            <div>
              <div className="section-label text-[11px] tracking-widest uppercase text-[#9E7A3F] font-semibold mb-4">How it works</div>
              <h2 className="section-title font-serif text-3xl md:text-5xl font-bold text-[#1C1A16] leading-tight mb-5">
                Three steps.<br />One gift link.
              </h2>
              <p className="section-sub text-lg text-[#6B6558] font-light max-w-[520px] leading-relaxed">
                No technical knowledge required. Connect your wallet, set an amount, and share the link.
              </p>
            </div>

            <div className="steps-grid mt-16">
              <div className="step-card bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-lg p-8 hover:-translate-y-1 hover:shadow-md hover:border-[#C9A96E]/40 transition-all">
                <div className="step-num font-serif text-4xl font-bold text-[#E8D5A3] mb-4">01</div>
                <div className="step-title font-semibold text-[#1C1A16] mb-2">Connect your wallet</div>
                <div className="step-desc text-sm text-[#6B6558] leading-relaxed">
                  Use Freighter to connect safely. We fetch your balance automatically to fund the gift cards.
                </div>
              </div>
              <div className="step-card bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-lg p-8 hover:-translate-y-1 hover:shadow-md hover:border-[#C9A96E]/40 transition-all">
                <div className="step-num font-serif text-4xl font-bold text-[#E8D5A3] mb-4">02</div>
                <div className="step-title font-semibold text-[#1C1A16] mb-2">Set amount & message</div>
                <div className="step-desc text-sm text-[#6B6558] leading-relaxed">
                  Enter the amount of XLM to gift and add an optional message. The app creates a unique gift address.
                </div>
              </div>
              <div className="step-card bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-lg p-8 hover:-translate-y-1 hover:shadow-md hover:border-[#C9A96E]/40 transition-all">
                <div className="step-num font-serif text-4xl font-bold text-[#E8D5A3] mb-4">03</div>
                <div className="step-title font-semibold text-[#1C1A16] mb-2">Share the link</div>
                <div className="step-desc text-sm text-[#6B6558] leading-relaxed">
                  Send the generated gift link to anyone. They open it and sweep the XLM directly to their address.
                </div>
              </div>
              <div className="step-card bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-lg p-8 hover:-translate-y-1 hover:shadow-md hover:border-[#C9A96E]/40 transition-all">
                <div className="step-num font-serif text-4xl font-bold text-[#E8D5A3] mb-4">04</div>
                <div className="step-title font-semibold text-[#1C1A16] mb-2">Gifts sweep safely</div>
                <div className="step-desc text-sm text-[#6B6558] leading-relaxed">
                  Funds are held in client-side generated addresses until recipient claims them.
                </div>
              </div>
            </div>
          </section>

          <div className="divider"></div>

          <section className="section py-20 px-6 text-center">
            <div className="section-label text-[11px] tracking-widest uppercase text-[#9E7A3F] font-semibold mb-4">Ready to try it?</div>
            <h2 className="section-title font-serif text-3xl md:text-5xl font-bold text-[#1C1A16] leading-tight mb-5 max-w-[600px] mx-auto">
              Start gifting XLM<br />in under a minute
            </h2>
            <p className="text-sm text-[#6B6558] mb-10">Free on testnet. No fee beyond standard network transaction costs.</p>
            <button
              className="btn-primary bg-[#1C1A16] text-[#F8F4EE] hover:bg-[#3D3A32] hover:-translate-y-0.5 border-none rounded-lg px-10 py-5 text-lg font-semibold cursor-pointer transition-all shadow-md"
              onClick={navigateToDashboard}
            >
              {walletAddress ? 'Go to Dashboard' : 'Connect Wallet to Start'}
            </button>
          </section>

          <footer className="py-12 px-6 border-t border-[rgba(28,26,22,0.1)] text-center">
            <div className="footer-logo font-serif text-2xl font-bold text-[#1C1A16] mb-2">
              <span className="text-[#C9A96E]">✦</span> StellarGift
            </div>
            <p className="text-xs text-[#9B968C]">Built for the Stellar Frontend Challenge · Testnet only</p>
          </footer>
        </div>
      )}

      {/* DASHBOARD PAGE */}
      {activePage === 'dashboard' && (
        <div id="dashboard" className="page dashboard min-h-screen bg-[#F8F4EE]">
          <nav className="dash-nav h-16 px-6 border-b border-[rgba(28,26,22,0.1)] flex justify-between items-center bg-[#F8F4EE]/95 backdrop-blur-md sticky top-0 z-50">
            <div className="dash-logo font-serif text-lg font-bold text-[#1C1A16] cursor-pointer" onClick={() => setActivePage('landing')}>
              <span className="text-[#C9A96E]">✦</span> StellarGift
            </div>
            <div className="dash-wallet">
              <WalletConnect
                address={walletAddress}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>
          </nav>

          <div className="dash-body max-w-[1100px] mx-auto py-12 px-6">
            {/* Premium Dashboard Title */}
            <div className="mb-8">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1C1A16]">Create a Stellar Gift Card</h2>
              <p className="text-sm text-[#6B6558] mt-1">Fund a secure, random keypair and generate a link to share with anyone.</p>
            </div>

            {/* Live Demo Area directly */}
            <div className="demo-area bg-[#FDFCF9] border border-[rgba(28,26,22,0.1)] rounded-[20px] overflow-hidden mb-8 shadow-sm">
              <div className="demo-header px-6 py-4.5 border-b border-[rgba(28,26,22,0.1)] flex justify-between items-center bg-[#FDFCF9]">
                <div className="demo-title text-sm font-bold text-[#1C1A16]">🎁 Create a Gift — Live Demo</div>
                <div className="text-xs text-[#9B968C]">Operates on Testnet</div>
              </div>
              <div className="demo-body p-6 md:p-8">
                {!walletAddress ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-[#6B6558] mb-4">Please connect your Freighter wallet to access the Live Demo.</p>
                    <WalletConnect
                      address={walletAddress}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                    />
                  </div>
                ) : giftResult ? (
                  <GiftResult
                    giftLink={giftResult.giftLink}
                    txHash={giftResult.txHash}
                    onReset={() => setGiftResult(null)}
                  />
                ) : (
                  <CreateGift
                    senderAddress={walletAddress}
                    onSuccess={(link, hash) => setGiftResult({ giftLink: link, txHash: hash })}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
