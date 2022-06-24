import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, getNetworksConfig } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const networkList = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  configEntry: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network } = argv

  logger.info(chalk.dim(`Nevermined pre-configured networks:`))

  const networksConfig = getNetworksConfig()
  const networks = Object.keys(networksConfig)
  networks.forEach((_key: string) => {
    logger.info(` ${chalk.green(_key)}:`)
    logger.info(`\t${networksConfig[_key].envDescription}`)
    logger.info(
      `\tIs a Production environment? ${chalk.blue(networksConfig[_key].isProduction)}`
    )
    logger.info(`\tGateway: ${chalk.yellow(networksConfig[_key].nvm.gatewayUri)}`)
    logger.info(`\tMarketplace API: ${chalk.yellow(networksConfig[_key].nvm.marketplaceUri)}`)
    logger.info(`\tFaucet: ${chalk.yellow(networksConfig[_key].nvm.faucetUri)}`)
    logger.info('\n')
  })

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(
      networks.map((_key) =>
        JSON.stringify({
          gatewayUri: networksConfig[_key].nvm.gatewayUri,
          marketplaceUri: networksConfig[_key].nvm.marketplaceUri,
          faucetUri: networksConfig[_key].nvm.faucetUri
        })
      )
    )
  }
}
