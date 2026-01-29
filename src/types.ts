/**
 * @fileoverview Type definitions for the Bako Vault CLI
 * @module types
 */

/**
 * Configuration for the predicate's configurable parameters
 * @interface PredicateConfigurable
 */
export interface PredicateConfigurable {
  /** Number of signatures required to execute a transaction */
  SIGNATURES_COUNT: number;
  /** Array of signer addresses (B256 format) */
  SIGNERS: string[];
  /** Optional predicate hash for verification */
  HASH_PREDICATE?: string;
}

/**
 * Wallet configuration stored in JSON files
 * @interface WalletConfig
 */
export interface WalletConfig {
  /** Wallet name (derived from filename) */
  name: string;
  /** Predicate configurable parameters */
  config: PredicateConfigurable;
  /** Predicate bytecode version hash */
  version: string;
}

/**
 * Network asset identifiers
 * @interface NetworkAssets
 */
export interface NetworkAssets {
  /** ETH asset ID for the network */
  ETH: string;
  /** USDC asset ID for the network */
  USDC: string;
}

/**
 * Network configuration stored in JSON files
 * @interface NetworkConfig
 */
export interface NetworkConfig {
  /** Network name (derived from filename) */
  name: string;
  /** RPC URL for the Fuel provider */
  url: string;
  /** Asset IDs for the network */
  assets: NetworkAssets;
  /** Optional chain ID */
  chainId?: number;
  /** Optional block explorer URL */
  explorerUrl?: string;
}

/**
 * Combined vault configuration (wallet + network)
 * @interface VaultConfig
 * @extends WalletConfig
 */
export interface VaultConfig extends WalletConfig {
  /** Network configuration */
  network: NetworkConfig;
}

/**
 * Transaction input parameters
 * @interface TransactionInput
 */
export interface TransactionInput {
  /** Recipient address (B256 format) */
  to: string;
  /** Amount to transfer (decimal string, e.g., '0.001' for 0.001 ETH) */
  amount: string;
  /** Optional asset ID (defaults to ETH) */
  assetId?: string;
}

/**
 * Signature object (signer + signature)
 * @typedef Signature
 */
export type Signature = {
  signer: string;
  signature: string;
};

/**
 * Pending transaction stored while waiting for signatures
 * @interface PendingTransaction
 */
export interface PendingTransaction {
  /** Name of the wallet used */
  walletName: string;
  /** Name of the network */
  networkName: string;
  /** Transaction hash to be signed */
  hashTxId: string;
  /** Encoded transaction ID */
  encodedTxId: string;
  /** Serialized transaction request (JSON) */
  txRequest: unknown;
  /** Original transaction input */
  transaction: TransactionInput;
  /** ISO timestamp of creation */
  createdAt: string;
  /** Array of collected signatures (objects) */
  signatures: Signature[];
  /** Number of signatures required */
  requiredSignatures: number;
}

/**
 * Transaction file format for JSON input
 * @interface TransactionFile
 */
export interface TransactionFile {
  /** Recipient address */
  to: string;
  /** Amount to transfer (decimal string) */
  amount: string;
  /** Optional asset ID */
  assetId?: string;
}
