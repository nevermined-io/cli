import { Account, generateInstantiableConfigFromConfig, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import readline from 'readline'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { CryptoConfig, Dtp } from '@nevermined-io/sdk-dtp'

readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const getAsset = async (
  nvmApp: NvmApp,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  let agreementId

  const ddo = await nvmApp.sdk.assets.resolve(did)
  const metadata = ddo.findServiceByType('metadata')

  const isDTP = metadata.attributes.main.files?.some( _f => _f.encryption === 'dtp')

  const instanceConfig = {    
    ...(await generateInstantiableConfigFromConfig(config.nvm)),
    nevermined: nvmApp.sdk,
  }

  const nodeInfo = await nvmApp.sdk.services.node.getNeverminedNodeInfo()
  const cryptoConfig: CryptoConfig = {
    provider_key: '',
    provider_password: '',
    provider_rsa_public: nodeInfo['rsa-public-key'],
    provider_rsa_private: ''
  }
  let dtp: Dtp = undefined
  const serviceReference = argv.serviceIndex ? argv.serviceIndex : 'access'

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))
  if (isDTP) {
    logger.info(`Is a DTP asset`)
    dtp = await Dtp.getInstance(instanceConfig, cryptoConfig)
    const babyAccount = await dtp.babyjubAccount(argv.password)
    account.babySecret = babyAccount.babySecret
    account.babyX = babyAccount.babyX
    account.babyY = babyAccount.babyY
  }

  if (!argv.agreementId) {
    logger.info(chalk.dim(`No agreementId. Ordering asset using reference ${serviceReference}: ${did}`))    
    agreementId = await nvmApp.sdk.assets.order(did, serviceReference, account)
  } else {
    agreementId = argv.agreementId
  }

  logger.info(
    chalk.dim(`Downloading asset: ${did} with agreement id: ${agreementId}`)
  )

  let encryptionPassword
  if (isDTP) {
    logger.info(`Calling Consume Proof with ${agreementId}, ${ddo.id} & ${account.getId()}`)
    const key = await dtp.consumeProof(agreementId, ddo.id, account)
    logger.info(`KEY: ${key}`)
    encryptionPassword = Buffer.from(key as any, 'hex').toString()
    logger.info(`Got password ${encryptionPassword}`)
  }

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

  if (isDTP)  {
    logger.info(`File/s are encrypted. You can decrypt using the "ncli utils decrypt" command`)
  }

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      isDTP,
      password: encryptionPassword,
      path
    })
  }
}
