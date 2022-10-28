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

export const downloadAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(chalk.dim(`Downloading asset: ${did}`))

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))

  const destination = argv.path.substring(argv.path.length - 1) === '/' ?
    argv.path :
    `${argv.path}/`

  const path = await nvm.assets.download(
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
