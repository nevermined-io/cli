import {
  StatusCodes,
  findAccountOrFirst,
  loadNevermined,
  ConfigEntry
} from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'

export const downloadNft = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, destination, account } = argv

  logger.info(
    chalk.dim(`Downloading NFT associated to ${chalk.whiteBright(did)}`)
  )
  logger.info(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))

  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  const accounts = await nvm.accounts.list()
  const consumerAccount = findAccountOrFirst(accounts, account)

  console.debug(chalk.dim(`Using account: '${consumerAccount.getId()}'`))

  await nvm.nfts.access(did, consumerAccount, destination)

  logger.info(
    chalk.dim(`NFT Assets downloaded to: ${chalk.whiteBright(destination)}`)
  )

  return StatusCodes.OK
}
