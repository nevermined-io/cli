import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  Constants,
  StatusCodes,
  findAccountOrFirst,
  ConfigEntry,
  loadToken
} from '../../utils'
import chalk from 'chalk'
import { getAssetRewardsFromDDOByService } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from 'log4js'
import { Account } from '@nevermined-io/nevermined-sdk-js'

export const transferNft = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, agreementId, account } = argv

  const token = await loadToken(nvm, config, verbose)

  logger.debug(
    chalk.dim(`Executing agreement: '${chalk.whiteBright(agreementId)}'`)
  )

  const { did, conditionIds } =
    await nvm.keeper.agreementStoreManager.getAgreement(agreementId)
  const { lastUpdatedBy } = await nvm.keeper.conditionStoreManager.getCondition(
    conditionIds[0]
  )

  const ddo = await nvm.assets.resolve(did)

  const accounts = await nvm.accounts.list()
  const sellerAccount = findAccountOrFirst(accounts, account)
  const buyerAccount = new Account(lastUpdatedBy)

  logger.debug(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))
  logger.debug(chalk.dim(`AgreementId: '${chalk.whiteBright(agreementId)}'`))
  logger.debug(
    chalk.dim(`Seller: '${chalk.whiteBright(sellerAccount.getId())}'`)
  )

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : config.nativeToken

  const serviceInDDO = argv.nftType === '721' ? 'nft721-sales' : 'nft-sales'

  const price =
    getAssetRewardsFromDDOByService(ddo, serviceInDDO).getTotalPrice() /
    10 ** decimals

  logger.info(
    chalk.dim(`Price ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  if (argv.nftType === '721') {
    logger.info(
      chalk.dim(`Transferring NFT (ERC-721) '${chalk.whiteBright(ddo.id)}' ...`)
    )
    await nvm.nfts.transfer721(agreementId, ddo.id, sellerAccount)

    logger.info(chalk.dim('Releasing rewards ...'))
    await nvm.nfts.release721Rewards(agreementId, ddo.id, sellerAccount)
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
  return StatusCodes.OK
}
