import { Account, AssetPrice, AssetAttributes, Nevermined, MetaData, MetaDataMain, zeroX, generateIntantiableConfigFromConfig, BigNumber, PublishMetadata, MetaDataExternalResource, ServiceType, NFTAttributes, NeverminedNFT721Type } from '@nevermined-io/sdk'
import {
  StatusCodes,
  printTokenBanner,
  loadToken,
  loadNeverminedConfigContract,
  getFeesFromBigNumber
} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { Dtp } from '@nevermined-io/sdk-dtp'
import { ethers } from 'ethers'

export const registerAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, metadata, assetType } = argv
  const token = await loadToken(nvm, config, verbose)
  
  const instanceConfig = {
    ...generateIntantiableConfigFromConfig(config.nvm),
    nevermined: nvm,
  }
  const dtp = await Dtp.getInstance(instanceConfig, null as any)
  
  const isDTP = argv.password ? true : false
  const password = argv.password ? Buffer.from(argv.password).toString('hex') : ''
  if (verbose) {
    printTokenBanner(token)
  }

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

  const ddoPrice = BigNumber.from(argv.price).gt(0)
    ? BigNumber.from(argv.price)
    : BigNumber.from(0)
  logger.debug(`With Price ${ddoPrice}`)


  if (!metadata) {

    const _files: MetaDataExternalResource[] = []
    let _fileIndex = 0
    if (isDTP) {
      _files.push({
        index: _fileIndex,
        url: password,
        encryption: 'dtp',
        contentType: 'text/plain'
      })
      _fileIndex++
    }
    argv.urls.forEach((_url: string) => {
      _files.push({
        index: _fileIndex,
        url: _url,
        contentType: argv.contentType || 'application/http'
      })
      _fileIndex++
    })

    ddoMetadata = {
      main: {
        name: argv.name,
        isDTP: !!password,
        type: assetType,
        dateCreated: new Date().toISOString().replace(/\.[0-9]{3}/, ''),
        author: argv.author,
        license: argv.license,
        files: _files
      } as MetaDataMain
    }    
    if (isDTP) {
      const nodeInfo = await nvm.services.node.getNeverminedNodeInfo()
      const providerKey = nodeInfo['babyjub-public-key']
      
      ddoMetadata.additionalInformation = {
        poseidonHash: await dtp.keytransfer.hashKey(Buffer.from(password, 'hex')),
        providerKey,
        links: argv.urls.map((url: string) => ({ name: 'public url', url }))
      }
      logger.info(`We are here now ${JSON.stringify(ddoMetadata.additionalInformation)}`)
    }
    if (assetType === 'algorithm') {
      const containerTokens = argv.container.split(':')
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

  console.log(`DDO Metadata = ${JSON.stringify(ddoMetadata)}`)

  const configContract = loadNeverminedConfigContract(config)
  const networkFee = await configContract.getMarketplaceFee()

  const assetPrice = new AssetPrice(account.getId(), ddoPrice)
    .setTokenAddress(token ? token.getAddress() : config.erc20TokenAddress)

  if (networkFee.gt(0)) {
    assetPrice.addNetworkFees(
      await configContract.getFeeReceiver(),
      networkFee
    )
    logger.info(`Network Fees: ${getFeesFromBigNumber(networkFee)}`)
  }

  let publishMetadata = PublishMetadata.OnlyMetadataAPI

  if (argv.publishMetadata?.toLowerCase() === 'ipfs')
    publishMetadata = PublishMetadata.IPFS  


  logger.info(chalk.dim('\nCreating Asset ...'))

  let ddo
  if (serviceTypes.includes('nft-access'))  {
    const nftType = Number(argv.nftType) === 721 ? 721 : 1155
    logger.info(chalk.dim(`\nNFT [${nftType}] ...`))

    if (!ethers.utils.isAddress(argv.subscriptionNFT))
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Invalid contract address ${argv.subscriptionNFT}`
      }

      if (nftType === 721) {
    
        const nft721Api = await nvm.contracts.loadNft721(argv.subscriptionNFT)

        const nftAttributes = NFTAttributes.getNFT721Instance({
          metadata: ddoMetadata,
          nftType: argv.access === 'subscription' ? NeverminedNFT721Type.nft721Subscription: NeverminedNFT721Type.nft721,          
          serviceTypes,
          providers: [config.nvm.neverminedNodeAddress!],
          nftContractAddress: argv.subscriptionNFT,
          preMint: false,
          nftTransfer: false
        })
        ddo = await nft721Api.create(nftAttributes, account) 

      } else {

        const nft1155Api = await nvm.contracts.loadNft1155(argv.subscriptionNFT)

        const nftAttributes = NFTAttributes.getNFT1155Instance({
          metadata: ddoMetadata,
          ercType: 1155,
          serviceTypes,
          providers: [config.nvm.neverminedNodeAddress!],
          nftContractAddress: argv.subscriptionNFT,
          preMint: false,
          nftTransfer: false
        })
        ddo = await nft1155Api.create(nftAttributes, account)         
      }

  } else {
    const assetAttributes = AssetAttributes.getInstance({
      metadata: ddoMetadata,
      price: assetPrice,
      serviceTypes: ['access'],
      providers: [config.nvm.neverminedNodeAddress!]
    })
  
    ddo = await nvm.assets.create(
      assetAttributes,
      account,
      publishMetadata
    )
  }


  const register = (await nvm.keeper.didRegistry.getDIDRegister(
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
