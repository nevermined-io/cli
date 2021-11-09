import {
  Constants,
  StatusCodes,
  loadNevermined,
  loadNftContract,
  printNftTokenBanner,
  ConfigEntry
} from '../../utils'
import { Account, DDO } from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'
import {
  getAssetRewardsFromDDOByService,
  zeroX
} from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from 'log4js'

export const showNft = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, account } = argv

  const { nvm, token } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  console.log(
    chalk.dim(
      `Loading information of NFTs attached to the DID: '${chalk.whiteBright(
        did
      )}'`
    )
  )

  let userAccount
  if (account) userAccount = new Account(account)
  else [userAccount] = await nvm.accounts.list()

  const ddo = await nvm.assets.resolve(did)

  const { url } = (await nvm.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    url: string
  }

  const metadata = ddo.findServiceByType('metadata')

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : config.nativeToken

  logger.info(chalk.dim(`====== ${chalk.whiteBright('Nevermined')} ======`))
  logger.info(chalk.dim(`====== ${chalk.whiteBright(ddo.id)} ======`))
  logger.info(chalk.dim(`Url: ${chalk.whiteBright(url)}`))
  logger.info(
    chalk.dim(`Name: ${chalk.whiteBright(metadata.attributes.main.name)}`)
  )
  logger.info(
    chalk.dim(`Author: ${chalk.whiteBright(metadata.attributes.main.author)}`)
  )
  logger.info(
    chalk.dim(`License: ${chalk.whiteBright(metadata.attributes.main.license)}`)
  )
  logger.info(
    chalk.dim(
      `Files: ${chalk.whiteBright(metadata.attributes.main.files?.length || 1)}`
    )
  )

  logger.info('\n')

  // Showing ERC-721 NFT information
  if (argv.nftAddress != '') {
    const nft = loadNftContract(config, argv.nftAddress)
    if (verbose) {
      await printNftTokenBanner(nft)
    }

    const [contractTokenUri, contractTokenOwner] = await Promise.all([
      nft.methods.tokenURI(zeroX(ddo.shortId())).call(),
      nft.methods.ownerOf(zeroX(ddo.shortId())).call()
    ])

    logger.info(
      chalk.dim(`====== ${chalk.whiteBright('NFT (ERC-721) Contract')} ======`)
    )
    logger.info(
      chalk.dim(`====== ${chalk.whiteBright(zeroX(ddo.shortId()))} ======`)
    )
    logger.info(chalk.dim(`Url: ${chalk.whiteBright(contractTokenUri)}`))
    logger.info(chalk.dim(`Owner: ${chalk.whiteBright(contractTokenOwner)}`))
    const price =
      getAssetRewardsFromDDOByService(ddo, 'nft721-sales').getTotalPrice() /
      10 ** decimals

    logger.info(
      chalk.dim(
        `Price: ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`
      )
    )

    logger.info('\n')
  }

  // Showing ERC-1155 NFT information
  if (argv.show1155) {
    const storedDIDRegister: any = await nvm.keeper.didRegistry.getDIDRegister(
      did
    )
    const erc1155Balance = await nvm.keeper.didRegistry.balance(
      userAccount.getId(),
      did
    )

    logger.info(
      chalk.dim(
        `====== ${chalk.whiteBright('Internal NFT (ERC-1155) Registry')} ======`
      )
    )
    logger.info(
      chalk.dim(
        `Total NFT Supply: ${chalk.whiteBright(storedDIDRegister.nftSupply)}`
      )
    )
    logger.info(
      chalk.dim(`Mint Cap: ${chalk.whiteBright(storedDIDRegister.mintCap)}`)
    )
    logger.info(
      chalk.dim(`Royalties: ${chalk.whiteBright(storedDIDRegister.nftSupply)}`)
    )
    logger.info(
      chalk.dim(
        `Account ${userAccount.getId()} balance: ${chalk.whiteBright(
          erc1155Balance
        )}`
      )
    )

    const price =
      getAssetRewardsFromDDOByService(ddo, 'nft-sales').getTotalPrice() /
      10 ** decimals

    logger.info(
      chalk.dim(
        `Price: ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`
      )
    )
  }

  logger.debug(chalk.dim(DDO.serialize(ddo)))

  return StatusCodes.OK
}
