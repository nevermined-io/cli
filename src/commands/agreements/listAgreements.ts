import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, ConfigEntry } from '../../utils'
import { ConditionState } from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'
import { Logger } from 'log4js'

export const listAgreements = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did } = argv

  logger.info(
    chalk.dim(`Loading agreements for DID: '${chalk.whiteBright(did)}'\n`)
  )
  const ddo = await nvm.assets.resolve(did)

  const agreements = await nvm.agreements.getAgreements(ddo.shortId())

  if (agreements.length === 0) {
    logger.info(chalk.dim(`No agreements for '${chalk.whiteBright(ddo.id)}'!`))
  }

  // agreements.sort((a, b) => a.blockNumberUpdated - b.blockNumberUpdated)

  for (const agreement of agreements) {
    const status = await nvm.agreements.status(agreement.agreementId)

    logger.info(
      chalk.dim(
        `Template: ${chalk.whiteBright(
          await nvm.keeper.getTemplateByAddress(agreement.templateId)
            .contractName
        )} AgreementID: '${chalk.whiteBright(agreement.agreementId)}'`
      )
    )

    logger.info(
      chalk.dim(
        `Status: ${chalk.whiteBright(
          Object.keys(status)
            .map((s) => `${s}: ${ConditionState[status[s]]}`)
            .join(' ')
        )}`
      )
    )

    logger.info('\n')
  }

  return StatusCodes.OK
}
