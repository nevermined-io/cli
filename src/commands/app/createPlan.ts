import { Account, AssetPrice, zeroX, NvmApp, NvmAppMetadata, DDO } from '@nevermined-io/sdk'
import {
  StatusCodes,
  loadToken} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { ZeroAddress } from 'ethers'


export const createPlan = async (
  nvmApp: NvmApp,
  publisherAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose } = argv

  const planType = argv.planType === 'time' ? 'time' : 'credits'

  logger.info(chalk.dim(`Registering Plan (${planType}) ...`))

  logger.debug(chalk.dim('Loading token'))

  const token = await loadToken(nvmApp.sdk, config, verbose, argv.token)
  const tokenAddress = token ? token.address : ZeroAddress
  logger.debug(chalk.dim(`Using publisher account: '${publisherAccount.getId()}'\n`))
  
  if (argv.name === '' || argv.author === '' || argv.price === '') {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `The following parameters need to be given: name, author, price`
    }
  }

  const ddoPrice = BigInt(argv.price) > 0n
    ? BigInt(argv.price)
    : 0n
  nvmApp
  
  const subscriptionPrice = new AssetPrice(publisherAccount.getId(), ddoPrice).setTokenAddress(tokenAddress)
  const subscriptionPriceWithFees = nvmApp.addNetworkFee(subscriptionPrice)

  logger.debug(`Price: ${subscriptionPriceWithFees.toString()}`)

  let ddo: DDO

  if (planType === 'time') {
    if (argv.duration === '' || argv.period === '')
      return {
        status: StatusCodes.ERROR,
        errorMessage: `For time subscriptions the following parameters need to be given: duration, period`
      }
    logger.info(`Duration: ${argv.duration} ${argv.period}`)

    const timeSubscriptionMetadata = NvmAppMetadata.getTimeSubscriptionMetadataTemplate(
      argv.name,
      argv.author,
      argv.period,
    )
  
    ddo = await nvmApp.createTimeSubscription(
      timeSubscriptionMetadata,
      subscriptionPrice,
      Number(argv.duration)
    )


  } else {
    if (argv.credits === '' || Number(argv.credits) < 0)
      return {
        status: StatusCodes.ERROR,
        errorMessage: `For credits subscriptions is necessary to specify a valid amount of credits (>=0)`
      }
    logger.info(`Credits: ${argv.credits}`)

    const creditsSubscriptionMetadata = NvmAppMetadata.getCreditsSubscriptionMetadataTemplate(
      argv.name,
      argv.author,
    )

    ddo = await nvmApp.createCreditsSubscription(
      creditsSubscriptionMetadata,
      subscriptionPrice,
      BigInt(argv.credits), 
    )
  }

  logger.info('Plan with DID created:', ddo.id)
  const planUrl = `${config.nvm.appUrl}/en/subscription/${zeroX(ddo.shortId())}`

  logger.info(
    chalk.dim(
      `Plan available on: ${chalk.whiteBright(planUrl)}`
    )
  )
  
  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did: ddo.id,
      url: planUrl
    })
  }
}
