import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import fs from 'fs'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const uploadFile = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { file, encrypt } = argv
  const stream = fs.createReadStream(file)
  const { url, password } = await nvm.files.uploadFilecoin(stream, encrypt)
  console.info(`URL: ${url}`)
  if (password) {
    console.info(`Password: ${password}`)
  }
  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      url,
      password
    })
  }
}
