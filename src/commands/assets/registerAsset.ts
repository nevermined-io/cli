import { NvmAccount, AssetPrice, AssetAttributes, MetaData, MetaDataMain, zeroX, MetaDataExternalResource, ServiceType, NFTAttributes, NeverminedNFT721Type, PublishMetadataOptions, ServiceAttributes, NvmApp } from '@nevermined-io/sdk'
import {
  StatusCodes,
  printTokenBanner,
  loadNeverminedConfigContract,
  getFeesFromBigNumber,
  getExtraInputParams
} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { ethers } from 'ethers'

export const registerAsset = async (
  nvmApp: NvmApp,
  account: NvmAccount,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, metadata, assetType } = argv
  const token = nvmApp.sdk.keeper.token
  

  if (verbose) await printTokenBanner(token)

  logger.info(chalk.dim(`Registering asset (${assetType}) ...`))

  logger.debug(chalk.dim(`Using creator: '${account.getId()}'\n`))

  let ddoMetadata: MetaData

  const serviceTypes: ServiceType[] = []
  if (argv.access === 'both') {
    serviceTypes.push('access')
    serviceTypes.push('nft-access')
  } else if (argv.access === 'direct') {
    serviceTypes.push('access')
  } else if (argv.access === 'subscription') {
    serviceTypes.push('nft-access')
  } else {
    logger.warn('Access method not found, it should be: direct, subscription or both')
    return {
      status: StatusCodes.NOT_IMPLEMENTED,
      errorMessage: 'Invalid access parameter'
    }
  }

  const ddoPrice = BigInt(argv.price) > 0n
    ? BigInt(argv.price)
    : 0n
  logger.debug(`With Price ${ddoPrice}`)


  if (!metadata) {

    const _files: MetaDataExternalResource[] = []
    let _fileIndex = 0

    argv.urls.forEach((_url: string) => {
      _files.push({
        index: _fileIndex,
        url: _url,
        contentType: argv.contentType || 'application/http'
      })
      _fileIndex++
    })
    logger.debug(`We have metadata`)

    ddoMetadata = {
      main: {
        name: argv.name,
        type: assetType,
        dateCreated: new Date().toISOString().replace(/\.[0-9]{3}/, ''),
        author: argv.author,
        license: argv.license,
        tags: argv.tags ? argv.tags.split(',') : [],
        files: _files
      } as MetaDataMain
    }    

    if (assetType === 'algorithm') {
      const containerTokens = argv.cointaer ? argv.container.split(':') : []
      ddoMetadata.main.algorithm = {
        language: argv.language,
        version: '0.1',
        entrypoint: argv.entrypoint,
        requirements: {
          container: {
            image: containerTokens[0],
            tag: containerTokens.length > 1 ? containerTokens[1] : 'latest'
          }
        }
      }
    } else if (assetType === 'service') {
      const urls = argv.urls as string[]
      const endpoints = urls.map( (url: string) => {         
        return { '*': url }
      })
      
      ddoMetadata.main.webService = {
        type: 'Other',
        endpoints
      }
      if (argv.authToken !== '') {
        ddoMetadata.main.webService.internalAttributes = {
          authentication: { type: 'oauth', token: argv.authToken},
          headers: [{'Authorization': `Bearer ${argv.authToken}`}]
        }
      }
    }
  } else {
    ddoMetadata = JSON.parse(fs.readFileSync(metadata).toString())
  }

  logger.debug(`Parsing extra metadata parameters`)
  // Parsing extra parameters (`--+extraParam xxx`) given to add as additional information
  const customData = getExtraInputParams(argv)

  ddoMetadata.additionalInformation = {
    ...ddoMetadata.additionalInformation,
    customData
  }

  const configContract = await loadNeverminedConfigContract(nvmApp.sdk, config)
  
  const networkFee = await configContract.read.getMarketplaceFee() as bigint

  const assetPrice = new AssetPrice(account.getId(), ddoPrice)
    .setTokenAddress(token ? token.address : config.erc20TokenAddress)

  if (networkFee > 0) {
    assetPrice.addNetworkFees(
      await configContract.read.getFeeReceiver() as string,
      networkFee
    )
    logger.info(`Network Fees: ${getFeesFromBigNumber(networkFee)}`)
  }

  let publishMetadata = PublishMetadataOptions.OnlyMetadataAPI

  if (argv.publishMetadata?.toLowerCase() === 'ipfs')
    publishMetadata = PublishMetadataOptions.IPFS  


  logger.info(chalk.dim('\nCreating Asset ...'))

  const serviceAttributes: ServiceAttributes[] = []
  if (serviceTypes.includes('nft-sales')) {
    serviceAttributes.push({
      serviceType: 'nft-sales',
      price: assetPrice,
      nft: { amount: 1n, nftTransfer: argv.transfer, isSubscription: argv.type === 'subscription' }
    })
  }

  let ddo
  
  if (serviceTypes.includes('nft-access'))  {
    const nftType = Number(argv.nftType) === 721 ? 721 : 1155
    logger.info(chalk.dim(`\nNFT [${nftType}] ...`))
    
    serviceAttributes.push({
      serviceType: 'nft-access',      
      nft: { amount: 1n}
    })

    if (!ethers.isAddress(argv.subscriptionNFT))
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Invalid contract address ${argv.subscriptionNFT}`
      }

      if (nftType === 721) {
    
        const nft721Api = await nvmApp.sdk.contracts.loadNft721(argv.subscriptionNFT)

        const nftAttributes = NFTAttributes.getNFT721Instance({
          metadata: ddoMetadata,
          nftType: argv.access === 'subscription' ? NeverminedNFT721Type.nft721Subscription: NeverminedNFT721Type.nft721,          
          services: serviceAttributes,
          providers: [config.nvm.neverminedNodeAddress!],
          nftContractAddress: argv.subscriptionNFT,
          preMint: false,
        })
        ddo = await nft721Api.create(nftAttributes, account) 

      } else {

        const nft1155Api = await nvmApp.sdk.contracts.loadNft1155(argv.subscriptionNFT)

        const nftAttributes = NFTAttributes.getNFT1155Instance({
          metadata: ddoMetadata,
          ercType: 1155,
          services: serviceAttributes,
          providers: [config.nvm.neverminedNodeAddress!],
          nftContractAddress: argv.subscriptionNFT,
          preMint: false,
        })
        ddo = await nft1155Api.create(nftAttributes, account)         
      }

  } else {
    const assetAttributes = AssetAttributes.getInstance({
      metadata: ddoMetadata,
      services: [{
        serviceType: 'access',
        price: assetPrice
      }],      
      providers: [config.nvm.neverminedNodeAddress!]
    })
  
    logger.debug(`Calling the Nevermined SDK to create the asset...`)
    ddo = await nvmApp.sdk.assets.create(
      assetAttributes,
      account,
      { metadata: publishMetadata }
    )
  }


  const register = (await nvmApp.sdk.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    owner: string
    url: string
  }

  logger.info(
    chalk.dim(`Created Asset ${ddo.id} with service endpoint: ${register.url}`)
  )

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did: ddo.id,
      url: register.url
    })
  }
}
