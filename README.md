# Solana Raw Liquidity Sniper

Un bot professionale e modulare per lo sniping di liquidità su Solana (Raydium), ottimizzato per la velocità utilizzando Raw Memory Parsing.

## 📂 Struttura del Progetto

```plaintext
solana-raw-sniper/
├── .env                # Variabili segrete (API Keys, Private Key)
├── .gitignore          # File da ignorare (node_modules, .env)
├── package.json        # Dipendenze
├── tsconfig.json       # Configurazione TypeScript
├── README.md           # Documentazione
├── src/
│   ├── index.ts        # Entry point principale (Orchestratore)
│   ├── config.ts       # Gestione centralizzata della configurazione
│   │
│   ├── listeners/      # Moduli di ascolto (Orecchie)
│   │   └── helius_raw.ts   # Listener WebSocket per Raydium
│   │
│   ├── parsers/        # Logica di decodifica (Cervello)
│   │   └── memory.ts   # Parsing dei buffer 752 bytes (TODO)
│   │
│   ├── executors/      # Moduli di esecuzione (Braccia)
│   │   ├── swapper.ts  # Costruzione transazione Raydium (TODO)
│   │   └── jito.ts     # Invio Bundle a Jito (TODO)
│   │
│   ├── filters/        # Sicurezza (Scudo)
│   │   └── safety.ts   # Check su Mint Authority/Freeze (TODO)
│   │
│   └── utils/          # Funzioni di supporto
│       ├── constants.ts # Costanti (Program IDs, Offsets) (TODO)
│       └── logger.ts    # Logger (TODO)
```

## 🚀 Setup e Installazione

1.  **Installa le dipendenze:**
    ```bash
    npm install
    ```

2.  **Configura le variabili d'ambiente:**
    Crea un file `.env` nella root del progetto e aggiungi le tue chiavi:
    ```env
    RPC_WSS=wss://mainnet.helius-rpc.com/?api-key=TUO_API_KEY
    RPC_HTTPS=https://mainnet.helius-rpc.com/?api-key=TUO_API_KEY
    PRIVATE_KEY=...
    ```

3.  **Avvia il Bot:**
    ```bash
    npx ts-node src/index.ts
    ```

## 🛠️ Funzionalità Attuali

*   **Raw Memory Listener:** Ascolta direttamente il programma Raydium per nuove pool.
*   **Zero-Latency Parsing:** Decodifica i dati della pool (752 bytes) localmente senza chiamate RPC aggiuntive.
*   **Filtraggio Base:** Identifica coppie SOL/TOKEN e TOKEN/SOL.

## 🔜 Prossimi Passaggi

*   Implementare `executors/swapper.ts` per l'acquisto.
*   Implementare `filters/safety.ts` per controlli di sicurezza (Rug Check).
*   Integrare Jito per l'invio di bundle.