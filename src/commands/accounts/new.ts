import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes, printWallet } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ethers } from 'ethers'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'
import fs from 'fs'

export const accountsNew = async (
  _nvmApp: NvmApp,
  _account: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { destination, password } = argv

  logger.info(chalk.dim('Creating wallet ...'))

  const wallet = ethers.Wallet.createRandom()
  printWallet(wallet)

  if (password !== '' && destination !== ''){
    logger.info(`Wallet added to ${destination} file`)
    logger.info(`Wallet password: ${password}`)
    const json = await wallet.encrypt(password)
    fs.writeFileSync(destination, json)
  }

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      walletAddress: wallet.address,
      walletPublicKey: wallet.publicKey,
      walletPrivateKey: wallet.privateKey,
      mnemonicPhrase: wallet.mnemonic?.phrase,
      mnemonicPath: wallet.path
    })
  }
}
