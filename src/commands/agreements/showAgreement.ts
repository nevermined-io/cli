import {
  StatusCodes,
  getConfig,
  loadNevermined,
  ConfigEntry
} from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'

export const showAgreement = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, agreementId } = argv

  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(
    chalk.dim(
      `Loading information for agreementId: '${chalk.whiteBright(agreementId)}'`
    )
  )

  const { did } = await nvm.keeper.agreementStoreManager.getAgreement(
    agreementId
  )

  const ddo = await nvm.assets.resolve(did)

  logger.info(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))

  await nvm.keeper.templates.accessTemplate.printAgreementStatus(agreementId)

  const { accessConsumer, accessProvider } =
    await nvm.keeper.templates.accessTemplate.getAgreementData(agreementId)

  logger.info(
    chalk.dim(`Access Consumer: '${chalk.whiteBright(accessConsumer)}'`)
  )
  logger.info(
    chalk.dim(`Access Provider: '${chalk.whiteBright(accessProvider)}'`)
  )

  logger.info('\n')

  return StatusCodes.OK
}
