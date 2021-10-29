import {
  StatusCodes,
  loadNevermined,
  printSearchResult,
  findAccountOrFirst
} from '../../utils'
import chalk from 'chalk'

import readline from 'readline'
import { ConfigEntry, logger } from '../../utils/config'
import { Logger } from 'log4js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const downloadAsset = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {

  const { verbose, network, did, account } = argv
  const { nvm, token } = await loadNevermined(config, network, verbose)
  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(chalk.dim(`Downloading asset: ${did}`))

  const accounts = await nvm.accounts.list()
  const userAccount = findAccountOrFirst(accounts, account)

  logger.debug(chalk.dim(`Using account: '${userAccount.getId()}'`))

  const path = await nvm.assets.download(did, userAccount, argv.path, argv.fileIndex, false)
  
  logger.info(chalk.dim(`Files downloaded to: ${path}`))

  return StatusCodes.OK
}
