use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::{invoke, invoke_signed},
    system_instruction::{create_account, transfer},
    sysvar::rent::Rent,
};
use anchor_spl::{
    associated_token::{self, AssociatedToken, Create},
    token::{self, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::instruction::create_master_edition_v3;
use mpl_token_metadata::instruction::create_metadata_accounts_v2;
use mpl_token_metadata::state::Creator;

declare_id!("3aeX9JsMSHueuLGDoigyt935Yom9cQAN3z8E58v7QDB4");

#[program]
pub mod sol_store {
    use super::*;

    pub fn create_merchant(ctx: Context<CreateMerchant>, name: String) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;
        merchant.authority = ctx.accounts.authority.key();
        merchant.name = name;
        merchant.no_of_nft_minted = 0;
        merchant.no_of_nft_burned = 0;
        merchant.bump = *ctx.bumps.get("merchant").unwrap();
        Ok(())
    }

    pub fn tx_with_coupon(
        ctx: Context<TxCoupon>,
        name: String,
        symbol: String,
        uri: String,
        seller_fee_basis_points: u16,
        is_mutable: bool,
    ) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;

        let creators = vec![Creator {
            address: ctx.accounts.merchant.authority,
            verified: false,
            share: 100,
        }];

        let ix = create_metadata_accounts_v2(
            *ctx.accounts.mpl_program.key,
            *ctx.accounts.metadata.key,
            *ctx.accounts.mint.to_account_info().key,
            *ctx.accounts.authority.key,
            *ctx.accounts.authority.key,
            ctx.accounts.merchant.authority,
            name,
            symbol,
            uri,
            Some(creators),
            seller_fee_basis_points,
            true,
            is_mutable,
            None,
            None,
        );

        invoke(
            &ix,
            &[
                ctx.accounts.metadata.clone(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.mpl_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;

        msg!("CREATED MEta data");

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, 1)?;

        msg!("TOKENMINTED");

        let ix = create_master_edition_v3(
            *ctx.accounts.mpl_program.key,
            *ctx.accounts.master_edition.key,
            *ctx.accounts.mint.to_account_info().key,
            *ctx.accounts.authority.key,
            *ctx.accounts.authority.key,
            *ctx.accounts.metadata.key,
            *ctx.accounts.authority.key,
            Some(0),
        );

        invoke(
            &ix,
            &[
                ctx.accounts.master_edition.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TxCoupon<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub merchant: Box<Account<'info, Merchant>>,
    #[account(mut)]
    pub master_edition: AccountInfo<'info>,
    #[account(address = mpl_token_metadata::id())]
    pub mpl_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateMerchant<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init,payer=authority,seeds=[b"merchant".as_ref(),authority.key().as_ref()],bump,space=32+1+8+8+64)]
    pub merchant: Box<Account<'info, Merchant>>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct Merchant {
    pub name: String,
    pub authority: Pubkey,
    pub bump: u8,
    no_of_nft_minted: i64,
    no_of_nft_burned: i64,
}
