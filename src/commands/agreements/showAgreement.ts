import { Account, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes, getContractNameFromAddress } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const showAgreement = async (
  nvmApp: NvmApp,
  _account: Account,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { agreementId } = argv

  logger.info(
    chalk.dim(
      `Loading information for agreementId: '${chalk.whiteBright(agreementId)}'`
    )
  )

  const agreementData = await nvmApp.sdk.keeper.agreementStoreManager.getAgreement(
    agreementId
  )

  const { accessConsumer, accessProvider } =
    await nvmApp.sdk.keeper.templates.accessTemplate.getAgreementData(agreementId)

  const ddo = await nvmApp.sdk.assets.resolve(agreementData.did)

  const contractName = await getContractNameFromAddress(
    nvmApp.sdk,
    agreementData.templateId
  )

  logger.info(chalk.dim(`DID: ${chalk.whiteBright(ddo.id)}`))

  logger.info(
    chalk.dim(`DID Owner: ${chalk.whiteBright(agreementData.didOwner)}`)
  )
  logger.info(
    chalk.dim(`Access Consumer: ${chalk.whiteBright(accessConsumer)}`)
  )
  logger.info(
    chalk.dim(`Access Provider: ${chalk.whiteBright(accessProvider)}`)
  )
  logger.info(
    chalk.dim(
      `Template Id: ${chalk.whiteBright(
        contractName + ' - ' + agreementData.templateId
      )}`
    )
  )

  // logger.info(chalk.dim(`Condition Ids:`))
  // await agreementData.conditionIds.map(async (_conditionId, _index) => {
  //   const cond = await nvmApp.sdk.keeper.conditionStoreManager.getCondition(_conditionId)    
  //   logger.info(chalk.dim(`\tCondition Id[${_index}]= ${_conditionId} with status: ${cond.state}. Timeout: ${cond.timeOut} - Timelock: ${cond.timeLock}`))
  // })

  if (contractName === 'NFTAccessTemplate')
    await nvmApp.sdk.keeper.templates.nftAccessTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'NFTSalesTemplate')
    await nvmApp.sdk.keeper.templates.nftSalesTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'AccessTemplate')
    await nvmApp.sdk.keeper.templates.accessTemplate.printAgreementStatus(agreementId)
  else if (contractName === 'DIDSalesTemplate')
    await nvmApp.sdk.keeper.templates.didSalesTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'EscrowComputeExecutionTemplate')
    await nvmApp.sdk.keeper.templates.escrowComputeExecutionTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'NFT721AccessTemplate')
    await nvmApp.sdk.keeper.templates.nft721AccessTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'NFT721SalesTemplate')      
    await nvmApp.sdk.keeper.templates.nft721SalesTemplate.printAgreementStatus(
      agreementId
    )

  logger.info('\n')

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did: ddo.id,
      didOwner: agreementData.didOwner,
      accessConsumer,
      accessProvider,
      templateId: agreementData.templateId,
      contractName
    })
  }
}
