import {
  StatusCodes,
  getConfig,
  formatDid,
  loadNftContract,
  Constants,
  printNftTokenBanner,
  loadNevermined
} from '../../utils'
import { DDO, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'

export const showAgreement = async (argv: any): Promise<number> => {
  const { verbose, network, agreementId } = argv

  console.log(
    chalk.dim(
      `Loading information for agreementId: '${chalk.whiteBright(agreementId)}'`
    )
  )

  const config = getConfig(network as string)
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  const nft = loadNftContract(config)
  if (verbose) await printNftTokenBanner(nft)

  const { did } = await nvm.keeper.agreementStoreManager.getAgreement(
    agreementId
  )

  const ddo = await nvm.assets.resolve(did)

  console.log(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`))

  await nvm.keeper.templates.nft721SalesTemplate.printAgreementStatus(
    agreementId
  )

  const { accessConsumer, accessProvider } =
    await nvm.keeper.templates.nft721SalesTemplate.getAgreementData(agreementId)

  console.log(
    chalk.dim(`Access Consumer: '${chalk.whiteBright(accessConsumer)}'`)
  )
  console.log(
    chalk.dim(`Access Provider: '${chalk.whiteBright(accessProvider)}'`)
  )

  console.log('\n')

  return StatusCodes.OK
}
