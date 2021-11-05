import { StatusCodes, loadNevermined } from '../../utils'
import chalk from 'chalk'
import { printProvenanceEvents } from '../../utils/utils'
import { ConfigEntry, logger } from '../../utils/config'
import { Logger } from 'log4js'

export const provenanceHistory = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {

  const { verbose, network, did } = argv

  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(
    chalk.dim(`Loading provenance history of: '${chalk.whiteBright(did)}'`)
  )

  const events = await nvm.provenance.getDIDProvenanceEvents(did)

  printProvenanceEvents(events, logger)

  return StatusCodes.OK
}
