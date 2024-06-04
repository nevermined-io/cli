import { NvmAccount, DID, NvmApp } from '@nevermined-io/sdk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import chalk from 'chalk'

export const encodeDID = async (
  _nvmApp: NvmApp,
  _account: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {

  const { did } = argv

  logger.info(chalk.dim(`Encoding DID: ${chalk.whiteBright(did)}`))
  
  const didInstance = DID.parse(did)
  const encodedDID = didInstance.getEncoded()

  logger.info(chalk.dim(`DID Encoded: ${chalk.greenBright(encodedDID)}`))

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did,
      encodedDID
    })
  }
}
