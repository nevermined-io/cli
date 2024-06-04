import { DDO, NvmAccount, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const orderPlan = async (
  nvmApp: NvmApp,
  _buyerAccount: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {

  const { did } = argv
  logger.info(chalk.dim(`Ordering Plan: '${chalk.whiteBright(argv.did)}'`))

  let ddo: DDO
  try {
    ddo = await nvmApp.sdk.assets.resolve(did)
    if (!ddo || ddo.id! !== did) {
      logger.warn('Asset not found')
      return {
        status: StatusCodes.DID_NOT_FOUND,
        errorMessage: 'Asset not found'
      }
    }
    const salesService = ddo.findServiceByType('nft-sales')
    const numberCredits = argv.numCredits ? argv.numberCredits : DDO.getNftAmountFromService(salesService)
    
    let agreementId: string
    if (!argv.argreementId || !argv.argreementId.startsWith('0x'))  {
      logger.info(chalk.dim(`Ordering plan with ${numberCredits} credits`))
      agreementId = await nvmApp.orderSubscription(did, numberCredits)
      if (!agreementId || !agreementId.startsWith('0x')) {
        logger.warn('Failed to order plan')
        return {
          status: StatusCodes.ERROR,
          errorMessage: 'Failed to order plan'
        }
      }
    } else {
      agreementId = argv.argreementId
    }
    
    const claimResult = await nvmApp.claimSubscription(agreementId, did, numberCredits)
    if (claimResult) {
      logger.info(chalk.dim(`Plan purchased and claimed succesfully: ${chalk.whiteBright(agreementId)}`))
  
      return { 
        status: StatusCodes.OK, 
        results: JSON.stringify({
          did: argv.did,
          agreementId: agreementId
        })
      }
    } else {
      logger.info(chalk.dim(`There was a problem ordering the plan: '${chalk.whiteBright(argv.did)}'`))
  
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Failed to order plan`
      }
    }  
  } catch (error) {
    logger.error(`Error ordering plan: ${error.message}`)
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Error ordering plan: ${error.message}`
    }
  }

}
