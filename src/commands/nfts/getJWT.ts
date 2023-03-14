import { Account, Nevermined } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const getJWT = async (
  nvm: Nevermined,
  userAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(
    chalk.dim(`Gets JWT Access Token ${chalk.whiteBright(did)}`)
  )

  let ddo
  
  try {
    ddo = await nvm.assets.resolve(did)
    
    const subscriptionToken = await nvm.services.node.getSubscriptionToken(ddo.id, userAccount)
  
    logger.info(
      chalk.dim(`JWT Token: ${chalk.whiteBright(subscriptionToken.accessToken)}`)
    )
    logger.info(
      chalk.dim(`Proxy: ${chalk.whiteBright(subscriptionToken.neverminedProxyUri)}`)
    )

    return {
      status: StatusCodes.OK,
      results: JSON.stringify(subscriptionToken)
    }
  } catch (error) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Error generating JWT: ${(error as Error).message}`
    }
  }





}
