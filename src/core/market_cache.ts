import { PublicKey } from '@solana/web3.js';

export interface CachedMarket {
    marketId: string;
    baseMint: string;
    quoteMint: string;
    bids: PublicKey;
    asks: PublicKey;
    eventQueue: PublicKey;
    timestamp: number;
}

export class MarketCache {
    private static instance: MarketCache;
    private markets: Map<string, CachedMarket> = new Map(); // Key: BaseMint (Token Address)

    private constructor() {}

    public static getInstance(): MarketCache {
        if (!MarketCache.instance) {
            MarketCache.instance = new MarketCache();
        }
        return MarketCache.instance;
    }

    public saveMarket(market: CachedMarket) {
        // Salviamo usando il BaseMint come chiave per recuperarlo velocemente quando troviamo la pool
        this.markets.set(market.baseMint, market);
        console.log(`💾 Market Cache: Dati salvati per ${market.baseMint} (Market ID: ${market.marketId})`);
    }

    public getMarket(baseMint: string): CachedMarket | undefined {
        return this.markets.get(baseMint);
    }

    public hasMarket(baseMint: string): boolean {
        return this.markets.has(baseMint);
    }
}
