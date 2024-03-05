import { Account, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const downloadFiles = async (
  nvmApp: NvmApp,
  _buyerAccount: Account,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {

  const { did, agreementId, destination } = argv
  logger.info(chalk.dim(`Download Asset Files with DID: '${chalk.whiteBright(did)}'`))

  const ddo = await nvmApp.sdk.assets.resolve(did)
  const metadata = ddo.findServiceByReference('metadata')
  logger.trace(JSON.stringify(metadata.attributes.main.files))

  const operationResult = await nvmApp.downloadFiles(
    did,
    agreementId,
    destination,
  )

  if (operationResult.success) {
    logger.info(chalk.dim(`Files downloaded succesfully to: '${chalk.whiteBright(argv.destination)}'`))

    return { 
      status: StatusCodes.OK, 
      results: JSON.stringify({
        did: argv.did,
        agreementId: operationResult.agreementId,
        destination: argv.destination
      })
    }
  } else {
    logger.info(chalk.dim(`There was a problem downloading the files`))

    return {
      status: StatusCodes.ERROR,
      errorMessage: `Failed to download`
    }
  }

}
