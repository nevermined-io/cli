import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, loadNevermined } from '../../utils'
import chalk from 'chalk'
import { printProvenanceEntry } from '../../utils/utils'
import { ConfigEntry, logger } from '../../utils/config'
import { Logger } from 'log4js'

export const provenanceInspect = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, provenanceId } = argv

  logger.info(
    chalk.dim(
      `Loading provenance event with id: '${chalk.whiteBright(provenanceId)}'`
    )
  )

  const provenance = await nvm.provenance.getProvenanceEntry(provenanceId)
  printProvenanceEntry(provenanceId, provenance, logger)

  return StatusCodes.OK
}
