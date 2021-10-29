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

export const getAsset = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {

  const { verbose, network, did, account } = argv  
  const { nvm, token } = await loadNevermined(config, network, verbose)
  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  let agreementId
  const accounts = await nvm.accounts.list()
  const userAccount = findAccountOrFirst(accounts, account)

  logger.debug(chalk.dim(`Using account: '${userAccount.getId()}'`))

  if (argv.agreementId === "") {
    logger.info(chalk.dim(`Ordering asset: ${did}`))
    agreementId = await nvm.assets.order(did, 'access', userAccount)  
  } else  {
    agreementId = argv.agreementId
  }
  
  logger.info(chalk.dim(`Downloading asset: ${did} with agreement id: ${agreementId}`))
  
  const path = await nvm.assets.consume(agreementId, did, userAccount, argv.path, argv.fileIndex)
  
  logger.info(chalk.dim(`Files downloaded to: ${path}`))

  return StatusCodes.OK
}
