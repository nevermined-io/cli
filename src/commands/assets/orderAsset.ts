import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, loadNevermined, findAccountOrFirst } from '../../utils'
import chalk from 'chalk'

import readline from 'readline'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'
import { makeKeyTransfer } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'

const rl = readline.createInterface({
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
  const { verbose, network, did, password } = argv

  const keyTransfer = await makeKeyTransfer()

  logger.info(chalk.dim(`Ordering asset: ${did}`))

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))

  let agreementId
  if (password) {
    const key = await keyTransfer.secretToPublic(keyTransfer.makeKey(password))
    account.babyX = key.x
    account.babyY = key.y
    account.babySecret = password
    agreementId = await nvm.assets.order(did, 'access-proof', account)
  } else {
    agreementId = await nvm.assets.order(did, 'access', account)
  }

  logger.info(chalk.dim(`Agreement Id: ${agreementId}`))

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({ agreementId })
  }
}
