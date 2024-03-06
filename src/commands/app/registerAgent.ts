import { Account, zeroX, NvmApp, NvmAppMetadata, DDO, ResourceAuthentication } from '@nevermined-io/sdk'
import {
  StatusCodes} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const registerAgent = async (
  nvmApp: NvmApp,
  publisherAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {  

  logger.info(chalk.dim(`Registering Agent ...`))

  logger.debug(chalk.dim(`Using publisher account: '${publisherAccount.getId()}'\n`))
    
  const paramEndpoints: string[] = argv.endpoint

  if (argv.name === '' || paramEndpoints.length < 1) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `The following parameters need to be given: name, endpoint`
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authType: ResourceAuthentication['type']
  let credentials = ''
  let authUser
  let authPassword

  if (argv.authType === 'none') {
    authType = 'none' as ResourceAuthentication['type']
    credentials = ''
  } else if (argv.authType === 'bearer' || argv.authType === 'oauth') {
    authType = 'bearer' as ResourceAuthentication['type']
    credentials = argv.credentials
    
  } else if (argv.authType === 'basic') {
    authType = 'basic' as ResourceAuthentication['type']
    credentials = argv.credentials.spli(':')
    authUser = credentials[0]
    authPassword = credentials[1] || ''

  } else {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Invalid authType. It should be one of: none, bearer, oauth, basic`
    }
  }

  const endpoints: { [verb: string]: string }[] = []
  
  paramEndpoints.map((_e: string) => {
    const e = new String(_e)
    
    if (e.split('@').length >= 2) {
      const [verb, url] = e.split('@')    
      endpoints.push({ [verb.toLocaleUpperCase()]: url })
    }    
  })

  if (endpoints.length === 0) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Invalid endpoints list. It should be a list of strings in the format: verb|url`
    }
  }
  logger.debug(`Endpoints: ${JSON.stringify(endpoints)}`)

  const isDynamic = argv.dynamicCost === 'true'

  const agentMetadata = NvmAppMetadata.getServiceMetadataTemplate(
    argv.name,
    argv.author,
    endpoints,
    [argv.openApiUrl],
    argv.openApiUrl,
    'RESTful',
    authType,
    credentials,
    authUser,
    authPassword,
    isDynamic,
  )

  const costInCredits = BigInt(argv.cost)

  let ddo: DDO
  if (isDynamic) {
    const maxCostInCredits = BigInt(argv.maxCost)
    ddo = await nvmApp.registerServiceAsset(
      agentMetadata,
      argv.subscriptionDid,
      costInCredits, // default cost in credits for every succesful query to the agent
      costInCredits, // min amount of credits to be consumed
      maxCostInCredits, // max amount of credits to be consumed
    )
  } else {
    ddo = await nvmApp.registerServiceAsset(
      agentMetadata,
      argv.subscriptionDid,
      costInCredits
    )
  }
  
  const agentUrl = `${config.nvm.appUrl}/en/webservice/${zeroX(ddo.shortId())}`
  logger.info(
    chalk.dim(
      `Agent created with DID: ${chalk.whiteBright(
        ddo.id
      )}\n available on: ${chalk.whiteBright(agentUrl)}`
    )
  )
  
  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did: ddo.id,
      url: agentUrl
    })
  }
}
