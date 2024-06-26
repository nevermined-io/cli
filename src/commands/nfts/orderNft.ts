import { NvmAccount, DDO, NvmApp, formatUnits } from '@nevermined-io/sdk'
import { Constants, StatusCodes, loadToken, getNFTAddressFromInput } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const orderNft = async (
  nvmApp: NvmApp,
  buyerAccount: NvmAccount,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, did } = argv

  const nftType = Number(argv.nftType)

  logger.info(chalk.dim(`Ordering DID: '${chalk.whiteBright(did)}'!`))

  const token = await loadToken(nvmApp.sdk, config, verbose)

  const ddo = await nvmApp.sdk.assets.resolve(did)

  logger.debug(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))
  logger.info(chalk.dim(`Buyer: '${chalk.whiteBright(buyerAccount.getId())}'`))
  
  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals
  const symbol = token !== null ? await token.symbol() : config.nativeToken

  
  console.log('decimals', decimals)
  console.log('symbol', symbol)
  const price = formatUnits(
    DDO.getAssetPriceFromService(ddo.findServiceByReference('nft-sales')).getTotalPrice(),
    decimals
  )

  logger.info(
    chalk.dim(`Price: ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  const nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales')
  logger.info(chalk.dim(`Purchase associated to NFT Contract: '${chalk.whiteBright(nftAddress)}'`))

  let agreementId = ''
  if (nftType === 721) {
    await nvmApp.sdk.contracts.loadNft721(nftAddress!)
    agreementId = await nvmApp.sdk.nfts721.order(did, buyerAccount)
  } else {
    await nvmApp.sdk.contracts.loadNft1155(nftAddress!)
    agreementId = await nvmApp.sdk.nfts1155.order(did, argv.amount, buyerAccount)
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
