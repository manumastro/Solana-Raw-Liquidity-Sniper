import { Connection, PublicKey } from '@solana/web3.js';
import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk';
import bs58 from 'bs58';
import { CONFIG } from '../config';
import { MarketCache } from '../core/market_cache';

const connection = new Connection(CONFIG.HELIUS_HTTPS, {
    wsEndpoint: CONFIG.HELIUS_WSS,
    commitment: CONFIG.COMMITMENT_LEVEL as any
});

const existingLiquidityPools = new Set<string>();
const processedPoolsLog = new Set<string>(); // Per evitare spam di log
const runTimestamp = Math.floor(new Date().getTime() / 1000);

export async function startRaydiumListener() {
    console.log("🎧 Avvio Raydium AMM Listener...");
    
    const quoteTokenMint = new PublicKey(CONFIG.SOL_MINT);
    const raydiumProgramId = new PublicKey(CONFIG.RAYDIUM_PROGRAM_ID);
    const openbookProgramId = new PublicKey(CONFIG.OPENBOOK_PROGRAM_ID);

    const subscriptionId = connection.onProgramAccountChange(
        raydiumProgramId,
        async (updatedAccountInfo) => {
            const key = updatedAccountInfo.accountId.toString();
            const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(updatedAccountInfo.accountInfo.data);
            const poolOpenTime = parseInt(poolState.poolOpenTime.toString());
            const existing = existingLiquidityPools.has(key);

            // Calcola l'inizio della giornata odierna (00:00:00)
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;

            // Gestione log: Mostra solo pool create oggi
            if (poolOpenTime >= startOfDay) {
                if (!processedPoolsLog.has(key)) {
                    processedPoolsLog.add(key);
                    const openTimeDate = new Date(poolOpenTime * 1000);
                    const runTimeDate = new Date(runTimestamp * 1000);
                    console.log(`🔎 Check Pool: ${key} | Open: ${openTimeDate.toLocaleString()} vs Start: ${runTimeDate.toLocaleString()} | Existing: ${existing}`);
                }
            } else if (poolOpenTime === 0) {
                 // Opzionale: Se vuoi vedere ancora i 1970, decommenta la riga sotto. 
                 // Per ora li nascondo come richiesto ("solo creati oggi").
                 // console.log(`⚠️  Pool con OpenTime 0 (1970) rilevata: https://dexscreener.com/solana/${key}`);
            }

            if (poolOpenTime > runTimestamp && !existing) {
                existingLiquidityPools.add(key);
                console.log(`✨ Nuova Pool Rilevata: https://dexscreener.com/solana/${key}`);
                console.log(`   Base Mint: ${poolState.baseMint.toString()}`);
                console.log(`   Quote Mint: ${poolState.quoteMint.toString()}`);
                console.log(`   Open Time: ${new Date(poolOpenTime * 1000).toLocaleString()}`);


                // CHECK CACHE OPENBOOK
                const cachedMarket = MarketCache.getInstance().getMarket(poolState.baseMint.toString());
                if (cachedMarket) {
                    console.log(`   🚀 CACHE HIT! Dati OpenBook trovati in memoria.`);
                    console.log(`   ⚡ Market ID: ${cachedMarket.marketId}`);
                    console.log(`   ⚡ Bids: ${cachedMarket.bids.toBase58()}`);
                    console.log(`   ⚡ Asks: ${cachedMarket.asks.toBase58()}`);
                    console.log(`   ⚡ EventQueue: ${cachedMarket.eventQueue.toBase58()}`);
                    // Qui possiamo procedere all'acquisto IMMEDIATO usando i dati in cache

                    console.log(`   🐢 CACHE MISS. Dati OpenBook non trovati. Bisogna scaricarli (lento).`);
                }
                // se trovata nuova pool, blocca il flusso per test
                process.exit(0);
            }
        },
        CONFIG.COMMITMENT_LEVEL as any,
        [
            { dataSize: LIQUIDITY_STATE_LAYOUT_V4.span },
            {
                memcmp: {
                    offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('marketProgramId'),
                    bytes: openbookProgramId.toBase58(),
                },
            },
            {
                memcmp: {
                    offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
                    bytes: quoteTokenMint.toBase58(),
                },
            },
            {
                memcmp: {
                    offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('status'),
                    bytes: bs58.encode([6, 0, 0, 0, 0, 0, 0, 0]),
                },
            }
        ]
    );

    console.log(`✅ In ascolto su Raydium (ID: ${subscriptionId})`);
}
