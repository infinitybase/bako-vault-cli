/**
 * @fileoverview Vault service for creating and interacting with BakoSafe vaults
 * @module services/vault
 */

import { Provider } from 'fuels';
import { Vault } from 'bakosafe';
import type { VaultConfig } from '../types.js';

/**
 * Vault information response
 * @interface VaultInfo
 */
export interface VaultInfo {
  /** Vault address in B256 format */
  address: string;
  /** Array of signer addresses */
  signers: string[];
  /** Number of signatures required */
  signaturesRequired: number;
  /** ETH balance in base units */
  balance: string;
  /** Predicate version hash */
  version: string;
}

/**
 * Vault instance with provider and configuration
 * @interface VaultInstance
 */
export interface VaultInstance {
  /** BakoSafe Vault instance */
  vault: Vault;
  /** Fuel provider instance */
  provider: Provider;
  /** Vault configuration */
  config: VaultConfig;
}

/**
 * Creates a BakoSafe Vault instance from configuration
 * @param {VaultConfig} config - Vault configuration containing wallet and network info
 * @returns {Promise<VaultInstance>} The vault instance with provider
 */
export async function createVaultInstance(config: VaultConfig): Promise<VaultInstance> {
  const provider = new Provider(config.network.url);

  const vaultConfig = {
    SIGNATURES_COUNT: config.config.SIGNATURES_COUNT,
    SIGNERS: config.config.SIGNERS,
    ...(config.config.HASH_PREDICATE && { HASH_PREDICATE: config.config.HASH_PREDICATE }),
  };

  const vault = new Vault(provider, vaultConfig, config.version);

  return { vault, provider, config };
}

/**
 * Gets vault information including address, signers, and balance
 * @param {VaultConfig} config - Vault configuration
 * @returns {Promise<VaultInfo>} Vault information
 */
export async function getVaultInfo(config: VaultConfig): Promise<VaultInfo> {
  const { vault } = await createVaultInstance(config);

  let balance = '0';
  try {
    const balanceResult = await vault.getBalance(config.network.assets.ETH);
    balance = balanceResult.toString();
  } catch {
    balance = '0';
  }

  return {
    address: vault.address.toB256(),
    signers: config.config.SIGNERS,
    signaturesRequired: config.config.SIGNATURES_COUNT,
    balance,
    version: config.version,
  };
}

/**
 * Gets all asset balances for a vault
 * @param {VaultConfig} config - Vault configuration
 * @returns {Promise<Array<{assetId: string, amount: string}>>} Array of asset balances
 */
export async function getVaultBalances(
  config: VaultConfig
): Promise<Array<{ assetId: string; amount: string }>> {
  const { vault } = await createVaultInstance(config);

  try {
    const response = await vault.getBalances();
    return response.balances.map((b: { assetId: string; amount: { toString: () => string } }) => ({
      assetId: b.assetId,
      amount: b.amount.toString(),
    }));
  } catch {
    return [];
  }
}
