import { StatusCodes, getConfig, loadNevermined } from '../../utils'
import chalk from 'chalk'
import { printProvenanceEvents } from '../../utils/utils'
import { logger } from '../../utils/config'

export const provenanceHistory = async (argv: any): Promise<number> => {
  const { verbose, network, did } = argv

  const config = getConfig(network as string)
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  console.info(
    chalk.dim(`Loading provenance history of: '${chalk.whiteBright(did)}'`)
  )

  const events = await nvm.provenance.getDIDProvenanceEvents(did)

  printProvenanceEvents(events, logger)

  return StatusCodes.OK
}
