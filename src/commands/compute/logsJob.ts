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

  ///////////////////////////////////////////////
  //////// TODO :                     ///////////
  //////// INTEGRATE COMPUTE SDK HERE ///////////
  ///////////////////////////////////////////////

  const computeLogs = {}

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({      
      agreementId,
      jobId,
      computeLogs
    })
  }
}
