# 🎯 Solana Raw Liquidity Sniper - Dual Strategy Edition

Un bot di trading ad alta frequenza (HFT) per Solana, progettato per **anticipare** la creazione di nuove pool di liquidità su Raydium sfruttando i dati di OpenBook.

## ⚡ Core Concept: La Strategia "OpenBook Anticipation"

La maggior parte dei bot ascolta Raydium per vedere quando una pool viene creata. **Questo è troppo lento.**
Questo bot utilizza una strategia professionale a due livelli:

1.  🧠 **Livello 1: OpenBook Listener (Anticipazione)**
    *   Per creare una pool su Raydium, uno sviluppatore deve *prima* creare un mercato su OpenBook.
    *   Questo avviene secondi o minuti prima della creazione della pool.
    *   Il bot rileva questo evento, legge i dati del token e **calcola matematicamente** l'indirizzo della futura pool Raydium (PDA) prima ancora che esista.

2.  📊 **Livello 2: Raydium Listener (Conferma)**
    *   Ascolta in parallelo i log di Raydium per confermare l'apertura della pool.
    *   Funge da fallback e sistema di validazione.

---

## ✨ Stato del Progetto

| Modulo | Stato | Descrizione |
| :--- | :---: | :--- |
| **OpenBook Listener** | ✅ | Connesso e funzionante. Rileva nuovi mercati in tempo reale. |
| **Raydium Listener** | ✅ | Connesso e funzionante. Filtra logs per `Initialize2`. |
| **Dual Engine** | ✅ | Entrambi i listener girano in parallelo senza blocchi. |
| **Market Parser** | 🚧 | Decodifica dei dati OpenBook (Base/Quote Mint) in sviluppo. |
| **PDA Predictor** | 🚧 | Calcolo deterministico dell'indirizzo pool in sviluppo. |
| **Auto-Swap** | 🚧 | Esecuzione transazioni Jito in sviluppo. |

---

## 📂 Struttura Aggiornata

```plaintext
solana-raw-sniper/
├── .env                    # API Keys & Config
├── start.sh                # Script di avvio ottimizzato
├── src/
│   ├── index.ts            # 🚀 Orchestratore Dual-Strategy
│   ├── config.ts           # Configurazione centralizzata
│   │
│   ├── listeners/          # I "Sensi" del Bot
│   │   ├── openbook_market.ts  # 🧠 Strategia Anticipazione (OpenBook)
│   │   └── helius_raw.ts       # 📊 Strategia Conferma (Raydium)
│   │
│   ├── parsers/            # Decodifica Dati
│   │   └── market_parser.ts    # 🚧 Parsing layout OpenBook
│   │
│   └── utils/              # Tools
│       └── pda_calculator.ts   # 🚧 Calcolo indirizzi futuri
```

---

## 🚀 Setup Rapido

### 1. Requisiti
*   Node.js v18+
*   API Key Helius (Free Tier supportato per ora)

### 2. Installazione
```bash
git clone <repo>
cd solana-raw-sniper
npm install
```

### 3. Configurazione (.env)
Crea un file `.env` nella root:
```env
# Usa Helius per la migliore compatibilità WebSocket
RPC_WSS=wss://mainnet.helius-rpc.com/?api-key=TUO_API_KEY
RPC_HTTPS=https://mainnet.helius-rpc.com/?api-key=TUO_API_KEY
```

### 4. Avvio
```bash
chmod +x start.sh
./start.sh
```

---

## 🧠 Deep Dive Tecnico

### Perché OpenBook?
OpenBook (fork di Serum V3) è l'orderbook sottostante usato da Raydium.
L'indirizzo di una pool Raydium AMM V4 non è casuale, ma è un **Program Derived Address (PDA)** derivato da:
1.  Raydium Program ID
2.  OpenBook Market ID
3.  Altri seed costanti

**Il vantaggio:** Appena vediamo un Market ID su OpenBook, abbiamo tutti gli ingredienti per calcolare dove sarà la pool e "appostarci" lì con uno sniper (o pre-calcolare le transazioni).

### Program IDs Monitorati
*   **Raydium V4:** `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`
*   **OpenBook V1:** `opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb`

---

## 🔜 Roadmap di Sviluppo

### Fase 1: Intelligence (Completata ✅)
*   [x] Setup WebSocket multipli
*   [x] Bypass limitazioni RPC Free Tier
*   [x] Rilevamento eventi base

### Fase 2: Data Extraction (In Corso 🚧)
*   [ ] **Market Layout Parsing:** Leggere i 388 bytes del market OpenBook per estrarre `CoinMint` (Token) e `PcMint` (SOL/USDC).
*   [ ] **PDA Calculation:** Implementare la funzione di derivazione indirizzo Pool.

### Fase 3: Execution (Futuro)
*   [ ] **Jito Integration:** Inviare bundle per garantire l'inclusione nel blocco.
*   [ ] **Safety Checks:** Verifica automatica Mint Authority revocata.

---

## ⚠️ Disclaimer

Questo software è a scopo didattico e di ricerca. Lo sniping di liquidità è un'attività ad alto rischio e altamente competitiva. L'autore non è responsabile per perdite finanziarie.

---
**Solana Raw Sniper** - *Speed is everything.*