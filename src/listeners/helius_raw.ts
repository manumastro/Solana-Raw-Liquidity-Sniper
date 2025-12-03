import { Connection, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../config';
import { SniperManager } from '../core/sniper_manager';

export async function startRawListener() {
    console.log("   --> Target: Raydium V4 (675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8)");

    // Usa l'endpoint HTTPS come base. web3.js userà automaticamente un endpoint WSS per il listener.
    const connection = new Connection(CONFIG.HELIUS_HTTPS, 'processed');
    const RAYDIUM_PROGRAM_ID = new PublicKey(CONFIG.RAYDIUM_PROGRAM_ID);
    let txCounter = 0;

    try {
        console.log("   📡 Connessione Logs Raydium avviata con commitment 'confirmed'...");

        connection.onLogs(
            RAYDIUM_PROGRAM_ID,
            (logs, ctx) => {
                if (logs.err) return;

                // LOGGING SU FILE (Solo se --debug è attivo)
                if (process.argv.includes('--debug')) {
                    const logEntry = `[${new Date().toISOString()}] Slot: ${ctx.slot} | Sig: ${logs.signature} | Logs: ${JSON.stringify(logs.logs)}\n`;
                    try {
                        fs.appendFileSync(path.join(__dirname, '../../raydium_logs.txt'), logEntry);
                    } catch (e) {
                        console.error("Errore scrittura log:", e);
                    }
                }
                
                txCounter++;
                if (txCounter % 100 === 0) {
                    console.log(`   💓 Raydium Listener Alive: ${txCounter} txs analizzate.`);
                }

                // Cerca le istruzioni di creazione pool o aggiunta liquidità (case-insensitive).
                const isPoolCreation = logs.logs.some(log => 
                    log.toLowerCase().includes("initialize2") || 
                    log.toLowerCase().includes("Initialize2")
                );

                if (isPoolCreation) {
                    console.log(`\n⚡ RAYDIUM POOL CREATION/LIQUIDITY DETECTED!`);
                    console.log(`   🎰 Slot: ${ctx.slot}`);
                    console.log(`   📝 Signature: ${logs.signature}`);

                    // CHECK WATCHLIST
                    console.log(`   👀 Checking Sniper Watchlist...`);
                    const sniperManager = SniperManager.getInstance();
                    const watchlist = sniperManager.getWatchlist();

                    if (watchlist.length > 0) {
                        console.log(`   ✅ Watchlist attiva con ${watchlist.length} target(s).`);

                        console.log(`   🕵️  Fetching transaction details...`);
                        connection.getParsedTransaction(logs.signature, {
                            commitment: 'confirmed',
                            maxSupportedTransactionVersion: 0
                        }).then(tx => {
                            if (!tx) {
                                console.log("   ❌ Transaction not found or not yet confirmed.");
                                return;
                            }

                            // Cerca l'istruzione Raydium per estrarre gli account
                            const instructions = tx.transaction.message.instructions;
                            const raydiumIx = instructions.find(ix => ix.programId.toBase58() === CONFIG.RAYDIUM_PROGRAM_ID) as any;
                            
                            if (!raydiumIx || !raydiumIx.accounts) {
                                console.log("   ⚠️ Impossibile trovare gli account Raydium nella tx.");
                                return;
                            }

                            const accounts = raydiumIx.accounts as PublicKey[];

                            // Gli indici (8 e 9) sono validi sia per Initialize2 che per LiquidityAdd in V4
                            const tokenAAccount = accounts[8]; 
                            const tokenBAccount = accounts[9];

                            console.log(`   📦 Token A (Mint): ${tokenAAccount.toBase58()}`);
                            console.log(`   📦 Token B (Mint): ${tokenBAccount.toBase58()}`);

                            // Cerca un match nella watchlist
                            const match = watchlist.find(target => 
                                target.baseMint === tokenAAccount.toBase58() || 
                                target.baseMint === tokenBAccount.toBase58()
                            );

                            if (match) {
                                console.log(`\n   🎯 🎯 🎯 BINGO! MATCH TROVATO! 🎯 🎯 🎯`);
                                console.log(`   🏆 Market ID Match: ${match.marketId}`);
                                console.log(`   💎 Token: ${match.baseMint}`);
                                console.log(`   🚀 PRONTI PER LO SWAP! (Esecuzione simulata)`);
                                console.log("\n🛑 TEST COMPLETATO: Match confermato. Arresto bot.");
                                process.exit(0);
                            } else {
                                console.log(`   ❌ Nessun match con la watchlist corrente.`);
                            }
                        }).catch(e => {
                            console.error(`   ⚠️ Errore fetch tx: ${e}`);
                        });

                    } else {
                        console.log(`   ❌ Watchlist vuota.`);
                    }
                }
            },
            "confirmed"
        );
    } catch (err) {
        console.error("Errore Raydium Listener:", err);
        // Riprova dopo 5 secondi
        setTimeout(startRawListener, 5000);
    }
}
