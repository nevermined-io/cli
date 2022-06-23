import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  Constants,
  StatusCodes,
  findAccountOrFirst,
  loadNftContract,
  printNftTokenBanner,
  ConfigEntry,
  loadToken
} from '../../utils'
import chalk from 'chalk'
import { File, MetaDataMain } from '@nevermined-io/nevermined-sdk-js'
import AssetRewards from '@nevermined-io/nevermined-sdk-js/dist/node/models/AssetRewards'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import BigNumber from 'bignumber.js'

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

    ddoPrice = new BigNumber(argv.price).multipliedBy(
      new BigNumber(10).exponentiatedBy(decimals)
    )

    console.log(`new BigNumber ${new BigNumber(argv.price)}`)
    console.log(`DDO Price: ${ddoPrice}`)
    console.log(`to Fixed: ${ddoPrice.toFixed()}`)

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
        price: ddoPrice.toFixed(),
        files: _files
      } as MetaDataMain
    }
  } else {
    ddoMetadata = JSON.parse(fs.readFileSync(metadata).toString())
    ddoPrice = new BigNumber(ddoMetadata.main.price)
  }

  logger.info(chalk.dim('\nCreating Asset ...'))

  let ddo

  if (argv.nftType === '721') {
    const nft = loadNftContract(config, argv.nftAddress)

    if (verbose) {
      await printNftTokenBanner(nft)
    }

    ddo = await nvm.nfts.create721(
      ddoMetadata,
      creatorAccount,
      // @ts-ignore
      new AssetRewards(creatorAccount.getId(), ddoPrice),
      argv.nftAddress,
      token ? token.getAddress() : config.erc20TokenAddress,
      argv.royalties,
      argv.nftMetadata
    )
  } else {
    // erc-1155
    ddo = await nvm.nfts.create(
      ddoMetadata,
      creatorAccount,
      argv.cap,
      argv.royalties,
      // @ts-ignore
      new AssetRewards(creatorAccount.getId(), ddoPrice),
      undefined,
      token ? token.getAddress() : config.erc20TokenAddress,
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
      logger.info('Approval receipt:', receipt)
    }
  }

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
