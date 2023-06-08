import { Account, Nevermined } from '@nevermined-io/sdk'
import { StatusCodes, getContractNameFromAddress } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const showAgreement = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { agreementId } = argv

  logger.info(
    chalk.dim(
      `Loading information for agreementId: '${chalk.whiteBright(agreementId)}'`
    )
  )

  const agreementData = await nvm.keeper.agreementStoreManager.getAgreement(
    agreementId
  )

  const { accessConsumer, accessProvider } =
    await nvm.keeper.templates.accessTemplate.getAgreementData(agreementId)

  const ddo = await nvm.assets.resolve(agreementData.did)

  const contractName = await getContractNameFromAddress(
    nvm,
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

  logger.info(chalk.dim(`Condition Ids:`))
  await agreementData.conditionIds.forEach(async (_conditionId, _index) => {
    const cond = await nvm.keeper.conditionStoreManager.getCondition(_conditionId)    
    logger.info(chalk.dim(`\tCondition Id[${_index}]= ${_conditionId} with status: ${cond.state}. Timeout: ${cond.timeOut} - Timelock: ${cond.timeLock}`))
  })

  if (contractName === 'NFTAccessTemplate')
    await nvm.keeper.templates.nftAccessTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'NFTSalesTemplate')
    await nvm.keeper.templates.nftSalesTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'AccessTemplate')
    await nvm.keeper.templates.accessTemplate.printAgreementStatus(agreementId)
  else if (contractName === 'DIDSalesTemplate')
    await nvm.keeper.templates.didSalesTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'EscrowComputeExecutionTemplate')
    await nvm.keeper.templates.escrowComputeExecutionTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'NFT721AccessTemplate')
    await nvm.keeper.templates.nft721AccessTemplate.printAgreementStatus(
      agreementId
    )
  else if (contractName === 'NFT721SalesTemplate')
    await nvm.keeper.templates.nft721SalesTemplate.printAgreementStatus(
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
