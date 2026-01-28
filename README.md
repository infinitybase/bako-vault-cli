# Bako Vault CLI

A command-line interface for executing transactions using Bako predicates on the Fuel network without requiring a server.

## Overview

Bako Vault CLI provides a serverless alternative to interact with BakoSafe vaults. It allows you to:

- Create and manage multi-signature transactions
- Sign transactions using Fuel private keys
- Send transactions directly to the Fuel network
- Check wallet balances across multiple networks

## Installation

```bash
# Clone the repository
git clone https://github.com/guimroque/bako-vault-cli.git
cd bako-vault-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Quick Start

### 1. Configure a Network

Create a network configuration file in `networks/testnet.json`:

```json
{
  "url": "https://testnet.fuel.network/v1/graphql",
  "explorerUrl": "https://app-testnet.fuel.network",
  "assets": {
    "ETH": "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
    "USDC": "0x..."
  }
}
```

### 2. Configure a Wallet

**Option A: Export from BakoSafe UI (Recommended)**

1. Open [BakoSafe](https://safe.bako.global)
2. Navigate to your vault → **Settings**
3. Click **Export Wallet**
4. Save the file to `wallets/<name>.json`

**Option B: Create manually**

Create a wallet configuration file in `wallets/my-vault.json`:

```json
{
  "config": {
    "SIGNATURES_COUNT": 1,
    "SIGNERS": [
      "0xYourSignerAddressHere..."
    ],
    "HASH_PREDICATE": "0x..."
  },
  "version": "0x..."
}
```

### 3. Create and Send a Transaction

```bash
# Create a transaction
npm run dev -- create-tx -w my-vault -n testnet -t 0xRecipientAddress -a 0.001

# Sign and send
npm run dev -- sign -p 0xYourPrivateKey
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `list-wallets` | `ls` | List all configured wallets |
| `list-networks` | `networks` | List all configured networks |
| `wallet-info` | `info` | Show wallet details |
| `create-tx` | `create` | Create a transaction |
| `send-tx` | `send` | Send a pending transaction |
| `sign` | - | Sign a pending transaction |
| `balances` | `bal` | List all wallet balances |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and components
- [Configuration](./docs/CONFIGURATION.md) - Wallet and network setup
- [Commands](./docs/COMMANDS.md) - Complete command reference
- [Transaction Flow](./docs/TRANSACTION-FLOW.md) - How transactions work
- [Integration](./docs/INTEGRATION.md) - Integration with BakoSafe SDK

## How It Works

1. **Create Transaction**: Generates a transaction hash that needs to be signed
2. **Sign**: Signs the hash using a Fuel private key
3. **Send**: Submits the signed transaction to the network

The CLI uses the BakoSafe SDK to interact with predicate-based vaults, enabling multi-signature wallet functionality without a centralized server.

## Transaction Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  create-tx  │────▶│    sign     │────▶│   encode    │────▶│    send     │
│             │     │  (N times)  │     │  witnesses  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Amount Format

The amount is specified as a **decimal string**:
- `0.001` = 0.001 ETH
- `1` = 1 ETH
- `0.000001` = 0.000001 ETH

## Project Structure

```
bako-vault-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── types.ts              # TypeScript type definitions
│   ├── commands/             # CLI command implementations
│   ├── services/             # Business logic layer
│   └── utils/                # Utility functions
├── wallets/                  # Wallet configuration files
├── networks/                 # Network configuration files
├── docs/                     # Documentation
└── package.json
```

## Requirements

- Node.js 20+
- npm or yarn
- A Fuel wallet with funds

## Development

```bash
# Run in development mode
npm run dev -- <command>

# Build
npm run build

# Type check
npm run typecheck
```

## Security Notes

1. **Private Keys**: Never stored - only used temporarily for signing
2. **Wallet Files**: Contain only public addresses (safe to commit)
3. **Pending Transactions**: Stored locally in `.pending-tx.json`
4. **No Server Dependency**: Transactions go directly to the blockchain

## Troubleshooting

### "Wallet not found"
Verify the file exists in `wallets/<name>.json`.

### "Network not found"
Verify the file exists in `networks/<name>.json`.

### "Insufficient balance"
The vault needs sufficient balance for the value + gas.

### "Invalid signature"
Ensure:
- The signer address is in the SIGNERS list
- The signature was made on the correct hash
- The signature format is correct (0x...)

## License

MIT

## Related Projects

- [BakoSafe](https://github.com/bakosafe/bako-safe) - The SDK this CLI is built on
- [Fuel Network](https://fuel.network) - The underlying blockchain
