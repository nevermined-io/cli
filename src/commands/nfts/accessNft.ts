import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, findAccountOrFirst, ConfigEntry } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'

export const accessNft = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, destination, account, agreementId, seller } =
    argv

  logger.info(
    chalk.dim(`Access & download NFT associated to ${chalk.whiteBright(did)}`)
  )
  logger.info(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))

  const accounts = await nvm.accounts.list()
  const consumerAccount = findAccountOrFirst(accounts, account)

  logger.debug(chalk.dim(`Using account: '${consumerAccount.getId()}'`))

  logger.debug(chalk.dim(`Using agreementId: ${argv.agreementId}`))

  logger.debug(`Agreement Id: ${agreementId}`)
  logger.debug(`NFT Holder: ${seller}`)
  logger.debug(`NFT Receiver: ${consumerAccount.getId()}`)

  const isSuccessfulTransfer = await nvm.nfts.transferForDelegate(
    agreementId,
    seller,
    consumerAccount.getId(),
    1
  )

  if (!isSuccessfulTransfer) {
    logger.warn(
      chalk.dim(`Problem executing 'transferForDelegate' through the gateway`)
    )
    return StatusCodes.ERROR
  }

  logger.info(`NFT Access request through the gateway sucessfully`)

  const isSuccessful = await nvm.nfts.access(
    did,
    consumerAccount,
    destination,
    undefined
  )

  if (isSuccessful) {
    logger.info(
      chalk.dim(`NFT Assets downloaded to: ${chalk.whiteBright(destination)}`)
    )
    return StatusCodes.OK
  }
  logger.warn(chalk.dim(`Unable to download assets`))
  return StatusCodes.ERROR
}
