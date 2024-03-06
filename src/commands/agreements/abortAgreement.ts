import { AccessCondition, Account, ConditionState, DDO, NvmApp, ServiceCommon, ServiceNFTSales, TransferNFT721Condition, TransferNFTCondition } from '@nevermined-io/sdk'
import { StatusCodes, getContractNameFromAddress } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const abortAgreement = async (
  nvmApp: NvmApp,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { agreementId } = argv

  logger.info(
    chalk.dim(
      `Aborting agreement: '${chalk.whiteBright(agreementId)}'`
    )
  )

  const agreementData = await nvmApp.sdk.keeper.agreementStoreManager.getAgreement(
    agreementId
  )
  
  const ddo = await nvmApp.sdk.assets.resolve(agreementData.did)
  logger.info(chalk.dim(`DID: ${chalk.whiteBright(ddo.id)}`))

  const contractName = await getContractNameFromAddress(
    nvmApp.sdk,
    agreementData.templateId
  )

  logger.info(
    chalk.dim(`DID Owner: ${chalk.whiteBright(agreementData.didOwner)}`)
  )

  logger.info(
    chalk.dim(
      `Template Id: ${chalk.whiteBright(
        contractName + ' - ' + agreementData.templateId
      )}`
    )
  )

  const accessConditionId = agreementData.conditionIds.length > 1 ? agreementData.conditionIds[1] : agreementData.conditionIds[0]
  let conditionData = await nvmApp.sdk.keeper.conditionStoreManager.getCondition(accessConditionId)
  logger.debug(`Access condition ${accessConditionId} - state: ${conditionData.state}`)
  logger.debug(`Condition timeout: ${conditionData.timeOut}`)

  let accessCondition: TransferNFTCondition | TransferNFT721Condition | AccessCondition
  if (contractName === 'NFTSalesTemplate')
    accessCondition = nvmApp.sdk.keeper.conditions.transferNftCondition
  else if (contractName === 'NFT721SalesTemplate')
    accessCondition = nvmApp.sdk.keeper.conditions.transferNft721Condition
  else if (contractName === 'AccessTemplate' || contractName === 'EscrowAccessTemplate')
    accessCondition = nvmApp.sdk.keeper.conditions.accessCondition
  else  {
    logger.error(`Contract not supported: ${contractName}`)
    return {
      status: StatusCodes.ERROR,
    }    
  }  

  
  if (conditionData.state === ConditionState.Unfulfilled) {
    const isTimedOut = await nvmApp.sdk.keeper.conditionStoreManager.isConditionTimedOut(accessConditionId)
    logger.debug(`Is condition timed out? ${isTimedOut}`)
    if (isTimedOut) {
      logger.info(chalk.dim(`Condition is timed out. Aborting agreement...`))
      await accessCondition!.abortByTimeOut(accessConditionId, account)
      logger.info(chalk.dim(`Condition aborted by time out`))
    } 
  }

  conditionData = await nvmApp.sdk.keeper.conditionStoreManager.getCondition(accessConditionId)
  if (conditionData.state === ConditionState.Aborted) {
    let service: ServiceCommon
    logger.info(chalk.dim(`Condition is aborted. Distributing payment back...`))
    if (contractName === 'NFTSalesTemplate') {
      service = ddo.findServiceByType('nft-sales')
      const nftAddress = DDO.getNftContractAddressFromService(service as ServiceNFTSales)
      await nvmApp.sdk.contracts.loadNft1155(nftAddress)
      await nvmApp.sdk.nfts1155.releaseRewards(agreementId, ddo.id, service.index, DDO.getNftAmountFromService(service), account)

    } else if (contractName === 'NFT721SalesTemplate') {
      service = ddo.findServiceByType('nft-sales')
      const nftAddress = DDO.getNftContractAddressFromService(service as ServiceNFTSales)
      await nvmApp.sdk.contracts.loadNft721(nftAddress)      
      await nvmApp.sdk.nfts721.releaseRewards(agreementId, ddo.id, account)

    } else {
      
      if (contractName === 'AccessTemplate')
        service = ddo.findServiceByType('access')
      else if (contractName === 'EscrowAccessTemplate')
        service = ddo.findServiceByType('compute')
      else {
        logger.error(`Service not supported for contract ${contractName}`)
        return {
          status: StatusCodes.ERROR,
        }
      }
      const assetPrice = DDO.getAssetPriceFromService(service)
      await nvmApp.sdk.agreements.conditions.releaseReward(
        agreementId,
        assetPrice.getAmounts(),
        assetPrice.getReceivers(),
        agreementData.creator,
        ddo.shortId(),
        assetPrice.getTokenAddress(),
        account,
      )
  
    }
    
    logger.info(chalk.dim(`Payment distributed back`))
  } 
    
  logger.info('\n')

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did: ddo.id,
      didOwner: agreementData.didOwner,
      templateId: agreementData.templateId,
      contractName
    })
  }
}
