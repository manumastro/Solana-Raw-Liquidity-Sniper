import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';
import { PoolData } from '../parsers/pool_parser';

export class PaperTrader {
    private connection: Connection;
    private isTracking: boolean = false;
    private initialPrice: number = 0;
    private maxPrice: number = 0;
    private startTime: number = 0;

    constructor() {
        this.connection = new Connection(CONFIG.HELIUS_HTTPS, 'confirmed');
    }

    public async startTracking(
        poolData: PoolData,
        inverted: boolean
    ) {
        console.log(`\n   📜 AVVIO PAPER TRADING (Simulazione)...`);
        this.isTracking = true;
        this.startTime = Date.now();

        const baseVault = new PublicKey(poolData.baseVault);
        const quoteVault = new PublicKey(poolData.quoteVault);

        console.log(`   🏦 Base Vault: ${baseVault.toBase58()}`);
        console.log(`   🏦 Quote Vault: ${quoteVault.toBase58()}`);

        // Loop di monitoraggio
        while (this.isTracking) {
            try {
                // Fetch balances
                const baseBal = await this.connection.getTokenAccountBalance(baseVault);
                const quoteBal = await this.connection.getTokenAccountBalance(quoteVault);

                if (baseBal.value.uiAmount === null || quoteBal.value.uiAmount === null) {
                    console.log("   ⚠️  Attesa liquidità...");
                    await new Promise(r => setTimeout(r, 100));
                    continue;
                }

                // Calcolo Prezzo (SOL per Token)
                let solAmount = inverted ? baseBal.value.uiAmount : quoteBal.value.uiAmount;
                let tokenAmount = inverted ? quoteBal.value.uiAmount : baseBal.value.uiAmount;

                if (tokenAmount === 0) {
                     await new Promise(r => setTimeout(r, 100));
                     continue;
                }

                let price = solAmount / tokenAmount;

                if (this.initialPrice === 0) {
                    this.initialPrice = price;
                    this.maxPrice = price;
                    console.log(`   🟢 BUY SIMULATO @ ${price.toFixed(9)} SOL`);
                    console.log(`   ⏰ Entry Time: ${new Date().toISOString()}`);
                    console.log(`   💧 Liquidity: ${solAmount.toFixed(2)} SOL`);
                }

                // Update stats
                if (price > this.maxPrice) this.maxPrice = price;
                
                const pnl = ((price - this.initialPrice) / this.initialPrice) * 100;
                const elapsed = (Date.now() - this.startTime) / 1000;

                // Log su una riga che si aggiorna (se possibile, altrimenti log normale)
                console.log(`   ⏱️  ${elapsed.toFixed(1)}s | Price: ${price.toFixed(9)} | PnL: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}% | Max: +${((this.maxPrice - this.initialPrice)/this.initialPrice * 100).toFixed(2)}%`);

                await new Promise(r => setTimeout(r, 100)); // Check every 100ms

            } catch (e) {
                console.error("   ❌ Errore Paper Trader:", e);
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
    
    public stop() {
        this.isTracking = false;
    }
}
