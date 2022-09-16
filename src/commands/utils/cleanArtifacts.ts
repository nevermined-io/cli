import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ARTIFACTS_PATH } from '../../utils/config'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { execSync } from 'child_process'

export const cleanArtifacts = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { contractsVersion, networkId, tag, path } = argv

  logger.info(`Deleting local copy of Smart Contracts artifacts`)

  let artifactsFolder
  if (path && path.length() > 0) artifactsFolder = `${path}`
  else artifactsFolder = ARTIFACTS_PATH

  try {
    const result = execSync(`rm -f ${artifactsFolder}/*.*`)
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
