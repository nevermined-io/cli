import { StatusCodes, getConfig, loadNevermined } from '../../utils'
import chalk from 'chalk'

export const showAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, agreementId } = argv

  const config = getConfig(network as string)
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  console.info(
    chalk.dim(
      `Loading information for agreementId: '${chalk.whiteBright(agreementId)}'`
    )
  )

  const { did } = await nvm.keeper.agreementStoreManager.getAgreement(
    agreementId
  )

  const ddo = await nvm.assets.resolve(did)

  console.info(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))

  await nvm.keeper.templates.accessTemplate.printAgreementStatus(agreementId)

  const { accessConsumer, accessProvider } =
    await nvm.keeper.templates.accessTemplate.getAgreementData(agreementId)

  console.info(
    chalk.dim(`Access Consumer: '${chalk.whiteBright(accessConsumer)}'`)
  )
  console.info(
    chalk.dim(`Access Provider: '${chalk.whiteBright(accessProvider)}'`)
  )

  console.info('\n')

  return StatusCodes.OK
}
