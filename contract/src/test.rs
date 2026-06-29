#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, symbol_short, String
};
use stellar_gift_nft::{GiftNFT, GiftNFTClient};

fn setup<'a>(env: &'a Env) -> (StellarGiftContractClient<'a>, Address, Address, Address, Address) {
    env.mock_all_auths();

    // 1. Register main contract
    let contract_id = env.register(StellarGiftContract, ());
    let client = StellarGiftContractClient::new(env, &contract_id);

    // 2. Register NFT receipt contract
    let nft_contract = env.register(GiftNFT, ());
    let nft_client = GiftNFTClient::new(env, &nft_contract);
    // Initialize NFT contract with main contract address
    nft_client.initialize(&contract_id);

    // 3. Register token contract
    let token_admin = Address::generate(env);
    let token_address = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::StellarAssetClient::new(env, &token_address);

    let sender = Address::generate(env);
    let recipient = Address::generate(env);

    // Mint tokens to sender
    token_client.mint(&sender, &100_000_000_i128);

    (client, sender, recipient, token_address, nft_contract)
}

#[test]
fn test_create_gift_success() {
    let env = Env::default();
    let (client, sender, _, token_address, nft_contract) = setup(&env);
    let gift_id = symbol_short!("gift1");
    let expires_at = env.ledger().timestamp() + 86400; // +1 day
    let amount = 10_000_000_i128;
    let message = String::from_str(&env, "Happy birthday!");

    client.create_gift(
        &gift_id,
        &sender,
        &token_address,
        &amount,
        &message,
        &expires_at,
        &nft_contract,
    );

    let gift = client.get_gift(&gift_id).unwrap();
    assert_eq!(gift.sender, sender);
    assert_eq!(gift.token, token_address);
    assert_eq!(gift.amount, amount);
    assert_eq!(gift.status, GiftStatus::Pending);
    assert_eq!(gift.expires_at, expires_at);
    assert_eq!(gift.nft_contract, nft_contract);
}

#[test]
fn test_claim_gift_success() {
    let env = Env::default();
    let (client, sender, recipient, token_address, nft_contract) = setup(&env);
    let gift_id = symbol_short!("gift2");
    let expires_at = env.ledger().timestamp() + 86400;
    let amount = 10_000_000_i128;
    let message = String::from_str(&env, "Cheers!");

    client.create_gift(
        &gift_id,
        &sender,
        &token_address,
        &amount,
        &message,
        &expires_at,
        &nft_contract,
    );

    // Claim
    client.claim_gift(&gift_id, &recipient);

    let gift = client.get_gift(&gift_id).unwrap();
    assert_eq!(gift.status, GiftStatus::Claimed);
    assert_eq!(gift.recipient, Some(recipient.clone()));

    // Verify recipient received funds
    let standard_token = token::Client::new(&env, &token_address);
    assert_eq!(standard_token.balance(&recipient), amount);

    // Verify NFT receipt exists
    let nft_client = GiftNFTClient::new(&env, &nft_contract);
    let receipt = nft_client.get_receipt(&recipient, &gift_id).unwrap();
    assert_eq!(receipt.owner, recipient);
    assert_eq!(receipt.amount_xlm, amount);
    assert_eq!(receipt.gift_id, gift_id);
}

#[test]
fn test_claim_expired_gift_fails() {
    let env = Env::default();
    let (client, sender, recipient, token_address, nft_contract) = setup(&env);
    let gift_id = symbol_short!("gift3");
    let expires_at = env.ledger().timestamp() + 10;
    let amount = 10_000_000_i128;
    let message = String::from_str(&env, "Hurry!");

    client.create_gift(
        &gift_id,
        &sender,
        &token_address,
        &amount,
        &message,
        &expires_at,
        &nft_contract,
    );

    // Advance time past expiry
    let now = env.ledger().timestamp();
    env.ledger().set_timestamp(now + 15);

    // Trying to claim should fail with Expired
    let result = client.try_claim_gift(&gift_id, &recipient);
    assert!(result.is_err());

    // Status should still be Pending because the claim transaction rolled back
    let gift = client.get_gift(&gift_id).unwrap();
    assert_eq!(gift.status, GiftStatus::Pending);

    // Transition status to Expired explicitly via expire_gift
    client.expire_gift(&gift_id);
    let gift_after = client.get_gift(&gift_id).unwrap();
    assert_eq!(gift_after.status, GiftStatus::Expired);

}

#[test]
fn test_double_claim_fails() {
    let env = Env::default();
    let (client, sender, recipient, token_address, nft_contract) = setup(&env);
    let gift_id = symbol_short!("gift4");
    let expires_at = env.ledger().timestamp() + 86400;
    let amount = 10_000_000_i128;
    let message = String::from_str(&env, "Double claim test");

    client.create_gift(
        &gift_id,
        &sender,
        &token_address,
        &amount,
        &message,
        &expires_at,
        &nft_contract,
    );

    // First claim succeeds
    client.claim_gift(&gift_id, &recipient);

    // Second claim fails
    let result = client.try_claim_gift(&gift_id, &recipient);
    assert!(result.is_err());
}

#[test]
fn test_expire_gift_refunds_sender() {
    let env = Env::default();
    let (client, sender, _, token_address, nft_contract) = setup(&env);
    let gift_id = symbol_short!("gift5");
    let expires_at = env.ledger().timestamp() + 10;
    let amount = 10_000_000_i128;
    let message = String::from_str(&env, "Refund me");

    // Sender starts with 100_000_000 tokens
    let standard_token = token::Client::new(&env, &token_address);
    assert_eq!(standard_token.balance(&sender), 100_000_000);

    client.create_gift(
        &gift_id,
        &sender,
        &token_address,
        &amount,
        &message,
        &expires_at,
        &nft_contract,
    );

    // Sender should have 100_000_000 - 10_000_000 = 90_000_000
    assert_eq!(standard_token.balance(&sender), 90_000_000);

    // Calling expire_gift before expiry should fail
    let err_before = client.try_expire_gift(&gift_id);
    assert!(err_before.is_err());

    // Advance time past expiry
    let now = env.ledger().timestamp();
    env.ledger().set_timestamp(now + 15);

    // Calling expire_gift after expiry should succeed
    client.expire_gift(&gift_id);

    // Sender should be refunded
    assert_eq!(standard_token.balance(&sender), 100_000_000);

    let gift = client.get_gift(&gift_id).unwrap();
    assert_eq!(gift.status, GiftStatus::Expired);
}
