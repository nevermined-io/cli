import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const grantAssetProvider = async (
  nvmApp: NvmApp,
  account: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did, providerAddress } = argv  

  logger.info(chalk.dim(`Granting provider access to address ${providerAddress} in asset: ${did}`))

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))
  
  try {
    await nvmApp.sdk.keeper.didRegistry.addProvider(did, providerAddress, account)
    logger.info(
      chalk.dim(`Permissions granted!`)
    )
  } catch (error) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Error granting permissions: ${error.message}`
    }
  }

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({ did, providerAddress })
  }
}
