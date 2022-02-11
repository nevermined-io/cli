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

export const getAsset = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, account, password } = argv

  let agreementId
  const accounts = await nvm.accounts.list()
  const userAccount = findAccountOrFirst(accounts, account)

  if (password) {
    const key = keytransfer.secretToPublic(keytransfer.makeKey(password))
    userAccount.babyX = key.x
    userAccount.babyY = key.y
    userAccount.babySecret = password
  }

  logger.debug(chalk.dim(`Using account: '${userAccount.getId()}'`))

  if (argv.agreementId === '') {
    logger.info(chalk.dim(`Ordering asset: ${did}`))
    if (password) {
      agreementId = await nvm.assets.order(did, 'access-proof', userAccount)
    } else {
      agreementId = await nvm.assets.order(did, 'access', userAccount)
    }
  } else {
    ;({ agreementId } = argv)
  }

  logger.info(
    chalk.dim(`Downloading asset: ${did} with agreement id: ${agreementId}`)
  )

  if (password) {
    const key = await nvm.assets.consumeProof(agreementId, did, userAccount)
    console.log(`Got password ${Buffer.from(key as any, 'hex').toString()}`)
  } else {
    const path = await nvm.assets.consume(
      agreementId,
      did,
      userAccount,
      argv.path,
      argv.fileIndex
    )
    logger.info(chalk.dim(`Files downloaded to: ${path}`))
  }

  return StatusCodes.OK
}
