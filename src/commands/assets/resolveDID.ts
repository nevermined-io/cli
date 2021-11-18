import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

export const resolveDID = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did } = argv

  logger.info(chalk.dim(`Resolving the asset: ${did}`))

  const ddo = await nvm.assets.resolve(did)

  if (!ddo) {
    logger.warn('Asset not found')
    return StatusCodes.DID_NOT_FOUND
  }

  logger.info(chalk.dim('DID found and DDOresolved'))
  logger.debug(ddo)

  return StatusCodes.OK
}
