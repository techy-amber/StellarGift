import { Keypair } from '@stellar/stellar-sdk';

export function generateGiftKeypair() {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),   // where XLM is sent
    secretKey: keypair.secret(),      // goes in the gift URL
  };
}

export function encodeForURL(secret: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(secret).toString('base64');
  }
  return btoa(secret); // base64 encode
}

export function decodeFromURL(encoded: string): string {
  // Decode percent encoding first (e.g. %3D -> =)
  const decodedParam = decodeURIComponent(encoded);
  if (typeof window === 'undefined') {
    return Buffer.from(decodedParam, 'base64').toString('utf-8');
  }
  return atob(decodedParam); // base64 decode
}
