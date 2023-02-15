import { Account, Nevermined } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import readline from 'readline'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const orderAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  // TODO: Enable DTP when `sdk-dtp` is ready
  // const keyTransfer = await makeKeyTransfer()

  logger.info(chalk.dim(`Ordering asset: ${did}`))

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))

  const agreementId = await nvm.assets.order(did, account)
  // }

  logger.info(chalk.dim(`Agreement Id: ${agreementId}`))

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({ agreementId })
  }
}
