import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import fs from 'fs'
import { Logger } from 'log4js'
import { StatusCodes } from '../../utils'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { aes_decryption_256 } from '@nevermined-io/nevermined-sdk-dtp/dist/utils'

export const decryptFile = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { file, password } = argv
  const encrypted = fs.readFileSync(file).toString('binary')
  const decrypted = aes_decryption_256(encrypted, password)

  const filePathDecrypted = file + '.decrypted'
  fs.writeFileSync(filePathDecrypted, decrypted)
  logger.info(`File decrypted successfully`)
  logger.info(filePathDecrypted)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      filePathDecrypted
    })
  }
}
