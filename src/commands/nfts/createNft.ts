import { Account, Nevermined, Nft721 } from '@nevermined-io/nevermined-sdk-js'
import {
  Constants,
  StatusCodes,
  printNftTokenBanner,
  loadToken,
  DEFAULT_ENCRYPTION_METHOD
} from '../../utils'
import chalk from 'chalk'
import { File, MetaDataMain } from '@nevermined-io/nevermined-sdk-js'
import AssetRewards from '@nevermined-io/nevermined-sdk-js/dist/node/models/AssetRewards'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import BigNumber from '@nevermined-io/nevermined-sdk-js/dist/node/utils/BigNumber'
import {
  getRoyaltyAttributes,
  RoyaltyKind
} from '@nevermined-io/nevermined-sdk-js/dist/node/nevermined/Assets'

export const createNft = async (
  nvm: Nevermined,
  creatorAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, metadata } = argv

  logger.info(chalk.dim('Creating NFT ...'))

  if (argv.royalties < 0 || argv.royalties > 100) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Royalties must be between 0 and 100%`
    }
  }

  logger.info(chalk.dim('Loading token'))

  const token = await loadToken(nvm, config, verbose)

  logger.debug(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`))

  let ddoMetadata
  let ddoPrice: BigNumber
  if (!metadata) {
    if (argv.name === '' || argv.author === '' || argv.urls === '') {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `If not metadata file is provided, the following parameters need to be given: name, author, urls, price`
      }
    }

    const decimals =
      token !== null ? await token.decimals() : Constants.ETHDecimals

    ddoPrice = BigNumber.from(argv.price).mul(BigNumber.from(10).pow(decimals))

    logger.trace(`new BigNumber ${BigNumber.from(argv.price)}`)
    logger.trace(`DDO Price: ${ddoPrice}`)
    logger.trace(`to Fixed: ${ddoPrice.toString()}`)

    const _files: File[] = []
    let _fileIndex = 0
    argv.urls.forEach((_url: string) => {
      _files.push({
        index: _fileIndex,
        url: _url,
        contentType: argv.contentType
      })
      _fileIndex++
    })

    ddoMetadata = {
      main: {
        name: argv.name,
        type: 'dataset',
        dateCreated: new Date().toISOString().replace(/\.[0-9]{3}/, ''),
        author: argv.author,
        license: argv.license,
        price: ddoPrice.toString(),
        files: _files
      } as MetaDataMain
    }
  } else {
    ddoMetadata = JSON.parse(fs.readFileSync(metadata).toString())
    ddoPrice = BigNumber.from(ddoMetadata.main.price)
  }

  const royaltyAttributes = getRoyaltyAttributes(
    nvm,
    RoyaltyKind.Standard,
    argv.royalties
  )

  logger.info(chalk.dim('\nCreating Asset ...'))

  let ddo

  if (argv.nftType === '721') {
    const nft: Nft721 = await nvm.contracts.loadNft721(argv.nftAddress)

    if (verbose) {
      await printNftTokenBanner(nft)
    }

    ddo = await nvm.assets.createNft721(
      ddoMetadata,
      creatorAccount,
      // @ts-ignore
      new AssetRewards(creatorAccount.getId(), ddoPrice),
      DEFAULT_ENCRYPTION_METHOD,
      argv.nftAddress,
      token ? token.getAddress() : config.erc20TokenAddress,
      true,
      [config.nvm.gatewayAddress!],
      royaltyAttributes,
      argv.nftMetadata,
      ['nft-sales', 'nft-access'],
      true
    )

  } else {

    ddo = await nvm.assets.createNft(
      ddoMetadata,
      creatorAccount,
      new AssetRewards(creatorAccount.getId(), ddoPrice),
      DEFAULT_ENCRYPTION_METHOD,
      argv.cap,
      [config.nvm.gatewayAddress!],
      BigNumber.from(1),
      royaltyAttributes,
      token ? token.getAddress() : config.erc20TokenAddress,
      argv.nftAddress || nvm.keeper.nftUpgradeable.getAddress(),
      argv.preMint,
      argv.nftMetadata
    )

    const isApproved = await nvm.keeper.nftUpgradeable.isApprovedForAll(
      creatorAccount.getId(),
      config.nvm.gatewayAddress!
    )
    if (!isApproved) {
      const receipt = await nvm.nfts.setApprovalForAll(
        config.nvm.gatewayAddress!,
        true,
        creatorAccount
      )
      logger.trace('Approval receipt:', receipt)
    }
  }

  logger.info('Asset with DID created:', ddo.id)

  const register = (await nvm.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    owner: string
    url: string
  }

  logger.info(
    chalk.dim(
      `Created DID: ${chalk.whiteBright(
        ddo.id
      )} with NFT associated and endpoint: ${chalk.whiteBright(register.url)}`
    )
  )

  logger.info('Now please mint the token on the NFT Contract!')

  return {
    status: StatusCodes.OK
  }
}
