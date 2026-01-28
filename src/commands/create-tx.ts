/**
 * @fileoverview Command to create a new transaction
 * @module commands/create-tx
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { readFileSync, existsSync } from 'fs';
import {
  loadWalletConfig,
  loadNetworkConfig,
  hasPendingTransaction,
  deletePendingTransaction,
  loadPendingTransaction,
} from '../utils/config.js';
import { createTransaction } from '../services/transaction.js';
import type { TransactionInput, TransactionFile, VaultConfig } from '../types.js';

/**
 * Options for the create-tx command
 * @interface CreateTxOptions
 */
interface CreateTxOptions {
  /** Wallet name */
  wallet?: string;
  /** Network name */
  network?: string;
  /** Recipient address */
  to?: string;
  /** Amount to transfer (decimal string) */
  amount?: string;
  /** Asset ID (optional) */
  asset?: string;
  /** Path to JSON file with transaction details */
  file?: string;
}

/**
 * Creates a new transaction and saves it as pending for signing
 * @param {CreateTxOptions} options - Command options
 * @returns {Promise<void>}
 */
export async function createTx(options: CreateTxOptions): Promise<void> {
  // Check for existing pending transaction
  if (hasPendingTransaction()) {
    const pending = loadPendingTransaction();
    console.log(chalk.yellow('\nThere is already a pending transaction:\n'));
    console.log(chalk.gray(`  Wallet: ${pending.walletName}`));
    console.log(chalk.gray(`  To: ${pending.transaction.to}`));
    console.log(chalk.gray(`  Amount: ${pending.transaction.amount}`));
    console.log(chalk.gray(`  Created: ${pending.createdAt}\n`));

    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'replace',
        message: 'Replace the pending transaction?',
        default: false,
      },
    ]);

    if (!answer.replace) {
      console.log(chalk.gray('\nKeeping existing transaction. Use "bako-vault sign" to sign it.\n'));
      return;
    }

    deletePendingTransaction();
    console.log(chalk.gray('Previous transaction discarded.\n'));
  }

  // Validate required options
  if (!options.wallet) {
    console.log(chalk.red('\nError: --wallet (-w) is required\n'));
    console.log(chalk.gray('Usage: bako-vault create-tx -w <wallet> -n <network> -t <to> -a <amount>'));
    return;
  }

  if (!options.network) {
    console.log(chalk.red('\nError: --network (-n) is required\n'));
    console.log(chalk.gray('Usage: bako-vault create-tx -w <wallet> -n <network> -t <to> -a <amount>'));
    return;
  }

  let txInput: TransactionInput;

  // Get transaction details
  if (options.file) {
    if (!existsSync(options.file)) {
      console.log(chalk.red(`\nError: File not found: ${options.file}\n`));
      return;
    }

    const content = readFileSync(options.file, 'utf-8');
    const txFile = JSON.parse(content) as TransactionFile;

    txInput = {
      to: txFile.to,
      amount: txFile.amount,
      assetId: txFile.assetId,
    };
  } else if (options.to && options.amount) {
    txInput = {
      to: options.to,
      amount: options.amount,
      assetId: options.asset,
    };
  } else {
    console.log(chalk.red('\nError: --to (-t) and --amount (-a) are required\n'));
    console.log(chalk.gray('Usage: bako-vault create-tx -w <wallet> -n <network> -t <to> -a <amount>'));
    console.log(chalk.gray('   or: bako-vault create-tx -w <wallet> -n <network> -f <file.json>'));
    return;
  }

  const spinner = ora('Creating transaction...').start();

  try {
    const walletConfig = loadWalletConfig(options.wallet);
    const networkConfig = loadNetworkConfig(options.network);

    const config: VaultConfig = {
      ...walletConfig,
      network: networkConfig,
    };

    const result = await createTransaction(config, txInput);

    spinner.stop();

    console.log(chalk.bold.green('\nTransaction created!\n'));
    console.log(chalk.gray('─'.repeat(70)));

    console.log(chalk.white('\n  Vault Address:'));
    console.log(chalk.gray(`    ${result.vaultAddress}`));

    console.log(chalk.white('\n  Transaction Details:'));
    console.log(chalk.gray(`    To: ${txInput.to}`));
    console.log(chalk.gray(`    Amount: ${txInput.amount}`));
    console.log(chalk.gray(`    Asset: ${txInput.assetId || 'ETH (default)'}`));

    console.log(chalk.white('\n  Signatures Required:'));
    console.log(chalk.yellow(`    ${result.signersRequired}`));

    console.log(chalk.bold.white('\n  Hash to Sign:'));
    console.log(chalk.cyan(`    ${result.hashTxId}`));

    console.log(chalk.gray('\n' + '─'.repeat(70)));

    console.log(chalk.white('\n  Next Step:'));
    console.log(chalk.gray('    Run: bako-vault sign\n'));
  } catch (error) {
    spinner.fail('Failed to create transaction');
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
  }
}
