import { Account, NvmApp } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { Logger } from 'log4js'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

const ERC20_DISPENSED_AMOUNT = 100n

export const accountsFund = async (
  nvmApp: NvmApp,
  account: Account,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const nvm = nvmApp.sdk
  const { verbose } = argv

  const addressToFund = argv.addressToFund ? argv.addressToFund : account.getId()
  let errorMessage = ''
  const results: string[] = []
  logger.info(
    chalk.dim(`Funding account with ERC20: '${chalk.whiteBright(addressToFund)}'`)
  )
  
  try {
    logger.info(
      chalk.dim(
        `Calling Dispenser with address ${nvm.keeper.dispenser.address} to get 
        ${ERC20_DISPENSED_AMOUNT} ERC20 tokens to ${chalk.whiteBright(addressToFund)}`
      )
    )
    // const scale = 10n ** BigInt(await nvm.keeper.token.decimals())
    await nvm.keeper.dispenser.requestTokens(
      ERC20_DISPENSED_AMOUNT,
      addressToFund
    )
    logger.info(
      chalk.dim(
        `Funded ${ERC20_DISPENSED_AMOUNT} ERC20 tokens to ${chalk.whiteBright(
          addressToFund
        )}`
      )
    )
    results.push('erc20')
  } catch (err) {
    const erc20ErrorMessage = `Funding ERC20 Tokens to ${chalk.whiteBright(
      addressToFund)} failed!`
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
