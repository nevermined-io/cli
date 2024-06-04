import {
  loadNeverminedConfigContract,
  StatusCodes
} from '../../utils'
import { Logger } from 'log4js'
import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const networkGetConfig = async (
  nvmApp: NvmApp,
  _account: NvmAccount,
  argv: any,
  configEntry: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { network } = argv

  logger.info(
    chalk.dim(
      `Loading information from network '${chalk.whiteBright(network)}:'\n`
    )
  )

  logger.info(
    chalk.dim(` Network Id ${chalk.bgBlue(await nvmApp.sdk.keeper.getNetworkId())}`)
  )
  logger.info(
    chalk.dim(
      ` Network Name ${chalk.yellow(await nvmApp.sdk.keeper.getNetworkName())}`
    )
  )
  logger.info('')

  try {
    const configContract = await loadNeverminedConfigContract(nvmApp.sdk, configEntry)

    logger.info(
      chalk.dim(
        ` Network Fee: ${chalk.yellow(
          (await configContract.read.getMarketplaceFee()) as bigint
        )}`
      )
    )

    logger.info(
      chalk.dim(
        ` Fee Receiver: ${chalk.yellow(await configContract.read.getFeeReceiver())}`
      )
    )

    logger.info('')
  } catch (error) {
    const errorMessage = `Unable to get config information: ${error}`
    return {
      status: StatusCodes.ERROR,
      errorMessage
    }
  }

  return {
    status: StatusCodes.OK,
    results: []
  }
}
