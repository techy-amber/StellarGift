# 🎁 StellarGift — Level 1: White Belt

StellarGift is a web application that allows users to send XLM as a shareable, one-time crypto gift link on the Stellar Testnet. Recipients do not need a pre-existing account to receive the gift—they can open the link and sweep the XLM balance directly to any Stellar public key.

> ⚪ **Level 1 Submission:** For a detailed breakdown of Level 1 (White Belt) requirements, verification states, and screenshots of live execution on the testnet, please refer to the [Level 1 - White Belt Submission Document](LEVEL_1_WHITE_BELT.md).

This repository contains the **Level 1 (White Belt)** implementation.

---

## 📸 Demo Screenshots

### 1. Sender Dashboard & Form
Configure gift amounts and add a personal message with a dynamic card preview:
![Sender Dashboard](./public/screenshots/gift%20form.png)

### 2. Recipient Claim Page
Decrypts the URL secret key client-side, displays the gift details, and sweeps the balance:
![Recipient Claim Page](./public/screenshots/recieved%20gift.png)

### 3. Claim Success Confirmation
The sweep transaction completes successfully, showing destination address confirmation:
![Claim Success](./public/screenshots/gift%20claied%20succesfully.png)

### 4. Transactions Verification on Stellar Expert
- **Funding Transaction (`createAccount`):** [View Explorer Proof](./public/screenshots/create-gift%20explorer.png)
- **Claim Transaction (`payment` sweep):** [View Explorer Proof](./public/screenshots/claimgift%20explorer.png)

---

## 🚀 Features

- **Freighter Wallet Integration:** Connect your wallet, view your address in a premium glassmorphic nav bar, and disconnect cleanly.
- **Horizon Balance Lookup:** Automatically loads and refreshes your XLM balance from the Stellar Horizon Testnet.
- **Client-Side Keypair Generation:** Generates a brand-new random Stellar keypair in the browser (never sent to any server) to hold the gifted XLM.
- **Fund Gift via `createAccount`:** Uses the Freighter wallet to sign and submit a `createAccount` transaction to fund and activate the new gift address.
- **Dynamic Gift Card Preview:** Form updating in real-time as you type the amount and optional message.
- **Shareable Link Builder:** Generates a copyable gift link with the base64-encoded secret key in the URL path.
- **Interactive Claim Sweep:** Claims page decodes the secret key from the path, displays the gift balance and message, and sweeps the balance (minus reserve and fee margin) to the recipient's public key.
- **Robust Error Handling:** Handles missing wallets, cancelled transaction signatures, and low balances with user-friendly error messages.

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom CSS Theme Variables
- **Stellar SDK:** `@stellar/stellar-sdk`
- **Wallet Connection:** `@stellar/freighter-api`
- **Stellar Horizon:** https://horizon-testnet.stellar.org

## 🛠️ Getting Started

Follow these steps to run the project locally:

1. **Clone and Navigate:**
   ```bash
   git clone https://github.com/yourname/stellar-gift
   cd stellar-gift
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root of the project:
   ```env
   NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
   NEXT_PUBLIC_NETWORK=TESTNET
   ```

4. **Run Local Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## 📁 Folder Structure

```
stellar-gift/
├── app/
│   ├── layout.tsx              # Root layout with global styles and Google Fonts
│   ├── page.tsx                # Home: Landing Page & Level 1 Dashboard
│   └── claim/[secret]/
│       └── page.tsx            # Gift claim page (uses URL secret key)
├── components/
│   ├── WalletConnect.tsx       # Connect / disconnect button with pill status
│   ├── CreateGift.tsx          # Amount input + generate gift link
│   ├── GiftResult.tsx          # Shows link + tx hash after sending
│   └── ClaimGift.tsx           # Recipient claim sweep UI
├── lib/
│   ├── stellar.ts              # Horizon calls, send XLM, fetch balance, claim sweep
│   └── keypair.ts              # Generate & encode/decode gift keypair
├── public/
├── .env.local                  # Environment variables
├── README.md
└── package.json
```

## ⚠️ Error Handling Features

The app handles the following edge cases:
1. **Wallet Not Found:** Prompts the user to install the Freighter browser extension if it is not detected.
2. **User Cancelled Signing:** Gracefully handles when a user declines or cancels transaction signing in Freighter.
3. **Insufficient Balance:** Alerts the user if their balance is lower than the input gift amount plus the account reserve margin (amount + 1.5 XLM).
