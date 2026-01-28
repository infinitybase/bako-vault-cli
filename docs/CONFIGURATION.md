# Configuration

This document explains how to configure wallets and networks for the Bako Vault CLI.

## Directory Structure

```
bako-vault-cli/
├── wallets/           # Wallet configuration files
│   ├── my-vault.json
│   └── team-vault.json
├── networks/          # Network configuration files
│   ├── mainnet.json
│   └── testnet.json
└── .pending-tx.json   # Current pending transaction (auto-generated)
```

## Network Configuration

Network files define how to connect to a Fuel network.

### Location

`networks/<network-name>.json`

### Schema

```json
{
  "url": "string",           // Required: GraphQL endpoint
  "explorerUrl": "string",   // Optional: Block explorer URL
  "chainId": "number",       // Optional: Chain ID
  "assets": {
    "ETH": "string",         // Required: ETH asset ID
    "USDC": "string"         // Optional: USDC asset ID
  }
}
```

### Example: Testnet

`networks/testnet.json`:

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

### Example: Mainnet

`networks/mainnet.json`:

```json
{
  "url": "https://mainnet.fuel.network/v1/graphql",
  "explorerUrl": "https://app.fuel.network",
  "assets": {
    "ETH": "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07",
    "USDC": "0x..."
  }
}
```

## Wallet Configuration

Wallet files define the vault/predicate configuration.

### Location

`wallets/<wallet-name>.json`

### Schema

```json
{
  "config": {
    "SIGNATURES_COUNT": "number",  // Required: Signatures needed
    "SIGNERS": ["string"],         // Required: Array of signer addresses
    "HASH_PREDICATE": "string"     // Optional: Predicate hash
  },
  "version": "string"              // Required: Predicate bytecode version
}
```

### Fields Explained

| Field | Description |
|-------|-------------|
| `SIGNATURES_COUNT` | Number of signatures required to execute a transaction (threshold) |
| `SIGNERS` | Array of B256 addresses that can sign transactions |
| `HASH_PREDICATE` | Hash of the predicate for verification |
| `version` | Predicate bytecode version hash (from BakoSafe) |

### Example: Single Signer

`wallets/personal.json`:

```json
{
  "config": {
    "SIGNATURES_COUNT": 1,
    "SIGNERS": [
      "0xed2b955f8bee5d1a0c01fcbdb6b20cd5420fdac05af1c13934af1a5fa0c632b9"
    ],
    "HASH_PREDICATE": "0x9f41683cc077e7762fe3b8ef41f1677795218e831ddbc37c91e96c96c5e66cc6"
  },
  "version": "0x967aaa71b3db34acd8104ed1d7ff3900e67cff3d153a0ffa86d85957f579aa6a"
}
```

### Example: Multi-Sig (2 of 3)

`wallets/team-vault.json`:

```json
{
  "config": {
    "SIGNATURES_COUNT": 2,
    "SIGNERS": [
      "0xabc123...",
      "0xdef456...",
      "0x789abc..."
    ],
    "HASH_PREDICATE": "0x..."
  },
  "version": "0x..."
}
```

## Getting Wallet Configuration

### From BakoSafe UI (Recommended)

1. Open [BakoSafe](https://safe.bako.global)
2. Navigate to your vault
3. Go to **Settings** (gear icon)
4. Click **Export Wallet**
5. Save the exported JSON file to `wallets/<name>.json`

The exported file contains all required fields (`config`, `version`) ready to use with this CLI.

### From BakoSafe SDK

```typescript
import { Vault } from 'bakosafe';

const vault = new Vault(provider, {
  SIGNATURES_COUNT: 2,
  SIGNERS: ['0x...', '0x...'],
});

console.log('Address:', vault.address.toB256());
console.log('Version:', vault.version);
```

## Getting Signer Addresses

### From Private Key

```typescript
import { Wallet } from 'fuels';

const wallet = Wallet.fromPrivateKey('0xYourPrivateKey');
console.log('Signer Address:', wallet.address.toB256());
```

### From Fuel Wallet Extension

1. Open Fuel Wallet
2. Click on your account
3. Copy the B256 address (starts with `0x`, 66 characters)

## Validation Rules

### Network Configuration

- `url` is required and must be a valid URL
- `assets.ETH` is required

### Wallet Configuration

- `config.SIGNATURES_COUNT` must be at least 1
- `config.SIGNERS` must have at least `SIGNATURES_COUNT` non-zero addresses
- `version` is required

## Environment-Specific Setup

### Development

```bash
# Use testnet
networks/testnet.json
wallets/dev-wallet.json
```

### Production

```bash
# Use mainnet
networks/mainnet.json
wallets/prod-wallet.json
```

## Security Best Practices

1. **Never commit private keys** to version control
2. **Use `.gitignore`** to exclude sensitive configuration:
   ```
   .pending-tx.json
   wallets/*.json  # If contains sensitive data
   ```
3. **Separate configurations** for development and production
4. **Review signer addresses** before creating transactions
