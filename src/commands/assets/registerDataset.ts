import {
  StatusCodes,
  findAccountOrFirst,
  Constants,
  loadNevermined,
  printTokenBanner
} from '../../utils'
import chalk from 'chalk'
import {
  MetaDataMain,
  File,
  Nevermined,
  MetaData
} from '@nevermined-io/nevermined-sdk-js'
import AssetRewards from '@nevermined-io/nevermined-sdk-js/dist/node/models/AssetRewards'
import readline from 'readline'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import fs from 'fs'
import { ConfigEntry, logger } from '../../utils/config'
import { Logger } from 'log4js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const registerDataset = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  logger.info(chalk.dim(`Registering dataset ...`))

  const { verbose, network, creator, metadata } = argv
  const { nvm, token } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) return StatusCodes.FAILED_TO_CONNECT

  if (verbose) printTokenBanner(token)

  const accounts = await nvm.accounts.list()
  let creatorAccount = findAccountOrFirst(accounts, creator)

  logger.debug(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`))

  let ddoMetadata: MetaData
  let ddoPrice: Number
  if (!metadata) {
    const decimals =
      token !== null ? await token.decimals() : Constants.ETHDecimals

    ddoPrice = argv.price * 10 ** decimals

    logger.debug(`Using Price ${argv.price}`)

    let _files: File[] = []
    let _fileIndex = 0
    argv.urls.forEach(function (_url: string) {
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
        type: 'dataset',
        dateCreated: new Date().toISOString().replace(/\.[0-9]{3}/, ''),
        author: argv.author,
        license: argv.license,
        price: ddoPrice.toString(),
        files: _files
      } as MetaDataMain
    }
  } else {
    ddoMetadata = JSON.parse(fs.readFileSync(metadata).toString())
    ddoPrice = Number(ddoMetadata.main.price)
  }

  logger.info(chalk.dim('\nCreating Asset ...'))

  const ddo = await nvm.assets.create(
    ddoMetadata,
    creatorAccount,
    // @ts-ignore
    new AssetRewards(creatorAccount.getId(), ddoPrice)
  )

  const register = (await nvm.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    owner: string
    url: string
  }

  logger.info(
    chalk.dim(
      `Created Asset '${chalk.whiteBright(
        ddo.id
      )} with service endpoint: ${chalk.whiteBright(register.url)}`
    )
  )

  return StatusCodes.OK
}
