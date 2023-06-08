import { Account, DID, Nevermined } from '@nevermined-io/sdk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import chalk from 'chalk'

export const decodeDID = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {

  const { encoded } = argv

  logger.info(chalk.dim(`Decoding DID: ${chalk.whiteBright(encoded)}`))
  
  const didInstance = DID.fromEncoded(encoded)  

  logger.info(chalk.dim(`DID Decoded: ${chalk.greenBright(didInstance.getDid())}`))

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      encoded,
      did: didInstance.getDid()
    })
  }
}
