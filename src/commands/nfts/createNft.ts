import { Account, AssetPrice, getRoyaltyAttributes, Nevermined, NeverminedNFT1155Type, NeverminedNFT721Type, NFTAttributes, RoyaltyKind, ServiceType, BigNumber, zeroX, PublishMetadata, AssetAttributes, MetaDataExternalResource } from '@nevermined-io/sdk'
import {
  StatusCodes,
  printNftTokenBanner,
  loadToken,
  loadNeverminedConfigContract,
  getFeesFromBigNumber
} from '../../utils'
import chalk from 'chalk'
import { MetaDataMain } from '@nevermined-io/sdk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { ethers } from 'ethers'


export const createNft = async (
  nvm: Nevermined,
  creatorAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, metadata } = argv

  const nftType = Number(argv.nftType)

  logger.info(chalk.dim('Creating NFT ...'))

  if (argv.royalties < 0 || argv.royalties > 100) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Royalties must be between 0 and 100%`
    }
  }

  const royaltiesAmount = BigNumber.parseUnits(String(argv.royalties), 4)
  logger.info(`Royalties: ${royaltiesAmount}`)

  logger.info(chalk.dim('Loading token'))

  const token = await loadToken(nvm, config, verbose)

  logger.debug(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`))

  let ddoMetadata
  const ddoPrice = BigNumber.from(argv.price).gt(0)
    ? BigNumber.from(argv.price)
    : BigNumber.from(0)

  if (!metadata) {
    if (argv.name === '' || argv.author === '' || argv.urls === '') {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `If not metadata file is provided, the following parameters need to be given: name, author, urls, price`
      }
    }

    logger.trace(`new BigNumber ${BigNumber.from(argv.price)}`)
    logger.trace(`DDO Price: ${ddoPrice}`)
    logger.trace(`to Fixed: ${ddoPrice.toString()}`)

    const _files: MetaDataExternalResource[] = []
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
        type: argv.type,
        dateCreated: new Date().toISOString().replace(/\.[0-9]{3}/, ''),
        author: argv.author,
        license: argv.license,
        price: ddoPrice.toString(),
        files: _files
      } as MetaDataMain
    }
  } else {
    ddoMetadata = JSON.parse(fs.readFileSync(metadata).toString())
    ddoMetadata.main.dateCreated = new Date().toISOString().replace(/\.[0-9]{3}/, '')
  }

  const royaltyAttributes = getRoyaltyAttributes(
    nvm,
    RoyaltyKind.Standard,
    royaltiesAmount.toNumber()
  )

  const configContract = loadNeverminedConfigContract(config)
  const networkFee = await configContract.getMarketplaceFee()
  const assetPrice = new AssetPrice(creatorAccount.getId(), ddoPrice)
    .setTokenAddress(token ? token.getAddress() : config.erc20TokenAddress)
  if (networkFee.gt(0)) {
    assetPrice.addNetworkFees(
      await configContract.getFeeReceiver(),
      networkFee
    )
    logger.info(`Network Fees: ${getFeesFromBigNumber(networkFee)}`)
  }

  const services: ServiceType[] = argv.services.filter(
    (_key: string) => _key !== '' && _key !== undefined
  )
  if (services.length < 1)  {
    logger.info(`Services not specified, using the default ..`)
    services.push('nft-access')
    services.push('nft-sales')
  }

  const providers: string[] = []
  argv.providers.forEach((_provider: string) => {
    if (ethers.utils.isAddress(_provider)) providers.push(_provider)
  })
  if (config.nvm.neverminedNodeAddress && 
      !providers.includes(config.nvm.neverminedNodeAddress) && 
      ethers.utils.isAddress(config.nvm.neverminedNodeAddress))
    providers.push(config.nvm.neverminedNodeAddress)
  
  logger.info(`Adding Node addresses as asset providers: ${JSON.stringify(providers)}`)

  logger.info(`Attaching services to the asset: ${JSON.stringify(services)}`)

  logger.info(chalk.dim('\nCreating Asset ...'))

  let ddo

  let publishMetadata = PublishMetadata.OnlyMetadataAPI
  if (argv.publishMetadata.toLowerCase() === 'ipfs')
    publishMetadata = PublishMetadata.IPFS  

  if (argv.type) ddoMetadata.main.type = argv.type
  
  const assetAttributes = AssetAttributes.getInstance({
      metadata: ddoMetadata,
      price: assetPrice,
      serviceTypes: services
  })
  let nftAttributes: NFTAttributes
  
  if (nftType === 721) {
    
    const nft721Api = await nvm.contracts.loadNft721(argv.nftAddress)

    if (verbose) {
      await printNftTokenBanner(nft721Api.getContract)
    }

    nftAttributes = NFTAttributes.getNFT721Instance({
      ...assetAttributes,
      ercType: 721,
      nftType: argv.type === 'subscription' ? NeverminedNFT721Type.nft721Subscription: NeverminedNFT721Type.nft721,
      nftContractAddress: argv.nftAddress,
      preMint: argv.preMint,
      providers,
      royaltyAttributes,
      nftMetadataUrl: argv.nftMetadata,
      nftTransfer: argv.transfer,
      isSubscription: argv.type === 'subscription'
    })
    if (argv.subscription)
      nftAttributes = {
        ...nftAttributes,
        duration: argv.duration
      }
    ddo = await nvm.nfts721.create(
        nftAttributes,
        creatorAccount,
        publishMetadata
    )    
    
    const transferCondAddress = nvm.keeper.conditions.transferNft721Condition.address
    logger.debug(`Transfer address? ${transferCondAddress}`)
    const isOperator = await nvm.nfts721.getContract.isOperator(transferCondAddress)
    logger.debug(`Is Transfer NFT721 Operator? ${isOperator}`)

  } else {
    nftAttributes = NFTAttributes.getNFT1155Instance({
      ...assetAttributes,
      ercType: 1155,
      nftType: NeverminedNFT1155Type.nft1155,      
      nftContractAddress: argv.nftAddress || nvm.keeper.nftUpgradeable.getAddress(),
      cap: argv.cap,
      preMint: argv.preMint,
      providers,
      royaltyAttributes,
      nftMetadataUrl: argv.nftMetadata,
      nftTransfer: argv.transfer,
      isSubscription: argv.type === 'subscription' ? argv.duration: 0
    })            
    ddo = await nvm.nfts1155.create(
        nftAttributes,
        creatorAccount,
        publishMetadata
    )

  }

  logger.info('Asset with DID created:', ddo.id)
  logger.info('Using NFT Contract Address:', nftAttributes.nftContractAddress)  

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
  
  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did: ddo.id,
      url: register.url
    })
  }
}
