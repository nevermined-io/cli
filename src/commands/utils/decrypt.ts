import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import crypto from 'crypto'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const decryptFile = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { file, password } = argv
  const encrypted = fs.readFileSync(file).toString('binary')

  const salt = Buffer.from(encrypted.substring(8, 16), 'binary')

  const keydata = crypto
    .pbkdf2Sync(password, salt, 10000, 48, 'sha256')
    .toString('binary')
  const key = Buffer.from(keydata.substring(0, 32), 'binary')
  const iv = Buffer.from(keydata.substring(32, 48), 'binary')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

  let decrypted = decipher.update(encrypted.substring(16), 'binary', 'binary')
  decrypted += decipher.final()

  logger.info(decrypted)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      decrypted
    })
  }
}
