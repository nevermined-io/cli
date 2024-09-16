import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import {
  StatusCodes,
} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const revokeApiKey = async (
  _nvmApp: NvmApp,
  _publisherAccount: NvmAccount,
  argv: any,
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

  logger.info(chalk.dim(`Revoking API Keys ...`))

  const options = {
    method: 'DELETE',
    headers: {
      'Accept': '*/*',
      'Authorization': `Bearer ${argv.hash}`
    }
  }

  logger.debug(`${NVM_BACKEND_URL}/api/v1/api-keys`)
  logger.debug(JSON.stringify(options))
  const _result = await fetch(`${NVM_BACKEND_URL}/api/v1/api-keys`, options)

  if (_result.status !== 200 && _result.status !== 201) {
    logger.error(`Error revoking NVM API Key: ${_result.statusText}`)
    logger.error(await _result.text())
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Error revoking NVM API Key: ${_result.statusText}`
    }
  }
    
  logger.info(chalk.green(`NVM API Key revoked`))  
  
  return {
    status: StatusCodes.OK    
  }
}
