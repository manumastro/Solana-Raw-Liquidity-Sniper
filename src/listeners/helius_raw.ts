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
            console.log("✅ Connesso al flusso dati Raw Memory di Helius.");
            console.log(`   --> Filtro Raydium ID: ${CONFIG.RAYDIUM_PROGRAM_ID}`);
            console.log(`   --> Filtro Dimensione: ${CONFIG.POOL_SIZE_BYTES} bytes`);

            // Invia comando di sottoscrizione
            ws.send(JSON.stringify(subscribeRequest));
        });

        ws.on('message', (data: string) => {
            try {
                const response = JSON.parse(data);

                // Ignora messaggi di sistema (es. conferma sottoscrizione id:1)
                if (!response.params || !response.params.result || !response.params.result.value) {
                    return;
                }

                const value = response.params.result.value;
                const pubkeyStr = value.pubkey; // Pool ID
                const accountData = value.account.data; // [base64_string, encoding]

                if (accountData[1] === 'base64') {
                    // DECODIFICA LOCALE (Zero Latency)
                    const buffer = Buffer.from(accountData[0], 'base64');

                    // Parsing Raw Memory (Layout Raydium V4)
                    const lpMint = new PublicKey(buffer.subarray(328, 360));
                    const coinMint = new PublicKey(buffer.subarray(400, 432));
                    const pcMint = new PublicKey(buffer.subarray(432, 464));

                    // Logica di Identificazione Target
                    let snipeToken = '';
                    let pairType = '';

                    if (coinMint.toBase58() === CONFIG.SOL_MINT) {
                        snipeToken = pcMint.toBase58();
                        pairType = 'SOL / TOKEN';
                    } else if (pcMint.toBase58() === CONFIG.SOL_MINT) {
                        snipeToken = coinMint.toBase58();
                        pairType = 'TOKEN / SOL';
                    } else {
                        // Ignora coppie non-SOL
                        return;
                    }

                    console.log(`\n🎯 NUOVA POOL IDENTIFICATA!`);
                    console.log(`   ID Pool: ${pubkeyStr}`);
                    console.log(`   Token:   ${snipeToken}`);
                    console.log(`   Coppia:  ${pairType}`);
                    console.log(`   LP Mint: ${lpMint.toBase58()}`);
                    console.log(`   ⏱️  Tempo:   ${new Date().toISOString()}`);

                    // TODO: Qui chiameremo l'Executor in futuro
                    // await executor.buy(snipeToken, ...);
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
            console.log("⚠️ Connessione chiusa dal server. Riconnessione tra 2s...");
            setTimeout(() => startRawListener(), 2000);
        });
    });
}
