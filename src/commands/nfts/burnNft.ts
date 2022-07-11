import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  StatusCodes,
  loadNftContract,
  printNftTokenBanner,
  getNFTAddressFromInput
} from '../../utils'
import chalk from 'chalk'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const burnNft = async (
  nvm: Nevermined,
  burnerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, did, uri } = argv

  logger.info(chalk.dim(`Burning NFT: '${chalk.whiteBright(did)}'`))

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
      return {
        status: StatusCodes.NFT_ALREADY_OWNED,
        errorMessage: `ERROR: NFT already existing and owned by: '${oldOwner}'`
      }
    } catch {}

    const to = await nvm.keeper.didRegistry.getDIDOwner(ddo.id)

    // Some ERC-721 NFT contracts don't implement the burn function
    // Se we are checking if it's already there
    const burnAbiDefinition = nft.options.jsonInterface.filter(
      (item) => item.name === 'burn'
    )

    if (burnAbiDefinition.length === 0) {
      return {
        status: StatusCodes.OK,
        errorMessage: `The NFT contract doesn't expose a 'burn' method`
      }
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
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Invalid number of ERC-1155 NFTs to burn. It should be >1`
      }
    }

    await nvm.keeper.didRegistry.burn(did, argv.amount, burnerAccount.getId(), {
      gasMultiplier: config.nvm.gasMultiplier
    })

    logger.info(
      chalk.dim(
        `Burned  ${chalk.whiteBright(
          argv.amount
        )}' NFTs (ERC-1155) '${chalk.whiteBright(ddo.id)}'!`
      )
    )
  }

  return {
    status: StatusCodes.OK
  }
}
