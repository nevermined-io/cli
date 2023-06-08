import { AccessCondition, Account, ConditionState, Nevermined, ServiceCommon, ServiceNFTSales, TransferNFT721Condition, TransferNFTCondition, getAssetPriceFromService, getNftAmountFromService, getNftContractAddressFromService } from '@nevermined-io/sdk'
import { StatusCodes, getContractNameFromAddress } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const abortAgreement = async (
  nvm: Nevermined,
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

  const agreementData = await nvm.keeper.agreementStoreManager.getAgreement(
    agreementId
  )
  
  const ddo = await nvm.assets.resolve(agreementData.did)
  logger.info(chalk.dim(`DID: ${chalk.whiteBright(ddo.id)}`))

  const contractName = await getContractNameFromAddress(
    nvm,
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
  let conditionData = await nvm.keeper.conditionStoreManager.getCondition(accessConditionId)
  logger.debug(`Access condition ${accessConditionId} - state: ${conditionData.state}`)
  logger.debug(`Condition timeout: ${conditionData.timeOut}`)

  let accessCondition: TransferNFTCondition | TransferNFT721Condition | AccessCondition
  if (contractName === 'NFTSalesTemplate')
    accessCondition = nvm.keeper.conditions.transferNftCondition
  else if (contractName === 'NFT721SalesTemplate')
    accessCondition = nvm.keeper.conditions.transferNft721Condition
  else if (contractName === 'AccessTemplate' || contractName === 'EscrowAccessTemplate')
    accessCondition = nvm.keeper.conditions.accessCondition
  else  {
    logger.error(`Contract not supported: ${contractName}`)
    return {
      status: StatusCodes.ERROR,
    }    
  }  

  
  if (conditionData.state === ConditionState.Unfulfilled) {
    const isTimedOut = await nvm.keeper.conditionStoreManager.isConditionTimedOut(accessConditionId)
    logger.debug(`Is condition timed out? ${isTimedOut}`)
    if (isTimedOut) {
      logger.info(chalk.dim(`Condition is timed out. Aborting agreement...`))
      await accessCondition!.abortByTimeOut(accessConditionId, account)
      logger.info(chalk.dim(`Condition aborted by time out`))
    } 
  }

  conditionData = await nvm.keeper.conditionStoreManager.getCondition(accessConditionId)
  if (conditionData.state === ConditionState.Aborted) {
    let service: ServiceCommon
    logger.info(chalk.dim(`Condition is aborted. Distributing payment back...`))
    if (contractName === 'NFTSalesTemplate') {
      service = ddo.findServiceByType('nft-sales')
      const nftAddress = getNftContractAddressFromService(service as ServiceNFTSales)
      await nvm.contracts.loadNft1155(nftAddress)
      await nvm.nfts1155.releaseRewards(agreementId, ddo.id, getNftAmountFromService(service), account)

    } else if (contractName === 'NFT721SalesTemplate') {
      service = ddo.findServiceByType('nft-sales')
      const nftAddress = getNftContractAddressFromService(service as ServiceNFTSales)
      await nvm.contracts.loadNft721(nftAddress)      
      await nvm.nfts721.releaseRewards(agreementId, ddo.id, account)

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
      const assetPrice = getAssetPriceFromService(service)
      await nvm.agreements.conditions.releaseReward(
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
