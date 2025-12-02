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
| **Market Parser** | ✅ | Decodifica `baseMint` e `quoteMint` dai dati raw di OpenBook. |
| **PDA Calculator** | ✅ | Calcola ATA. Nota: Pool ID V4 è Keypair (random), CPMM è PDA. |
| **Safety Checks** | 🚧 | In sviluppo: verifica Mint/Freeze Authority. |
| **Auto-Swap** | 🚧 | In sviluppo: esecuzione transazioni Jito. |

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
│   │   └── market_parser.ts    # ✅ Parsing layout OpenBook (Offset 53/85)
│   │
│   └── utils/              # Tools
│       └── pda_calculator.ts   # ✅ Calcolo ATA e Market Authority
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
OpenBook (fork di Serum V3) è l'orderbook sottostante usato da Raydium Legacy.
L'indirizzo di una pool Raydium AMM V4 è solitamente una **Keypair casuale**, quindi non predicibile al 100%.
**TUTTAVIA**, usando OpenBook possiamo:
1.  Rilevare il mercato minuti prima della pool.
2.  Estrarre i Token Mint (`baseMint`, `quoteMint`).
3.  Pre-calcolare gli **Associated Token Accounts (ATA)** del nostro wallet.
4.  Preparare tutto per lo swap e attendere solo l'evento `Initialize2` di Raydium per scattare.

*Nota: Per il nuovo standard Raydium CPMM, l'indirizzo pool è un PDA deterministico e può essere predetto.*

### Program IDs Monitorati
*   **Raydium V4:** `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`
*   **OpenBook V1:** `opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb`

---

## 🔜 Roadmap di Sviluppo

### Fase 1: Intelligence (Completata ✅)
*   [x] Setup WebSocket multipli
*   [x] Bypass limitazioni RPC Free Tier
*   [x] Rilevamento eventi base
*   [x] **Market Parser:** Estrazione Token Mint da OpenBook
*   [x] **PDA Calculator:** Calcolo ATA e predisposizione CPMM

### Fase 2: Safety & Execution (In Corso 🚧)
*   [ ] **Safety Checks:** Verificare Mint Authority e Freeze Authority (Anti-Rug).
*   [ ] **Swapper:** Creazione ed invio transazione di acquisto.
*   [ ] **Jito Integration:** Inviare bundle per garantire l'inclusione nel blocco.

---

## ⚠️ Disclaimer

Questo software è a scopo didattico e di ricerca. Lo sniping di liquidità è un'attività ad alto rischio e altamente competitiva. L'autore non è responsabile per perdite finanziarie.

---
**Solana Raw Sniper** - *Speed is everything.*