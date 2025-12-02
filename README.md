# 🎯 Solana Raw Liquidity Sniper

Un bot professionale e modulare per lo sniping di liquidità su Solana (Raydium), ottimizzato per la velocità utilizzando **strategia dual-listener** (OpenBook + Raydium) per massimo vantaggio competitivo.

## ✨ Stato Attuale

✅ **Dual-Listener Strategy Attiva** - OpenBook (anticipazione) + Raydium (conferma)  
✅ **OpenBook Market Listener** - Rileva nuovi mercati 5-60 secondi PRIMA delle pool Raydium  
✅ **Raydium Pool Listener** - Monitora creazione pool in tempo reale con `Initialize2`  
✅ **Modalità TEST** - Contatore TX per verificare il flusso dati  
🚧 **OpenBook Market Parser** - In sviluppo: decodifica baseMint/quoteMint  
🚧 **PDA Calculator** - In sviluppo: calcolo indirizzo pool Raydium prevista  
🚧 **Esecuzione Swap** - In sviluppo: costruzione e invio transazioni  

## 📂 Struttura del Progetto

```plaintext
solana-raw-sniper/
├── .env                # Variabili segrete (API Keys, Private Key)
├── .gitignore          # File da ignorare (node_modules, .env)
├── package.json        # Dipendenze
├── tsconfig.json       # Configurazione TypeScript
├── start.sh            # Script di avvio (consigliato per WSL)
├── README.md           # Documentazione
├── idea.txt            # 🧠 Strategia OpenBook (documentazione interna)
├── src/
│   ├── index.ts        # Entry point principale (Orchestratore dual-listener)
│   ├── config.ts       # Gestione centralizzata della configurazione
│   │
│   ├── listeners/      # Moduli di ascolto (Orecchie)
│   │   ├── helius_raw.ts      # ✅ Listener WebSocket Raydium V4 (conferma)
│   │   └── openbook_market.ts # ✅ Listener WebSocket OpenBook (anticipazione)
│   │
│   ├── parsers/        # Logica di decodifica (Cervello)
│   │   └── memory.ts   # 🚧 Parsing dei buffer 752 bytes
│   │
│   ├── executors/      # Moduli di esecuzione (Braccia)
│   │   ├── swapper.ts  # 🚧 Costruzione transazione Raydium
│   │   └── jito.ts     # 🚧 Invio Bundle a Jito
│   │
│   ├── filters/        # Sicurezza (Scudo)
│   │   └── safety.ts   # 🚧 Check su Mint Authority/Freeze
│   │
│   └── utils/          # Funzioni di supporto
│       ├── constants.ts # 🚧 Costanti (Program IDs, Offsets)
│       └── logger.ts    # 🚧 Logger
```

## 🚀 Setup e Installazione

### 1. Installa le dipendenze
```bash
npm install
```

### 2. Configura le variabili d'ambiente
Crea un file `.env` nella root del progetto:

```env
# Helius RPC Endpoints (Free tier supportato)
RPC_WSS=wss://mainnet.helius-rpc.com/?api-key=TUO_API_KEY
RPC_HTTPS=https://mainnet.helius-rpc.com/?api-key=TUO_API_KEY

# Private Key del wallet (opzionale per ora, solo listener attivo)
PRIVATE_KEY=...
```

**Nota:** Puoi ottenere una API key gratuita su [Helius](https://www.helius.dev/) con 1M crediti/mese.

### 3. Avvia il Bot

**Metodo consigliato (WSL/Linux):**
```bash
chmod +x start.sh
./start.sh
```

**Metodo alternativo:**
```bash
npm start
```

**Output atteso:**
```
=================================================
🤖 SOLANA SNIPER BOT - Dual Strategy Edition
=================================================
📡 Strategia 1: OpenBook Market Listener (Anticipazione)
📡 Strategia 2: Raydium Pool Listener (Conferma)
=================================================

🔍 Connessione al listener OpenBook...
🔌 Connessione al WebSocket Helius in corso...
✅ Connesso al flusso OpenBook.
   --> Strategia: ANTICIPAZIONE (OpenBook → Raydium)
   --> Target: OpenBook Markets (opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb)
📡 Richiesta programSubscribe inviata per OpenBook

✅ Connesso al flusso dati Helius.
   --> Modalità: LOGS (Fallback per limitazioni RPC)
   --> Target: Raydium V4 (675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8)
✅ Raydium PublicKey validato: 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8
✅ OpenBook Subscription attiva (ID: 12345678)
✅ Sottoscrizione attiva (ID: 87654321)
🎯 In ascolto per nuove pool Raydium...
📊 Modalità TEST: Mostrerò sample ogni 10 TX

📊 [10 TX ricevute] Sample: 5jop2y79uyeXtc9N...
📊 [20 TX ricevute] Sample: 5uf7DMjGwro9bXQo...
```

```

## 🧠 La OpenBook Strategy - Il Vero Vantaggio Competitivo

### Perché OpenBook?

La maggior parte dei bot sniper ascolta solo Raydium, ma questo significa essere **sempre in ritardo**. La OpenBook Strategy ti dà un vantaggio di **5-60 secondi** perché:

#### 📋 Il Processo di Creazione Pool su Raydium

1. **Step 1**: Lo sviluppatore crea un **Mercato OpenBook** (orderbook DEX)
2. **Step 2**: Aspetta conferma della transazione (~400ms)
3. **Step 3**: Crea la **Pool Raydium** usando il Market ID di OpenBook
4. **Step 4**: La pool diventa attiva e tradabile

**Il trucco**: Noi ascoltiamo lo **Step 1**, mentre gli altri bot aspettano lo **Step 4**!

### Come Funziona

```typescript
// 1. Ascoltiamo programSubscribe su OpenBook
OpenBook Program ID: opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb

// 2. Quando rileviamo un nuovo Market:
- Estraiamo baseMint (il token nuovo)
- Estraiamo quoteMint (SOL/USDC)
- Market ID (necessario per calcolare PDA)

// 3. Calcoliamo l'indirizzo PDA della pool Raydium (deterministico!)
Pool Address = derivePoolPDA(RAYDIUM_PROGRAM_ID, marketId, baseMint, quoteMint)

// 4. Due opzioni:
// A) Spam buy tentativi su quell'indirizzo finché non si attiva
// B) accountSubscribe su quel PDA specifico → compra al millisecondo dell'attivazione
```

### Vantaggi

✅ **Anticipo temporale**: 5-60 secondi prima degli altri  
✅ **Meno competizione**: Pochi bot usano questa strategia  
✅ **Free tier friendly**: OpenBook ha meno traffico → `programSubscribe` funziona  
✅ **Deterministico**: Possiamo calcolare l'indirizzo della pool in anticipo  

### Limitazioni

⚠️ Non tutte le pool Raydium usano OpenBook (alcune usano altri DEX)  
⚠️ Richiede decodifica dei dati del Market (in sviluppo)  
⚠️ Il calcolo PDA deve essere preciso (un byte sbagliato = indirizzo errato)  

## 🧠 Architettura Tecnica

### Strategia: Logs Subscription (Helius Free Tier Compatible)

A causa delle limitazioni degli RPC pubblici/gratuiti che bloccano `programSubscribe` su programmi ad alto volume come Raydium, il bot utilizza una strategia ottimizzata:

#### 1. **WebSocket Subscription** (`logsSubscribe`)
- Si connette al WebSocket Helius/Solana
- Sottoscrive i log di tutte le transazioni che menzionano il Raydium V4 Program ID
- Filtro: `{ mentions: ["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"] }`

#### 2. **Pattern Matching** (Rilevamento Pool)
- Analizza i log di ogni transazione in tempo reale
- Cerca l'istruzione `Initialize2` che indica la creazione di una nuova pool
- Estrae la signature della transazione

#### 3. **Data Extraction** (In sviluppo)
- Recupera i dettagli completi tramite `getTransaction`
- Estrae Token A, Token B, liquidità iniziale, ecc.

#### 4. **Execution** (Futuro)
- Valida la sicurezza del token (mint authority, freeze authority)
- Costruisce la transazione di swap
- Invia tramite Jito per priorità massima

### Costanti Raydium V4 & OpenBook

```typescript
RAYDIUM_PROGRAM_ID: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'  // Raydium V4 AMM (Legacy)
OPENBOOK_PROGRAM_ID: 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb' // OpenBook v1 (ex-Serum fork)
POOL_SIZE_BYTES: 752  // Dimensione fissa della struct AMM V4
```

## 🛠️ Funzionalità Implementate

- ✅ **Dual-Listener Strategy** - OpenBook (anticipazione) + Raydium (conferma) in parallelo
- ✅ **OpenBook Market Listener** - `programSubscribe` su OpenBook per rilevare nuovi mercati
- ✅ **Raydium Pool Listener** - `logsSubscribe` su Raydium V4 per conferma pool
- ✅ **Rilevamento nuove pool** - Pattern matching su `Initialize2`
- ✅ **Validazione PublicKey** - Verifica automatica degli indirizzi
- ✅ **Logging intelligente** - Solo eventi rilevanti, no spam
- ✅ **Modalità TEST** - Contatore TX per monitorare il flusso dati
- ✅ **Auto-reconnect** - Gestione automatica disconnessioni WebSocket

## 🔜 Roadmap

### Fase 1: Completamento Listener ✅
- [x] WebSocket connection
- [x] logsSubscribe con mentions filter
- [x] Rilevamento Initialize2
- [ ] Parsing completo dei log per estrarre indirizzi token

### Fase 2: Parser & Filters 🚧
- [ ] Implementare `getTransaction` per dettagli pool
- [ ] Decodifica Token A e Token B
- [ ] Safety checks (mint authority, freeze authority)
- [ ] Filtro per coppie SOL/TOKEN

### Fase 3: Executor 🚧
- [ ] Costruzione transazione swap Raydium
- [ ] Calcolo slippage ottimale
- [ ] Integrazione Jito bundles
- [ ] Gestione wallet e firma transazioni

### Fase 4: Ottimizzazioni 🔮
- [ ] Modalità Raw Memory (con RPC dedicato)
- [ ] Multi-wallet support
- [ ] Take profit automatico
- [ ] Dashboard web real-time

## 🐛 Troubleshooting

### Errore: "Invalid mentions provided"
**Causa:** Il Raydium Program ID nel file `config.ts` non è valido.  
**Soluzione:** Verifica che sia esattamente `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`

### Errore: "Invalid public key input"
**Causa:** Il Program ID contiene caratteri non validi o è formattato male.  
**Soluzione:** Il bot ora valida automaticamente il PublicKey all'avvio. Controlla i log per dettagli.

### WebSocket si disconnette continuamente
**Causa:** API key Helius non valida o rate limit superato.  
**Soluzione:** 
- Verifica la tua API key su [Helius Dashboard](https://dev.helius.xyz/)
- Il bot ha auto-reconnect, aspetta 2 secondi tra i tentativi

### Non ricevo notifiche di nuove pool
**Causa:** Potrebbero non esserci nuove pool in quel momento, o il filtro `Initialize2` potrebbe essere troppo specifico.  
**Soluzione:** Il bot è funzionante se vedi "🎯 In ascolto per nuove pool Raydium...". Le pool vengono create sporadicamente.

## 📊 Performance

- **Latenza WebSocket:** ~50-100ms (dipende da Helius)
- **Rilevamento pool:** Istantaneo (pattern matching locale)
- **Overhead parsing:** <1ms per transazione
- **Rate limit Helius Free:** 10 req/s (WebSocket non conta nel limite)

## ⚠️ Disclaimer

Questo bot è fornito a scopo educativo. Il trading di criptovalute comporta rischi significativi. L'autore non è responsabile per eventuali perdite finanziarie derivanti dall'uso di questo software.

## 📝 Changelog

### v1.2.0 (2025-12-02) - OpenBook Strategy 🧠
- ✅ **FEATURE MAJOR:** Implementata OpenBook Strategy (dual-listener)
- ✅ Aggiunto listener OpenBook per anticipazione mercati
- ✅ Dual WebSocket paralleli (OpenBook + Raydium)
- ✅ Modalità TEST con contatore TX
- ✅ Documentazione completa strategia OpenBook
- ✅ Corretto OpenBook Program ID (opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb)
- 📊 Performance: ~70 TX/sec su Raydium, OpenBook subscription attiva

### v1.1.0 (2025-12-02)
- ✅ **FIX CRITICO:** Corretto Raydium V4 Program ID
- ✅ Aggiunta validazione PublicKey automatica
- ✅ Ridotto spam nei log (solo eventi rilevanti)
- ✅ Migliorata gestione errori WebSocket
- ✅ Aggiunto logging della subscription ID

### v1.0.0 (Initial)
- ✅ Setup base progetto
- ✅ WebSocket listener Helius
- ✅ Rilevamento Initialize2

## 📚 Risorse Utili

- [Raydium SDK](https://github.com/raydium-io/raydium-sdk)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Helius Documentation](https://docs.helius.dev/)
- [Jito Labs](https://www.jito.wtf/)

---

**Made with ⚡ for Solana snipers**