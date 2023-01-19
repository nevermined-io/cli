import { Account, BigNumber, Nevermined, NFTsBaseApi, zeroX } from '@nevermined-io/nevermined-sdk-js'
import { loadNFT1155Contract, StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const accessNft = async (
  nvm: Nevermined,
  consumerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(
    chalk.dim(`Access & download NFT associated to ${chalk.whiteBright(did)}`)
  )

  const ddo = await nvm.assets.resolve(did)  
  
  let isHolder = false
  let nftAddress = ''

  try {
    nftAddress = NFTsBaseApi.getNFTContractAddress(ddo) as string  
  } catch {    
    nftAddress = nvm.keeper.nftUpgradeable.address
  }
  
  const seller = argv.seller ? argv.seller : ddo.proof.creator
  const agreementId = argv.agreementId ? argv.agreementId : '0x'

  const destination = argv.destination.substring(argv.destination.length - 1) === '/' ?
    argv.destination :
    `${argv.destination}/`
  
  logger.info(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))
  logger.debug(chalk.dim(`Using account: '${consumerAccount.getId()}'`))
  logger.debug(`NFT Contract Address: ${nftAddress}`)
  logger.debug(`NFT Holder: ${seller}`)
  logger.debug(`NFT Receiver: ${consumerAccount.getId()}`)
  logger.debug(`NFT ERC type: ${argv.nftType}`)

  let nftApi: NFTsBaseApi
  if (argv.nftType == 721) {     
    const nft = await nvm.contracts.loadNft721(nftAddress)
    const balance = await nft.balanceOf(consumerAccount)
    isHolder = balance.gt(0)
    nftApi = nvm.nfts721
  } else {
    logger.info(`Checking balance`)
    const nftContract = loadNFT1155Contract(config, nftAddress)
    const balance = await nftContract.balanceOf(consumerAccount.getId(), zeroX(ddo.shortId()))
    isHolder = balance.gt(0)
    nftApi = nvm.nfts1155
  }
  
  if (!isHolder) {
    logger.info(`Not owner of the NFT, trying transfer`)
    logger.debug(`Using AgreementId: ${agreementId}`)

    const isSuccessfulTransfer = await nftApi.transferForDelegate(
      agreementId,
      seller,
      consumerAccount.getId(),
      BigNumber.from(1),
      argv.nftType === 721 ? 721 : 1155
    )

    if (!isSuccessfulTransfer) {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Problem executing 'transferForDelegate' through the Nevermined Node`
      }
    }
    
    logger.info(`NFT Access request through the Nevermined Node sucessfully`)
  }

  const isSuccessful = await nftApi.access(
    did,
    consumerAccount,
    destination,
    undefined,
    agreementId
  )

  if (isSuccessful) {
    logger.info(
      chalk.dim(`NFT Assets downloaded to: ${chalk.whiteBright(destination)}`)
    )
    return {
      status: StatusCodes.OK,
      results: JSON.stringify({
        destination
      })
    }
  }

  return {
    status: StatusCodes.ERROR,
    errorMessage: `Unable to download assets`
  }
}
