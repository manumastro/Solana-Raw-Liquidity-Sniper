// src/index.ts
import { startRawListener } from './listeners/helius_raw';
import { CONFIG } from './config';

async function main() {
    console.clear();
    console.log("=================================================");
    console.log("🤖 SOLANA RAW SNIPER BOT - Helius Free Tier Ed.");
    console.log("=================================================");

    // Check veloce delle config
    if (!CONFIG.HELIUS_WSS.includes('helius')) {
        console.warn("⚠️  ATTENZIONE: Non sembri usare un RPC Helius. Il raw parsing potrebbe non funzionare se il formato dati è diverso.");
    }

    try {
        // Avvio del modulo Listener
        await startRawListener();
    } catch (error) {
        console.error("❌ Errore critico all'avvio:", error);
        process.exit(1);
    }
}

main();
