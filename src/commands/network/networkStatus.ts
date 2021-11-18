import { StatusCodes, config, loadNevermined, ConfigEntry } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import {
  PlatformTechStatus
} from '@nevermined-io/nevermined-sdk-js/dist/node/nevermined/Versions'


export const networkStatus = async (
  argv: any,
  configEntry: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network } = argv

  const { nvm } = await loadNevermined(configEntry, network, verbose)

  const platformVersions = await nvm.versions.get()

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(
    chalk.dim(
      `Loading information from network '${chalk.whiteBright(network)}:'\n`
    )
  )

  logger.info(
    chalk.dim(` Network Id ${chalk.bgBlue(await nvm.keeper.getNetworkId())}`)
  )
  logger.info(
    chalk.dim(
      ` Network Name ${chalk.yellow(await nvm.keeper.getNetworkName())}`
    )
  )
  logger.info('')

  // Contracts
  logger.info(chalk.dim(`${chalk.whiteBright('Contracts')}:`))
  logger.info(
    chalk.dim(
      `  Contracts Version ${chalk.bgBlue(
        await platformVersions.sdk.keeperVersion
      )}`
    )
  )
  logger.info(chalk.dim(`  URL: ${chalk.yellow(configEntry.nvm.nodeUri)}`))

  Object.keys(platformVersions.sdk.contracts || {}).forEach((_name) => {
    logger.info(
      chalk.dim(
        `  ${_name} with address ${chalk.yellow(
          platformVersions.sdk.contracts![_name]
        )}`
      )
    )
  })

  // Gateway
  logger.info('')
  logger.info(chalk.dim(`${chalk.whiteBright('Gateway')}:`))
  logger.info(chalk.dim(`  URL: ${chalk.yellow(configEntry.nvm.gatewayUri)}`))
  if (platformVersions.gateway.status === PlatformTechStatus.Working)
    logger.info(
      chalk.dim(`  Status: ${chalk.bgGreen(platformVersions.gateway.status)}`)
    )
  else
    logger.info(
      chalk.dim(`  Status: ${chalk.bgRed(platformVersions.gateway.status)}`)
    )
  logger.info(
    chalk.dim(
      `  Version ${chalk.bgBlue(await platformVersions.gateway.version)}`
    )
  )
  // TODO: Get Gateway Address from Gateway versions info
  logger.info(
    chalk.dim(`  Address ${chalk.bgBlue(configEntry.nvm.gatewayAddress)}`)
  )

  // Metadata API
  logger.info('')
  logger.info(chalk.dim(`${chalk.whiteBright('Metadata API')}:`))
  logger.info(chalk.dim(`  URL: ${chalk.yellow(configEntry.nvm.metadataUri)}`))
  if (platformVersions.metadata.status === PlatformTechStatus.Working)
    logger.info(
      chalk.dim(`  Status: ${chalk.bgGreen(platformVersions.metadata.status)}`)
    )
  else
    logger.info(
      chalk.dim(`  Status: ${chalk.bgRed(platformVersions.metadata.status)}`)
    )
  logger.info(
    chalk.dim(
      `  Version ${chalk.bgBlue(await platformVersions.metadata.version)}`
    )
  )

  // Faucet
  logger.info('')
  logger.info(chalk.dim(`${chalk.whiteBright('Faucet')}:`))
  logger.info(chalk.dim(`  URL: ${chalk.yellow(configEntry.nvm.faucetUri)}`))

  logger.info('')
  logger.info(chalk.dim(`${chalk.whiteBright('Validations')}:`))

  // Contracts Versions are the same in the Gateway and SDK
  if (
    platformVersions.sdk.keeperVersion ===
    platformVersions.gateway.keeperVersion
  )
    logger.info(
      chalk.dim(
        `SDK and Gateway contract versions are the same: ${chalk.bgGreen(
          platformVersions.sdk.keeperVersion
        )}`
      )
    )
  else
    logger.warn(
      chalk.dim(
        `SDK and Gateway contract versions are NOT the same: ${chalk.bgYellow(
          platformVersions.sdk.keeperVersion
        )} != ${chalk.bgYellow(platformVersions.gateway.keeperVersion)}`
      )
    )

  // Contract Addresses are the same
  let errorContractsMatching = false
  Object.keys(platformVersions.sdk.contracts || {}).forEach((_name) => {
    if (!platformVersions.sdk.contracts![_name]) {
      logger.warn(
        chalk.yellow(`Contract ${_name} not existing in SDK configuration`)
      )
      errorContractsMatching = true
    } else if (!platformVersions.gateway.contracts![_name]) {
      logger.warn(
        chalk.yellow(`Contract ${_name} not existing in Gateway configuration`)
      )
      errorContractsMatching = true
    } else {
      logger.trace(
        `Comparing Contract ${_name}: ${platformVersions.sdk.contracts![
          _name
        ].toLocaleLowerCase()} - ${platformVersions.gateway.contracts![
          _name
        ].toLocaleLowerCase()}`
      )

      if (
        platformVersions.sdk.contracts![_name].toLocaleLowerCase() !=
        platformVersions.gateway.contracts![_name].toLowerCase()
      ) {
        logger.warn(
          chalk.dim(
            `Addresses doesn't match for contract ${_name}: ${chalk.bgYellow(
              platformVersions.sdk.contracts![_name].toLocaleLowerCase()
            )} != ${chalk.bgYellow(
              platformVersions.gateway.contracts![_name].toLocaleLowerCase()
            )}`
          )
        )
        errorContractsMatching = true
      }
    }
  })

  if (errorContractsMatching)
    logger.error(
      chalk.red(
        'Not all contract addresses match between the SDK and the Gateway'
      )
    )
  else logger.info(chalk.green('SDK and Gateway contract addresses math'))

  // TODO: The Gateway provider address and the `GATEWAY_ADDRESS` env variable are the same

  logger.info('\n')

  return StatusCodes.OK
}
