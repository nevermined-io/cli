import { Account, NvmApp, OperationResult } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const orderPlan = async (
  nvmApp: NvmApp,
  buyerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {

  logger.info(chalk.dim(`Ordering Plan: '${chalk.whiteBright(argv.did)}'`))

  let orderResult: OperationResult
  if (argv.argreementId && argv.argreementId !== '')
    orderResult = await nvmApp.orderSubscription(argv.did, argv.argreementId)
  else
    orderResult = await nvmApp.orderSubscription(argv.did)
  
  if (orderResult.success) {
    logger.info(chalk.dim(`Plan purchased succesfully: '${chalk.whiteBright(orderResult.agreementId)}'`))

    return { 
      status: StatusCodes.OK, 
      results: JSON.stringify({
        did: argv.did,
        agreementId: orderResult.agreementId
      })
    }
  } else {
    logger.info(chalk.dim(`There was a problem ordering the plan: '${chalk.whiteBright(argv.did)}'`))

    return {
      status: StatusCodes.ERROR,
      errorMessage: `Failed to order plan`
    }
  }

}
