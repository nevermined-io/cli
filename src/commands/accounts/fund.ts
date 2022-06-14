import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, ConfigEntry } from '../../utils'
import { Logger } from 'log4js'
import chalk from 'chalk'

export const accountsFund = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, token } = argv

  logger.info(
    chalk.dim(`Funding account: '${chalk.whiteBright(account.getId())}'`)
  )

  if (token === 'both' || token === 'native') {
    try {
      await nvm.faucet.requestEth(account.getId())
      console.log(
        chalk.dim(`Funded ETH to ${chalk.whiteBright(account.getId())}`)
      )
    } catch (err) {
      console.log(
        chalk.red(
          `Funding ETH to ${chalk.whiteBright(account.getId())} failed! ${
            (err as Error).message
          }`
        )
      )

      if (verbose) {
        console.log(err)
      }
    }
  }

  if (token === 'erc20' || token === 'native') {
    try {
      await nvm.keeper.dispenser.requestTokens(100, account.getId())
      console.log(
        chalk.dim(`Funded Tokens to ${chalk.whiteBright(account.getId())}`)
      )
    } catch (err) {
      console.log(
        chalk.red(
          `Funding Tokens to ${chalk.whiteBright(account.getId())} failed! ${
            (err as Error).message
          }`
        )
      )
      if (verbose) {
        console.log(err)
      }
    }
  }

  return StatusCodes.OK
}
