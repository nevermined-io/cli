import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import {
  StatusCodes,
  ConfigEntry,
  getNFTAddressFromInput,
  loadNftContract
} from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import IpfsHelper from '../../utils/IpfsHelper'
import { getDidHash } from '../../utils/utils'
import { didZeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'

export const getNftMetadata = async (
  nvm: Nevermined,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, did } = argv

  let nftAddress
  let metadataUrl
  logger.info(chalk.dim(`Getting NFT Metadata:`))

  // Resolves the DID
  const ddo = await nvm.assets.resolve(did)

  if (!ddo) {
    logger.error('Asset not found')
    return StatusCodes.DID_NOT_FOUND
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
    logger.error('Unable to identify if the asset has a ERC-1155 or 721 NFT')
    return StatusCodes.ERROR
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

  if (metadataUrl.startsWith('cid://')) {
    const metadataContent = await IpfsHelper.get(metadataUrl)
    logger.info(
      `NFT Metadata: \n${JSON.stringify(
        JSON.parse(metadataContent),
        null,
        2
      )}\n`
    )
  } else if (metadataUrl.startsWith('http')) {
    const metadataContent = await fetch(metadataUrl)
    logger.info(`NFT Metadata: \n${metadataContent}\n`)
  } else {
    logger.warn('Unable to understand URL format')
  }

  // Print the metadata

  return StatusCodes.OK
}
