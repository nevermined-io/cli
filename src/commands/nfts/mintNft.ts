import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  StatusCodes,
  findAccountOrFirst,
  loadNftContract,
  printNftTokenBanner,
  ConfigEntry,
  getNFTAddressFromInput
} from '../../utils'
import chalk from 'chalk'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from 'log4js'

export const mintNft = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did, account, uri } = argv

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

    // Mint function is out of the ERC-721, so there are typically 3 implementations:
    // 1. toAddress + tokenId
    // 2. toAddress + tokenId + tokenURI
    // 3. tokenId
    // We check the number of parameters expected by the mint function to adapt the parameters
    const mintAbiDefinition = nft.options.jsonInterface
      .filter((item) => item.name === 'mint')
      .map((entry) => entry.inputs)

    if (mintAbiDefinition.length == 3) {
      logger.debug(`Minting using the To address + tokenId + tokenURI`)
      await nft.methods
        .mint(to, zeroX(ddo.shortId()), uri || register.url)
        .send({ from: minterAccount.getId() })
    } else if (mintAbiDefinition.length == 2) {
      logger.debug(`Minting using the To address + tokenId`)
      await nft.methods
        .mint(to, zeroX(ddo.shortId()))
        .send({ from: minterAccount.getId() })
    } else if (mintAbiDefinition.length == 1) {
      logger.debug(`Minting using the tokenId`)
      await nft.methods
        .mint(zeroX(ddo.shortId()))
        .send({ from: minterAccount.getId() })
    } else {
      logger.error(`Unable to mint NFT, minting function not recognized`)
      return StatusCodes.ERROR
    }

    logger.info(
      chalk.dim(
        `Minted NFT (ERC-721) '${chalk.whiteBright(
          ddo.id
        )}' to '${chalk.whiteBright(to)}'!`
      )
    )
  } else {
    // Minting NFT (ERC-1155)

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
