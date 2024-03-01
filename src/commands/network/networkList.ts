import { Account, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes, getNetworksConfig } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const networkList = async (
  _nvmApp: NvmApp,
  _account: Account,
  argv: any,
  _configEntry: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { hideInternal } = argv

  logger.info(chalk.dim(`Nevermined pre-configured networks:`))

  const networksConfig = getNetworksConfig()
  const networks = Object.keys(networksConfig)
  networks
    .filter(
      (_key: string) => hideInternal && networksConfig[_key].externalNetwork
    )
    .forEach((_key: string) => {
      logger.info(` ${chalk.green(_key)}:`)
      logger.info(`\t${networksConfig[_key].envDescription}`)
      logger.info(
        `\tIs a Production environment? ${chalk.blue(
          networksConfig[_key].isProduction
        )}`
      )
      logger.info(
        `\n\tWeb3 Provider Uri: ${chalk.yellow(networksConfig[_key].nvm.web3ProviderUri)}`
      )
      logger.info(
        `\tNevermined Node: ${chalk.yellow(networksConfig[_key].nvm.neverminedNodeUri)}`
      )
      logger.info(
        `\tMarketplace API: ${chalk.yellow(
          networksConfig[_key].nvm.marketplaceUri
        )}`
      )      
      logger.info('\n')
    })

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(
      networks.map((_key) =>
        JSON.stringify({
          neverminedNodeUri: networksConfig[_key].nvm.neverminedNodeUri,
          marketplaceUri: networksConfig[_key].nvm.marketplaceUri
        })
      )
    )
  }
}
