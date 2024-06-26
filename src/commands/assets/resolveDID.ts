import { ExecutionOutput } from '../../models/ExecutionOutput'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const resolveDID = async (
  nvmApp: NvmApp,
  _account: NvmAccount,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(chalk.dim(`Resolving the asset: ${chalk.green(did)}`))

  logger.info(
    chalk.dim(`Using DIDRegistry: ${await nvmApp.sdk.keeper.didRegistry.address}`)
  )
  const onchainInfo: any = await nvmApp.sdk.keeper.didRegistry.getDIDRegister(did)

  logger.info(
    chalk.dim(
      `\n====== ${chalk.whiteBright(
        'On-Chain information on DIDRegistry'
      )} ======`
    )
  )
  logger.info(chalk.dim(`Owner: ${chalk.whiteBright(onchainInfo.owner)}`))
  logger.info(
    chalk.dim(`Last Checksum: ${chalk.whiteBright(onchainInfo.lastChecksum)}`)
  )
  logger.info(chalk.dim(`URL: ${chalk.yellowBright(onchainInfo.url)}`))
  logger.info(
    chalk.dim(
      `Last Updated by: ${chalk.whiteBright(onchainInfo.lastUpdatedBy)}`
    )
  )
  logger.info(
    chalk.dim(
      `Block number updated: ${chalk.whiteBright(
        onchainInfo.blockNumberUpdated
      )}`
    )
  )
  logger.info(
    chalk.dim(
      `Providers: ${chalk.whiteBright(JSON.stringify(onchainInfo.providers))}`
    )
  )
  logger.info(
    chalk.dim(`NFT Supply: ${chalk.whiteBright(onchainInfo.nftSupply)}`)
  )
  logger.info(chalk.dim(`Mint cap: ${chalk.whiteBright(onchainInfo.mintCap)}`))
  logger.info(
    chalk.dim(`Royalties: ${chalk.whiteBright(onchainInfo.royalties)}`)
  )
  logger.info('\n')

  let ddo
  try {
    ddo = await nvmApp.sdk.assets.resolve(did)
    if (!ddo || ddo.id! !== did) {
      logger.warn('Asset not found')
      return {
        status: StatusCodes.DID_NOT_FOUND,
        errorMessage: 'Asset not found'
      }
    }
    logger.info(chalk.dim(`${chalk.bgGreen('✅')} DID found and DDO resolved`))
    logger.debug(ddo)
  } catch {
    logger.warn('Asset not found')
    return {
      status: StatusCodes.DID_NOT_FOUND,
      errorMessage: 'Asset not found'
    }
  }

  // Check if Nevermined Node is a provider
  const isProvider = await nvmApp.sdk.keeper.didRegistry.isDIDProvider(
    ddo.id,
    config.nvm.neverminedNodeAddress || ''
  )

  if (!isProvider) {
    logger.warn(
      chalk.dim(
        ` ${chalk.bgRed('WARNING :')} The Nevermined Node with address ${
          config.nvm.neverminedNodeAddress
        } ${chalk.bgRed(
          'is not listed as a provider'
        )} of this asset. This could cause problems during the purchase process\n\n`
      )
    )
  } else {
    logger.info(
      chalk.dim(
        `${chalk.bgGreen('✅')} The Nevermined Node with address ${
          config.nvm.neverminedNodeAddress
        } is a provider of the asset\n\n`
      )
    )
  }

  logger.info(chalk.yellowBright(`Metadata:`))
  logger.info(
    JSON.stringify(
      ddo.findServiceByType('metadata').attributes,
      undefined,
      2
    )
  )
  logger.info(`\n`)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(ddo)
  }
}
