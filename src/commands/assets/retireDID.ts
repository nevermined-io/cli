import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

export const retireDID = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did } = argv

  logger.info(chalk.dim(`Retiring the asset: ${did}`))

  let ddo = await nvm.assets.resolve(did)

  if (!ddo || ddo.id! !== did) {
    logger.warn('Asset not found')
    return StatusCodes.OK
  }

  await nvm.assets.retire(did)

  ddo = await nvm.assets.resolve(did)

  if (!ddo) {
    logger.info(chalk.dim('Asset retired'))
    return StatusCodes.OK
  }

  logger.warn(chalk.dim('Error retiring asset'))
  return StatusCodes.ERROR
}
