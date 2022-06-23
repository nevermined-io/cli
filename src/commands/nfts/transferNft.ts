import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { Constants, StatusCodes, ConfigEntry, loadToken } from '../../utils'
import chalk from 'chalk'
import { getAssetRewardsFromDDOByService } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from 'log4js'
import { Account } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'

export const transferNft = async (
  nvm: Nevermined,
  sellerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, agreementId } = argv

  const token = await loadToken(nvm, config, verbose)

  logger.debug(
    chalk.dim(`Executing agreement: '${chalk.whiteBright(agreementId)}'`)
  )

  let agreementData
  try {
    agreementData = await nvm.keeper.agreementStoreManager.getAgreement(
      agreementId
    )
    logger.trace(JSON.stringify(agreementData))
  } catch (err) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Unable to load Agreement with Id ${agreementId}: ${
        (err as Error).message
      }`
    }
  }
  logger.trace(
    chalk.dim(
      `Agreement Data: '${chalk.whiteBright(JSON.stringify(agreementData))}'`
    )
  )

  const { lastUpdatedBy } = await nvm.keeper.conditionStoreManager.getCondition(
    agreementData.conditionIds[0]
  )

  const conditionData = await nvm.keeper.conditionStoreManager.getCondition(
    agreementData.conditionIds[0]
  )
  logger.trace(
    chalk.dim(
      `Lock Condition Id: '${chalk.whiteBright(JSON.stringify(conditionData))}'`
    )
  )

  const ddo = await nvm.assets.resolve(agreementData.did)
  const buyerAccount = new Account(argv.buyerAccount)

  logger.debug(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))
  logger.debug(chalk.dim(`AgreementId: '${chalk.whiteBright(agreementId)}'`))
  logger.debug(
    chalk.dim(`Seller: '${chalk.whiteBright(sellerAccount.getId())}'`)
  )
  logger.debug(chalk.dim(`Buyer: '${chalk.whiteBright(buyerAccount.getId())}'`))

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : config.nativeToken

  const serviceInDDO = argv.nftType === '721' ? 'nft721-sales' : 'nft-sales'

  const price = getAssetRewardsFromDDOByService(ddo, serviceInDDO)
    .getTotalPrice()
    .div(10)
    .multipliedBy(decimals)

  logger.info(
    chalk.dim(`Price ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  if (argv.nftType === '721') {
    logger.info(
      chalk.dim(`Transferring NFT (ERC-721) '${chalk.whiteBright(ddo.id)}' ...`)
    )
    await nvm.nfts.transfer721(agreementId, ddo.id, sellerAccount)

    logger.info(chalk.dim('Releasing rewards ...'))
    await nvm.nfts.release721Rewards(
      agreementId,
      ddo.id,
      buyerAccount,
      sellerAccount
    )
  } else {
    // ERC-1155
    logger.info(
      chalk.dim(
        `Transferring NFT (ERC-1155) '${chalk.whiteBright(ddo.id)}' ...`
      )
    )
    await nvm.nfts.transfer(agreementId, ddo.id, argv.amount, sellerAccount)

    logger.info(chalk.dim('Releasing rewards ...'))
    await nvm.nfts.releaseRewards(
      agreementId,
      ddo.id,
      argv.amount,
      buyerAccount,
      sellerAccount
    )
  }

  logger.info(chalk.dim('Transfer done!'))
  return { status: StatusCodes.OK }
}
