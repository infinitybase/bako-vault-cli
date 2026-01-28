/**
 * @fileoverview Command to list balances for all wallets across all networks
 * @module commands/balances
 */

import chalk from 'chalk';
import ora from 'ora';
import { listWalletFiles, listNetworkFiles, loadWalletConfig, loadNetworkConfig } from '../utils/config.js';
import { getVaultBalances } from '../services/vault.js';
import type { VaultConfig } from '../types.js';

/**
 * Lists balances for all configured wallets across all configured networks
 * @returns {Promise<void>}
 */
export async function balances(): Promise<void> {
  const wallets = listWalletFiles();
  const networks = listNetworkFiles();

  if (wallets.length === 0) {
    console.log(chalk.yellow('\nNo wallets configured.'));
    console.log(chalk.gray('Create a wallet file in wallets/<name>.json\n'));
    return;
  }

  if (networks.length === 0) {
    console.log(chalk.yellow('\nNo networks configured.'));
    console.log(chalk.gray('Create a network file in networks/<name>.json\n'));
    return;
  }

  console.log(chalk.bold('\nWallet Balances\n'));
  console.log(chalk.gray('─'.repeat(70)));

  for (const walletName of wallets) {
    console.log(chalk.bold.cyan(`\n  ${walletName}`));

    const walletConfig = loadWalletConfig(walletName);

    for (const networkName of networks) {
      const spinner = ora(`  Loading ${networkName}...`).start();

      try {
        const networkConfig = loadNetworkConfig(networkName);

        const config: VaultConfig = {
          ...walletConfig,
          network: networkConfig,
        };

        const balanceList = await getVaultBalances(config);

        spinner.stop();

        console.log(chalk.white(`\n    ${networkName}:`));

        if (balanceList.length === 0) {
          console.log(chalk.gray('      No balances'));
        } else {
          for (const b of balanceList) {
            let assetLabel = b.assetId.slice(0, 10) + '...';
            if (b.assetId === networkConfig.assets.ETH) {
              assetLabel = 'ETH';
            } else if (b.assetId === networkConfig.assets.USDC) {
              assetLabel = 'USDC';
            }
            console.log(chalk.gray(`      ${assetLabel}: ${b.amount}`));
          }
        }
      } catch (error) {
        spinner.stop();
        console.log(chalk.white(`\n    ${networkName}:`));
        console.log(chalk.red(`      Error: ${(error as Error).message}`));
      }
    }
  }

  console.log(chalk.gray('\n' + '─'.repeat(70) + '\n'));
}
