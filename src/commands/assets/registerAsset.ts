import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  StatusCodes,
  printTokenBanner,
  loadToken,
  loadNeverminedConfigContract,
  getFeesFromBigNumber,
  DTP_PROVIDER_KEY
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
  const { verbose, metadata, assetType, password } = argv
  const token = await loadToken(nvm, config, verbose)

  // TODO: Enable DTP when `sdk-dtp` is ready
  const keyTransfer = await makeKeyTransfer()

  if (verbose) {
    printTokenBanner(token)
  }

  logger.info(chalk.dim(`Registering asset (${assetType}) ...`))

  logger.info(JSON.stringify(argv))

  logger.debug(chalk.dim(`Using creator: '${account.getId()}'\n`))

  let ddoMetadata: MetaData

  const ddoPrice = BigNumber.from(argv.price).gt(0)
    ? BigNumber.from(argv.price)
    : BigNumber.from(0)

  if (!metadata) {

    logger.debug(`Using Price ${argv.price}`)

    await nvm.gateway.getBabyjubPublicKey()    

    const _files: File[] = []
    let _fileIndex = 0
    if (password) {
      _files.push({
        index: _fileIndex,
        url: Buffer.from(password).toString('hex'),
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
      const providerKey = DTP_PROVIDER_KEY
      ddoMetadata.additionalInformation = {
        poseidonHash: await keyTransfer.hashKey(Buffer.from(password, 'hex')),
        providerKey,
        links: argv.urls.map((url: string) => ({ name: 'public url', url }))
      }
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
    // undefined,
    // undefined,
    // undefined,
    // undefined,
    // params
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
