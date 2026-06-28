#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, token, Address, Env, Symbol, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GiftCard {
    pub sender: Address,
    pub token: Address,
    pub amount: i128,
    pub message: String,
    pub claimed: bool,
    pub recipient: Option<Address>,
}

#[contract]
pub struct StellarGiftContract;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GiftError {
    AlreadyExists = 1,
    DoesNotExist = 2,
    AlreadyClaimed = 3,
    InvalidAmount = 4,
}

#[contractimpl]
impl StellarGiftContract {
    pub fn create_gift(
        env: Env,
        id: Symbol,
        sender: Address,
        token: Address,
        amount: i128,
        message: String,
    ) -> Result<(), GiftError> {
        // Authenticate the sender
        sender.require_auth();

        if amount <= 0 {
            return Err(GiftError::InvalidAmount);
        }

        // Verify if gift ID already exists
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
            claimed: false,
            recipient: None,
        };
        env.storage().persistent().set(&id, &gift);

        Ok(())
    }

    pub fn claim_gift(
        env: Env,
        id: Symbol,
        recipient: Address,
    ) -> Result<(), GiftError> {
        // Verify if gift exists
        if !env.storage().persistent().has(&id) {
            return Err(GiftError::DoesNotExist);
        }

        let mut gift: GiftCard = env.storage().persistent().get(&id).unwrap();

        // Check if already claimed
        if gift.claimed {
            return Err(GiftError::AlreadyClaimed);
        }

        // Send tokens from escrow contract to recipient
        let token_client = token::Client::new(&env, &gift.token);
        token_client.transfer(&env.current_contract_address(), &recipient, &gift.amount);

        // Update status to claimed
        gift.claimed = true;
        gift.recipient = Some(recipient);
        env.storage().persistent().set(&id, &gift);

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
