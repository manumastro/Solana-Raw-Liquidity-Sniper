// src/config.ts
import dotenv from 'dotenv';

// Carica le variabili dal file .env
dotenv.config();

// Funzione helper per garantire che le variabili critiche esistano
const getEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        console.error(`❌ ERRORE FATALE: La variabile d'ambiente '${key}' manca nel file .env`);
        process.exit(1);
    }
    return value;
};

export const CONFIG = {
    // Credenziali
    HELIUS_WSS: getEnv('RPC_WSS'),
    HELIUS_HTTPS: getEnv('RPC_HTTPS'),
    PRIVATE_KEY: process.env.PRIVATE_KEY || '', // Opzionale per ora (solo listener)

    // Costanti Raydium & Solana
    RAYDIUM_PROGRAM_ID: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium V4 AMM (Legacy)
    OPENBOOK_PROGRAM_ID: 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb', // OpenBook v1 (ex-Serum fork)
    POOL_SIZE_BYTES: 752, // Dimensione fissa struct AMM V4
    SOL_MINT: 'So11111111111111111111111111111111111111112',

    // Impostazioni Bot
    COMMITMENT_LEVEL: 'confirmed' // 'processed' = velocità massima
};
