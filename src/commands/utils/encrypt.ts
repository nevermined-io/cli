import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { aes_encryption_256 } from '@nevermined-io/nevermined-sdk-dtp/dist/utils'
import chalk from 'chalk'

export const encryptFile = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  logger.info(chalk.dim(`Encrypting file`))
  const { file, password } = argv
  const encrypted = fs.readFileSync(file).toString('binary')
  const decrypted = aes_encryption_256(encrypted, password)

  const filePathEncrypted = file + '.encrypted'
  fs.writeFileSync(filePathEncrypted, Buffer.from(decrypted, 'binary'))
  logger.info(filePathEncrypted, 'password:', password)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      filePathEncrypted
    })
  }
}
