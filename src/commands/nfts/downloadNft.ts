import {
  StatusCodes,
  getConfig,
  loadNftContract,
  findAccountOrFirst,
  printNftTokenBanner,
  loadNevermined
} from '../../utils'
import chalk from 'chalk'

export const downloadNft = async (argv: any): Promise<number> => {
  const { verbose, network, did, consumer, destination } = argv

  console.log(chalk.dim(`Downloading NFT ...`))

  if (destination)
    console.log(chalk.dim(`Downloading to: ${chalk.whiteBright(destination)}`))

  const config = getConfig(network as string)
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  const nft = loadNftContract(config)
  if (verbose) await printNftTokenBanner(nft)

  const accounts = await nvm.accounts.list()
  let consumerAccount = findAccountOrFirst(accounts, consumer)

  if (verbose)
    console.log(chalk.dim(`Using consumer: '${consumerAccount.getId()}'`))

  await nvm.nfts.access(did, consumerAccount, destination)

  return StatusCodes.OK
}
