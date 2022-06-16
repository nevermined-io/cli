import { ExecutionOutput } from '../../models/ExecutionOutput'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

export const resolveDID = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, did } = argv

  logger.info(chalk.dim(`Resolving the asset: ${did}`))

  logger.info(
    chalk.dim(`Using DIDRegistry: ${await nvm.keeper.didRegistry.getAddress()}`)
  )
  const onchainInfo = await nvm.keeper.didRegistry.getDIDRegister(did)

  logger.info(JSON.stringify(onchainInfo))

  let ddo
  try {
    ddo = await nvm.assets.resolve(did)
    if (!ddo || ddo.id! !== did) {
      logger.warn('Asset not found')
      return { 
        status: StatusCodes.DID_NOT_FOUND,
        errorMessage: 'Asset not found'
      }
    }
    logger.info(chalk.dim('DID found and DDO resolved'))
    logger.debug(ddo)
  } catch {
    logger.warn('Asset not found')
    return { 
      status: StatusCodes.DID_NOT_FOUND,
      errorMessage: 'Asset not found'
    }
  }

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

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(ddo)
  }
}
