import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { Constants, StatusCodes, ConfigEntry, loadToken } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { getAssetRewardsFromDDOByService } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import chalk from 'chalk'
import { Logger } from 'log4js'

export const orderNft = async (
  nvm: Nevermined,
  buyerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, did } = argv

  logger.info(chalk.dim(`Ordering DID: '${chalk.whiteBright(did)}'!`))

  const token = await loadToken(nvm, config, verbose)

  const ddo = await nvm.assets.resolve(did)

  logger.debug(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))
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
    chalk.dim(`Price: ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  let agreementId = ''
  if (argv.nftType === '721') {
    logger.info(`Lets order the did`)
    agreementId = await nvm.nfts.order721(did, buyerAccount)
  } else {
    agreementId = await nvm.nfts.order(did, argv.amount, buyerAccount)
  }

  logger.info(
    chalk.dim(
      `NFT Agreement Created: ${chalk.whiteBright(
        agreementId
      )} for DID: ${chalk.whiteBright(ddo.id)} `
    )
  )

  return { status: StatusCodes.OK }
}
