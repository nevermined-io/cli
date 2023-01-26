import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import { ConditionState } from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const listAgreements = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  logger.info(
    chalk.dim(`Loading agreements for DID: '${chalk.whiteBright(did)}'\n`)
  )
  const ddo = await nvm.assets.resolve(did)

  const agreements = await nvm.agreements.getAgreements(ddo.shortId())

  if (agreements.length === 0) {
    logger.info(chalk.dim(`No agreements for '${chalk.whiteBright(ddo.id)}'!`))
  }

  for (const agreement of agreements) {
    try {
      const status = await nvm.agreements.status(agreement.agreementId, true)
      const contractName = await nvm.keeper.getTemplateByAddress(agreement.templateId).contractName

      logger.info(
        chalk.dim(
          `Template: ${chalk.whiteBright(contractName
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

    } catch (err) {
      logger.info(`Error getting status for agreement: ${agreement.agreementId} - ${err} `)
    }
  
    logger.info('\n')
  }

  return {
    status: StatusCodes.OK,
    results: '{}' //JSON.stringify(agreements.map((a) => a.agreementId))
  }
}
