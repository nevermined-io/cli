import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import fs from 'fs'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

export const uploadFile = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { file, encrypt } = argv
  const stream = fs.createReadStream(file)
  const {url, password} = await nvm.files.uploadFilecoin(stream, encrypt)
  console.log(`URL: ${url}`)
  if (password) {
      console.log(`Password: ${password}`)
  }
  return 0
}

