import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ServiceMetadata } from '@nevermined-io/nevermined-sdk-js/dist/node/ddo/Service'
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
  const { verbose, network, query, json, onlyMetadata } = argv

  logger.info(chalk.dim(`Search using query: ${chalk.green(query)}`))

  const queryResults = await nvm.assets.search(query, argv.offset, argv.page)
  let metadataResult

  if (onlyMetadata) {
    metadataResult = {
      page: queryResults.page,
      totalPages: queryResults.page,
      totalResults: queryResults.totalResults,
      results: queryResults.results.map((ddo) => {
        const service: ServiceMetadata = ddo.findServiceByType(
          'metadata'
        ) as ServiceMetadata
        service.attributes.encryptedFiles = ''
        return service
      })
    }
  }

  if (!json) printSearchResult(queryResults, logger)

  return {
    status: StatusCodes.OK,
    results: onlyMetadata
      ? JSON.stringify(metadataResult)
      : JSON.stringify(queryResults)
  }
}
