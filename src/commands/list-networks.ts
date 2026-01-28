/**
 * @fileoverview Command to list all configured networks
 * @module commands/list-networks
 */

import chalk from 'chalk';
import { listNetworkFiles, loadNetworkConfig } from '../utils/config.js';

/**
 * Lists all configured networks with their basic information
 * @returns {Promise<void>}
 */
export async function listNetworks(): Promise<void> {
  const networks = listNetworkFiles();

  if (networks.length === 0) {
    console.log(chalk.yellow('\nNo networks found.'));
    console.log(chalk.gray('Create a network config file in the networks/ directory.'));
    console.log(chalk.gray('Example: networks/mainnet.json\n'));
    return;
  }

  console.log(chalk.bold('\nConfigured Networks:\n'));
  console.log(chalk.gray('─'.repeat(60)));

  for (const name of networks) {
    try {
      const config = loadNetworkConfig(name);
      console.log(chalk.cyan(`  ${name}`));
      console.log(chalk.gray(`    URL: ${config.url}`));
      if (config.explorerUrl) {
        console.log(chalk.gray(`    Explorer: ${config.explorerUrl}`));
      }
      console.log(chalk.gray(`    ETH: ${config.assets.ETH.slice(0, 10)}...`));
      if (config.assets.USDC) {
        console.log(chalk.gray(`    USDC: ${config.assets.USDC.slice(0, 10)}...`));
      }
      console.log('');
    } catch {
      console.log(chalk.red(`  ${name} (invalid config)`));
      console.log('');
    }
  }

  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.gray(`Total: ${networks.length} network(s)\n`));
}
