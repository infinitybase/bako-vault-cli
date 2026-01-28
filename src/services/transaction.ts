/**
 * @fileoverview Transaction service for creating and sending vault transactions
 * @module services/transaction
 */

import type { VaultConfig, TransactionInput, PendingTransaction } from '../types.js';
import { createVaultInstance } from './vault.js';
import {
  savePendingTransaction,
  loadPendingTransaction,
  deletePendingTransaction,
} from '../utils/config.js';

/**
 * Result of creating a transaction
 * @interface CreateTxResult
 */
export interface CreateTxResult {
  /** Transaction hash to be signed */
  hashTxId: string;
  /** Vault address in B256 format */
  vaultAddress: string;
  /** Number of signatures required */
  signersRequired: number;
}

/**
 * Creates a new transaction and saves it as pending
 * @param {VaultConfig} config - Vault configuration
 * @param {TransactionInput} input - Transaction input parameters
 * @returns {Promise<CreateTxResult>} Transaction creation result with hash to sign
 */
export async function createTransaction(
  config: VaultConfig,
  input: TransactionInput
): Promise<CreateTxResult> {
  const { vault } = await createVaultInstance(config);

  const assetId = input.assetId || config.network.assets.ETH;

  // Use vault.transaction method (same as SDK tests)
  // Amount should be a decimal string like '0.1' for 0.1 ETH
  const { tx, hashTxId } = await vault.transaction({
    assets: [
      {
        assetId,
        amount: input.amount, // Pass as-is (decimal string like '0.001')
        to: input.to,
      },
    ],
  });

  // Serialize transaction as JSON for later restoration
  const txRequest = tx.toJSON();

  // Save pending transaction
  const pending: PendingTransaction = {
    walletName: config.name,
    networkName: config.network.name,
    hashTxId,
    encodedTxId: hashTxId,
    txRequest,
    transaction: input,
    createdAt: new Date().toISOString(),
    signatures: [],
    requiredSignatures: config.config.SIGNATURES_COUNT,
  };

  savePendingTransaction(pending);

  return {
    hashTxId,
    vaultAddress: vault.address.toB256(),
    signersRequired: config.config.SIGNATURES_COUNT,
  };
}

/**
 * Result of sending a transaction
 * @interface SendTxResult
 */
export interface SendTxResult {
  /** Transaction ID on the blockchain */
  transactionId: string;
  /** Transaction status */
  status: string;
}

/**
 * Sends a pending transaction with the provided signatures
 * @param {VaultConfig} config - Vault configuration
 * @param {Array<{signer: string, signature: string}>} signatures - Array of signer addresses and signatures
 * @returns {Promise<SendTxResult>} Transaction result with ID and status
 */
export async function sendTransaction(
  config: VaultConfig,
  signatures: Array<{ signer: string; signature: string }>
): Promise<SendTxResult> {
  const { vault } = await createVaultInstance(config);

  // Load the pending transaction
  const pending = loadPendingTransaction();

  // Recreate the transaction (same parameters)
  const assetId = pending.transaction.assetId || config.network.assets.ETH;

  const { tx } = await vault.transaction({
    assets: [
      {
        assetId,
        amount: pending.transaction.amount, // Decimal string
        to: pending.transaction.to,
      },
    ],
  });

  // Build witnesses array with encoded signatures (same as SDK tests)
  const witnesses: string[] = [];
  for (const sig of signatures) {
    const encodedSignature = vault.encodeSignature(sig.signer, sig.signature);
    witnesses.push(encodedSignature);
  }

  // Set witnesses directly on tx (same as SDK tests: tx.witnesses = [...])
  tx.witnesses = witnesses;

  // Send using vault.send (same as SDK tests)
  const response = await vault.send(tx);
  const result = await response.waitForResult();

  // Clean up pending transaction
  deletePendingTransaction();

  return {
    transactionId: response.id,
    status: result.status || 'success',
  };
}
