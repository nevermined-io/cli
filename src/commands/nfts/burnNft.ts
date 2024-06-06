import { NvmAccount, NvmApp } from '@nevermined-io/sdk'
import {
  StatusCodes,
  printNftTokenBanner,
  getNFTAddressFromInput
} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const burnNft = async (
  nvmApp: NvmApp,
  burnerAccount: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, did, nftType} = argv

  const tokenId = nftType == 721 && argv.tokenId ? argv.tokenId : argv.did

  logger.info(chalk.dim(`Burning NFT: '${chalk.whiteBright(did)}'`))

  logger.debug(
    chalk.dim(`Using Account: ${chalk.whiteBright(burnerAccount.getId())}`)
  )

  const ddo = await nvmApp.sdk.assets.resolve(did)

  if (nftType == 721) {
    // Burning NFT (ERC-721)

    const nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales') || nvmApp.sdk.nfts721.getContract.address

    await nvmApp.sdk.contracts.loadNft721(nftAddress)

    if (verbose) {
      await printNftTokenBanner(nvmApp.sdk.nfts721.getContract)
    }
    await nvmApp.sdk.nfts721.burn(tokenId, burnerAccount)

    logger.info(
      chalk.dim(`Burned NFT (ERC-721) with tokenId: ${chalk.whiteBright(tokenId)} `)
    )
  } else {
    // Burning NFT (ERC-1155)

    if (argv.amount < 1) {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Invalid number of ERC-1155 NFTs to burn. It should be >= 1`
      }
    }

    const nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales') || nvmApp.sdk.nfts1155.getContract.address
    const nft = await nvmApp.sdk.contracts.loadNft1155(nftAddress)

    await nft.burn(tokenId, BigInt(argv.amount), burnerAccount)
    
    logger.info(
      chalk.dim(
        `Burned  ${chalk.whiteBright(
          argv.amount
        )}' NFTs (ERC-1155) '${chalk.whiteBright(tokenId)}'!`
      )
    )
  }

  return {
    status: StatusCodes.OK
  }
}
