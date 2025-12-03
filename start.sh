#!/bin/bash
# Script di avvio robusto per bypassare i conflitti Windows/WSL
echo "🚀 Avvio Solana Raw Sniper..."
/usr/bin/node -r ts-node/register src/index.ts "$@"
