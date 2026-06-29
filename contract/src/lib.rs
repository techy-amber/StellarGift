#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol, symbol_short, String
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum GiftStatus {
    Pending = 0,
    Claimed = 1,
    Expired = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GiftCard {
    pub sender: Address,
    pub token: Address,
    pub amount: i128,
    pub message: String,
    pub status: GiftStatus,
    pub recipient: Option<Address>,
    pub expires_at: u64,
    pub nft_contract: Address,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GiftError {
    AlreadyExists = 1,
    DoesNotExist = 2,
    AlreadyClaimed = 3,
    InvalidAmount = 4,
    Expired = 5,
    NotExpiredYet = 6,
    NotPending = 7,
}

// Generate contract client for the NFT contract
#[soroban_sdk::contractclient(name = "InternalGiftNFTClient")]
pub trait GiftNFTInterface {
    fn mint_receipt(
        env: Env,
        caller: Address,
        recipient: Address,
        gift_id: Symbol,
        amount_xlm: i128,
    );
}

const GIFT: Symbol = symbol_short!("GIFT");

#[contract]
pub struct StellarGiftContract;

#[contractimpl]
impl StellarGiftContract {
    pub fn create_gift(
        env: Env,
        id: Symbol,
        sender: Address,
        token: Address,
        amount: i128,
        message: String,
        expires_at: u64,
        nft_contract: Address,
    ) -> Result<(), GiftError> {
        sender.require_auth();

        if amount <= 0 {
            return Err(GiftError::InvalidAmount);
        }

        if env.storage().persistent().has(&id) {
            return Err(GiftError::AlreadyExists);
        }

        // Interface with native token (or stablecoin) contract to pull funds into this contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        // Store the gift card state in persistent storage
        let gift = GiftCard {
            sender,
            token,
            amount,
            message,
            status: GiftStatus::Pending,
            recipient: None,
            expires_at,
            nft_contract,
        };
        env.storage().persistent().set(&id, &gift);

        env.events().publish((GIFT, symbol_short!("created")), id.clone());

        Ok(())
    }

    pub fn claim_gift(
        env: Env,
        id: Symbol,
        recipient: Address,
    ) -> Result<(), GiftError> {
        recipient.require_auth();

        // Verify if gift exists
        if !env.storage().persistent().has(&id) {
            return Err(GiftError::DoesNotExist);
        }

        let mut gift: GiftCard = env.storage().persistent().get(&id).unwrap();

        // Check if already claimed or expired
        if gift.status == GiftStatus::Claimed {
            return Err(GiftError::AlreadyClaimed);
        }
        if gift.status == GiftStatus::Expired {
            return Err(GiftError::Expired);
        }
        if gift.status != GiftStatus::Pending {
            return Err(GiftError::NotPending);
        }

        // Check expiry
        let now = env.ledger().timestamp();
        if now > gift.expires_at {
            gift.status = GiftStatus::Expired;
            env.storage().persistent().set(&id, &gift);
            return Err(GiftError::Expired);
        }

        // Send tokens from escrow contract to recipient
        let token_client = token::Client::new(&env, &gift.token);
        token_client.transfer(&env.current_contract_address(), &recipient, &gift.amount);

        // Call the NFT receipt contract to mint receipt
        let nft_client = InternalGiftNFTClient::new(&env, &gift.nft_contract);
        nft_client.mint_receipt(
            &env.current_contract_address(),
            &recipient,
            &id,
            &gift.amount,
        );

        // Update status to claimed
        gift.status = GiftStatus::Claimed;
        gift.recipient = Some(recipient.clone());
        env.storage().persistent().set(&id, &gift);

        env.events().publish(
            (GIFT, symbol_short!("claimed")),
            (id, recipient)
        );

        Ok(())
    }

    pub fn expire_gift(env: Env, id: Symbol) -> Result<(), GiftError> {
        // Verify if gift exists
        if !env.storage().persistent().has(&id) {
            return Err(GiftError::DoesNotExist);
        }

        let mut gift: GiftCard = env.storage().persistent().get(&id).unwrap();

        // Check if pending
        if gift.status != GiftStatus::Pending {
            return Err(GiftError::NotPending);
        }

        // Check timestamp
        let now = env.ledger().timestamp();
        if now <= gift.expires_at {
            return Err(GiftError::NotExpiredYet);
        }

        // Refund tokens back to the sender
        let token_client = token::Client::new(&env, &gift.token);
        token_client.transfer(&env.current_contract_address(), &gift.sender, &gift.amount);

        // Update status to expired
        gift.status = GiftStatus::Expired;
        env.storage().persistent().set(&id, &gift);

        env.events().publish((GIFT, symbol_short!("expired")), id);

        Ok(())
    }

    pub fn get_gift(env: Env, id: Symbol) -> Option<GiftCard> {
        if env.storage().persistent().has(&id) {
            Some(env.storage().persistent().get(&id).unwrap())
        } else {
            None
        }
    }
}

#[cfg(test)]
mod test;

