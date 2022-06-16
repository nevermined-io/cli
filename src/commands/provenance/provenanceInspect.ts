import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { printProvenanceEntry } from '../../utils/utils'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'
import chalk from 'chalk'

export const provenanceInspect = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, provenanceId } = argv

  logger.info(
    chalk.dim(
      `Loading provenance event with id: '${chalk.whiteBright(provenanceId)}'`
    )
  )

  const provenance = await nvm.provenance.getProvenanceEntry(provenanceId)
  printProvenanceEntry(provenanceId, provenance, logger)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(provenance)
  }
}
