/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateGift from '@/components/CreateGift';

// Mock the wallet library to prevent Freighter CJS import crashes
vi.mock('@/lib/wallet', () => ({
  signTx: vi.fn(),
  openWalletModal: vi.fn(),
  getActiveWalletId: vi.fn(),
  disconnectWallet: vi.fn(),
}));

// Mock the stellar library to prevent network calls
vi.mock('@/lib/stellar', () => ({
  createGiftOnChain: vi.fn(),
  fetchBalance: vi.fn().mockResolvedValue('100.00'), // default balance mock
}));

describe('CreateGift Component', () => {
  it('renders the amount and message inputs', () => {
    render(<CreateGift senderAddress="GBY67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7J" onSuccess={vi.fn()} />);
    expect(screen.getByPlaceholderText('e.g. 10')).toBeTruthy();
    expect(screen.getByPlaceholderText('Happy birthday! 🎉')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Generate Gift Link/i })).toBeTruthy();
  });

  it('validates amount validation limits', async () => {
    render(<CreateGift senderAddress="GBY67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7JTR7T67Q7J" onSuccess={vi.fn()} />);
    const amountInput = screen.getByPlaceholderText('e.g. 10') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '0.05' } });
    
    const submitBtn = screen.getByRole('button', { name: /Generate Gift Link/i });
    fireEvent.click(submitBtn);

    // Should display validation error because amount is below 0.1 XLM
    expect(await screen.findByText(/Minimum gift amount is 0.1 XLM/i)).toBeTruthy();
  });
});
