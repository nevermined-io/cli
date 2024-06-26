import { NvmAccount, DDO, NvmApp, formatUnits } from '@nevermined-io/sdk'
import { Constants, StatusCodes, loadToken, getNFTAddressFromInput } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const claimNft = async (
  nvmApp: NvmApp,
  userAccount: NvmAccount,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, agreementId } = argv

  const nftType = Number(argv.nftType)
  
  const token = await loadToken(nvmApp.sdk, config, verbose)

  logger.info(
    chalk.dim(`Claiming NFT order by agreement: '${chalk.whiteBright(agreementId)}'`)
  )

  let agreementData
  try {
    agreementData = await nvmApp.sdk.keeper.agreementStoreManager.getAgreement(
      agreementId
    )
    logger.trace(`Agreement Data = ${JSON.stringify(agreementData)}`)
  } catch (err) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Unable to load Agreement with Id ${agreementId}: ${
        (err as Error).message
      }`
    }
  }
  logger.debug(
    chalk.dim(
      `Agreement Data: '${chalk.whiteBright(JSON.stringify(agreementData))}'`
    )
  )

  if (agreementData.conditionIds.length === 0) {
    logger.error(`Unable to load Agreement with Id ${agreementId}: No conditions found`)
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Unable to load Agreement with Id ${agreementId}: No conditions found`
    }
  }

  await nvmApp.sdk.keeper.conditionStoreManager.getCondition(
    agreementData.conditionIds[0]
  )

  const conditionData = await nvmApp.sdk.keeper.conditionStoreManager.getCondition(
    agreementData.conditionIds[0]
  )
  logger.debug(
    chalk.dim(
      `Lock Condition Id: '${chalk.whiteBright(JSON.stringify(conditionData))}'`
    )
  )

  const ddo = await nvmApp.sdk.assets.resolve(agreementData.did)  
  const buyerAddress = argv.buyerAddress ? argv.buyerAddress : userAccount.getId()
  const sellerAddress = argv.sellerAddress ? argv.sellerAddress : ddo.proof.creator

  logger.debug(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))
  logger.debug(chalk.dim(`AgreementId: '${chalk.whiteBright(agreementId)}'`))
  logger.debug(
    chalk.dim(`Seller: '${chalk.whiteBright(sellerAddress)}'`)
  )
  logger.debug(chalk.dim(`Buyer: '${chalk.whiteBright(buyerAddress)}'`))

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : config.nativeToken

  const price = formatUnits(
    DDO.getAssetPriceFromService(ddo.findServiceByReference('nft-sales')).getTotalPrice(),
    decimals
  )

  logger.info(
    chalk.dim(`Price ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  let isSuccessfulTransfer = false

  if (nftType === 721) {
    logger.debug(
      chalk.dim(`Claiming NFT (ERC-721) associated to asset: '${chalk.whiteBright(ddo.id)}' ...`)
    )
    let nftAddress
    try {
      nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales')
      await nvmApp.sdk.contracts.loadNft721(nftAddress!)
    } catch {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `No NFT Contract Address found`
      }
    }    
    isSuccessfulTransfer = await nvmApp.sdk.nfts721.claim(
      agreementId,
      sellerAddress,
      buyerAddress
    )      

  } else {
    // ERC-1155
    logger.info(
      chalk.dim(
        `Claiming NFT (ERC-1155) '${chalk.whiteBright(ddo.id)}' ...`
      )
    )
    isSuccessfulTransfer = await nvmApp.sdk.nfts1155.claim(
      agreementId,
      sellerAddress,
      buyerAddress,
      argv.amount,
      // ddo.id
    )
  }

  if (!isSuccessfulTransfer) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Problem executing 'claim' through the Nevermined Node`
    }
  }   

  logger.info(chalk.dim('Transfer done!'))
  return { status: StatusCodes.OK }
}
