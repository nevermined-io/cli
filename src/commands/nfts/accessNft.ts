import { NvmAccount, NFTsBaseApi, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const accessNft = async (
  nvmApp: NvmApp,
  consumerAccount: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(
    chalk.dim(`Access & download NFT associated to ${chalk.whiteBright(did)}`)
  )

  const ddo = await nvmApp.sdk.assets.resolve(did)  
  const nftType = Number(argv.nftType)

  let isHolder = false
  let nftAddress = ''

  try {
    nftAddress = NFTsBaseApi.getNFTContractAddress(ddo) as string  
  } catch {    
    nftAddress = nvmApp.sdk.keeper.nftUpgradeable.address
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
  logger.debug(`NFT ERC type: ${nftType}`)

  if (nftType === 721) {

    const nft = await nvmApp.sdk.contracts.loadNft721(nftAddress)
    const balance = await nft.balanceOf(consumerAccount)
    isHolder = balance > 0n

  } else {
    logger.info(`Checking balance`)
    
    const nftContract = await nvmApp.sdk.contracts.loadNft1155(nftAddress)

    const balance = await nftContract.balance(ddo.shortId(), consumerAccount.getId())
    isHolder = balance > 0n
  }
  
  logger.debug(`Is user holder? ${isHolder}`)
  

  if (!isHolder) {
    logger.info(`Not owner of the NFT, trying to claim it`)
    logger.debug(`Using AgreementId: ${agreementId}`)
    logger.debug(`Claiming NFT (ERC-${nftType})`)   

    let isSuccessfulTransfer = false
    if (nftType === 721)      
      isSuccessfulTransfer = await nvmApp.sdk.nfts721.claim(agreementId, seller, consumerAccount.getId())      
    else
      isSuccessfulTransfer = await nvmApp.sdk.nfts1155.claim(agreementId, seller, consumerAccount.getId(), 1n)
    
      
    
    if (!isSuccessfulTransfer) {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Problem executing 'transferForDelegate' through the Nevermined Node`
      }
    }
    
    logger.info(`NFT Access request through the Nevermined Node sucessfully`)
  }

  let isSuccessful = false 
  if (argv.nftType === 721)
    isSuccessful = await nvmApp.sdk.nfts721.access(
      did,
      consumerAccount,
      destination,
      undefined,
      agreementId
    )
  else    {
    logger.debug(`Trying to access NFT-1155`)
    isSuccessful = await nvmApp.sdk.nfts1155.access(
      did,
      consumerAccount,
      destination,
      undefined,
      agreementId
    )
  }


  if (isSuccessful) {
    logger.info(
      chalk.dim(`File Assets downloaded to: ${chalk.whiteBright(destination)}`)
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
