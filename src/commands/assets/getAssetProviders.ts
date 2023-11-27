import { Account, Nevermined } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const getAssetProviders = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv  

  logger.info(chalk.dim(`Getting providers of asset: ${did}`))

  try {
    const providers = await nvm.keeper.didRegistry.getProviders(did)

    providers.forEach((_provider: string) => {
      
      logger.info(
        chalk.dim(
          `Provider address: ${chalk.green(_provider)}`
        )
      )
    })

    return {
      status: StatusCodes.OK,
      results: JSON.stringify({ did, providers })
    }
    
  } catch (error) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Error getting permissions: ${error.message}`
    }
  }

}
