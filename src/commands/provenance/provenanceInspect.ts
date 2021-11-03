import { StatusCodes, getConfig, loadNevermined } from '../../utils'
import chalk from 'chalk'
import { printProvenanceEntry } from '../../utils/utils'
import { logger } from '../../utils/config'

export const provenanceInspect = async (argv: any): Promise<number> => {
  const { verbose, network, provenanceId } = argv

  const config = getConfig(network as string)
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  console.info(
    chalk.dim(
      `Loading provenance event with id: '${chalk.whiteBright(provenanceId)}'`
    )
  )

  const provenance = await nvm.provenance.getProvenanceEntry(provenanceId)
  printProvenanceEntry(provenanceId, provenance, logger)

  return StatusCodes.OK
}
