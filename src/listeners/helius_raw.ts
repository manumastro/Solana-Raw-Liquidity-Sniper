// src/listeners/helius_raw.ts
import WebSocket from 'ws';
import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';

// Payload della richiesta di iscrizione
const subscribeRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "programSubscribe",
    params: [
        CONFIG.RAYDIUM_PROGRAM_ID,
        {
            encoding: "base64",
            commitment: CONFIG.COMMITMENT_LEVEL,
            filters: [
                { dataSize: CONFIG.POOL_SIZE_BYTES } // Filtro hardware-level
            ]
        }
    ]
};

export async function startRawListener() {
    return new Promise<void>((resolve, reject) => {
        console.log("🔌 Connessione al WebSocket Helius in corso...");
        const ws = new WebSocket(CONFIG.HELIUS_WSS);

        ws.on('open', () => {
            console.log("✅ Connesso al flusso dati Helius.");
            console.log(`   --> Modalità: LOGS (Fallback per limitazioni RPC)`);
            console.log(`   --> Target: Raydium V4 (${CONFIG.RAYDIUM_PROGRAM_ID})`);

            // Usiamo logsSubscribe perché programSubscribe è bloccato su Helius Free/Public per Raydium
            // NOTA: Validazione e uso del Raydium Program ID
            try {
                // Validiamo che sia un PublicKey valido
                const raydiumPubkey = new PublicKey(CONFIG.RAYDIUM_PROGRAM_ID);
                console.log(`✅ Raydium PublicKey validato: ${raydiumPubkey.toBase58()}`);

                const request = {
                    jsonrpc: "2.0",
                    id: 1,
                    method: "logsSubscribe",
                    params: [
                        { mentions: [raydiumPubkey.toBase58()] },
                        { commitment: CONFIG.COMMITMENT_LEVEL }
                    ]
                };

                ws.send(JSON.stringify(request));
            } catch (err) {
                console.error("❌ Errore validazione PublicKey:", err);
                reject(err);
            }
        });


        // Contatore per modalità TEST
        let txCounter = 0;

        ws.on('message', async (data: string) => {
            try {
                const response = JSON.parse(data);

                // Log solo la conferma di sottoscrizione
                if (response.result && response.id === 1) {
                    console.log(`✅ Sottoscrizione attiva (ID: ${response.result})`);
                    console.log(`🎯 In ascolto per nuove pool Raydium...`);
                    console.log(`📊 Modalità TEST: Mostrerò sample ogni 10 TX\n`);
                    return;
                }

                // Ignora messaggi di sistema
                if (!response.params || !response.params.result || !response.params.result.value) {
                    return;
                }

                const value = response.params.result.value;
                const logs = value.logs as string[];
                const signature = value.signature;

                // Incrementa contatore
                txCounter++;

                // Cerca l'istruzione di creazione pool (Initialize2)
                const isNewPool = logs.some(log => log.includes("Initialize2"));

                if (isNewPool) {
                    console.log(`\n🎉 NUOVA POOL RILEVATA!`);
                    console.log(`   TX: https://solscan.io/tx/${signature}`);
                    console.log(`   ⏱️  Tempo: ${new Date().toISOString()}`);
                    console.log(`   📋 Logs:`, logs.filter(l => l.includes("Initialize2") || l.includes("Program log")));

                    // TODO: Qui dovremmo fare getTransaction per avere i dettagli (Token A, Token B)
                    // Poiché non abbiamo i dati raw in memoria, dobbiamo fare una fetch.
                    // Questo è più lento del raw memory ma funziona su tutti gli RPC.
                } else if (txCounter % 10 === 0) {
                    // Ogni 10 TX, mostra un sample per confermare che stiamo ricevendo dati
                    console.log(`📊 [${txCounter} TX ricevute] Sample: ${signature.substring(0, 16)}...`);
                }

            } catch (err) {
                console.error("⚠️ Errore parsing messaggio:", err);
            }
        });

        ws.on('error', (err) => {
            console.error("❌ Errore WebSocket:", err);
            reject(err);
        });

        ws.on('close', () => {
            console.log("⚠️ Connessione chiusa. Riconnessione...");
            setTimeout(() => startRawListener(), 2000);
        });
    });
}
