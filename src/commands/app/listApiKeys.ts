import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import {
  StatusCodes,
} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const listApiKeys = async (
  _nvmApp: NvmApp,
  _publisherAccount: NvmAccount,
  _argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {

  const NVM_BACKEND_URL = config.nvm.neverminedBackendUri || undefined
  if (!NVM_BACKEND_URL) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Missing Nevermined Backend URL`
    }
  }

  logger.info(chalk.dim(`Listing NVM API Keys ...`))
  // logger.info(config.nvm.marketplaceAuthToken)
  // logger.info(config.nvm.marketplaceUri)
  // const clientAssertion = await nvmApp.sdk.utils.jwt.generateClientAssertion(publisherAccount)
  // const marketplaceAuthToken = await nvmApp.sdk.services.marketplace.login(clientAssertion)

  const options = {
    method: 'GET',
    headers: {
      'Accept': '*/*',
      'Authorization': `Bearer ${config.nvm.marketplaceAuthToken}`
    }
  }

  logger.debug(`${NVM_BACKEND_URL}/api/v1/api-keys`)
  logger.debug(JSON.stringify(options))
  const _result = await fetch(`${NVM_BACKEND_URL}/api/v1/api-keys`, options)

  if (_result.status !== 200) {
    logger.error(`Error listing NVM API Keys: ${_result.statusText}`)
    logger.error(await _result.text())
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Error listing NVM API Keys: ${_result.statusText}`
    }
  }
  
  const keyResult = await _result.json()
  logger.info(chalk.green(`NVM API Keys found ${keyResult.totalResults}`))
  
  
  keyResult.apiKeys.forEach((key: any) => {
    logger.info('---------------------------------')
    logger.info(chalk.dim(`\tName: ${chalk.yellow(key.name)}`))
    if (key.isActive)
      logger.info(chalk.dim(`\tIs Active?: ${chalk.green('yes')}`))
    else
      logger.info(chalk.dim(`\tIs Active?: ${chalk.red('no')}`))
    
    logger.info(chalk.dim(`\tHash: ${chalk.yellow(key.hash)}`))
    logger.info(chalk.dim(`\tWallet: ${chalk.yellow(key.userWallet)}`))
    logger.info(chalk.dim(`\tCreated/Expires: ${chalk.yellow(key.createdAt)} / ${chalk.yellow(key.expiresAt)}`))    
  })  
  
  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      keyResult
    })
  }
}
