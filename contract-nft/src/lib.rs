#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NFTReceipt {
    pub owner: Address,
    pub gift_id: Symbol,
    pub amount_xlm: i128,
    pub claimed_at: u64,
}

#[contracttype]
pub enum NFTDataKey {
    GiftContract,
    Receipt(Address, Symbol),
}

#[contract]
pub struct GiftNFT;

#[contractimpl]
impl GiftNFT {
    pub fn initialize(env: Env, gift_contract: Address) {
        if env.storage().instance().has(&NFTDataKey::GiftContract) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&NFTDataKey::GiftContract, &gift_contract);
    }

    // Only callable by the main GiftContract
    pub fn mint_receipt(
        env: Env,
        caller: Address,
        recipient: Address,
        gift_id: Symbol,
        amount_xlm: i128,
    ) {
        caller.require_auth();

        let gift_contract: Address = env
            .storage()
            .instance()
            .get(&NFTDataKey::GiftContract)
            .expect("Not initialized");

        if caller != gift_contract {
            panic!("Unauthorized caller");
        }

        let receipt = NFTReceipt {
            owner: recipient.clone(),
            gift_id: gift_id.clone(),
            amount_xlm,
            claimed_at: env.ledger().timestamp(),
        };

        // Store receipt keyed by recipient + gift_id
        let key = NFTDataKey::Receipt(recipient.clone(), gift_id.clone());
        env.storage().persistent().set(&key, &receipt);

        // Emit mint event
        env.events().publish(
            (symbol_short!("NFT"), symbol_short!("minted")),
            (recipient, gift_id)
        );
    }

    pub fn get_receipt(env: Env, owner: Address, gift_id: Symbol) -> Option<NFTReceipt> {
        let key = NFTDataKey::Receipt(owner, gift_id);
        if env.storage().persistent().has(&key) {
            Some(env.storage().persistent().get(&key).unwrap())
        } else {
            None
        }
    }
}
