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
    QUOTE_MINT_OFFSET: 85,
    BIDS_OFFSET: 285,
    ASKS_OFFSET: 317,
    EVENT_QUEUE_OFFSET: 349
};

export interface MarketData {
    baseMint: string;
    quoteMint: string;
    bids: PublicKey;
    asks: PublicKey;
    eventQueue: PublicKey;
}

export function parseMarketData(data: Buffer): MarketData | null {
    try {
        // Verifica minima lunghezza buffer
        // Il layout completo è ~388 bytes
        if (data.length < 388) {
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

        // Estrazione Bids
        const bidsBuffer = data.subarray(
            MARKET_STATE_LAYOUT_V3.BIDS_OFFSET,
            MARKET_STATE_LAYOUT_V3.BIDS_OFFSET + 32
        );
        const bids = new PublicKey(bidsBuffer);

        // Estrazione Asks
        const asksBuffer = data.subarray(
            MARKET_STATE_LAYOUT_V3.ASKS_OFFSET,
            MARKET_STATE_LAYOUT_V3.ASKS_OFFSET + 32
        );
        const asks = new PublicKey(asksBuffer);

        // Estrazione Event Queue
        const eventQueueBuffer = data.subarray(
            MARKET_STATE_LAYOUT_V3.EVENT_QUEUE_OFFSET,
            MARKET_STATE_LAYOUT_V3.EVENT_QUEUE_OFFSET + 32
        );
        const eventQueue = new PublicKey(eventQueueBuffer);

        return {
            baseMint,
            quoteMint,
            bids,
            asks,
            eventQueue
        };

    } catch (error) {
        console.error("❌ Errore durante il parsing del Market OpenBook:", error);
        return null;
    }
}
