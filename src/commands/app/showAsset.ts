import { NvmAccount, ChargeType, DDO, MetaDataExternalResource, NvmApp, formatUnits, zeroX } from '@nevermined-io/sdk'
import {
  Constants,
  StatusCodes,
  loadToken
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'

import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const showAsset = async (
  nvmApp: NvmApp,
  _userAccount: NvmAccount,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, did } = argv


  logger.info(
    chalk.dim(
      `Loading Asset information: '${chalk.whiteBright(
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

  logger.info(chalk.dim(`====== ${chalk.whiteBright(ddo.id)} ======`))
  logger.info(chalk.dim(`Metadata Url: ${chalk.whiteBright(url)}`))

  const assetType = metadata.attributes.main.type

  logger.info(
    chalk.dim(`Asset Type: ${chalk.whiteBright(assetType)}`)
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

  if (assetType === 'subscription') {
    logger.info(
      chalk.dim(
        `Plan Type: ${chalk.yellowBright(metadata.attributes.main.subscription?.subscriptionType)}`
      )
    )
    const token = await loadToken(nvmApp.sdk, config, verbose)

    const decimals =
      token !== null ? await token.decimals() : Constants.ETHDecimals
  
    const symbol = token !== null ? await token.symbol() : config.nativeToken
  
    const price = formatUnits(
      DDO.getAssetPriceFromService(ddo.findServiceByType('nft-sales')).getTotalPrice(),
      decimals
    )
  
    logger.info(
      chalk.dim(
        `Price: ${chalk.yellowBright(price)} ${chalk.whiteBright(symbol)}`
      )
    )    

  } else if (assetType === 'service')  {
    logger.info(`Endpoints:`)    
    metadata.attributes.main.webService?.endpoints?.map((endpoint: any) => {
      logger.info(`\t${chalk.whiteBright(endpoint.method)}: ${endpoint.url}`)
    })
    logger.info(`Open Endpoints:`)
    metadata.attributes.main.webService?.openEndpoints?.map((endpoint: string) => {
      logger.info(`\t${endpoint}`)
    })
    logger.info(
      chalk.dim(`\nOpen API Url: ${chalk.whiteBright(metadata.attributes.additionalInformation?.customData?.openApi)}`)
    )
    const accessService = ddo.findServiceByType('nft-access')
    if (metadata.attributes.main.webService?.chargeType === ChargeType.Fixed)  {
      logger.info(
        chalk.dim(`\nAccess Cost: ${chalk.whiteBright(accessService.attributes.main.nftAttributes?.amount)}`)
      )
    } else if (metadata.attributes.main.webService?.chargeType === ChargeType.Dynamic) {
      logger.info(
        chalk.dim(`\nAccess Cost between: ${chalk.whiteBright(accessService.attributes.main.nftAttributes?.minCreditsToCharge)} and ${chalk.whiteBright(accessService.attributes.main.nftAttributes?.maxCreditsToCharge)}`)
      )
    }
      
  } else  {
    logger.info(`Files:`)
    metadata.attributes.main.files?.map((resource: MetaDataExternalResource) => {
      resource.name && logger.info(`\t${chalk.whiteBright(resource.name)}: ${resource.contentType}`)      
    })
  }


  logger.trace(chalk.dim(DDO.serialize(ddo)))

  return { status: StatusCodes.OK }
}
