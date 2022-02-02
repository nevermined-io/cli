import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, loadNevermined, findAccountOrFirst } from '../../utils'
import chalk from 'chalk'

import readline from 'readline'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

import KeyTransfer from '@nevermined-io/nevermined-sdk-js/dist/node/utils/KeyTransfer'

const keytransfer = new KeyTransfer()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const orderAsset = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, account, password } = argv

  logger.info(chalk.dim(`Ordering asset: ${did}`))

  const accounts = await nvm.accounts.list()
  const userAccount = findAccountOrFirst(accounts, account)

  logger.debug(chalk.dim(`Using account: '${userAccount.getId()}'`))

  let agreementId
  if (password) {
    const key = keytransfer.secretToPublic(keytransfer.makeKey(password))
    userAccount.babyX = key.x
    userAccount.babyY = key.y
    userAccount.babySecret = password
    agreementId = await nvm.assets.order(did, 'access-proof', userAccount)
  } else {
    agreementId = await nvm.assets.order(did, 'access', userAccount)
  }

  logger.info(chalk.dim(`Agreement Id: ${agreementId}`))

  return StatusCodes.OK
}
