import { Account, jsonReplacer, NvmApp, SubscriptionType } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const balancePlan = async (
  nvmApp: NvmApp,
  consumerAccount: Account,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv
   
  const userAddress = argv.address ? argv.address : consumerAccount.getId()

  logger.info(
    chalk.dim(`Getting the balance of the account ${userAddress} for the Plan with Did: ${chalk.whiteBright(did)}`)
  )  
 
  const ddo = await nvmApp.sdk.assets.resolve(did)
  const metadata = ddo.findServiceByType('metadata')
  const subscriptionType = metadata.attributes.main.subscription?.subscriptionType
  logger.info(
    chalk.dim(
      `Plan Type: ${chalk.yellowBright(subscriptionType)}`
    )
  )

  const balance = await nvmApp.sdk.nfts1155.balance(did, userAddress)
  logger.debug(`Balance: ${balance}`)
  if (subscriptionType === SubscriptionType.Time) {
    if (balance > 0n) {
      logger.info(
        chalk.dim(`Time plan NOT expired, the ${userAddress} is still a subscriber for the Plan with Did: ${chalk.whiteBright(did)}`)
      )
    } else {
      logger.info(
        chalk.dim(`Time is not a subscriber for the Plan with Did: ${chalk.whiteBright(did)}`)
      )
    }
  } else {
    if (balance > 0n) {
      logger.info(
        chalk.dim(`The ${userAddress} is a subscriber with a balance of ${balance} credits for the Plan with Did: ${chalk.whiteBright(did)}`)
      )
    } else {
      logger.info(
        chalk.dim(`The ${userAddress} has no balance for the Plan with Did: ${chalk.whiteBright(did)}`)
      )
    }  
  }  
  
  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      subscriptionType,
      balance
    }, jsonReplacer)
  }

}
