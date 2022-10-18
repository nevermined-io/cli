import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import BigNumber from '@nevermined-io/nevermined-sdk-js/dist/node/utils/BigNumber'

export const accessNft = async (
  nvm: Nevermined,
  consumerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did, destination, agreementId, seller } = argv

  logger.info(
    chalk.dim(`Access & download NFT associated to ${chalk.whiteBright(did)}`)
  )
  logger.info(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))

  logger.debug(chalk.dim(`Using account: '${consumerAccount.getId()}'`))

  logger.debug(chalk.dim(`Using agreementId: ${argv.agreementId}`))

  logger.debug(`Agreement Id: ${agreementId}`)
  logger.debug(`NFT Holder: ${seller}`)
  logger.debug(`NFT Receiver: ${consumerAccount.getId()}`)
  logger.debug(`NFT ERC type: ${argv.nftType}`)

  let ownerOf = ''
  let isOwner = false
  const ddo = await nvm.assets.resolve(did)
  const agreementData = await nvm.agreements.getAgreement(agreementId)
  const nftAddress = nvm.nfts.getNftContractAddress(ddo) as string

  logger.info(`NFT Address ${nftAddress}`)
  logger.debug(`The agreement refers to the DID: ${agreementData.did}`)
  logger.info(`Checking owner`)
  
  if (argv.nftType == 721) {     

    ownerOf = await nvm.nfts.ownerOf(
      agreementData.did,
      nftAddress,
      agreementId
    )

    logger.info(`For the NFT (ERC721) Contract ${nftAddress} the DID ${argv.subscriptionDid} owner is ${ownerOf}`)
    isOwner = ownerOf === consumerAccount.getId()

  } else {
    const balance = await nvm.nfts.balance(
      did,
      consumerAccount
    )
    isOwner = balance.gt(0)
  }
  
  if (!isOwner) {
    logger.info(`Not owner of the NFT, trying transfer`)
    const isSuccessfulTransfer = await nvm.nfts.transferForDelegate(
      agreementId,
      seller,
      consumerAccount.getId(),
      BigNumber.from(1),
      argv.nftType === 721 ? 721 : 1155
    )

    if (!isSuccessfulTransfer) {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Problem executing 'transferForDelegate' through the gateway`
      }
    }
    
    logger.info(`NFT Access request through the gateway sucessfully`)
  }

  const isSuccessful = await nvm.nfts.access(
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
