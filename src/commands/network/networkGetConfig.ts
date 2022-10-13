import {
  ARTIFACTS_PATH,
  loadNeverminedConfigContract,
  StatusCodes
} from '../../utils'
import { Logger } from 'log4js'
import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { ethers } from 'ethers'

export const networkGetConfig = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  configEntry: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network } = argv

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

  try {
    const configContract = loadNeverminedConfigContract(configEntry)

    logger.info(
      chalk.dim(
        ` Network Fee: ${chalk.yellow(
          await configContract.getMarketplaceFee()
        )}`
      )
    )

    logger.info(
      chalk.dim(
        ` Fee Receiver: ${chalk.yellow(await configContract.getFeeReceiver())}`
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
