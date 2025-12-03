// src/listeners/openbook_market.ts
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { CONFIG } from '../config';
import { parseMarketData } from '../parsers/market_parser';
import { MarketCache } from '../core/market_cache';

/**
 * 🧠 OPENBOOK STRATEGY - La strategia avanzata degli sniper professionisti
 * 
 * Perché funziona:
 * 1. Per creare una pool Raydium, PRIMA si deve creare un mercato OpenBook
 * 2. Questo avviene secondi/minuti prima della pool Raydium
 * 3. OpenBook ha meno traffico → programSubscribe NON è bloccato su free tier
 * 4. Possiamo rilevare il nuovo mercato e predire l'indirizzo della pool Raydium
 * 
 * Vantaggio: 5-60 secondi di anticipo rispetto a chi ascolta solo Raydium
 */

export async function startOpenBookListener() {
    console.log("🔍 Connessione al listener OpenBook (Web3.js)...");

    const connection = new Connection(CONFIG.HELIUS_HTTPS, {
        wsEndpoint: CONFIG.HELIUS_WSS,
        commitment: CONFIG.COMMITMENT_LEVEL as any
    });

    const openbookPubkey = new PublicKey(CONFIG.OPENBOOK_PROGRAM_ID);

    console.log(`   --> Strategia: CACHING (OpenBook → Memory)`);
    console.log(`   --> Target: OpenBook Markets (${CONFIG.OPENBOOK_PROGRAM_ID})`);

    try {
        // Utilizziamo onProgramAccountChange di web3.js invece del WebSocket raw
        // Questo gestisce automaticamente la connessione e il parsing di base
        const subscriptionId = connection.onProgramAccountChange(
            openbookPubkey,
            (updatedAccountInfo, context) => {
                const pubkey = updatedAccountInfo.accountId;
                const accountInfo = updatedAccountInfo.accountInfo;
                const slot = context.slot;

                // Parsing dei dati
                const marketData = parseMarketData(accountInfo.data);

                // SMART FILTER: Ignora account che non sono mercati validi
                const SYSTEM_PROGRAM = '11111111111111111111111111111111';
                const SOL_MINT = 'So11111111111111111111111111111111111111112';

                if (marketData &&
                    marketData.baseMint !== SYSTEM_PROGRAM &&
                    marketData.quoteMint !== SYSTEM_PROGRAM) {

                    // FIX: Gestione coppie invertite (SOL/TOKEN invece di TOKEN/SOL)
                    let baseMint = marketData.baseMint;
                    let quoteMint = marketData.quoteMint;
                    let isInverted = false;

                    if (baseMint === SOL_MINT) {
                        // console.log("   🔄 Coppia invertita rilevata (SOL è Base). Scambio Base/Quote...");
                        baseMint = marketData.quoteMint;
                        quoteMint = marketData.baseMint;
                        isInverted = true;
                    }

                    // SALVATAGGIO IN CACHE
                    // Invece di attivare logiche complesse, salviamo solo i dati in memoria
                    // Così quando Raydium aprirà la pool, avremo già i dati pronti.
                    MarketCache.getInstance().saveMarket({
                        marketId: pubkey.toBase58(),
                        baseMint: baseMint,
                        quoteMint: quoteMint,
                        bids: marketData.bids,
                        asks: marketData.asks,
                        eventQueue: marketData.eventQueue,
                        timestamp: Date.now()
                    });
                }
            },
            {
                commitment: CONFIG.COMMITMENT_LEVEL as any,
                filters: [
                    // Filtro per dimensione tipica di un Market account OpenBook V1 (Serum V3)
                    { dataSize: 388 }
                ]
            }
        );

        console.log(`✅ OpenBook Subscription attiva (ID: ${subscriptionId})`);
        console.log(`🎯 In ascolto per nuovi mercati OpenBook (Caching Mode)...\n`);

    } catch (err) {
        console.error("❌ Errore setup OpenBook Listener:", err);
    }
}
