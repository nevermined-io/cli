import { Account, BigNumber, getAssetPriceFromDDOByService, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { Constants, StatusCodes, loadToken, getNFTAddressFromInput } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const orderNft = async (
  nvm: Nevermined,
  buyerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, did } = argv

  logger.info(chalk.dim(`Ordering DID: '${chalk.whiteBright(did)}'!`))

  const token = await loadToken(nvm, config, verbose)

  const ddo = await nvm.assets.resolve(did)

  logger.debug(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))
  logger.debug(chalk.dim(`Buyer: '${chalk.whiteBright(buyerAccount.getId())}'`))

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals
  const symbol = token !== null ? await token.symbol() : config.nativeToken

  const price = BigNumber.formatUnits(
    getAssetPriceFromDDOByService(ddo, 'nft-sales').getTotalPrice(),
    decimals
  )

  logger.info(
    chalk.dim(`Price: ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  const nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales')

  let agreementId = ''
  if (argv.nftType == 721) {
    await nvm.contracts.loadNft721(nftAddress!)
    agreementId = await nvm.nfts721.order(did, buyerAccount)
  } else {
    await nvm.contracts.loadNft1155(nftAddress!)
    agreementId = await nvm.nfts1155.order(did, argv.amount, buyerAccount)
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
