import { getConfig, loadNevermined, StatusCodes } from '../../utils'
import chalk from 'chalk'

export const accountsFund = async (argv: any): Promise<number> => {
  const { verbose, network, account } = argv

  if (verbose)
    console.log(chalk.dim(`Funding account: '${chalk.whiteBright(account)}'`))

  const config = getConfig(network as string)
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  try {
    await nvm.faucet.requestEth(account)
    console.log(chalk.dim(`Funded ETH to ${chalk.whiteBright(account)}`))
  } catch (err) {
    console.log(
      chalk.red(
        `Funding ETH to ${chalk.whiteBright(account)} failed! ${
          (err as Error).message
        }`
      )
    )

    if (verbose) console.log(err)
  }

  try {
    await nvm.keeper.dispenser.requestTokens(100, account)
    console.log(chalk.dim(`Funded Tokens to ${chalk.whiteBright(account)}`))
  } catch (err) {
    console.log(
      chalk.red(
        `Funding Tokens to ${chalk.whiteBright(account)} failed! ${
          (err as Error).message
        }`
      )
    )
    if (verbose) console.log(err)
  }

  return StatusCodes.OK
}
