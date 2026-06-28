# ⚪ Level 1 — White Belt Submission

**StellarGift** is a web-based, non-custodial crypto gift card application built on the Stellar Testnet. 

This document serves as the official submission for the **Stellar Frontend Challenge — Level 1 (White Belt)**.

---

## 📝 Requirements Checklist & Implementation

### 1. Wallet Setup
- [x] **Freighter Wallet Configuration:** Integrated Freighter API using `@stellar/freighter-api` to connect, retrieve addresses, and sign transactions on the **Stellar Testnet**.

### 2. Wallet Connection
- [x] **Connect Wallet:** The home page provides a prominent "Connect Freighter" button that triggers the wallet authorization popup.
- [x] **Clean Disconnect:** Users can click the "Disconnect" button to clear address/balance states and return cleanly to the public landing page.

### 3. Balance Handling
- [x] **Fetch & Display Balance:** Queries the Stellar Horizon Testnet API (`https://horizon-testnet.stellar.org`) automatically upon connection to fetch and display the user's native XLM balance. Includes a manual refresh button.

### 4. Transaction Flow
- [x] **Send XLM via `createAccount`:** Sends the specified XLM amount to a generated keypair. Since the keypair is new, we use the `createAccount` operation to fund and activate the destination account.
- [x] **Transaction Feedback:** Displays dynamic status states: `Submitting transaction...`, `Success` with the transaction hash, and `Error` handling.
- [x] **Transaction Link:** Success state includes direct redirection links to check the transaction details on the **Stellar Expert explorer**.

### 5. Development Standards
- [x] **Robust Error Handling:** Specifically catches and displays descriptive error states for:
  1. *Freighter Not Installed:* Prompts users to install the wallet extension.
  2. *User Rejection:* Handles cancelled signatures gracefully.
  3. *Insufficient Balance:* Prevents submission if the balance is too low (requires gift amount + 1.5 XLM reserve/fee buffer).

---

## 📸 Screenshots

### 1. Wallet Connected & Balance Displayed
The app successfully connects to Freighter, fetches the balance, and updates the form view:
![Wallet Connected & Balance](./public/screenshots/gift%20form.png)

### 2. Successful Funding Transaction (Stellar Expert Explorer)
The funding transaction (`createAccount`) is signed by Freighter and successfully submitted to the Stellar Testnet:
![Funding Transaction on Explorer](./public/screenshots/create-gift%20explorer.png)

### 3. Receiver Page (Awaiting Claim)
The recipient opens the base64-encoded secret link, which decodes the secret key and loads the gift card details and message:
![Receiver Page](./public/screenshots/recieved%20gift.png)

### 4. Gift Claimed Successfully (Sweep Completed)
The recipient enters their public address (or autofills it with Freighter) and sweeps the XLM balance:
![Gift Claimed Successfully](./public/screenshots/gift%20claied%20succesfully.png)

### 5. Successful Claim Sweep Transaction (Stellar Expert Explorer)
The sweep transaction is signed by the ephemeral gift keypair and broadcast successfully:
![Claim Sweep on Explorer](./public/screenshots/claimgift%20explorer.png)

---

## 🛠️ Local Development & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourname/stellar-gift
   cd stellar-gift
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (`.env.local`):**
   ```env
   NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
   NEXT_PUBLIC_NETWORK=TESTNET
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with the app.
