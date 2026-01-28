#!/usr/bin/env node

/**
 * @fileoverview Bako Vault CLI - Execute transactions using Bako predicates without a server
 * @module bako-vault-cli
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { listWallets } from './commands/list-wallets.js';
import { listNetworks } from './commands/list-networks.js';
import { walletInfo } from './commands/wallet-info.js';
import { createTx } from './commands/create-tx.js';
import { sendTx } from './commands/send-tx.js';
import { sign } from './commands/sign.js';
import { balances } from './commands/balances.js';

const program = new Command();

program
  .name('bako-vault')
  .description('CLI to execute transactions using Bako predicates without a server')
  .version('1.0.0');

program
  .command('list-wallets')
  .alias('ls')
  .description('List all configured wallets')
  .action(listWallets);

program
  .command('list-networks')
  .alias('networks')
  .description('List all configured networks')
  .action(listNetworks);

program
  .command('wallet-info')
  .alias('info')
  .description('Show wallet details (address, signers, balance)')
  .argument('[wallet]', 'Wallet name')
  .option('-n, --network <name>', 'Network name')
  .action((wallet, options) => walletInfo(wallet, options.network));

program
  .command('create-tx')
  .alias('create')
  .description('Create a transaction and generate the hash to sign')
  .option('-w, --wallet <name>', 'Wallet name')
  .option('-n, --network <name>', 'Network name')
  .option('-t, --to <address>', 'Recipient address')
  .option('-a, --amount <value>', 'Amount to transfer (e.g., 0.001 for 0.001 ETH)')
  .option('--asset <assetId>', 'Asset ID (default: ETH)')
  .option('-f, --file <path>', 'JSON file with transaction data')
  .action((options) => createTx(options));

program
  .command('send-tx')
  .alias('send')
  .description('Send the pending transaction with the provided signatures')
  .option('-n, --network <name>', 'Network name (optional)')
  .option('-s, --signer <address>', 'Signer address')
  .option('-S, --signature <sig>', 'Signature')
  .action((options) => sendTx(options));

program
  .command('sign')
  .description('Sign the pending transaction using a private key')
  .option('-p, --pk <privateKey>', 'Private key (0x...)')
  .action((options) => sign(options));

program
  .command('balances')
  .alias('bal')
  .description('List balances of all wallets across all networks')
  .action(balances);

// Show help if no command
if (process.argv.length === 2) {
  console.log(chalk.bold.cyan('\n  Bako Vault CLI\n'));
  console.log(chalk.gray('  Execute transactions using Bako predicates without a server.\n'));
  program.outputHelp();
}

program.parse();
