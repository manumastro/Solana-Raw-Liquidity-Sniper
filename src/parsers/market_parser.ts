// src/parsers/market_parser.ts
import { PublicKey } from '@solana/web3.js';

/**
 * Layout OpenBook V3 (Serum V3 Fork)
 * 
 * Offsets critici:
 * - Blob(5)       : Header "accountFlags" padding
 * - Blob(8)       : Account Flags
 * - Own Address   : Offset 13 (32 bytes)
 * - Vault Nonce   : Offset 45 (8 bytes)
 * - Base Mint     : Offset 53 (32 bytes)  <-- TARGET
 * - Quote Mint    : Offset 85 (32 bytes)  <-- TARGET
 */

const MARKET_STATE_LAYOUT_V3 = {
    BASE_MINT_OFFSET: 53,
    QUOTE_MINT_OFFSET: 85
};

export interface MarketData {
    baseMint: string;
    quoteMint: string;
}

export function parseMarketData(data: Buffer): MarketData | null {
    try {
        // Verifica minima lunghezza buffer
        // Il layout completo è ~388 bytes, ma ci servono almeno fino al quote mint (85 + 32 = 117 bytes)
        if (data.length < 117) {
            console.warn(`⚠️ Buffer troppo corto per Market Parser: ${data.length} bytes`);
            return null;
        }

        // Estrazione Base Mint
        const baseMintBuffer = data.subarray(
            MARKET_STATE_LAYOUT_V3.BASE_MINT_OFFSET,
            MARKET_STATE_LAYOUT_V3.BASE_MINT_OFFSET + 32
        );
        const baseMint = new PublicKey(baseMintBuffer).toBase58();

        // Estrazione Quote Mint
        const quoteMintBuffer = data.subarray(
            MARKET_STATE_LAYOUT_V3.QUOTE_MINT_OFFSET,
            MARKET_STATE_LAYOUT_V3.QUOTE_MINT_OFFSET + 32
        );
        const quoteMint = new PublicKey(quoteMintBuffer).toBase58();

        return {
            baseMint,
            quoteMint
        };

    } catch (error) {
        console.error("❌ Errore durante il parsing del Market OpenBook:", error);
        return null;
    }
}
