import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, findAccountOrFirst, loadNevermined } from '../../utils'
import chalk from 'chalk'
import { generateId } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { ConfigEntry } from '../../utils/config'
import { Logger } from 'log4js'

export const registerProvenance = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, account, method } = argv

  logger.info(chalk.dim(`Registering provenance activity (${method}) ...`))

  const accounts = await nvm.accounts.list()
  const creatorAccount = findAccountOrFirst(accounts, account)

  logger.debug(chalk.dim(`Using account: '${creatorAccount.getId()}'\n`))

  const provenanceId = generateId()

  const ddo = await nvm.assets.resolve(argv.did)

  if (method === 'wasGeneratedBy') {
    logger.warn(
      chalk.dim(
        `The 'wasGeneratedBy' event is reported automatically during the asset registration`
      )
    )
    return StatusCodes.OK
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
    logger.error(chalk.dim(`W3C Method (${method}) not recognized`))
    return StatusCodes.ERROR
  }

  logger.info(
    chalk.dim(
      `Registed W3C Provenance event with Provenance Id: ${provenanceId}`
    )
  )

  return StatusCodes.OK
}
