// src/listeners/openbook_market.ts
import WebSocket from 'ws';
import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';
import { parseMarketData } from '../parsers/market_parser';
import { PdaCalculator } from '../utils/pda_calculator';

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
    return new Promise<void>((resolve, reject) => {
        console.log("🔍 Connessione al listener OpenBook...");
        const ws = new WebSocket(CONFIG.HELIUS_WSS);

        ws.on('open', () => {
            console.log("✅ Connesso al flusso OpenBook.");
            console.log(`   --> Strategia: ANTICIPAZIONE (OpenBook → Raydium)`);
            console.log(`   --> Target: OpenBook Markets (${CONFIG.OPENBOOK_PROGRAM_ID})`);

            try {
                // Validazione PublicKey
                const openbookPubkey = new PublicKey(CONFIG.OPENBOOK_PROGRAM_ID);

                // Sottoscrizione a TUTTI i nuovi account del programma OpenBook
                // Questo cattura la creazione di nuovi mercati
                const request = {
                    jsonrpc: "2.0",
                    id: 2,
                    method: "programSubscribe",
                    params: [
                        openbookPubkey.toBase58(),
                        {
                            encoding: "base64",
                            commitment: CONFIG.COMMITMENT_LEVEL,
                            filters: [
                                // Filtro per dimensione tipica di un Market account OpenBook
                                // Un Market OpenBook V3 è circa 388 bytes
                                // { dataSize: 388 }  <-- RIMOSSO TEMPORANEAMENTE PER DEBUG
                            ]
                        }
                    ]
                };

                ws.send(JSON.stringify(request));
                console.log("📡 Richiesta programSubscribe inviata per OpenBook\n");
            } catch (err) {
                console.error("❌ Errore validazione OpenBook PublicKey:", err);
                reject(err);
            }
        });

        ws.on('message', async (data: string) => {
            try {
                const response = JSON.parse(data);

                // Conferma sottoscrizione
                if (response.result && response.id === 2) {
                    console.log(`✅ OpenBook Subscription attiva (ID: ${response.result})`);
                    console.log(`🎯 In ascolto per nuovi mercati OpenBook...\n`);
                    return;
                }

                // Ignora messaggi di sistema
                if (!response.params || !response.params.result) {
                    return;
                }

                const accountInfo = response.params.result.value;
                const slot = response.params.result.context.slot;
                console.log(accountInfo);

                // Nuovo account OpenBook rilevato!
                if (accountInfo && accountInfo.account) {
                    const pubkey = accountInfo.pubkey;
                    const dataBuffer = Buffer.from(accountInfo.account.data[0], 'base64');

                    // Decodifica immediata dei dati
                    const marketData = parseMarketData(dataBuffer);

                    // SMART FILTER: Ignora account che non sono mercati validi
                    // Un mercato valido deve avere Mint diversi dal System Program (111111...)
                    const SYSTEM_PROGRAM = '11111111111111111111111111111111';

                    if (marketData &&
                        marketData.baseMint !== SYSTEM_PROGRAM &&
                        marketData.quoteMint !== SYSTEM_PROGRAM) {

                        console.log(`\n🔥 NUOVO MERCATO OPENBOOK RILEVATO!`);
                        console.log(`   📍 Market Address: ${pubkey}`);
                        console.log(`   🎰 Slot: ${slot}`);
                        console.log(`   ⏱️  Tempo: ${new Date().toISOString()}`);
                        console.log(`   💎 Base Mint (Token): ${marketData.baseMint}`);
                        console.log(`   💰 Quote Mint (SOL/USDC): ${marketData.quoteMint}`);
                        console.log(`   🔗 Solscan: https://solscan.io/account/${pubkey}`);

                        // Tentativo di predizione (spesso fallisce per V4, ma utile per debug)
                        // TODO: Sostituire con il vero wallet dell'utente quando avremo il modulo Wallet
                        const dummyWallet = new PublicKey('11111111111111111111111111111111');

                        try {
                            const raydiumProgId = new PublicKey(CONFIG.RAYDIUM_PROGRAM_ID);

                            // 1. Calcolo ATA (Dove riceveremo i token)
                            const baseAta = PdaCalculator.getAssociatedTokenAccount(dummyWallet, new PublicKey(marketData.baseMint));
                            console.log(`   🏦 Predicted ATA (Base): ${baseAta.toBase58()}`);

                            // 2. Tentativo Predizione Pool (Solo per scopi futuri/CPMM)
                            // NOTA: Per Raydium V4 Legacy (il nostro target attuale), l'indirizzo pool è random (Keypair).
                            // Questa funzione sarà utile se integreremo il supporto a Raydium CPMM o CLMM.
                            const predictedPool = PdaCalculator.predictRaydiumPoolAddress(raydiumProgId, pubkey);
                            if (predictedPool) {
                                console.log(`   🔮 Predicted Pool PDA: ${predictedPool.toBase58()} (Nota: Probabilmente errato per V4, valido per CPMM)`);
                            }
                        } catch (e) {
                            console.log(`   ⚠️  Errore calcoli PDA: ${e}`);
                        }

                        console.log(`   ⏳ In attesa di 'Initialize2' su Raydium per confermare ID Pool...\n`);
                    }
                    // else { Ignora silenziosamente il rumore (EventQueue, Bids, Asks, etc.) }
                }

            } catch (err) {
                console.error("⚠️ Errore parsing messaggio OpenBook:", err);
            }
        });

        ws.on('error', (err) => {
            console.error("❌ Errore WebSocket OpenBook:", err);
            reject(err);
        });

        ws.on('close', () => {
            console.log("⚠️ Connessione OpenBook chiusa. Riconnessione...");
            setTimeout(() => startOpenBookListener(), 2000);
        });
    });
}
