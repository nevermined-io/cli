import {
  Constants,
  StatusCodes,
  findAccountOrFirst,
  getConfig,
  loadNevermined,
  loadNftContract,
  printNftTokenBanner
} from '../../utils'
import chalk from 'chalk'
import {
  getAssetRewardsFromDDOByService,
  zeroX
} from '@nevermined-io/nevermined-sdk-js/dist/node/utils'

export const orderNft = async (argv: any): Promise<number> => {
  const { verbose, network, did, buyer } = argv

  console.log(chalk.dim(`Ordering DID: '${chalk.whiteBright(did)}'!`))

  const config = getConfig(network as string)
  const { nvm, token } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  const accounts = await nvm.accounts.list()
  const buyerAccount = findAccountOrFirst(accounts, buyer)

  const nft = loadNftContract(config)
  if (verbose) {
    await printNftTokenBanner(nft)
  }

  const ddo = await nvm.assets.resolve(did)

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))
    console.log(
      chalk.dim(`Buyer: '${chalk.whiteBright(buyerAccount.getId())}'`)
    )
  }

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const price =
    getAssetRewardsFromDDOByService(ddo, 'nft721-sales').getTotalPrice() /
    10 ** decimals
  const symbol = token !== null ? await token.symbol() : config.nativeToken

  console.log(
    chalk.dim(`Price: ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  const agreementId = await nvm.nfts.order721(did, buyerAccount)

  console.log(
    chalk.dim(
      `Agreement '${chalk.whiteBright(
        agreementId
      )}' for did '${chalk.whiteBright(ddo.id)}' created!`
    )
  )

  return StatusCodes.OK
}
