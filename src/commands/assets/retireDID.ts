import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const retireDID = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, did } = argv

  logger.info(chalk.dim(`Retiring the asset: ${did}`))

  let ddo = await nvm.assets.resolve(did)

  if (!ddo || ddo.id! !== did) {
    logger.warn('Asset not found')
    return {
      status: StatusCodes.OK
    }
  }

  await nvm.assets.retire(did)

  ddo = await nvm.assets.resolve(did)

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
