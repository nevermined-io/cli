import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import Web3Provider from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'
import { ethers } from 'ethers'

export const accountsNew = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  logger.info(chalk.dim('Creating wallet ...'))

  const wallet = ethers.Wallet.createRandom()
  logger.info(
    chalk.dim(`Wallet address: ${chalk.yellowBright(wallet.address)}`)
  )
  logger.info(
    chalk.dim(`Wallet public key: ${chalk.yellowBright(wallet.publicKey)}`)
  )
  logger.info(
    chalk.dim(`Wallet private key: ${chalk.yellowBright(wallet.privateKey)}`)
  )
  logger.info(chalk.dim(`Wallet Mnemonic:`))

  logger.info(
    chalk.dim(`  Phrase: ${chalk.yellowBright(wallet.mnemonic.phrase)}`)
  )
  logger.info(chalk.dim(`  Path: ${chalk.yellowBright(wallet.mnemonic.path)}`))
  logger.info(
    chalk.dim(`  Locale: ${chalk.yellowBright(wallet.mnemonic.locale)}`)
  )

  logger.info(
    chalk.dim(
      `\nIf you want to use it in the CLI run:\n${chalk.yellow(
        'export MNEMONIC="' + wallet.mnemonic.phrase + '"'
      )}\n`
    )
  )

  return StatusCodes.OK
}
