import {
  StatusCodes,
  findAccountOrFirst,
  loadNevermined,
  loadNftContract,
  printNftTokenBanner,
  ConfigEntry
} from '../../utils'
import chalk from 'chalk'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from 'log4js'

export const mintNft = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, account, uri } = argv
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(chalk.dim(`Minting NFT: '${chalk.whiteBright(did)}'`))

  const accounts = await nvm.accounts.list()

  const minterAccount = findAccountOrFirst(accounts, account)

  logger.debug(
    chalk.dim(`Using Minter: ${chalk.whiteBright(minterAccount.getId())}`)
  )

  const ddo = await nvm.assets.resolve(did)
  const register = (await nvm.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    owner: string
    url: string
    mintCap: number
  }

  logger.info(
    chalk.dim(
      `Minting NFT with service Endpoint! ${chalk.whiteBright(register.url)}`
    )
  )

  if (argv.nftType === '721') {
    // Minting NFT (ERC-721)

    const nft = loadNftContract(config, argv.nftAddress)
    if (verbose) {
      await printNftTokenBanner(nft)
    }

    const contractOwner: string = await nft.methods.owner().call()

    if (contractOwner.toLowerCase() !== minterAccount.getId().toLowerCase()) {
      logger.info(
        chalk.red(
          `ERROR: Account '${minterAccount.getId()}' is not the owner of the contract but '${contractOwner}' is`
        )
      )
      return StatusCodes.MINTER_NOT_OWNER
    }

    try {
      const oldOwner = await nft.methods.ownerOf(ddo.shortId()).call()
      logger.info(
        chalk.red(`ERROR: NFT already existing and owned by: '${oldOwner}'`)
      )
      return StatusCodes.NFT_ALREADY_OWNED
    } catch {}

    const to = await nvm.keeper.didRegistry.getDIDOwner(ddo.id)

    await nft.methods
      .mint(to, zeroX(ddo.shortId()), uri || register.url)
      .send({ from: minterAccount.getId() })

    logger.info(
      chalk.dim(
        `Minted NFT (ERC-721) '${chalk.whiteBright(
          ddo.id
        )}' to '${chalk.whiteBright(to)}'!`
      )
    )
  } else {
    // Minting NFT (ERC-721)

    if (argv.amount < 1 || argv.amount > register.mintCap) {
      logger.error(
        `Invalid number of ERC-1155 NFTs to mint. It should be >=1 and <cap`
      )
      return StatusCodes.ERROR
    }

    await nvm.keeper.didRegistry.mint(did, argv.amount, minterAccount.getId())

    logger.info(
      chalk.dim(
        `Minted  ${chalk.whiteBright(
          argv.amount
        )}' NFTs (ERC-1155) '${chalk.whiteBright(ddo.id)}'!`
      )
    )
  }

  return StatusCodes.OK
}
