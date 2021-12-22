import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, findAccountOrFirst } from '../../utils'
import chalk from 'chalk'

import readline from 'readline'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const downloadAsset = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, account } = argv

  logger.info(chalk.dim(`Downloading asset: ${did}`))

  const accounts = await nvm.accounts.list()
  const userAccount = findAccountOrFirst(accounts, account)

  logger.debug(chalk.dim(`Using account: '${userAccount.getId()}'`))

  const path = await nvm.assets.download(
    did,
    userAccount,
    argv.path,
    argv.fileIndex,
    false
  )

  logger.info(chalk.dim(`Files downloaded to: ${path}`))

  return StatusCodes.OK
}
