import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import readline from 'readline'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { Dtp } from '@nevermined-io/nevermined-sdk-dtp/dist/Dtp'
import { generateIntantiableConfigFromConfig } from '@nevermined-io/nevermined-sdk-js/dist/node/Instantiable.abstract'
import { CryptoConfig } from '@nevermined-io/nevermined-sdk-dtp/dist/utils'

readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const getAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  let agreementId

  const ddo = await nvm.assets.resolve(did)
  const metadata = ddo.findServiceByType('metadata')

  let isDTP = false
  if (argv.fileIndex && argv.fileIndex >= 0)
    isDTP = metadata.attributes.main.files?.[argv.fileIndex].encryption === 'dtp' ? true : false
  else
    metadata.attributes.main.files?.forEach( _f => {
      if (_f.encryption === 'dtp')
        isDTP = true
    })

  const instanceConfig = {
    ...generateIntantiableConfigFromConfig(config.nvm),
    nevermined: nvm,
  }

  const gatewayInfo = await nvm.gateway.getGatewayInfo()
  const cryptoConfig: CryptoConfig = {
    provider_key: '',
    provider_password: '',
    provider_rsa_public: gatewayInfo['rsa-public-key'],
    provider_rsa_private: ''
  }
  const dtp = await Dtp.getInstance(instanceConfig, cryptoConfig)

  logger.debug(chalk.dim(`Using account: '${account.getId()}'`))
  if (isDTP) {
    logger.info(`Is a DTP asset`)
    const babyAccount = await dtp.babyjubAccount(argv.password)
    account.babySecret = babyAccount.babySecret
    account.babyX = babyAccount.babyX
    account.babyY = babyAccount.babyY
  }

  if (!argv.agreementId) {
    logger.info(chalk.dim(`Ordering asset: ${did}`))
    agreementId = await nvm.assets.order(did, 'access', account)
  } else {
    agreementId = argv.agreementId
  }

  logger.info(
    chalk.dim(`Downloading asset: ${did} with agreement id: ${agreementId}`)
  )

  let encryptionPassword
  if (isDTP) {
    logger.info(`Is a DTP asset`)
    const babyAccount = await dtp.babyjubAccount(argv.password)
    account.babySecret = babyAccount.babySecret
    account.babyX = babyAccount.babyX
    account.babyY = babyAccount.babyY
    logger.info(`Calling Consume Proof with ${agreementId}, ${ddo.id} & ${account.getId()}`)
    const key = await dtp.consumeProof(agreementId, ddo.id, account)
    logger.info(`KEY: ${key}`)
    encryptionPassword = Buffer.from(key as any, 'hex').toString()
    logger.info(`Got password ${encryptionPassword}`)
  }

  const path = await nvm.assets.consume(
    agreementId,
    did,
    account,
    argv.path,
    argv.fileIndex
  )
  logger.info(chalk.dim(`Files downloaded to: ${path}`))    

  if (isDTP)  {
    logger.info(`TODO: Decrypt the files using the password`)
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
