import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, findAccountOrFirst, ConfigEntry } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'

export const downloadNft = async (
  nvm: Nevermined,
  consumerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, destination, agreementId } = argv

  logger.info(
    chalk.dim(`Downloading NFT associated to ${chalk.whiteBright(did)}`)
  )
  logger.info(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))

  console.debug(chalk.dim(`Using account: '${consumerAccount.getId()}'`))

  await nvm.nfts.access(
    did,
    consumerAccount,
    destination,
    undefined,
    agreementId
  )

  logger.info(
    chalk.dim(`NFT Assets downloaded to: ${chalk.whiteBright(destination)}`)
  )

  return StatusCodes.OK
}
