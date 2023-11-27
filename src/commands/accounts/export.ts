import { Account, Nevermined } from '@nevermined-io/sdk'
import { StatusCodes, printWallet } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { Mnemonic, ethers } from 'ethers'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'
import fs from 'fs'

export const accountsExport = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { destination, password } = argv

  logger.info(chalk.dim('Export wallet ...'))

  const pathLength = ethers.defaultPath.length
  const accountPath = ethers.defaultPath.substring(0, pathLength - 1) + argv.accountIndex
  logger.info(`Using account path: ${accountPath}`)
  
  const wallet = ethers.HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(config.seed!), accountPath)
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
