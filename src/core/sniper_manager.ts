import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';

export interface MarketTarget {
    marketId: string;
    baseMint: string;
    quoteMint: string;
    baseAta: string; // Dove riceveremo i token
    timestamp: number;
    inverted?: boolean; // True se la coppia è SOL/TOKEN invece di TOKEN/SOL
}

/**
 * SniperManager (Singleton)
 * Gestisce lo stato condiviso tra i listener OpenBook (Anticipazione) e Raydium (Esecuzione).
 */
export class SniperManager {
    private static instance: SniperManager;
    private watchlist: Map<string, MarketTarget> = new Map();
    private connection: Connection;
    private activeSubscriptions: Map<string, number> = new Map(); // Map<MarketID, SubscriptionID>

    private constructor() { 
        this.connection = new Connection(CONFIG.HELIUS_HTTPS, 'confirmed');
    }

    public static getInstance(): SniperManager {
        if (!SniperManager.instance) {
            SniperManager.instance = new SniperManager();
        }
        return SniperManager.instance;
    }

    /**
     * Aggiunge un mercato alla watchlist (da OpenBook Listener)
     * E avvia la sottoscrizione WebSocket mirata per la pool Raydium.
     */
    public addToWatchlist(target: MarketTarget) {
        if (this.watchlist.has(target.marketId)) return;

        this.watchlist.set(target.marketId, target);
        console.log(`   📝 Watchlist ADD: ${target.marketId} (${target.baseMint})`);
        console.log(`   📊 Total Targets: ${this.watchlist.size}`);

        // Avvia Listener Mirato (WebSocket)
        this.startTargetedListener(target);
    }

    /**
     * Listener WebSocket mirato per cercare la Pool Raydium associata al Market ID
     * Usa onProgramAccountChange con filtri lato server per efficienza massima.
     */
    private startTargetedListener(target: MarketTarget) {
        console.log(`   👂 Avvio Listener WebSocket Mirato per Market: ${target.marketId}...`);
        
        try {
            // Sottoscrizione WebSocket specifica per questo Market ID
            // Helius filtrerà lato server e ci manderà SOLO l'evento di creazione della pool giusta.
            const subscriptionId = this.connection.onProgramAccountChange(
                new PublicKey(CONFIG.RAYDIUM_PROGRAM_ID),
                (updatedAccountInfo, context) => {
                    const poolAddress = updatedAccountInfo.accountId.toBase58();
                    console.log(`\n   🚨 🚨 🚨 POOL TROVATA (WebSocket)! 🚨 🚨 🚨`);
                    console.log(`   💎 Token: ${target.baseMint}`);
                    console.log(`   🏊 Pool Address: ${poolAddress}`);
                    console.log(`   🎰 Slot: ${context.slot}`);
                    console.log(`   🚀 ESECUZIONE SNIPE (Simulata)...`);
                    
                    // Stop listener e pulizia
                    this.stopTargetedListener(target.marketId);
                    this.removeTarget(target.marketId);
                    
                    console.log(`   ✅ Snipe completato. Bot in attesa di nuovi target.`);

                    // fermo qui - l'esecuzione per test
                    process.exit(0);
        
                },
                'confirmed',
                [
                    { dataSize: 752 }, // Dimensione fissa struct AmmInfo V4
                    { memcmp: { offset: 528, bytes: target.marketId } } // Filtro preciso sul Market ID
                ]
            );

            this.activeSubscriptions.set(target.marketId, subscriptionId);

            // Timeout di sicurezza: smetti di ascoltare dopo 10 minuti se non succede nulla
            setTimeout(() => {
                if (this.activeSubscriptions.has(target.marketId)) {
                    console.log(`   ⏰ Timeout listener per ${target.marketId}. Rimozione.`);
                    this.stopTargetedListener(target.marketId);
                    this.removeTarget(target.marketId);
                }
            }, 10 * 60 * 1000);

        } catch (error) {
            console.error(`   ⚠️ Errore avvio listener ${target.marketId}:`, error);
        }
    }

    private stopTargetedListener(marketId: string) {
        const subId = this.activeSubscriptions.get(marketId);
        if (subId !== undefined) {
            this.connection.removeProgramAccountChangeListener(subId).catch(e => console.error("Errore rimozione sub:", e));
            this.activeSubscriptions.delete(marketId);
        }
    }

    /**
     * Verifica se un mercato è nella watchlist (da Raydium Listener)
     * Se presente, restituisce i dati per l'esecuzione immediata.
     */
    public checkAndGetTarget(marketId: string): MarketTarget | undefined {
        return this.watchlist.get(marketId);
    }

    /**
     * Rimuove un target dopo l'esecuzione o timeout
     */
    public removeTarget(marketId: string) {
        if (this.watchlist.has(marketId)) {
            this.stopTargetedListener(marketId);
            this.watchlist.delete(marketId);
            console.log(`   🗑️  Watchlist REMOVE: ${marketId}`);
            console.log(`   📊 Total Targets: ${this.watchlist.size}`);
        }
    }

    /**
     * Restituisce tutti i target attivi (per debug o check euristici)
     */
    public getWatchlist(): MarketTarget[] {
        return Array.from(this.watchlist.values());
    }
}
