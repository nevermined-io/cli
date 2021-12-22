import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, loadNevermined } from '../../utils'
import chalk from 'chalk'
import { printProvenanceEvents } from '../../utils/utils'
import { ConfigEntry, logger } from '../../utils/config'
import { Logger } from 'log4js'

export const provenanceHistory = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did } = argv

  logger.info(
    chalk.dim(`Loading provenance history of: '${chalk.whiteBright(did)}'`)
  )

  const events = await nvm.provenance.getDIDProvenanceEvents(did)

  printProvenanceEvents(events, logger)

  return StatusCodes.OK
}
