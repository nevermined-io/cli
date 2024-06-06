import { NvmAccount, NvmApp, jsonReplacer } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { printProvenanceEntry } from '../../utils/utils'
import { Logger } from 'log4js'
import chalk from 'chalk'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const provenanceInspect = async (
  nvmApp: NvmApp,
  _account: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { provenanceId } = argv

  logger.info(
    chalk.dim(
      `Loading provenance event with id: '${chalk.whiteBright(provenanceId)}'`
    )
  )

  const provenance = await nvmApp.sdk.provenance.getProvenanceEntry(provenanceId)
  if (!provenance) {
    logger.error(
      chalk.red(`Provenance event with id: '${provenanceId}' not found`)
    )
    return { status: StatusCodes.ERROR}  
  }
  printProvenanceEntry(provenanceId, provenance, logger)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(provenance, jsonReplacer)
  }
}
