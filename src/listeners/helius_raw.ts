import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';
import { SniperManager } from '../core/sniper_manager';

export async function startRawListener() {
    console.log("   --> Target: Raydium V4 (675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8)");

    const connection = new Connection(CONFIG.HELIUS_HTTPS, {
        wsEndpoint: CONFIG.HELIUS_WSS
    });
    const RAYDIUM_PROGRAM_ID = new PublicKey(CONFIG.RAYDIUM_PROGRAM_ID);
    let txCounter = 0;

    try {
        console.log("   📡 Connessione Logs Raydium avviata...");

        connection.onLogs(
            RAYDIUM_PROGRAM_ID,
            (logs, ctx) => {
                if (logs.err) return;
                txCounter++;
                // Cerca l'istruzione di creazione pool
                if (logs.logs.some(log => log.includes("Initialize2"))) {
                    console.log(`\n⚡ RAYDIUM POOL CREATION DETECTED!`);
                    console.log(`   🎰 Slot: ${ctx.slot}`);
                    console.log(`   � Signature: ${logs.signature}`);

                    // CHECK WATCHLIST
                    console.log(`   👀 Checking Sniper Watchlist...`);
                    const sniperManager = SniperManager.getInstance();
                    const watchlist = sniperManager.getWatchlist();

                    if (watchlist.length > 0) {
                        console.log(`   ✅ Watchlist attiva con ${watchlist.length} target(s).`);
                        console.log(`   � TARGET POTENZIALE TROVATO! (Logica di match da implementare)`);

                        // TODO: Qui dovremmo fare getTransaction per avere i dettagli (Token A, Token B)
                        // e confrontare con la watchlist.
                    } else {
                        console.log(`   ❌ Watchlist vuota. Nessun target da snipare.`);
                    }

                    console.log("\n🛑 TEST COMPLETATO: Pool rilevata. Arresto bot.");
                    process.exit(0);

                } else if (txCounter % 100 === 0) {
                    // Ogni 100 TX, mostra un sample per confermare che stiamo ricevendo dati
                    console.log(`📊 [${txCounter} TX ricevute] Raydium Alive. Last Sig: ${logs.signature.substring(0, 10)}...`);
                }
            },
            "processed"
        );
    } catch (err) {
        console.error("Errore Raydium Listener:", err);
        // Riprova dopo 5 secondi
        setTimeout(startRawListener, 5000);
    }
}
