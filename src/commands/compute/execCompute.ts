import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const execCompute = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  let agreementId


  if (!argv.agreementId) {
    logger.info(chalk.dim(`Ordering asset: ${did}`))
    agreementId = await nvm.assets.order(did, 'compute', account)
  } else {
    agreementId = argv.agreementId
  }

  logger.info(
    chalk.dim(`Executing asset: ${did} with agreement id: ${agreementId}`)
  )

  ///////////////////////////////////////////////
  //////// TODO :                     ///////////
  //////// INTEGRATE COMPUTE SDK HERE ///////////
  ///////////////////////////////////////////////





  const jobId = 'hey sucker!'

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did,
      agreementId,
      jobId
    })
  }
}
