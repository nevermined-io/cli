import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, printSearchResult } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const searchAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, query } = argv

  logger.info(chalk.dim(`Search using query: ${query}`))

  const assets = await nvm.assets.search(query, argv.offset, argv.page)

  printSearchResult(assets, logger)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(assets)
  }
}
