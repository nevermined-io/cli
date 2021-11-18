import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, loadNevermined, ConfigEntry } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'

export const showAgreement = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, agreementId } = argv

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
