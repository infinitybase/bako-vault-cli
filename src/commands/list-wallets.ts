/**
 * @fileoverview Command to list all configured wallets
 * @module commands/list-wallets
 */

import chalk from 'chalk';
import { listWalletFiles, loadWalletConfig } from '../utils/config.js';

/**
 * Lists all configured wallets with their basic information
 * @returns {Promise<void>}
 */
export async function listWallets(): Promise<void> {
  const wallets = listWalletFiles();

  if (wallets.length === 0) {
    console.log(chalk.yellow('\nNo wallets found.'));
    console.log(chalk.gray('Create a wallet config file in the wallets/ directory.'));
    console.log(chalk.gray('Example: wallets/my-vault.json\n'));
    return;
  }

  console.log(chalk.bold('\nConfigured Wallets:\n'));
  console.log(chalk.gray('─'.repeat(60)));

  for (const name of wallets) {
    try {
      const config = loadWalletConfig(name);
      const validSigners = config.config.SIGNERS.filter(
        s => s !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      );
      console.log(chalk.cyan(`  ${name}`));
      console.log(chalk.gray(`    Signers: ${validSigners.length}`));
      console.log(chalk.gray(`    Required: ${config.config.SIGNATURES_COUNT} signature(s)`));
      console.log(chalk.gray(`    Version: ${config.version.slice(0, 10)}...`));
      console.log('');
    } catch {
      console.log(chalk.red(`  ${name} (invalid config)`));
      console.log('');
    }
  }

  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.gray(`Total: ${wallets.length} wallet(s)\n`));
}
