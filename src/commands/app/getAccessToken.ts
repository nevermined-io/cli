import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const getAccessToken = async (
  nvmApp: NvmApp,
  _buyerAccount: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {

  const { did } = argv

  logger.info(chalk.dim(`Getting Agent access token for the agent: '${chalk.whiteBright(did)}'`))

  const accessToken = await nvmApp.getServiceAccessToken(did)

  
  if (accessToken.accessToken.length > 0) {
    logger.info(chalk.dim(`JWT Access Token: '${chalk.whiteBright(accessToken.accessToken)}'`))
    logger.info(chalk.dim(`Proxy URL: '${chalk.whiteBright(accessToken.neverminedProxyUri)}'`))

    return { 
      status: StatusCodes.OK, 
      results: JSON.stringify({
        accessToken: accessToken.accessToken,
        proxyUrl: accessToken.neverminedProxyUri
      })
    }
  } else {
    logger.info(chalk.dim(`There was a problem getting the token: '${chalk.whiteBright(argv.did)}'`))
    logger.info(`Is the user a subscriber for the Plan with Did: ${chalk.whiteBright(did)}?`)

    return {
      status: StatusCodes.ERROR,
      errorMessage: `Failed to get the access token`
    }
  }

}
