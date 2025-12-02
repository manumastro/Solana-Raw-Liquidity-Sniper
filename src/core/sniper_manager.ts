export interface MarketTarget {
    marketId: string;
    baseMint: string;
    quoteMint: string;
    baseAta: string; // Dove riceveremo i token
    timestamp: number;
}

/**
 * SniperManager (Singleton)
 * Gestisce lo stato condiviso tra i listener OpenBook (Anticipazione) e Raydium (Esecuzione).
 */
export class SniperManager {
    private static instance: SniperManager;
    private watchlist: Map<string, MarketTarget> = new Map();

    private constructor() { }

    public static getInstance(): SniperManager {
        if (!SniperManager.instance) {
            SniperManager.instance = new SniperManager();
        }
        return SniperManager.instance;
    }

    /**
     * Aggiunge un mercato alla watchlist (da OpenBook Listener)
     */
    public addToWatchlist(target: MarketTarget) {
        this.watchlist.set(target.marketId, target);
        console.log(`   📝 Watchlist Aggiornata: ${this.watchlist.size} target attivi.`);
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
        this.watchlist.delete(marketId);
    }

    /**
     * Restituisce tutti i target attivi (per debug o check euristici)
     */
    public getWatchlist(): MarketTarget[] {
        return Array.from(this.watchlist.values());
    }
}
