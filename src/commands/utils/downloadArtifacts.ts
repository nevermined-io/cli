import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ARTIFACTS_REPOSITORY } from '../../utils/config'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import chalk from 'chalk'
import { writeFileSync, mkdirSync } from 'fs'
import { x } from 'tar'
import fetch from 'cross-fetch'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const downloadArtifacts = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { contractsVersion, networkId, tag, destination } = argv

  logger.info(
    `Checking available artifacts from the repository: ${chalk.bgBlue(
      ARTIFACTS_REPOSITORY
    )}`
  )

  let artifactPackageUrl = `${ARTIFACTS_REPOSITORY}`
  let packageFileName = `${destination}`
  if (networkId !== undefined && networkId.length > 0) {
    // We have `networkId` information so we are trying to download artifacts deployed
    artifactPackageUrl = `${artifactPackageUrl}/${networkId}/${tag}/contracts_v${contractsVersion}.tar.gz`
    packageFileName = `${packageFileName}/contracts_${contractsVersion}.tar.gz`
  } else {
    artifactPackageUrl = `${artifactPackageUrl}/abis/abis_${contractsVersion}.tar.gz`
    packageFileName = `${packageFileName}/abis_${contractsVersion}.tar.gz`
  }

  logger.info(`Downloading: ${artifactPackageUrl}`)
  const response = await fetch(artifactPackageUrl)
  if (response.status !== 200) {
    const errorMessage =
      `Unable to download the artifacts from: ${artifactPackageUrl}.` +
      +` ${JSON.stringify(response)}`
    return {
      status: StatusCodes.ERROR,
      errorMessage
    }
  }

  try {
    mkdirSync(destination, { recursive: true })
    const buffer = Buffer.from(await response.arrayBuffer())
    writeFileSync(packageFileName, buffer, 'binary')
    await x({
      file: packageFileName,
      cwd: destination
    })
    logger.info(
      `Artifacts downloaded (${chalk.greenBright(
        packageFileName
      )} file) and de-compressed in the destination folder (${chalk.greenBright(
        destination
      )})`
    )
  } catch (error) {
    const errorMessage = `Unable to store the artifacts file: ${JSON.stringify(
      error
    )}`
    return {
      status: StatusCodes.ERROR,
      errorMessage
    }
  }

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      destination,
      packageFileName
    })
  }
}
