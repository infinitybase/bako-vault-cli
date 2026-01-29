/**
 * @fileoverview Command to send a pending transaction with signatures
 * @module commands/send-tx
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import {
  hasPendingTransaction,
  loadPendingTransaction,
  loadWalletConfig,
  loadNetworkConfig,
} from '../utils/config.js';
import { sendTransaction } from '../services/transaction.js';
import type { VaultConfig } from '../types.js';

/**
 * Options for the send-tx command
 * @interface SendTxOptions
 */
interface SendTxOptions {
  /** Network name (optional, uses pending tx network if not provided) */
  network?: string;
}

/**
 * Sends a pending transaction with the provided signatures
 * @param {SendTxOptions} options - Command options
 * @returns {Promise<void>}
 */
export async function sendTx(options: SendTxOptions): Promise<void> {
  // Check for pending transaction
  if (!hasPendingTransaction()) {
    console.log(chalk.yellow('\nNo pending transaction found.'));
    console.log(chalk.gray('Create one first with: bako-vault create-tx\n'));
    return;
  }

  // Load the pending transaction
  const pending = loadPendingTransaction();

  console.log(chalk.bold(`\nPending Transaction`));
  console.log(chalk.gray('─'.repeat(70)));

  console.log(chalk.white('\n  Details:'));
  console.log(chalk.gray(`    Wallet: ${pending.walletName}`));
  console.log(chalk.gray(`    Network: ${pending.networkName}`));
  console.log(chalk.gray(`    To: ${pending.transaction.to}`));
  console.log(chalk.gray(`    Amount: ${pending.transaction.amount}`));

  console.log(chalk.white('\n  Signatures Required:'));
  console.log(chalk.yellow(`    ${pending.requiredSignatures}`));

  console.log(chalk.white('\n  Hash:'));
  console.log(chalk.cyan(`    ${pending.hashTxId}`));

  const signatures = pending.signatures;

  const uniqueSigners = new Set(signatures.map((s) => s.signer));
  const uniqueCount = uniqueSigners.size;

  if (uniqueCount < pending.requiredSignatures) {
    console.log(
        chalk.red(`\nError: Need ${pending.requiredSignatures} unique signatures, got ${uniqueCount}\n`)
    );
    return;
  }

  // Confirm
  const confirm = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'send',
      message: 'Send transaction to blockchain?',
      default: true,
    },
  ]);

  if (!confirm.send) {
    console.log(chalk.gray('\nTransaction cancelled.\n'));
    return;
  }

  const spinner = ora('Sending transaction...').start();

  try {
    const walletConfig = loadWalletConfig(pending.walletName);
    const networkConfig = loadNetworkConfig(options.network || pending.networkName);

    const config: VaultConfig = {
      ...walletConfig,
      network: networkConfig,
    };

    const result = await sendTransaction(config, signatures);

    spinner.succeed('Transaction sent!');

    console.log(chalk.bold.green('\nTransaction submitted successfully!\n'));
    console.log(chalk.gray('─'.repeat(70)));

    console.log(chalk.white('\n  Transaction ID:'));
    console.log(chalk.cyan(`    ${result.transactionId}`));

    console.log(chalk.white('\n  Status:'));
    console.log(chalk.green(`    ${result.status}`));

    const explorerUrl = networkConfig.explorerUrl || 'https://app.fuel.network';
    console.log(chalk.gray(`\n  View: ${explorerUrl}/tx/${result.transactionId}`));

    console.log(chalk.gray('\n' + '─'.repeat(70) + '\n'));
  } catch (error) {
    spinner.fail('Failed to send transaction');
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
  }
}
