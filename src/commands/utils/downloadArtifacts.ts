import { Account, Nevermined } from '@nevermined-io/sdk'
import { ARTIFACTS_PATH, ARTIFACTS_REPOSITORY } from '../../utils/config'
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
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
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

  let packageFileName
  let destinationFolder
  let artifactPackageUrl = `${ARTIFACTS_REPOSITORY}`
  if (destination && destination.length > 0) {
    packageFileName = `${destination}`
    destinationFolder = destination
  } else {
    packageFileName = ARTIFACTS_PATH
    destinationFolder = ARTIFACTS_PATH
  }

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
    mkdirSync(destinationFolder, { recursive: true })
    const buffer = Buffer.from(await response.arrayBuffer())
    writeFileSync(packageFileName, buffer, 'binary')

    logger.info(
      `Extracting artifacts from package: ${packageFileName} into ${destinationFolder}`
    )

    await x({
      file: packageFileName,
      cwd: destinationFolder
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
      destinationFolder,
      packageFileName
    })
  }
}
