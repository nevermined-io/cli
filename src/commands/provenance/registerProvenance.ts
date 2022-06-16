import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import { generateId } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'
import chalk from 'chalk'

export const registerProvenance = async (
  nvm: Nevermined,
  creatorAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, method } = argv

  logger.info(chalk.dim(`Registering provenance activity (${method}) ...`))

  logger.debug(chalk.dim(`Using account: '${creatorAccount.getId()}'\n`))

  const provenanceId = generateId()

  const ddo = await nvm.assets.resolve(argv.did)

  if (method === 'wasGeneratedBy') {
    logger.warn(
      chalk.dim(
        `The 'wasGeneratedBy' event is reported automatically during the asset registration`
      )
    )
    return { status: StatusCodes.OK }
  } else if (method === 'used') {
    await nvm.provenance.used(
      provenanceId,
      ddo.shortId(),
      argv.agentId,
      argv.activityId,
      argv.signature,
      argv.attributes,
      creatorAccount
    )
  } else if (method === 'wasDerivedFrom') {
    await nvm.provenance.wasDerivedFrom(
      provenanceId,
      ddo.shortId(),
      argv.relatedDid,
      argv.agentId,
      argv.activity,
      argv.attributes,
      creatorAccount
    )
  } else if (method === 'wasAssociatedWith') {
    await nvm.provenance.wasAssociatedWith(
      provenanceId,
      ddo.shortId(),
      argv.agentId,
      argv.activityId,
      argv.attributes,
      creatorAccount
    )
  } else if (method === 'ActedOnBehalf') {
    await nvm.provenance.actedOnBehalf(
      provenanceId,
      ddo.shortId(),
      argv.agentId,
      argv.agentInvolved,
      argv.activity,
      argv.signature,
      argv.attributes,
      creatorAccount
    )
  } else {
    return {
      status: StatusCodes.NOT_IMPLEMENTED,
      errorMessage: `W3C Method (${method}) not recognized`
    }
  }

  logger.info(
    chalk.dim(
      `Registed W3C Provenance event with Provenance Id: ${provenanceId}`
    )
  )

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      provenanceId
    })
  }
}
