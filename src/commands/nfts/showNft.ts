import { Account, DDO, NvmApp, formatUnits, zeroX } from '@nevermined-io/sdk'
import {
  Constants,
  StatusCodes,
  printNftTokenBanner,
  getNFTAddressFromInput,
  loadToken
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'

import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const showNft = async (
  nvmApp: NvmApp,
  userAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, did } = argv

  const token = await loadToken(nvmApp.sdk, config, verbose)

  logger.info(
    chalk.dim(
      `Loading information of NFTs attached to the DID: '${chalk.whiteBright(
        did
      )}'`
    )
  )

  const ddo = await nvmApp.sdk.assets.resolve(did)

  const { url } = (await nvmApp.sdk.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    url: string
  }

  const metadata = ddo.findServiceByType('metadata')

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : config.nativeToken

  logger.info(chalk.dim(`====== ${chalk.whiteBright(ddo.id)} ======`))
  logger.info(chalk.dim(`Metadata Url: ${chalk.whiteBright(url)}`))

  logger.info(
    chalk.dim(
      `NFT ERC Type: ${chalk.yellowBright(metadata.attributes.main.ercType)}`
    )
  )
  logger.info(
    chalk.dim(
      `Nevermined NFT Type: ${chalk.whiteBright(
        metadata.attributes.main.nftType
      )}`
    )
  )

  logger.info(
    chalk.dim(
      `Asset Type: ${chalk.yellowBright(metadata.attributes.main.type)}`
    )
  )
  logger.info(
    chalk.dim(`Name: ${chalk.whiteBright(metadata.attributes.main.name)}`)
  )
  logger.info(
    chalk.dim(`Author: ${chalk.whiteBright(metadata.attributes.main.author)}`)
  )
  logger.info(
    chalk.dim(
      `Data Created: ${chalk.whiteBright(metadata.attributes.main.dateCreated)}`
    )
  )
  logger.info(
    chalk.dim(
      `Number of files attached to it: ${chalk.whiteBright(
        metadata.attributes.main.files?.length || 1
      )}`
    )
  )

  const price = formatUnits(
    DDO.getAssetPriceFromService(ddo.findServiceByType('nft-sales')).getTotalPrice(),
    decimals
  )

  logger.info(
    chalk.dim(
      `Price: ${chalk.yellowBright(price)} ${chalk.whiteBright(symbol)}`
    )
  )

  // TODO: Implement get `_contract` NFT address from DID/DDO
  let nftDetails
  let nftAddress = ''
  // Showing ERC-721 NFT information
  if (metadata.attributes.main.ercType == 721) {
    logger.debug(`Loading NFT-721 details ...`)
    nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales') || nvmApp.sdk.nfts721.getContract.address
    const nft = await nvmApp.sdk.contracts.loadNft721(nftAddress)
     nftDetails = await nft.details(did)

    if (verbose) {
      await printNftTokenBanner(nft.getContract)
    }

    logger.info(
      chalk.dim(
        `====== ${chalk.whiteBright(
          `NFT (ERC-721) Contract: ${nftAddress}`
        )} ======`
      )
    )
    logger.info(
      chalk.dim(`====== ${chalk.whiteBright(zeroX(ddo.shortId()))} ======`)
    )

    const accountBalance = await nft.balanceOf(userAccount)
    logger.info(
      chalk.dim(`Account Balance: ${chalk.whiteBright(accountBalance)}`)
    )

    try {
      const contractTokenUri = await nft.getContract.tokenURI(zeroX(ddo.shortId()))
      logger.info(chalk.dim(`Url: ${chalk.whiteBright(contractTokenUri)}`))
    } catch {
      logger.warn(`Token Id not found`)
    }
  } else {
    nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales') || nvmApp.sdk.nfts1155.getContract.address
    const nft = await nvmApp.sdk.contracts.loadNft1155(nftAddress)
    nftDetails = await nft.details(did)

    const storedDIDRegister: any = await nvmApp.sdk.keeper.didRegistry.getDIDRegister(
      did
    )
    const erc1155Balance = await nvmApp.sdk.keeper.nftUpgradeable.balance(
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
      chalk.dim(
        `Account ${userAccount.getId()} balance: ${chalk.whiteBright(
          erc1155Balance
        )}`
      )
    )
  }

  logger.info(chalk.dim(`Owner: ${chalk.whiteBright(nftDetails.owner)}`))
  logger.info(
    chalk.dim(`Last Checksum: ${chalk.whiteBright(nftDetails.lastChecksum)}`)
  )
  logger.info(
    chalk.dim(`Last Updated By: ${chalk.whiteBright(nftDetails.lastUpdatedBy)}`)
  )
  logger.info(
    chalk.dim(
      `Block Number updated: ${chalk.whiteBright(
        nftDetails.blockNumberUpdated
      )}`
    )
  )

  logger.info('Royalties ====')
  const royaltiesSchemes = ['Standard', 'Curve', 'Legacy']
  logger.info(
    chalk.dim(
      `Royalty Scheme: ${chalk.whiteBright(
        royaltiesSchemes[nftDetails.royaltyScheme]
      )}`
    )
  )

  const royaltiesAmount = nftDetails.royalties / 10000
  logger.info(
    chalk.dim(`Royalties Amount: ${chalk.yellowBright(royaltiesAmount)} %\n`)
  )

  logger.trace(chalk.dim(DDO.serialize(ddo)))

  return { status: StatusCodes.OK }
}
