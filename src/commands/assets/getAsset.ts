import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, loadNevermined, findAccountOrFirst } from '../../utils'
import chalk from 'chalk'
import readline from 'readline'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'
import { makeKeyTransfer } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const getAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, password } = argv

  const keyTransfer = await makeKeyTransfer()

  let agreementId

  if (password) {
    const key = await keyTransfer.secretToPublic(keyTransfer.makeKey(password))
    account.babyX = key.x
    account.babyY = key.y
    account.babySecret = password
  }

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))

  if (argv.agreementId === '') {
    logger.info(chalk.dim(`Ordering asset: ${did}`))
    if (password) {
      agreementId = await nvm.assets.order(did, 'access-proof', account)
    } else {
      agreementId = await nvm.assets.order(did, 'access', account)
    }
  } else {
    ;({ agreementId } = argv)
  }

  logger.info(
    chalk.dim(`Downloading asset: ${did} with agreement id: ${agreementId}`)
  )

  if (password) {
    const key = await nvm.assets.consumeProof(agreementId, did, account)
    console.log(`Got password ${Buffer.from(key as any, 'hex').toString()}`)
  } else {
    const path = await nvm.assets.consume(
      agreementId,
      did,
      account,
      argv.path,
      argv.fileIndex
    )
    logger.info(chalk.dim(`Files downloaded to: ${path}`))
  }

  return StatusCodes.OK
}
