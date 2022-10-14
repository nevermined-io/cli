import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
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

export const getAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  let agreementId

  // TODO: Enable DTP when `sdk-dtp` is ready
  // const instanceConfig: InstantiableConfig = {
  //   nevermined: nvm,
  //   config: config.nvm,
  //   artifactsFolder: config.nvm.artifactsFolder
  // }

  // const keyTransfer = await makeKeyTransfer()

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))

  if (!argv.agreementId) {
    logger.info(chalk.dim(`Ordering asset: ${did}`))
    agreementId = await nvm.assets.order(did, 'access', account)
  } else {
    agreementId = argv.agreementId
  }

  logger.info(
    chalk.dim(`Downloading asset: ${did} with agreement id: ${agreementId}`)
  )

  // if (password) {
  //   const dtp = await Dtp.getInstance(instanceConfig, cryptoConfig)
  //   const key = await dtp.consumeProof(agreementId, did, account)
  //   results = Buffer.from(key as any, 'hex').toString()
  //   logger.info(`Got password ${results}`)
  // } else {
  const path = await nvm.assets.consume(
    agreementId,
    did,
    account,
    argv.path,
    argv.fileIndex
  )
  logger.info(chalk.dim(`Files downloaded to: ${path}`))
  const results = path
  // }

  return {
    status: StatusCodes.OK,
    results
  }
}
