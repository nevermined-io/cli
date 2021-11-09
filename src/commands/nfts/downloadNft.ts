import {
  StatusCodes,
  findAccountOrFirst,
  getConfig,
  loadNevermined,
  loadNftContract,
  printNftTokenBanner
} from '../../utils'
import chalk from 'chalk'

export const downloadNft = async (argv: any): Promise<number> => {
  const { verbose, network, did, consumer, destination } = argv

  console.info(chalk.dim('Downloading NFT ...'))

  if (destination) {
    console.info(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))
  }

  const config = getConfig(network as string)
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  const nft = loadNftContract(config, argv.tokenAddress)
  if (verbose) {
    await printNftTokenBanner(nft)
  }

  const accounts = await nvm.accounts.list()
  const consumerAccount = findAccountOrFirst(accounts, consumer)

  console.debug(chalk.dim(`Using consumer: '${consumerAccount.getId()}'`))

  await nvm.nfts.access(did, consumerAccount, destination)

  return StatusCodes.OK
}
