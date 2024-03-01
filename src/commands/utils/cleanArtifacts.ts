import { Account, NvmApp } from '@nevermined-io/sdk'
import { ARTIFACTS_PATH } from '../../utils/config'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { execSync } from 'child_process'

export const cleanArtifacts = async (
  _nvmApp: NvmApp,
  _account: Account,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { path } = argv

  logger.info(`Deleting local copy of Smart Contracts artifacts`)

  let artifactsFolder
  if (path && path.length() > 0) artifactsFolder = `${path}`
  else artifactsFolder = ARTIFACTS_PATH

  try {
    execSync(`rm -f ${artifactsFolder}/*.*`)
  } catch (error) {
    const errorMessage = `Unable to removed the cached the artifacts: ${JSON.stringify(
      error
    )}`
    return {
      status: StatusCodes.ERROR,
      errorMessage
    }
  }

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({})
  }
}
