import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const retireDID = async (
  nvmApp: NvmApp,
  _account: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(chalk.dim(`Retiring the asset: ${did}`))

  let ddo = await nvmApp.sdk.assets.resolve(did)

  if (!ddo || ddo.id! !== did) {
    logger.warn('Asset not found')
    return {
      status: StatusCodes.OK
    }
  }

  await nvmApp.sdk.assets.retire(did)

  ddo = await nvmApp.sdk.assets.resolve(did)

  if (!ddo) {
    logger.info(chalk.dim('Asset retired'))
    return {
      status: StatusCodes.OK
    }
  }

  return {
    status: StatusCodes.ERROR,
    errorMessage: 'Error retiring asset'
  }
}
