import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import { Logger } from 'log4js'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const accountsFund = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, token } = argv

  let errorMessage = ''
  let results: string[] = []
  logger.info(
    chalk.dim(`Funding account: '${chalk.whiteBright(account.getId())}'`)
  )

  if (token === 'both' || token === 'native') {
    try {
      await nvm.faucet.requestEth(account.getId())
      logger.info(
        chalk.dim(
          `Funded Native token to ${chalk.whiteBright(account.getId())}`
        )
      )
      results.push('native')
    } catch (err) {
      errorMessage = `Funding Native token to ${chalk.whiteBright(
        account.getId()
      )} failed! ${(err as Error).message}`
      logger.info(chalk.red(errorMessage))

      if (verbose) {
        logger.debug(err)
      }
    }
  }

  if (token === 'erc20' || token === 'native') {
    try {
      await nvm.keeper.dispenser.requestTokens(100, account.getId())
      logger.info(
        chalk.dim(`Funded Tokens to ${chalk.whiteBright(account.getId())}`)
      )
      results.push('erc20')
    } catch (err) {
      const erc20ErrorMessage = `Funding Tokens to ${chalk.whiteBright(
        account.getId()
      )} failed! ${(err as Error).message}`
      logger.info(chalk.red(erc20ErrorMessage))
      errorMessage = `${errorMessage}, ${erc20ErrorMessage}`
      if (verbose) {
        logger.info(err)
      }
    }
  }

  return {
    status: results.length > 0 ? StatusCodes.OK : StatusCodes.ERROR,
    errorMessage,
    results: JSON.stringify(results)
  }
}
