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
  /** Signer address for CLI-provided signature */
  signer?: string;
  /** Signature for CLI-provided signature */
  signature?: string;
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

  // Check if signatures provided via CLI
  let signatures: Array<{ signer: string; signature: string }> = [];

  if (options.signer && options.signature) {
    // Single signature via CLI
    signatures.push({
      signer: options.signer,
      signature: options.signature,
    });
    console.log(chalk.green(`\n  Signature provided via CLI`));
  } else {
    // Interactive mode - collect signatures
    console.log(chalk.white(`\n  Enter ${pending.requiredSignatures} signature(s):\n`));

    for (let i = 0; i < pending.requiredSignatures; i++) {
      console.log(chalk.gray(`  --- Signature ${i + 1} of ${pending.requiredSignatures} ---`));

      const sigInput = await inquirer.prompt([
        {
          type: 'input',
          name: 'signer',
          message: 'Signer address (0x...):',
          validate: (input: string) => {
            if (!input.startsWith('0x') || input.length !== 66) {
              return 'Enter a valid B256 address (0x + 64 hex chars)';
            }
            return true;
          },
        },
        {
          type: 'input',
          name: 'signature',
          message: 'Signature (0x...):',
          validate: (input: string) => {
            if (!input.startsWith('0x')) {
              return 'Signature should start with 0x';
            }
            return true;
          },
        },
      ]);

      signatures.push({
        signer: sigInput.signer,
        signature: sigInput.signature,
      });

      console.log(chalk.green(`  Signature ${i + 1} added\n`));
    }
  }

  if (signatures.length < pending.requiredSignatures) {
    console.log(
      chalk.red(`\nError: Need ${pending.requiredSignatures} signatures, got ${signatures.length}\n`)
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
