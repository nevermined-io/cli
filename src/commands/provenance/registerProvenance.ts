import { Account, generateId, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import chalk from 'chalk'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const registerProvenance = async (
  nvmApp: NvmApp,
  creatorAccount: Account,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { method } = argv

  logger.info(chalk.dim(`Registering provenance activity (${method}) ...`))

  logger.debug(chalk.dim(`Using account: '${creatorAccount.getId()}'\n`))

  const provenanceId = generateId()

  const ddo = await nvmApp.sdk.assets.resolve(argv.did)

  if (method === 'wasGeneratedBy') {
    logger.warn(
      chalk.dim(
        `The 'wasGeneratedBy' event is reported automatically during the asset registration`
      )
    )
    return { status: StatusCodes.OK }
  } else if (method === 'used') {
    await nvmApp.sdk.provenance.used(
      provenanceId,
      ddo.shortId(),
      argv.agentId,
      argv.activityId,
      argv.signature,
      argv.attributes,
      creatorAccount
    )
  } else if (method === 'wasDerivedFrom') {
    await nvmApp.sdk.provenance.wasDerivedFrom(
      provenanceId,
      ddo.shortId(),
      argv.relatedDid,
      argv.agentId,
      argv.activity,
      argv.attributes,
      creatorAccount
    )
  } else if (method === 'wasAssociatedWith') {
    await nvmApp.sdk.provenance.wasAssociatedWith(
      provenanceId,
      ddo.shortId(),
      argv.agentId,
      argv.activityId,
      argv.attributes,
      creatorAccount
    )
  } else if (method === 'ActedOnBehalf') {
    await nvmApp.sdk.provenance.actedOnBehalf(
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
