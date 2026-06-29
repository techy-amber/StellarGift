/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClaimGift from '@/components/ClaimGift';
import * as stellarLib from '@/lib/stellar';

// Mock the wallet library to prevent Freighter CJS import crashes
vi.mock('@/lib/wallet', () => ({
  signTx: vi.fn(),
  openWalletModal: vi.fn(),
  getActiveWalletId: vi.fn(),
  disconnectWallet: vi.fn(),
}));

// Mock the stellar library
vi.mock('@/lib/stellar', () => {
  return {
    getGiftFromContract: vi.fn(),
    claimGiftOnChain: vi.fn(),
    fetchBalance: vi.fn(),
    getNFTReceiptFromContract: vi.fn(),
  };
});

describe('ClaimGift Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    (stellarLib.getGiftFromContract as any).mockReturnValue(new Promise(() => {}));
    render(<ClaimGift secretKey="TEST_GIFT_ID" />);
    expect(screen.getByText(/Querying smart contract ledger/i)).toBeTruthy();
  });

  it('renders gift details when found', async () => {
    const mockGift = {
      sender: 'GBY67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7J',
      token: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      amount: '25',
      message: 'Hello World',
      claimed: false,
      recipient: null,
      status: 0, // Pending
      expiresAt: Math.floor(Date.now() / 1000) + 86400, // +1 day
      nftContract: 'CCLS7LDBNGFGXRSBMXS6CTJF6LPIKKK3FUA6WE2UILL5WTVNH2DK5NST',
    };

    (stellarLib.getGiftFromContract as any).mockResolvedValue(mockGift);
    render(<ClaimGift secretKey="TEST_GIFT_ID" />);

    await waitFor(() => {
      expect(screen.getByText(/Hello World/)).toBeTruthy();
      expect(screen.getAllByText(/25/)).toBeTruthy();
    });
  });

  it('renders error state when gift is not found', async () => {
    (stellarLib.getGiftFromContract as any).mockResolvedValue(null);
    render(<ClaimGift secretKey="TEST_GIFT_ID" />);

    await waitFor(() => {
      expect(screen.getByText(/Gift card not found/i)).toBeTruthy();
    });
  });
});
