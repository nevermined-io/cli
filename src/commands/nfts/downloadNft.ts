import { NvmAccount, NFTsBaseApi, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const downloadNft = async (
  nvmApp: NvmApp,
  consumerAccount: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did, agreementId, nftType } = argv

  const destination = argv.destination.substring(argv.destination.length - 1) === '/' ?
    argv.destination :
    `${argv.destination}/`

  logger.info(
    chalk.dim(`Downloading files associated to ${chalk.whiteBright(did)}`)
  )
  logger.info(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))

  console.debug(chalk.dim(`Using account: '${consumerAccount.getId()}'`))

  const ddo = await nvmApp.sdk.assets.resolve(did)

  const nftAddress = NFTsBaseApi.getNFTContractAddress(ddo) as string

  if (nftType == 721) {
    await nvmApp.sdk.contracts.loadNft721(nftAddress)
    await nvmApp.sdk.nfts721.access(
      did,
      consumerAccount,
      destination,
      undefined,
      agreementId
    )
  } else {
    await nvmApp.sdk.contracts.loadNft1155(nftAddress)
    await nvmApp.sdk.nfts1155.access(
      did,
      consumerAccount,
      destination,
      undefined,
      agreementId
    )
  }

  logger.info(
    chalk.dim(`File Assets downloaded to: ${chalk.whiteBright(destination)}`)
  )

  return {
    status: StatusCodes.OK
  }
}
