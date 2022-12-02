import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const logsJob = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { agreementId, jobId } = argv

  logger.info(
    chalk.dim(`Fetching logs of jobId: ${jobId} and agreement id: ${agreementId}`)
  )

  try {
    const computeLogs = await nvm.assets.computeLogs(agreementId, jobId, account)

    logger.info(
      chalk.dim(`Logs for ${jobId} fetched correctly`)
    )

    return {
      status: StatusCodes.OK,
      results: JSON.stringify({      
        agreementId,
        jobId,
        computeLogs
      })
    }
  }catch (error) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Unable to fetch the logs of jobId: ${jobId} and agreement id: ${agreementId}: ${
        (error as Error).message
      }`
    }
  }
}