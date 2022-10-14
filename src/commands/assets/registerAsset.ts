import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  Constants,
  StatusCodes,
  printTokenBanner,
  loadToken
} from '../../utils'
import chalk from 'chalk'
import { File, MetaData, MetaDataMain } from '@nevermined-io/nevermined-sdk-js'
import AssetRewards from '@nevermined-io/nevermined-sdk-js/dist/node/models/AssetRewards'
import {
  // makeKeyTransfer,
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
  // const keyTransfer = await makeKeyTransfer()

  if (verbose) {
    printTokenBanner(token)
  }

  logger.info(chalk.dim(`Registering asset (${assetType}) ...`))

  logger.info(JSON.stringify(argv))

  logger.debug(chalk.dim(`Using creator: '${account.getId()}'\n`))

  let ddoMetadata: MetaData
  let ddoPrice: BigNumber
  if (!metadata) {
    const decimals =
      token !== null ? await token.decimals() : Constants.ETHDecimals

    ddoPrice = BigNumber.from(argv.price).mul(BigNumber.from(10).pow(decimals))

    logger.debug(`Using Price ${argv.price}`)

    await nvm.gateway.getBabyjubPublicKey()

    const _files: File[] = []
    let _fileIndex = 0
    if (password) {
      _files.push({
        index: _fileIndex,
        url: Buffer.from(password).toString('hex'),
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
        price: ddoPrice.toString(),
        files: _files
      } as MetaDataMain
    }
    // if (password) {
    //   ddoMetadata.additionalInformation = {
    //     poseidonHash: await keyTransfer.hashKey(Buffer.from(password)),
    //     providerKey,
    //     links: argv.urls.map((url: string) => ({ name: 'public url', url }))
    //   }
    // }
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

    ddoPrice = BigNumber.from(ddoMetadata.main.price).gt(0)
      ? BigNumber.from(ddoMetadata.main.price)
      : BigNumber.from(0)
  }

  logger.info(chalk.dim('\nCreating Asset ...'))
  // const feeData = await config.nvm.web3Provider.getFeeData()
  // feeData.mul(gasLimit)
  // (await provider.getFeeData()).maxFeePerGas.mul(gasLimit)
  // const params: TxParameters= { gasMultiplier: 10 }

  const ddo = await nvm.assets.create(
    ddoMetadata,
    account,
    new AssetRewards(account.getId(), ddoPrice),
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
