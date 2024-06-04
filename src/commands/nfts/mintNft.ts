import { NvmAccount, NvmApp, zeroX } from '@nevermined-io/sdk'
import {
  StatusCodes,
  printNftTokenBanner,
  getNFTAddressFromInput
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { FunctionFragment, ethers } from 'ethers'

export const mintNft = async (
  nvmApp: NvmApp,
  minterAccount: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, did, uri } = argv

  const nftType = Number(argv.nftType)

  logger.info(chalk.dim(`Minting NFT: '${chalk.whiteBright(did)}'`))

  logger.debug(
    chalk.dim(`Using Minter: ${chalk.whiteBright(minterAccount.getId())}`)
  )

  const ddo = await nvmApp.sdk.assets.resolve(did)
  const register = (await nvmApp.sdk.keeper.didRegistry.getDIDRegister(
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

  let receiver
  if (ethers.isAddress(argv.receiver)) receiver = argv.receiver
  else receiver = minterAccount.getId()

  if (nftType === 721) {
    // Minting NFT (ERC-721)

    const nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales') || nvmApp.sdk.nfts721.getContract.address

    const nft = await nvmApp.sdk.contracts.loadNft721(nftAddress)
    if (verbose) {
      await printNftTokenBanner(nft.getContract)
    }

    // We check the number of parameters expected by the mint function to adapt the parameters
    const mintAbiDefinition = nft.nftContract.contract.interface.fragments
      .filter((item: FunctionFragment) => item.name === 'mint')
      .map((entry: { inputs: any }) => entry.inputs)

    if (mintAbiDefinition.length == 3) {
      logger.debug(`Minting using the To address + tokenId + tokenURI`)
      await nft.mintWithURL(
        receiver,
        zeroX(ddo.shortId()),
        uri || register.url,
        minterAccount
      )
    } else {
      logger.debug(`Minting using the tokenId`)
      await nft.mint(zeroX(ddo.shortId()), minterAccount)
    }

    logger.info(
      chalk.dim(
        `Minted NFT (ERC-721) '${chalk.whiteBright(
          ddo.id
        )}' to '${chalk.whiteBright(receiver)}'!`
      )
    )
  } else {
    // Minting NFT (ERC-1155)
    
    if (argv.amount < 1 || argv.amount > register.mintCap) {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Invalid number of ERC-1155 NFTs to mint. It should be >=1 and < cap`
      }
    }
    
    const nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft-sales') || nvmApp.sdk.nfts1155.getContract.address
    const nft = await nvmApp.sdk.contracts.loadNft1155(nftAddress)

    await nft.mint(did, BigInt(argv.amount), receiver, minterAccount)
    

    logger.info(
      chalk.dim(
        `Minted  ${chalk.whiteBright(
          argv.amount
        )}' NFTs (ERC-1155) '${chalk.whiteBright(ddo.id)}'!`
      )
    )
  }

  return {
    status: StatusCodes.OK
  }
}
