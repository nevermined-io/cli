import {
  StatusCodes,
  findAccountOrFirst,
  loadNevermined,
  loadNftContract,
  printNftTokenBanner,
  ConfigEntry,
  getNFTAddressFromInput
} from '../../utils'
import chalk from 'chalk'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from 'log4js'

export const burnNft = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, account, uri } = argv
  const { nvm } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.info(chalk.dim(`Burning NFT: '${chalk.whiteBright(did)}'`))

  const accounts = await nvm.accounts.list()

  const burnerAccount = findAccountOrFirst(accounts, account)

  logger.debug(
    chalk.dim(`Using Account: ${chalk.whiteBright(burnerAccount.getId())}`)
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
      `Burning NFT with service Endpoint! ${chalk.whiteBright(register.url)}`
    )
  )

  if (argv.nftType === '721') {
    // Burning NFT (ERC-721)

    const nftAddress = getNFTAddressFromInput(
      argv.nftAddress,
      ddo,
      'nft721-sales'
    )

    const nft = loadNftContract(config, nftAddress)
    if (verbose) {
      await printNftTokenBanner(nft)
    }

    try {
      const oldOwner = await nft.methods.ownerOf(ddo.shortId()).call()
      logger.info(
        chalk.red(`ERROR: NFT already existing and owned by: '${oldOwner}'`)
      )
      return StatusCodes.NFT_ALREADY_OWNED
    } catch {}

    const to = await nvm.keeper.didRegistry.getDIDOwner(ddo.id)

    // Some ERC-721 NFT contracts don't implement the burn function
    // Se we are checking if it's already there
    const burnAbiDefinition = nft.options.jsonInterface.filter(
      (item) => item.name === 'burn'
    )

    if (burnAbiDefinition.length === 0) {
      logger.warn(`The NFT contract doesn't expose a 'burn' method`)
      return StatusCodes.OK
    }

    await nft.methods
      .burn(zeroX(ddo.shortId()))
      .send({ from: burnerAccount.getId() })

    logger.info(
      chalk.dim(
        `Burned NFT (ERC-721) '${chalk.whiteBright(
          ddo.id
        )}' to '${chalk.whiteBright(to)}'!`
      )
    )
  } else {
    // Burning NFT (ERC-1155)

    if (argv.amount < 1) {
      logger.error(`Invalid number of ERC-1155 NFTs to burn. It should be >1`)
      return StatusCodes.ERROR
    }

    await nvm.keeper.didRegistry.burn(did, argv.amount, burnerAccount.getId())

    logger.info(
      chalk.dim(
        `Burned  ${chalk.whiteBright(
          argv.amount
        )}' NFTs (ERC-1155) '${chalk.whiteBright(ddo.id)}'!`
      )
    )
  }

  return StatusCodes.OK
}
