/**
 * @fileoverview Command to sign a pending transaction using a private key
 * @module commands/sign
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { Wallet } from 'fuels';
import {
  hasPendingTransaction,
  loadPendingTransaction,
  loadWalletConfig,
  loadNetworkConfig,
  savePendingTransaction,
} from '../utils/config.js';
import { sendTransaction } from '../services/transaction.js';
import type { VaultConfig } from '../types.js';

/**
 * Options for the sign command
 * @interface SignOptions
 */
interface SignOptions {
  /** Private key (0x...) */
  pk?: string;
}

/**
 * Signs a pending transaction using a Fuel private key
 * If threshold is reached, offers to send the transaction
 * @param {SignOptions} options - Command options
 * @returns {Promise<void>}
 */
export async function sign(options: SignOptions): Promise<void> {
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

  console.log(chalk.white('\n  Hash to Sign:'));
  console.log(chalk.cyan(`    ${pending.hashTxId}`));

  // Get private key
  let privateKey = options.pk;
  if (!privateKey) {
    const pkAnswer = await inquirer.prompt([
      {
        type: 'password',
        name: 'pk',
        message: 'Enter your private key (0x...):',
        mask: '*',
        validate: (input: string) => {
          if (!input.startsWith('0x')) {
            return 'Private key should start with 0x';
          }
          return true;
        },
      },
    ]);
    privateKey = pkAnswer.pk;
  }

  try {
    // Create wallet from private key
    const wallet = Wallet.fromPrivateKey(privateKey!);
    const signerAddress = wallet.address.toB256();

    // Sign the hashTxId directly (same as SDK tests for Fuel wallets)
    const signature = await wallet.signMessage(pending.hashTxId);

    console.log(chalk.bold.green('\n  Signature created!\n'));
    console.log(chalk.gray('─'.repeat(70)));

    console.log(chalk.white('\n  Signer Address:'));
    console.log(chalk.cyan(`    ${signerAddress}`));

    console.log(chalk.white('\n  Signature:'));
    console.log(chalk.green(`    ${signature}`));

    // Check threshold
    const currentSignatures = pending.signatures.length + 1;
    const requiredSignatures = pending.requiredSignatures;

    console.log(chalk.white('\n  Signatures:'));
    console.log(chalk.yellow(`    ${currentSignatures} of ${requiredSignatures} required`));

    if (currentSignatures >= requiredSignatures) {
      console.log(chalk.green('\n  Threshold reached! Ready to send.'));

      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'sendNow',
          message: 'Send transaction now?',
          default: true,
        },
      ]);

      if (answer.sendNow) {
        const spinner = ora('Sending transaction...').start();

        try {
          const walletConfig = loadWalletConfig(pending.walletName);
          const networkConfig = loadNetworkConfig(pending.networkName);
          const config: VaultConfig = {
            ...walletConfig,
            network: networkConfig,
          };

          // Pass raw signature - sendTransaction will encode it
          const result = await sendTransaction(config, [{ signer: signerAddress, signature }]);

          spinner.succeed('Transaction sent!');

          console.log(chalk.bold.green('\nTransaction submitted successfully!\n'));
          console.log(chalk.gray('─'.repeat(70)));

          console.log(chalk.white('\n  Transaction ID:'));
          console.log(chalk.cyan(`    ${result.transactionId}`));

          const explorerUrl = networkConfig.explorerUrl || 'https://app.fuel.network';
          console.log(chalk.gray(`\n  View: ${explorerUrl}/tx/${result.transactionId}`));

          console.log(chalk.gray('\n' + '─'.repeat(70) + '\n'));
        } catch (error) {
          spinner.fail('Failed to send transaction');
          console.error(chalk.red(`\nError: ${(error as Error).message}\n`));

          showSendCommand(signerAddress, signature);
        }
      } else {
        showSendCommand(signerAddress, signature);
      }
    } else {
      console.log(chalk.yellow(`\n  Need ${requiredSignatures - currentSignatures} more signature(s).`));
      console.log(chalk.gray('\n  Run "bako-vault sign" again with another signer.\n'));

      // Save this signature to pending
      const sigEntry = JSON.stringify({ signer: signerAddress, signature });
      if (!pending.signatures.includes(sigEntry)) {
        pending.signatures.push(sigEntry);
        savePendingTransaction(pending);
      }
    }
  } catch (error) {
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
  }
}

/**
 * Shows the manual send command for the user
 * @param {string} signer - Signer address
 * @param {string} signature - Signature
 * @private
 */
function showSendCommand(signer: string, signature: string): void {
  console.log(chalk.gray('\n' + '─'.repeat(70)));
  console.log(chalk.white('\n  Manual send command:'));
  console.log(chalk.gray(`    npm run dev -- send-tx -s ${signer} -S ${signature}\n`));
}
