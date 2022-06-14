import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import fs from 'fs'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'
import crypto from 'crypto'

export const decryptFile = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
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

  console.log(decrypted)

  return 0
}
