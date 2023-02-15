import { Account, Nevermined, ServiceMetadata } from '@nevermined-io/sdk'
import { StatusCodes, printSearchResult } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const queryAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { query, json, onlyMetadata } = argv

  logger.info(chalk.dim(`Search using query: ${chalk.green(query)}`))

  logger.debug(chalk.dim(`Using Marketplace API: ${config.nvm.marketplaceUri}`))  

  const queryResults = await nvm.search.query({
    offset: argv.offset,
    page: argv.page,
    query: JSON.parse(query) as any,
    sort: {
      created: 'desc'
    }
  })

  let metadataResult

  if (onlyMetadata) {
    metadataResult = {
      page: queryResults.page,
      totalPages: queryResults.totalPages,
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
