import { DDO, Nevermined, Nft721 } from '@nevermined-io/nevermined-sdk-js'
import {
  Constants,
  StatusCodes,
  printNftTokenBanner,
  getNFTAddressFromInput,
  loadToken
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Account } from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'
import {
  getAssetRewardsFromDDOByService,
  zeroX
} from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import BigNumber from '@nevermined-io/nevermined-sdk-js/dist/node/utils/BigNumber'

export const showNft = async (
  nvm: Nevermined,
  userAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, did } = argv

  const token = await loadToken(nvm, config, verbose)

  logger.info(
    chalk.dim(
      `Loading information of NFTs attached to the DID: '${chalk.whiteBright(
        did
      )}'`
    )
  )

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

  // TODO: Implement get `_contract` NFT address from DID/DDO

  let nftAddress = ''
  // Showing ERC-721 NFT information
  if (argv.is721) {
    nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales')
    const nft: Nft721 = await nvm.contracts.loadNft721(nftAddress)

    if (verbose) {
      await printNftTokenBanner(nft)
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
      const contractTokenUri = await nft.contract.tokenURI(zeroX(ddo.shortId()))
      logger.info(chalk.dim(`Url: ${chalk.whiteBright(contractTokenUri)}`))
    } catch {
      logger.warn(`Token Id not found`)
    }

    const price = BigNumber.formatUnits(
      getAssetRewardsFromDDOByService(ddo, 'nft-sales').getTotalPrice(), decimals)

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
    const erc1155Balance = await nvm.keeper.nftUpgradeable.balance(
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

    const price = BigNumber.formatUnits(
      getAssetRewardsFromDDOByService(ddo, 'nft-sales').getTotalPrice(), decimals)
      logger.info(
        chalk.dim(
          `Price (NFT): ${chalk.whiteBright(price)} ${chalk.whiteBright(
            symbol
          )}`
        )
      )
  }

  logger.trace(chalk.dim(DDO.serialize(ddo)))

  return { status: StatusCodes.OK }
}
