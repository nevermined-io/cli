import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import readline from 'readline'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const getAsset = async (
  nvmApp: NvmApp,
  account: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  let agreementId

  const ddo = await nvmApp.sdk.assets.resolve(did)


  const serviceReference = argv.serviceIndex ? argv.serviceIndex : 'access'

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))

  const service = ddo.findServiceByReference(serviceReference)
  console.log(`Service: ${service.attributes.serviceAgreementTemplate.contractName}`)

  if (!argv.agreementId) {
    logger.info(chalk.dim(`No agreementId. Ordering asset using reference ${serviceReference}: ${did}`))    
    agreementId = await nvmApp.sdk.assets.order(did, serviceReference, account)
  } else {
    agreementId = argv.agreementId
  }

  logger.info(
    chalk.dim(`Downloading asset: ${did} with agreement id: ${agreementId}`)
  )

  const destination = argv.destination.substring(argv.destination.length - 1) === '/' ?
    argv.destination :
    `${argv.destination}/`

  const path = await nvmApp.sdk.assets.access(
    agreementId,
    did,
    serviceReference,
    account,
    destination,
    argv.fileIndex
  )
  logger.info(chalk.dim(`Files downloaded to: ${path}`))    

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({      
      path
    })
  }
}
