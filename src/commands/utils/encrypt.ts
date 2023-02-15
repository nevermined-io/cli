import { Account, Nevermined } from '@nevermined-io/sdk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { aes_encryption_256 } from '@nevermined-io/sdk-dtp/dist/utils'
import chalk from 'chalk'
import crypto from 'crypto'

export const encryptFile = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  logger.info(chalk.dim(`Encrypting file`))
  let { password } = argv
  const { file } = argv
  if (!password) {
    password = crypto.randomBytes(32).toString('base64url')
  }
  const plain = fs.readFileSync(file).toString('binary')
  const encrypted = aes_encryption_256(plain, password)

  const filePathEncrypted = file + '.encrypted'
  fs.writeFileSync(filePathEncrypted, Buffer.from(encrypted, 'binary'))
  logger.info(filePathEncrypted, 'password:', password)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      password,
      filePathEncrypted
    })
  }
}
