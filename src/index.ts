// src/index.ts
import { startRawListener } from './listeners/helius_raw';
import { startOpenBookListener } from './listeners/openbook_market';
import { CONFIG } from './config';

async function main() {
    console.clear();
    console.log("=================================================");
    console.log("🤖 SOLANA SNIPER BOT - Dual Strategy Edition");
    console.log("=================================================");
    console.log("📡 Strategia 1: OpenBook Market Listener (Anticipazione)");
    console.log("📡 Strategia 2: Raydium Pool Listener (Conferma)");
    console.log("=================================================\n");

    // Check veloce delle config
    if (!CONFIG.HELIUS_WSS.includes('helius')) {
        console.warn("⚠️  ATTENZIONE: Non sembri usare un RPC Helius.\n");
    }

    try {
        // Avvio PARALLELO di entrambi i listener
        // OpenBook ci dà l'anticipo, Raydium la conferma
        await Promise.all([
            startOpenBookListener(),  // 🧠 Strategia avanzata
            startRawListener()         // 📊 Fallback/Conferma
        ]);
    } catch (error) {
        console.error("❌ Errore critico all'avvio:", error);
        process.exit(1);
    }
}

main();
