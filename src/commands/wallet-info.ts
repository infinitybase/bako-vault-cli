/**
 * @fileoverview Command to display detailed wallet information
 * @module commands/wallet-info
 */

import chalk from 'chalk';
import ora from 'ora';
import { loadWalletConfig, loadNetworkConfig } from '../utils/config.js';
import { getVaultInfo, getVaultBalances } from '../services/vault.js';
import type { VaultConfig } from '../types.js';

/**
 * Displays detailed information about a wallet including address, signers, and balances
 * @param {string} [walletName] - Name of the wallet to display
 * @param {string} [networkName] - Name of the network to use
 * @returns {Promise<void>}
 */
export async function walletInfo(walletName?: string, networkName?: string): Promise<void> {
  if (!walletName) {
    console.log(chalk.red('\nError: wallet name is required\n'));
    console.log(chalk.gray('Usage: bako-vault info <wallet> -n <network>'));
    return;
  }

  if (!networkName) {
    console.log(chalk.red('\nError: --network (-n) is required\n'));
    console.log(chalk.gray('Usage: bako-vault info <wallet> -n <network>'));
    return;
  }

  const spinner = ora('Loading wallet info...').start();

  try {
    const walletConfig = loadWalletConfig(walletName);
    const networkConfig = loadNetworkConfig(networkName);

    const config: VaultConfig = {
      ...walletConfig,
      network: networkConfig,
    };

    const info = await getVaultInfo(config);
    const balances = await getVaultBalances(config);

    spinner.stop();

    console.log(chalk.bold(`\nWallet: ${chalk.cyan(walletName)}\n`));
    console.log(chalk.gray('─'.repeat(70)));

    console.log(chalk.white('  Address:'));
    console.log(chalk.green(`    ${info.address}`));
    console.log('');

    console.log(chalk.white('  Network:'));
    console.log(chalk.gray(`    ${networkName} (${networkConfig.url})`));
    console.log('');

    console.log(chalk.white('  Predicate Version:'));
    console.log(chalk.gray(`    ${info.version}`));
    console.log('');

    // Filter out zero addresses
    const validSigners = info.signers.filter(
      s => s !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    );
    console.log(chalk.white(`  Signers (${validSigners.length}):`));
    validSigners.forEach((signer, i) => {
      console.log(chalk.gray(`    ${i + 1}. ${signer}`));
    });
    console.log('');

    console.log(chalk.white('  Signatures Required:'));
    console.log(chalk.yellow(`    ${info.signaturesRequired} of ${validSigners.length}`));
    console.log('');

    console.log(chalk.white('  Balances:'));
    if (balances.length === 0) {
      console.log(chalk.gray('    No balances found'));
    } else {
      balances.forEach(b => {
        let assetLabel = b.assetId.slice(0, 10) + '...';
        if (b.assetId === networkConfig.assets.ETH) {
          assetLabel = 'ETH';
        } else if (b.assetId === networkConfig.assets.USDC) {
          assetLabel = 'USDC';
        }
        console.log(chalk.gray(`    ${assetLabel}: ${b.amount}`));
      });
    }

    console.log(chalk.gray('\n' + '─'.repeat(70) + '\n'));
  } catch (error) {
    spinner.fail('Failed to load wallet info');
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
  }
}
