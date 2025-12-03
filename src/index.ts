// src/index.ts
import { startOpenBookListener } from './listeners/openbook_market';
import { startRaydiumListener } from './listeners/raydium_amm';
import { CONFIG } from './config';

async function main() {
    console.clear();
    console.log("=================================================");
    console.log("🤖 SOLANA SNIPER BOT - Dual Strategy Edition");
    console.log("=================================================");
    console.log("📡 Strategia 1: OpenBook Market Listener (Anticipazione)");
    console.log("📡 Strategia 2: Raydium WebSocket (Esecuzione Mirata)");
    console.log("=================================================\n");

    // Check veloce delle config
    if (!CONFIG.HELIUS_WSS.includes('helius')) {
        console.warn("⚠️  ATTENZIONE: Non sembri usare un RPC Helius.\n");
    }

    try {
        // Avvio Listener OpenBook
        // Quando trova un market, il SniperManager avvierà automaticamente il polling su Raydium
        await startOpenBookListener();
        await startRaydiumListener();
        
        // startRawListener() rimosso per evitare limiti RPC e rumore inutile
        // await startRawListener(); 
    } catch (error) {
        console.error("❌ Errore critico all'avvio:", error);
        process.exit(1);
    }
}

main();
