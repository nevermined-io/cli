import { Account, Nevermined } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const revokeAssetProvider = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did, providerAddress } = argv  

  logger.info(chalk.dim(`Revoke provider permissions to address ${providerAddress} in asset: ${did}`))

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))
  
  try {
    await nvm.keeper.didRegistry.removeProvider(did, providerAddress, account.getId())
    logger.info(
      chalk.dim(`Permissions revoked!`)
    )
  } catch (error) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Error revoking permissions: ${error.message}`
    }
  }

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({ did, providerAddress })
  }
}
