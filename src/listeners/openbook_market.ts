// src/listeners/openbook_market.ts
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { CONFIG } from '../config';
import { parseMarketData } from '../parsers/market_parser';
import { PdaCalculator } from '../utils/pda_calculator';
import { SniperManager } from '../core/sniper_manager';

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

    console.log(`   --> Strategia: ANTICIPAZIONE (OpenBook → Raydium)`);
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
                        console.log("   🔄 Coppia invertita rilevata (SOL è Base). Scambio Base/Quote...");
                        baseMint = marketData.quoteMint;
                        quoteMint = marketData.baseMint;
                        isInverted = true;
                    }

                    console.log(`\n🔥 NUOVO MERCATO OPENBOOK RILEVATO!`);
                    console.log(`   📍 Market Address: ${pubkey.toBase58()}`);
                    console.log(`   🎰 Slot: ${slot}`);
                    console.log(`   ⏱️  Tempo: ${new Date().toISOString()}`);
                    console.log(`   💎 Base Mint (Token): ${baseMint}`);
                    console.log(`   💰 Quote Mint (SOL/USDC): ${quoteMint}`);
                    console.log(`   🔗 Solscan: https://solscan.io/account/${pubkey.toBase58()}`);

                    // Tentativo di predizione
                    // Usiamo un wallet random per simulare il calcolo dell'ATA (in produzione useremmo il tuo wallet)
                    const dummyWallet = Keypair.generate().publicKey;

                    try {
                        const raydiumProgId = new PublicKey(CONFIG.RAYDIUM_PROGRAM_ID);
                        const baseAta = PdaCalculator.getAssociatedTokenAccount(dummyWallet, new PublicKey(baseMint));
                        console.log(`   🏦 Predicted ATA (Base): ${baseAta.toBase58()} (Simulated)`);

                        // AGGIUNTA ALLA WATCHLIST
                        SniperManager.getInstance().addToWatchlist({
                            marketId: pubkey.toBase58(),
                            baseMint: baseMint,
                            quoteMint: quoteMint,
                            baseAta: baseAta.toBase58(),
                            timestamp: Date.now(),
                            inverted: isInverted
                        });

                        const predictedPool = PdaCalculator.predictRaydiumPoolAddress(raydiumProgId, pubkey);
                        if (predictedPool) {
                            console.log(`   🔮 Predicted Pool PDA: ${predictedPool.toBase58()} (Potential Match)`);
                        }
                    } catch (e) {
                        console.log(`   ⚠️  Errore calcoli PDA: ${e}`);
                    }

                    console.log(`   ⏳ In attesa di 'Initialize2' su Raydium per confermare ID Pool...\n`);
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
        console.log(`🎯 In ascolto per nuovi mercati OpenBook...\n`);

    } catch (err) {
        console.error("❌ Errore setup OpenBook Listener:", err);
    }
}
