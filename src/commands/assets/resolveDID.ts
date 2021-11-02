import {
  Constants,
  StatusCodes,
  findAccountOrFirst,
  loadNevermined,
  printTokenBanner
} from '../../utils'
import chalk from 'chalk'
import {
  File,
  MetaData,
  MetaDataMain,
  Nevermined
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

export const resolveDID = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did } = argv
  const { nvm, token } = await loadNevermined(config, network, verbose)
  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(chalk.dim(`Resolving the asset: ${did}`))

  const ddo = await nvm.assets.resolve(did)

  if (!ddo) {
    logger.warn('Asset not found')
    return StatusCodes.DID_NOT_FOUND
  }

  logger.info(chalk.dim('DID found and DDOresolved'))
  logger.debug(ddo)

  return StatusCodes.OK
}
