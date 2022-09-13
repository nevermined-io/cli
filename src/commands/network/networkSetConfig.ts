import { StatusCodes } from '../../utils'
import { Logger } from 'log4js'
import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { ConfigEntry } from '../../models/ConfigDefinition'

type GovernanceParams = 'fees' | 'governor'

export const networkSetConfig = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  configEntry: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network } = argv

  logger.info(
    chalk.dim(
      `Updating governance information from network '${chalk.whiteBright(
        network
      )}:'\n`
    )
  )
  let _param: GovernanceParams

  try {
    _param = argv.parameter
  } catch (error) {
    const errorMessage = `Invalid governance 'param' (${argv.param})`
    logger.error(errorMessage)
    return {
      status: StatusCodes.ERROR,
      errorMessage
    }
  }

  try {
    const isGovernor = await nvm.keeper.nvmConfig.isGovernor(account.getId())
    if (!isGovernor) {
      const errorMessage = `The account you are using is not a Governor of the network: ${account.getId()}`
      return {
        status: StatusCodes.ERROR,
        errorMessage
      }
    }

    const functionParams = argv.newValue.split(',')

    if (_param === 'fees') {
      if (functionParams.length != 2) {
        const errorMessage = `You need to pass 2 parameters, the fee and the receiver. Example: ncli network set-config fees 350,0x4569832`
        logger.error(errorMessage)
        return {
          status: StatusCodes.ERROR,
          errorMessage
        }
      }
      logger.info(
        `Setting up Fees ... with values ${JSON.stringify(functionParams)}`
      )
      try {
        await nvm.keeper.nvmConfig.setNetworkFees(
          functionParams[0],
          functionParams[1],
          account
        )
      } catch (error) {
        const errorMessage = `Unable to modify network fees parameter: ${error}`
        logger.error(errorMessage)
        return {
          status: StatusCodes.ERROR,
          errorMessage
        }
      }
    } else if (_param === 'governor') {
      logger.info(`Setting up a new Governor ${argv.newValue}`)
      try {
        await nvm.keeper.nvmConfig.setGovernor(argv.newValue, account)
      } catch (error) {
        const errorMessage = `Unable to modify 'governor' parameter: ${error}`
        logger.error(errorMessage)
        return {
          status: StatusCodes.ERROR,
          errorMessage
        }
      }
    }

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
