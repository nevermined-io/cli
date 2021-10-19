import {
  StatusCodes,
  getConfig,
  loadNftContract,
  printNftTokenBanner,
  loadNevermined
} from '../../utils'
import { ConditionState } from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'

export const listAgreements = async (argv: any): Promise<number> => {
  const { verbose, network, did } = argv

  const config = getConfig(network as string)
  const { nvm } = await loadNevermined(config, network, verbose)
  const ddo = await nvm.assets.resolve(did)

  console.log(
    chalk.dim(`Loading agreements for DID: '${chalk.whiteBright(ddo.id)}'\n`)
  )

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  const nft = loadNftContract(config)
  if (verbose) await printNftTokenBanner(nft)

  const agreements = await nvm.agreements.getAgreements(ddo.shortId())

  if (agreements.length === 0)
    console.log(chalk.dim(`No agreements for '${chalk.whiteBright(ddo.id)}'!`))

  agreements.sort((a, b) => a.blockNumberUpdated - b.blockNumberUpdated)

  for (const agreement of agreements) {
    const status = await nvm.agreements.status(agreement.agreementId)

    console.log(
      chalk.dim(
        `Template: ${chalk.whiteBright(
          await nvm.keeper.getTemplateByAddress(agreement.templateId)
            .contractName
        )} AgreementID: '${chalk.whiteBright(agreement.agreementId)}'`
      )
    )

    console.log(
      chalk.dim(
        `Last updated: ${chalk.whiteBright(
          agreement.blockNumberUpdated
        )} Status: ${chalk.whiteBright(
          Object.keys(status)
            .map((s) => `${s}: ${ConditionState[status[s]]}`)
            .join(' ')
        )}`
      )
    )

    console.log('\n')
  }

  return StatusCodes.OK
}
