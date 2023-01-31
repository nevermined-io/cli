import {
  getFeesFromBigNumber,
  loadNeverminedConfigContract,
  StatusCodes
} from '../../utils'
import { Logger } from 'log4js'
import { Account, Nevermined, PlatformTechStatus } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const networkStatus = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  configEntry: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { network } = argv

  const platformVersions = await nvm.utils.versions.get()

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

  try {
    const configContract = loadNeverminedConfigContract(configEntry)
    const networkFee = await configContract.getMarketplaceFee()
    logger.info(
      chalk.dim(
        ` Network Fee: ${chalk.yellow(getFeesFromBigNumber(networkFee))} %`
      )
    )

    logger.info(
      chalk.dim(
        ` Fee Receiver: ${chalk.yellow(await configContract.getFeeReceiver())}`
      )
    )

    logger.info('')
  } catch (error) {
    logger.warn(`Unable to get fee information: ${error}`)
  }

  // Contracts
  logger.info(chalk.dim(`${chalk.whiteBright('Contracts')}:`))
  logger.info(
    chalk.dim(
      `  Contracts Version ${chalk.bgBlue(
        await platformVersions.sdk.keeperVersion
      )}`
    )
  )
  logger.info(chalk.dim(`  URL: ${chalk.yellow(configEntry.nvm.web3ProviderUri)}`))

  Object.keys(platformVersions.sdk.contracts || {}).forEach((_name) => {
    logger.info(
      chalk.dim(
        `  ${_name} with address ${chalk.yellow(
          platformVersions.sdk.contracts![_name]
        )}`
      )
    )
  })

  // Nevermined Node
  logger.info('')
  logger.info(chalk.dim(`${chalk.whiteBright('Nevermined Node')}:`))
  logger.info(chalk.dim(`  URL: ${chalk.yellow(configEntry.nvm.neverminedNodeUri)}`))
  if (platformVersions.node.status === PlatformTechStatus.Working)
    logger.info(
      chalk.dim(`  Status: ${chalk.bgGreen(platformVersions.node.status)}`)
    )
  else
    logger.info(
      chalk.dim(`  Status: ${chalk.bgRed(platformVersions.node.status)}`)
    )
  logger.info(
    chalk.dim(
      `  Version ${chalk.bgBlue(await platformVersions.node.version)}`
    )
  )
  // TODO: Get Nevermined Node Address from Nevermined Node versions info
  logger.info(
    chalk.dim(`  Address ${chalk.bgBlue(configEntry.nvm.neverminedNodeAddress)}`)
  )

  // Metadata API
  logger.info('')
  logger.info(chalk.dim(`${chalk.whiteBright('Metadata API')}:`))
  logger.info(
    chalk.dim(`  URL: ${chalk.yellow(configEntry.nvm.marketplaceUri)}`)
  )
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

  logger.info('')
  logger.info(chalk.dim(`${chalk.whiteBright('Validations')}:`))

  // Contracts Versions are the same in the Nevermined Node and SDK
  if (
    platformVersions.sdk.keeperVersion ===
    platformVersions.node.keeperVersion
  )
    logger.info(
      chalk.dim(
        `SDK and Nevermined Node contract versions are the same: ${chalk.bgGreen(
          platformVersions.sdk.keeperVersion
        )}`
      )
    )
  else
    logger.warn(
      chalk.dim(
        `SDK and Nevermined Node contract versions are NOT the same: ${chalk.bgYellow(
          platformVersions.sdk.keeperVersion
        )} != ${chalk.bgYellow(platformVersions.node.keeperVersion)}`
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
    } else if (!platformVersions.node.contracts![_name]) {
      logger.warn(
        chalk.yellow(`Contract ${_name} not existing in Nevermined Node configuration`)
      )
      errorContractsMatching = true
    } else {
      logger.trace(
        `Comparing Contract ${_name}: ${platformVersions.sdk.contracts![
          _name
        ].toLocaleLowerCase()} - ${platformVersions.node.contracts![
          _name
        ].toLocaleLowerCase()}`
      )

      if (
        platformVersions.sdk.contracts![_name].toLocaleLowerCase() !=
        platformVersions.node.contracts![_name].toLowerCase()
      ) {
        logger.warn(
          chalk.dim(
            `Addresses doesn't match for contract ${_name}: ${chalk.bgYellow(
              platformVersions.sdk.contracts![_name].toLocaleLowerCase()
            )} != ${chalk.bgYellow(
              platformVersions.node.contracts![_name].toLocaleLowerCase()
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
        'Not all contract addresses match between the SDK and the Nevermined Node'
      )
    )
  else logger.info(chalk.green('SDK and Nevermined Node contract addresses math'))

  // TODO: The Nevermined Node provider address and the `NODE_ADDRESS` env variable are the same

  logger.info('\n')
  
  return {
    status: StatusCodes.OK,
    results: JSON.stringify(platformVersions)
  }
}
