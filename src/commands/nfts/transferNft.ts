import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { Constants, StatusCodes, loadToken } from '../../utils'
import chalk from 'chalk'
import { getAssetPriceFromDDOByService } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from 'log4js'
import { Account } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'
import BigNumber from '@nevermined-io/nevermined-sdk-js/dist/node/utils/BigNumber'

export const transferNft = async (
  nvm: Nevermined,
  userAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, agreementId } = argv

  const token = await loadToken(nvm, config, verbose)

  logger.debug(
    chalk.dim(`Executing agreement: '${chalk.whiteBright(agreementId)}'`)
  )

  let agreementData
  try {
    agreementData = await nvm.keeper.agreementStoreManager.getAgreement(
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
  logger.trace(
    chalk.dim(
      `Agreement Data: '${chalk.whiteBright(JSON.stringify(agreementData))}'`
    )
  )

  await nvm.keeper.conditionStoreManager.getCondition(
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

  const price = BigNumber.formatUnits(
    getAssetPriceFromDDOByService(ddo, 'nft-sales').getTotalPrice(),
    decimals
  )

  logger.info(
    chalk.dim(`Price ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  let isSuccessfulTransfer = false

  if (argv.nftType === '721') {
    logger.info(
      chalk.dim(`Transferring NFT (ERC-721) '${chalk.whiteBright(ddo.id)}' ...`)
    )
    // await nvm.nfts.transfer721(agreementId, ddo.id, userAccount)
    isSuccessfulTransfer = await nvm.nfts721.transferForDelegate(
      agreementId,
      sellerAddress,
      buyerAddress,
      BigNumber.from(1),
      721
    )      

  } else {
    // ERC-1155
    logger.info(
      chalk.dim(
        `Transferring NFT (ERC-1155) '${chalk.whiteBright(ddo.id)}' ...`
      )
    )
    isSuccessfulTransfer = await nvm.nfts1155.transferForDelegate(
      agreementId,
      sellerAddress,
      buyerAddress,
      argv.amount,
      1155
    )
  }

  if (!isSuccessfulTransfer) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Problem executing 'transferForDelegate' through the Nevermined Node`
    }
  }   

  logger.info(chalk.dim('Transfer done!'))
  return { status: StatusCodes.OK }
}
