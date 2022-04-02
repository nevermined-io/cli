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
  logger.info(ddo)

  // Get Gateway address
  // const gatewayAddress = config.nvm.gatewayAddress
  

  // Check if Gateway is a provider
  const isProvider = await nvm.keeper.didRegistry.isDIDProvider(
    ddo.id,
    config.nvm.gatewayAddress || ''
  )

  if (!isProvider) {
    logger.warn(
      chalk.dim(
        ` ${chalk.bgRed('WARNING :')} The Gateway with address ${
          config.nvm.gatewayAddress
        } ${chalk.bgRed(
          'is not listed as a provider'
        )} of this asset. This could cause problems during the purchase process\n\n`
      )
    )
  } else {
    logger.info(
      chalk.dim(
        `${chalk.bgGreen('✅')} The Gateway with address ${
          config.nvm.gatewayAddress
        } is a provider of the asset\n\n`
      )
    )
  }
  return StatusCodes.OK
}
