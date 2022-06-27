import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import { printProvenanceEvents } from '../../utils/utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const provenanceHistory = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, did } = argv

  logger.info(
    chalk.dim(`Loading provenance history of: '${chalk.whiteBright(did)}'`)
  )

  const events = await nvm.provenance.getDIDProvenanceEvents(did)

  printProvenanceEvents(events, logger)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(events)
  }
}
