// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateGiftKeypair, encodeForURL, decodeFromURL } from '@/lib/keypair';

describe('generateGiftKeypair', () => {
  it('returns valid Stellar public and secret keys', () => {
    const { publicKey, secretKey } = generateGiftKeypair();
    expect(publicKey).toMatch(/^G[A-Z2-7]{55}$/);  // valid Stellar public key
    expect(secretKey).toMatch(/^S[A-Z2-7]{55}$/);  // valid secret key
  });

  it('generates unique keypairs each call', () => {
    const a = generateGiftKeypair();
    const b = generateGiftKeypair();
    expect(a.publicKey).not.toBe(b.publicKey);
  });

  it('encodeForURL produces base64 that decodes back to secret', () => {
    const { secretKey } = generateGiftKeypair();
    const encoded = encodeForURL(secretKey);
    expect(decodeFromURL(encoded)).toBe(secretKey);
  });
});
