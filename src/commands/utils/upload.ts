import { Account, Nevermined, NodeUploadBackends } from '@nevermined-io/sdk'
import fs from 'fs'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { Logger } from 'log4js'
import chalk from 'chalk'

export const uploadFile = async (
  nvm: Nevermined,
  account: Account,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  argv: any,
  config: ConfigEntry,
  logger: Logger  
): Promise<ExecutionOutput> => {
  const { file, encrypt } = argv

  const uploadBackend = argv.where === 'filecoin' ? NodeUploadBackends.Filecoin : NodeUploadBackends.IPFS  

  logger.info(chalk.dim(`Uploading File to ${uploadBackend.toString()}...`))
  
  if (!fs.existsSync(file))
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Unable to open ${file}`
    }

  try {
    const buffer = fs.readFileSync(file)

    const { url, password } = await nvm.services.node.uploadContent(buffer.toString('utf8'), encrypt, uploadBackend)
    logger.info(`File uploaded to URL: ${url}`)
    if (password) {
      logger.info(`Password: ${password}`)
    }
    return {
      status: StatusCodes.OK,
      results: JSON.stringify({
        url,
        password
      })
    }
  } catch (error) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Unable to upload file: ${
        (error as Error).message
      }`
    }
  }

}