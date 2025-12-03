import { PublicKey } from '@solana/web3.js';

/**
 * Layout Raydium V4 (Liquidity State V4)
 * 
 * Offsets critici per il Paper Trading:
 * - Base Vault     : Offset 336 (32 bytes)
 * - Quote Vault    : Offset 368 (32 bytes)
 * - Base Mint      : Offset 400 (32 bytes)
 * - Quote Mint     : Offset 432 (32 bytes)
 */

const RAYDIUM_V4_LAYOUT = {
    BASE_VAULT_OFFSET: 336,
    QUOTE_VAULT_OFFSET: 368,
    BASE_MINT_OFFSET: 400,
    QUOTE_MINT_OFFSET: 432,
    BASE_DECIMAL_OFFSET: 32,
    QUOTE_DECIMAL_OFFSET: 40
};

export interface PoolData {
    baseVault: string;
    quoteVault: string;
    baseMint: string;
    quoteMint: string;
    baseDecimals: number;
    quoteDecimals: number;
}

export function parsePoolData(data: Buffer): PoolData | null {
    try {
        if (data.length < 464) { // 432 + 32
            console.warn(`⚠️ Buffer troppo corto per Pool Parser: ${data.length} bytes`);
            return null;
        }

        const baseDecimals = Number(data.readBigUInt64LE(RAYDIUM_V4_LAYOUT.BASE_DECIMAL_OFFSET));
        const quoteDecimals = Number(data.readBigUInt64LE(RAYDIUM_V4_LAYOUT.QUOTE_DECIMAL_OFFSET));

        const baseVault = new PublicKey(data.subarray(
            RAYDIUM_V4_LAYOUT.BASE_VAULT_OFFSET,
            RAYDIUM_V4_LAYOUT.BASE_VAULT_OFFSET + 32
        )).toBase58();

        const quoteVault = new PublicKey(data.subarray(
            RAYDIUM_V4_LAYOUT.QUOTE_VAULT_OFFSET,
            RAYDIUM_V4_LAYOUT.QUOTE_VAULT_OFFSET + 32
        )).toBase58();

        const baseMint = new PublicKey(data.subarray(
            RAYDIUM_V4_LAYOUT.BASE_MINT_OFFSET,
            RAYDIUM_V4_LAYOUT.BASE_MINT_OFFSET + 32
        )).toBase58();

        const quoteMint = new PublicKey(data.subarray(
            RAYDIUM_V4_LAYOUT.QUOTE_MINT_OFFSET,
            RAYDIUM_V4_LAYOUT.QUOTE_MINT_OFFSET + 32
        )).toBase58();

        return {
            baseVault,
            quoteVault,
            baseMint,
            quoteMint,
            baseDecimals,
            quoteDecimals
        };

    } catch (error) {
        console.error("❌ Errore durante il parsing della Pool Raydium:", error);
        return null;
    }
}
