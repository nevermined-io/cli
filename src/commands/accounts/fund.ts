import { Account, BigNumber, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes } from '../../utils'
import { Logger } from 'log4js'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

const ERC20_DISPENSED_AMOUNT = BigNumber.from(100)

export const accountsFund = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose } = argv

  let errorMessage = ''
  const results: string[] = []
  logger.info(
    chalk.dim(`Funding account with ERC20: '${chalk.whiteBright(account.getId())}'`)
  )
  
  try {
    logger.info(
      chalk.dim(
        `Calling Dispenser with address ${nvm.keeper.dispenser.getAddress()} to get 
        ${ERC20_DISPENSED_AMOUNT} ERC20 tokens to ${chalk.whiteBright(account.getId())}`
      )
    )
    await nvm.keeper.dispenser.requestTokens(
      ERC20_DISPENSED_AMOUNT,
      account.getId()
    )
    logger.info(
      chalk.dim(
        `Funded ${ERC20_DISPENSED_AMOUNT} ERC20 tokens to ${chalk.whiteBright(
          account.getId()
        )}`
      )
    )
    results.push('erc20')
  } catch (err) {
    const erc20ErrorMessage = `Funding ERC20 Tokens to ${chalk.whiteBright(
      account.getId())} failed!`
    logger.error(erc20ErrorMessage)
    errorMessage = `${errorMessage}, ${erc20ErrorMessage}`
    if (verbose) {
      logger.debug(err)
    }
  }

  return {
    status: results.length > 0 ? StatusCodes.OK : StatusCodes.ERROR,
    errorMessage,
    results: JSON.stringify(results)
  }
}
