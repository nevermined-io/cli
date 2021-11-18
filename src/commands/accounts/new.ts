import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import Web3Provider from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

export const accountsNew = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  logger.info(chalk.dim('Loading accounts ...'))

  const web3 = Web3Provider.getWeb3(config.nvm)
  const newAccount = web3.eth.accounts.create()

  logger.info(`Account address: ${newAccount.address}`)
  logger.info(`Account private key: ${newAccount.privateKey}`)

  return StatusCodes.OK
}
