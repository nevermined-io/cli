import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, ConfigEntry, config } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'

export const networkList = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  configEntry: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network } = argv

  logger.info(chalk.dim(`Nevermined pre-configured networks:`))

  const networks = Object.keys(config)
  networks.forEach((_key: string) => {
    logger.info(chalk.dim(` ${chalk.whiteBright(_key)}:`))
    logger.info(chalk.dim(`   Gateway: ${config[_key].nvm.gatewayUri}`))
    logger.info(
      chalk.dim(`   Marketplace API: ${config[_key].nvm.marketplaceUri}`)
    )
    logger.info(chalk.dim(`   Faucet: ${config[_key].nvm.faucetUri}`))
    logger.info('\n')
  })

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(
      networks.map((_key) =>
        JSON.stringify({
          gatewayUri: config[_key].nvm.gatewayUri,
          marketplaceUri: config[_key].nvm.marketplaceUri,
          faucetUri: config[_key].nvm.faucetUri
        })
      )
    )
  }
}
