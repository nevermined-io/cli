import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const downloadNft = async (
  nvm: Nevermined,
  consumerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did, agreementId } = argv

  const destination = argv.destination.substring(argv.destination.length - 1) === '/' ?
    argv.destination :
    `${argv.destination}/`

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

  return {
    status: StatusCodes.OK
  }
}
