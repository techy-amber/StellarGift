# 🎁 StellarGift — Level 3: Orange Belt

StellarGift is a production-ready end-to-end dApp on Stellar that allows users to send XLM as a shareable, one-time crypto gift link. In **Level 3 (Orange Belt)**, we transition the application from a simple demo to a fully-featured, production-ready product with advanced smart contract logic, zero-knowledge equivalent NFT claim receipts, rigorous testing, and fully automated CI/CD pipelines.

> 🟠 **Level 3 Submission:** For the detailed technical specification of the Level 3 (Orange Belt) contract, deploy hashes, testing reports, and screenshots of live execution on the testnet, please refer to the [Level 3 - Orange Belt Submission Document](LEVEL_3_ORANGE_BELT.md).
> 
> 🟡 **Level 2 Submission:** For details on the original Soroban transition, please see [Level 2 - Yellow Belt Submission Document](LEVEL_2_YELLOW_BELT.md).
> 
> ⚪ **Level 1 Submission:** For the earlier peer-to-peer Horizon implementation details, please see [Level 1 - White Belt Submission Document](LEVEL_1_WHITE_BELT.md).

---

## 🚀 Level 3 Advanced Features

### 1. Smart Contract Escrow with Expiry & Status Controls
The main Soroban smart contract escrow tracks each gift card's status through an explicit state machine:
- **Pending**: XLM is locked in escrow, awaiting recipient claim.
- **Claimed**: XLM successfully released; contract guarantees no double claims.
- **Expired**: Gift lifetime exceeded. Only the original sender can trigger the refund.

### 2. Inter-Contract NFT Claim Receipts
When a recipient claims their gift card, the main escrow contract executes an on-chain cross-contract invocation to a custom `GiftNFT` receipt contract. This contract mints a unique, non-transferable proof-of-claim NFT receipt directly to the recipient's address.

### 3. Expiry Countdowns & On-Chain Creator Refunds
- **Recipient view**: A reactive, live-updating timer counts down days, hours, minutes, and seconds until the gift expires.
- **Sender view**: If the gift card expires, the claim interface transforms to block recipient claims and provides a secure button for the sender to reclaim their escrowed funds back to their wallet.

### 4. 100% Green Dual-Side Testing Suite
- **Rust Contract Tests**: 5 robust tests verifying gift creation, successful claims, duplicate claim blocks, expiry time-checks, and sender refunds.
- **Frontend Vitest Suite**: 8 unit tests in Node and JSDOM environments checking keypair encoding, form validations, loading states, and mock contract retrieval.

### 5. Automated CI/CD Pipelines
- **Continuous Integration (`ci.yml`)**: On every push and pull-request, builds and runs unit tests for both the Rust contracts and the Next.js frontend.
- **Continuous Deployment (`deploy.yml`)**: Auto-deploys verified main branches directly to production on Vercel.

---

## 🛠️ Tech Stack & Dependencies

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Wallet Connection**: `@creit.tech/stellar-wallets-kit` (Freighter, xBull, Albedo, LOBSTR)
- **Stellar Client**: `@stellar/stellar-sdk` (v16.0.0+)
- **Testing Frameworks**: Vitest, React Testing Library, JSDOM
- **Smart Contracts**: Soroban Smart Contract Rust SDK
- **CI/CD**: GitHub Actions, Vercel

---

## 📦 Getting Started

### 1. Clone and Navigate:
```bash
git clone https://github.com/yourname/stellar-gift
cd stellar-gift
```

### 2. Install Frontend Dependencies:
```bash
npm install --ignore-scripts
```

### 3. Build & Run Smart Contracts:
Compile the main contract and the NFT contract, and run the Rust test suite:
```bash
cd contract
cargo +stable-x86_64-pc-windows-gnu test --target-dir target-test-gnu -j 1
```

### 4. Run Frontend Unit Tests:
```bash
npm run test
```

### 5. Start Development Server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📁 Level 3 Project Structure

```
stellar-gift/
├── .github/workflows/
│   ├── ci.yml                  # Automated compilation & testing pipeline
│   └── deploy.yml              # Automated Vercel production deployment pipeline
├── __tests__/
│   ├── keypair.test.ts         # Unit tests for client cryptography
│   ├── CreateGift.test.tsx     # Form validations and bounds tests
│   └── ClaimGift.test.tsx      # Multi-state claim page rendering tests
├── app/
│   ├── layout.tsx              # Global layout & styles
│   ├── page.tsx                # Dashboard view
│   └── claim/[secret]/
│       └── page.tsx            # Recipient claiming & refunding route
├── components/
│   ├── CreateGift.tsx          # Gift card creation form (with datetime expiry picker)
│   ├── ClaimGift.tsx           # Claim sweep + refund handler + receipt loader
│   ├── ExpiryCountdown.tsx     # Live reactive countdown widget
│   ├── GiftNFTReceipt.tsx      # Render container for proof NFT details
│   └── MobileGiftCard.tsx      # Responsive visual preview card
├── contract/                   # Main Gift Card Escrow Contract
│   ├── src/lib.rs              # Escrow status, claims, and cross-contract NFT mint calls
│   └── src/test.rs             # Escrow rust unit tests suite
├── contract-nft/               # Receipt Minting NFT Contract
│   └── src/lib.rs              # Role-gated receipt NFT minter
├── lib/
│   ├── stellar.ts              # RPC & Horizon communication helpers
│   ├── keypair.ts              # Client key generation
│   └── wallet.ts               # Wallet integration bindings
├── vitest.config.ts            # Frontend test environment configuration
├── vitest.setup.ts             # Web Crypto API global polyfills
└── package.json
```
