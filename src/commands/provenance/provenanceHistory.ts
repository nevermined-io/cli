import { NvmAccount, NvmApp, jsonReplacer } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { printProvenanceEvents } from '../../utils/utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const provenanceHistory = async (
  nvmApp: NvmApp,
  _account: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(
    chalk.dim(`Loading provenance history of: '${chalk.whiteBright(did)}'`)
  )

  const events = await nvmApp.sdk.provenance.getDIDProvenanceEvents(did)

  printProvenanceEvents(events, logger)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(events, jsonReplacer)
  }
}
