/**
 * @fileoverview Configuration utilities for wallet, network, and pending transaction management
 * @module utils/config
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { WalletConfig, NetworkConfig, PendingTransaction, Signature } from '../types.js';

/** Directory containing wallet configuration files */
const WALLETS_DIR = join(process.cwd(), 'wallets');

/** Directory containing network configuration files */
const NETWORKS_DIR = join(process.cwd(), 'networks');

/** File path for the pending transaction */
const PENDING_FILE = join(process.cwd(), '.pending-tx.json');

/**
 * Gets the wallets directory path, creating it if it doesn't exist
 * @returns {string} Path to the wallets directory
 */
export function getWalletsDir(): string {
  if (!existsSync(WALLETS_DIR)) {
    mkdirSync(WALLETS_DIR, { recursive: true });
  }
  return WALLETS_DIR;
}

/**
 * Gets the networks directory path, creating it if it doesn't exist
 * @returns {string} Path to the networks directory
 */
export function getNetworksDir(): string {
  if (!existsSync(NETWORKS_DIR)) {
    mkdirSync(NETWORKS_DIR, { recursive: true });
  }
  return NETWORKS_DIR;
}

/**
 * Checks if there is a pending transaction
 * @returns {boolean} True if a pending transaction exists
 */
export function hasPendingTransaction(): boolean {
  return existsSync(PENDING_FILE);
}

/**
 * Lists all wallet configuration files
 * @returns {string[]} Array of wallet names (without .json extension)
 */
export function listWalletFiles(): string[] {
  const dir = getWalletsDir();
  return readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

/**
 * Lists all network configuration files
 * @returns {string[]} Array of network names (without .json extension)
 */
export function listNetworkFiles(): string[] {
  const dir = getNetworksDir();
  return readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

/**
 * Loads a network configuration by name
 * @param {string} name - Network name (filename without extension)
 * @returns {NetworkConfig} The network configuration
 * @throws {Error} If network file doesn't exist or is invalid
 */
export function loadNetworkConfig(name: string): NetworkConfig {
  const filePath = join(getNetworksDir(), `${name}.json`);

  if (!existsSync(filePath)) {
    throw new Error(`Network "${name}" not found. Create a file at networks/${name}.json`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const config = JSON.parse(content) as NetworkConfig;
  config.name = name;

  validateNetworkConfig(config);

  return config;
}

/**
 * Validates a network configuration
 * @param {NetworkConfig} config - Network configuration to validate
 * @throws {Error} If configuration is invalid
 * @private
 */
function validateNetworkConfig(config: NetworkConfig): void {
  if (!config.url) {
    throw new Error('Network config must have a url');
  }
  if (!config.assets || !config.assets.ETH) {
    throw new Error('Network config must have assets.ETH');
  }
}

/**
 * Loads a wallet configuration by name
 * @param {string} name - Wallet name (filename without extension)
 * @returns {WalletConfig} The wallet configuration
 * @throws {Error} If wallet file doesn't exist or is invalid
 */
export function loadWalletConfig(name: string): WalletConfig {
  const filePath = join(getWalletsDir(), `${name}.json`);

  if (!existsSync(filePath)) {
    throw new Error(`Wallet "${name}" not found. Create a file at wallets/${name}.json`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const config = JSON.parse(content) as WalletConfig;
  config.name = name;

  validateWalletConfig(config);

  return config;
}

/**
 * Validates a wallet configuration
 * @param {WalletConfig} config - Wallet configuration to validate
 * @throws {Error} If configuration is invalid
 * @private
 */
function validateWalletConfig(config: WalletConfig): void {
  if (!config.config) {
    throw new Error('Wallet config must have a "config" object');
  }

  if (!config.config.SIGNERS || config.config.SIGNERS.length === 0) {
    throw new Error('Wallet config must have SIGNERS array');
  }

  if (!config.config.SIGNATURES_COUNT || config.config.SIGNATURES_COUNT < 1) {
    throw new Error('SIGNATURES_COUNT must be at least 1');
  }

  if (!config.version) {
    throw new Error('Wallet config must have a "version" field');
  }

  // Filter out zero addresses for validation
  const validSigners = config.config.SIGNERS.filter(
    s => s !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  );
  if (config.config.SIGNATURES_COUNT > validSigners.length) {
    throw new Error('SIGNATURES_COUNT cannot be greater than number of valid signers');
  }
}

/**
 * Saves a pending transaction to the file system
 * @param {PendingTransaction} pending - The pending transaction to save
 */
export function savePendingTransaction(pending: PendingTransaction): void {
  writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
}

/**
 * Loads the pending transaction from the file system
 * @returns {PendingTransaction} The pending transaction
 * @throws {Error} If no pending transaction exists
 */
export function loadPendingTransaction(): PendingTransaction {
  if (!existsSync(PENDING_FILE)) {
    throw new Error('No pending transaction found. Create one first with: bako-vault create-tx');
  }

  const content = readFileSync(PENDING_FILE, 'utf-8');
  return JSON.parse(content) as PendingTransaction;
}

/**
 * Deletes the pending transaction file
 */
export function deletePendingTransaction(): void {
  if (existsSync(PENDING_FILE)) {
    unlinkSync(PENDING_FILE);
  }
}
