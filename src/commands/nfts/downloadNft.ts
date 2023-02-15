import { Account, Nevermined, NFTsBaseApi } from '@nevermined-io/sdk'
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
  const { did, agreementId, nftType } = argv

  const destination = argv.destination.substring(argv.destination.length - 1) === '/' ?
    argv.destination :
    `${argv.destination}/`

  logger.info(
    chalk.dim(`Downloading NFT associated to ${chalk.whiteBright(did)}`)
  )
  logger.info(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))

  console.debug(chalk.dim(`Using account: '${consumerAccount.getId()}'`))

  const ddo = await nvm.assets.resolve(did)

  const nftAddress = NFTsBaseApi.getNFTContractAddress(ddo) as string

  if (nftType == 721) {
    await nvm.contracts.loadNft721(nftAddress)
    await nvm.nfts721.access(
      did,
      consumerAccount,
      destination,
      undefined,
      agreementId
    )
  } else {
    await nvm.contracts.loadNft1155(nftAddress)
    await nvm.nfts1155.access(
      did,
      consumerAccount,
      destination,
      undefined,
      agreementId
    )
  }

  logger.info(
    chalk.dim(`NFT Assets downloaded to: ${chalk.whiteBright(destination)}`)
  )

  return {
    status: StatusCodes.OK
  }
}
