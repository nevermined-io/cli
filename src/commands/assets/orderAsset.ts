import {
  StatusCodes,
  loadNevermined,
  findAccountOrFirst
} from '../../utils'
import chalk from 'chalk'

import readline from 'readline'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const orderAsset = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {

  const { verbose, network, did, account } = argv
  const { nvm, token } = await loadNevermined(config, network, verbose)
  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(chalk.dim(`Ordering asset: ${did}`))

  const accounts = await nvm.accounts.list()
  const userAccount = findAccountOrFirst(accounts, account)

  logger.debug(chalk.dim(`Using account: '${userAccount.getId()}'`))

  const agreementId = await nvm.assets.order(did, 'access', userAccount)  
  
  logger.info(chalk.dim(`Agreement Id: ${agreementId}`))

  return StatusCodes.OK
}
