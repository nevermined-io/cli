import { Account, DDO, NvmApp, formatUnits, zeroX } from '@nevermined-io/sdk'
import {
  Constants,
  StatusCodes,
  loadToken
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'

import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const showPlan = async (
  nvmApp: NvmApp,
  userAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, did } = argv

  // const token = await loadToken(nvmApp.sdk, config, verbose)

  logger.info(
    chalk.dim(
      `Loading Plan information: '${chalk.whiteBright(
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

  const token = await loadToken(nvmApp.sdk, config, verbose)

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : config.nativeToken

  logger.info(chalk.dim(`====== ${chalk.whiteBright(ddo.id)} ======`))
  logger.info(chalk.dim(`Metadata Url: ${chalk.whiteBright(url)}`))



  logger.info(
    chalk.dim(
      `Plan Type: ${chalk.yellowBright(metadata.attributes.main.subscription?.subscriptionType)}`
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

  const price = formatUnits(
    DDO.getAssetPriceFromService(ddo.findServiceByType('nft-sales')).getTotalPrice(),
    decimals
  )

  logger.info(
    chalk.dim(
      `Price: ${chalk.yellowBright(price)} ${chalk.whiteBright(symbol)}`
    )
  )

  logger.trace(chalk.dim(DDO.serialize(ddo)))

  return { status: StatusCodes.OK }
}
