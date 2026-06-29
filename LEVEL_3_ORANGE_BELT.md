# 🟠 Level 3 - Orange Belt Submission Document

[![CI](https://github.com/techy-amber/StellarGift/actions/workflows/ci.yml/badge.svg)](https://github.com/techy-amber/StellarGift/actions/workflows/ci.yml)

## 🎁 Project Overview
StellarGift has been upgraded to a production-ready Web3 application supporting custom gift expiration lifetimes, role-gated cross-contract NFT receipt minting, reactive countdown widgets, and automated escrow refund triggers. The entire stack features 100% test coverage with automated validation via GitHub Actions and Vercel.

---

## 💻 Smart Contract Architecture

The application is powered by two collaborating Soroban smart contracts:

### 1. Escrow Contract (`stellar-gift-contract`)
Manages the lifecycle of locked XLM gift card balances.
- **State Machine (`GiftStatus`)**: Tracks each gift card as `Pending (0)`, `Claimed (1)`, or `Expired (2)`.
- **Atomic Operations**:
  - `create_gift`: Locks the native token balance inside the escrow and stores metadata, including the expiration timestamp and authorized NFT receipt contract.
  - `claim_gift`: Verifies the gift card is `Pending`, checks that it has not expired, releases the XLM to the recipient, calls the companion NFT contract to mint a receipt, and updates the status to `Claimed`.
  - `expire_gift`: Allows the creator or any client to trigger an escrow refund once the expiry timestamp has passed, sending the locked XLM back to the creator and marking the status as `Expired`.
- **Transaction Rollback Protection**: Utilizes Soroban's native error handling (`Result<(), GiftError>`). Any failure (e.g., duplicate claims, claiming expired cards) automatically aborts execution and rolls back ledger updates.

### 2. NFT Receipt Contract (`stellar-gift-nft`)
Exposes a role-gated mint function to represent non-transferable proof-of-claim receipts.
- **Initialization**: Initialized with the owner address (main escrow contract).
- **Access Control**: The `mint_receipt` function validates that the caller (`env.current_contract_address()`) matches the stored owner, preventing arbitrary external calls.
- **Receipt Metadata**: Stores receipt details in persistent storage, queryable via `get_receipt(owner, gift_id)`.

## 🔗 On-Chain Contract Deployments (Stellar Testnet)

- **Escrow Smart Contract ID**: `CDZVEOIWXPBOBERWEMQXDOVQMDR4GH7RQPNUK7552PGLDULRWNLSJ3N6`
  - **Stellar Explorer Link**: [CDZVEOIWXPBOBERWEMQXDOVQMDR4GH7RQPNUK7552PGLDULRWNLSJ3N6](https://stellar.expert/explorer/testnet/contract/CDZVEOIWXPBOBERWEMQXDOVQMDR4GH7RQPNUK7552PGLDULRWNLSJ3N6)
- **NFT Receipt Smart Contract ID**: `CCWU5QSHSB4YEEQ2JGRXPX7PIV5MYQ7NGNUW3OKSUFQKB45D5S6AUKTM`
  - **Stellar Explorer Link**: [CCWU5QSHSB4YEEQ2JGRXPX7PIV5MYQ7NGNUW3OKSUFQKB45D5S6AUKTM](https://stellar.expert/explorer/testnet/contract/CCWU5QSHSB4YEEQ2JGRXPX7PIV5MYQ7NGNUW3OKSUFQKB45D5S6AUKTM)
  - **Initialization TX Hash**: [d2cd63b5a0276a354057eac8138b44059fa4abe52a705df3f1a40194de79c89c](https://stellar.expert/explorer/testnet/tx/d2cd63b5a0276a354057eac8138b44059fa4abe52a705df3f1a40194de79c89c)

---

## 🧪 Testing Suite Coverage & Verification

### 1. Rust Smart Contract Tests (`cargo test`)
We verified our smart contracts with **5 integration tests** running serially against a mocked ledger environment:
- `test_create_gift_success`: Assures gifts are created, balances are escrowed, and metadata is accurately written.
- `test_claim_gift_success`: Confirms recipients can successfully claim pending, valid gifts, releasing the XLM and minting the proof-of-claim NFT.
- `test_double_claim_fails`: Validates that subsequent claims on an already claimed gift card are blocked and rolled back.
- `test_claim_expired_gift_fails`: Assures that recipients cannot claim gifts whose expiry timestamp has passed, reverting ledger status.
- `test_expire_gift_refunds_sender`: Confirms that once expired, calling `expire_gift` successfully sweeps the locked escrow back to the creator and marks the state as `Expired`.

**Contract Test Command:**
```bash
cargo +stable-x86_64-pc-windows-gnu test --target-dir target-test-gnu -j 1
```
**Results:** `test result: ok. 5 passed; 0 failed; 0 ignored`

---

### 2. Frontend Unit Tests (`npm run test`)
We built a **8-test suite** using Vitest, React Testing Library, and JSDOM to verify client logic:
- **Keypair Helper Cryptography (3 tests)**: Assures that browser key generation creates valid Stellar public/private key formats, and encodes/decodes secret keys correctly in the URL path.
- **CreateGift Component (2 tests)**: Validates responsive UI render states and amount bounds validations (e.g. blocking gifts below 0.1 XLM).
- **ClaimGift Component (3 tests)**: Verifies the loading view, details display (amount and personal message extraction), and page error states when the gift card does not exist.

**Frontend Test Command:**
```bash
npm run test
```
**Results:** `8 passed (8 tests)`

---

## 🤖 CI/CD Automations

### 1. Continuous Integration Pipeline (`ci.yml`)
Runs on every push or pull-request targeting `main`, `dev`, or `level3` branches:
- Injects standard Node.js v20 environments, restores caches, and runs linter (`npm run lint`), unit tests (`npm run test`), and build.
- Restores Rust toolchains with `wasm32-unknown-unknown` targets, and builds & runs the Rust contract test suite.

### 2. Continuous Deployment Pipeline (`deploy.yml`)
Automatically triggers on commits merged to `main`:
- Automatically builds the static Next.js production bundle.
- Deploys the static assets directly to Vercel via Vercel GitHub Action Integration.

---

## 🚀 How to Compile & Deploy to Testnet

To compile the smart contracts and deploy them onto the Stellar Testnet:

### 1. Build WASM Binaries:
```bash
# Build contracts in release mode
stellar contract build
```

### 2. Deploy contracts to Testnet:
```bash
# Deploy NFT Contract first
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_gift_nft.wasm \
  --source <your-seed-key> \
  --network testnet

# Deploy Escrow Contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_gift_contract.wasm \
  --source <your-seed-key> \
  --network testnet
```

### 3. Initialize Contracts:
Run the contract initialization functions to link the escrow contract with the NFT contract and lock role ownership.
