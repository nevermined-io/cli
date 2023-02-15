import { Account, Nevermined } from '@nevermined-io/sdk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { aes_decryption_256 } from '@nevermined-io/sdk-dtp/dist/utils'
import chalk from 'chalk'

export const decryptFile = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  logger.info(chalk.dim(`Decrypting file`))
  const { file, password } = argv
  const encrypted = fs.readFileSync(file).toString('binary')
  const decrypted = aes_decryption_256(encrypted, password)

  const filePathDecrypted = file + '.decrypted'
  fs.writeFileSync(filePathDecrypted, Buffer.from(decrypted, 'binary'))
  logger.info(filePathDecrypted)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      filePathDecrypted
    })
  }
}
