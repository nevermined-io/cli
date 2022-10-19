import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  StatusCodes,
  printTokenBanner,
  loadToken,
  loadNeverminedConfigContract,
  getFeesFromBigNumber
} from '../../utils'
import chalk from 'chalk'
import { File, MetaData, MetaDataMain } from '@nevermined-io/nevermined-sdk-js'
import { makeKeyTransfer } from '@nevermined-io/nevermined-sdk-dtp/dist/KeyTransfer'
import AssetRewards from '@nevermined-io/nevermined-sdk-js/dist/node/models/AssetRewards'
import {
  zeroX
} from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import BigNumber from '@nevermined-io/nevermined-sdk-js/dist/node/utils/BigNumber'

export const registerAsset = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, metadata, assetType } = argv
  const token = await loadToken(nvm, config, verbose)

  //const password = Buffer.from('passwd_32_letters_1234567890asdF').toString('hex')
  const password = Buffer.from(argv.password).toString('hex')
  if (verbose) {
    printTokenBanner(token)
  }

  logger.info(chalk.dim(`Registering asset (${assetType}) ...`))

  logger.debug(chalk.dim(`Using creator: '${account.getId()}'\n`))

  let ddoMetadata: MetaData

  const ddoPrice = BigNumber.from(argv.price).gt(0)
    ? BigNumber.from(argv.price)
    : BigNumber.from(0)
  logger.debug(`With Price ${ddoPrice}`)


  if (!metadata) {

    const _files: File[] = []
    let _fileIndex = 0
    if (password) {
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
        contentType: argv.contentType
      })
      _fileIndex++
    })

    ddoMetadata = {
      main: {
        name: argv.name,
        type: assetType,
        dateCreated: new Date().toISOString().replace(/\.[0-9]{3}/, ''),
        author: argv.author,
        license: argv.license,
        files: _files
      } as MetaDataMain
    }    
    if (password) {
      const gatewayInfo = await nvm.gateway.getGatewayInfo()
      const providerKey = gatewayInfo['babyjub-public-key']

      const keyTransfer = await makeKeyTransfer()
      
      const bufferHash = Buffer.from(password, 'hex')
      console.log(`Trying to convert poseidon hash: ${bufferHash}`)
      ddoMetadata.additionalInformation = {
        poseidonHash: await keyTransfer.hashKey(Buffer.from(password, 'hex')),
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
    }
  } else {
    ddoMetadata = JSON.parse(fs.readFileSync(metadata).toString())
  }

  const configContract = loadNeverminedConfigContract(config)
  const networkFee = await configContract.getMarketplaceFee()

  const assetRewards = new AssetRewards(account.getId(), ddoPrice)
  if (networkFee.gt(0)) {
    assetRewards.addNetworkFees(
      await configContract.getFeeReceiver(),
      networkFee
    )
    logger.info(`Network Fees: ${getFeesFromBigNumber(networkFee)}`)
  }

  logger.info(chalk.dim('\nCreating Asset ...'))

  const ddo = await nvm.assets.create(
    ddoMetadata,
    account,
    assetRewards,
    ['access']
  )

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
