import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
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

export const downloadAsset = async (
  nvmApp: NvmApp,
  account: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(chalk.dim(`Downloading asset: ${did}`))

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))

  const destination = argv.destination.substring(argv.destination.length - 1) === '/' ?
    argv.destination :
    `${argv.destination}/`

  const path = await nvmApp.sdk.assets.download(
    did,
    account,
    destination,
    argv.fileIndex
  )

  logger.info(chalk.dim(`Files downloaded to: ${path}`))

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({ path })
  }
}
