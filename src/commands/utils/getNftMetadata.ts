import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  StatusCodes,
  getNFTAddressFromInput,
  loadNftContract
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import IpfsHelper from '../../utils/IpfsHelper'
import { getDidHash } from '../../utils/utils'
import { didZeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import fetch from 'cross-fetch'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const getNftMetadata = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, did } = argv

  let nftAddress
  let metadataUrl
  logger.info(chalk.dim(`Getting NFT Metadata:`))

  // Resolves the DID
  const ddo = await nvm.assets.resolve(did)

  if (!ddo) {
    return {
      status: StatusCodes.DID_NOT_FOUND,
      errorMessage: `Asset not found`
    }
  }

  // Check if the NFT is 721 or 1155
  let is1155
  if (
    ddo.findServiceByType('nft-access') ||
    ddo.findServiceByType('nft-sales')
  ) {
    is1155 = true
    nftAddress = nvm.keeper.nftUpgradeable.address
    logger.debug(
      `The DID has a ERC-1155 NFT attached with address ${nftAddress}`
    )
  } else if (
    ddo.findServiceByType('nft721-access') ||
    ddo.findServiceByType('nft721-sales')
  ) {
    is1155 = false
    nftAddress = getNFTAddressFromInput(argv.nftAddress, ddo, 'nft721-sales')
    logger.debug(
      `The DID has a ERC-721 NFT attached with address ${nftAddress}`
    )
  } else {
    return {
      status: StatusCodes.DID_NOT_FOUND,
      errorMessage: 'Unable to identify if the asset has a ERC-1155 or 721 NFT'
    }
  }

  // Return the Metadata url
  // logger.info(JSON.stringify(nftContract.methods))
  const didHash = didZeroX(getDidHash(did))
  if (is1155) {
    metadataUrl = await nvm.keeper.nftUpgradeable.uri(did)
  } else {
    const nftContract = loadNftContract(config, nftAddress)
    metadataUrl = await nftContract.methods.tokenURI(didHash).call()
  }

  // Resolve the metadata
  logger.info(
    chalk.dim(`NFT Metadata URL: ${chalk.yellowBright(metadataUrl)}\n`)
  )

  let metadataContent = '{}'
  if (metadataUrl.startsWith('cid://')) {
    const metadata = await IpfsHelper.get(metadataUrl)
    metadataContent = await metadata.text()
  } else if (metadataUrl.startsWith('http')) {
    const metadata = await fetch(metadataUrl)
    metadataContent = await metadata.text()
  } else {
    return {
      status: StatusCodes.ERROR,
      errorMessage: 'Unable to understand URL format'
    }
  }

  logger.info(
    `NFT Metadata: \n${JSON.stringify(JSON.parse(metadataContent), null, 2)}\n`
  )

  return {
    status: StatusCodes.OK
  }
}
