import {
  StatusCodes,
  loadNevermined,
  printSearchResult
} from '../../utils'
import chalk from 'chalk'

import readline from 'readline'
import { ConfigEntry, logger } from '../../utils/config'
import { Logger } from 'log4js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export const searchAsset = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {

  const { verbose, network, query } = argv
  const { nvm, token } = await loadNevermined(config, network, verbose)
  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(chalk.dim(`Search using query: ${query}`))

  const assets = await nvm.assets.search(query, argv.offset, argv.page)
  
  printSearchResult(assets, logger)

  return StatusCodes.OK
}
