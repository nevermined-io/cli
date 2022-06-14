import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, ConfigEntry, config } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { NFTMetadata } from '../../models/NFTMetadata'
import IpfsHelper from '../../utils/IpfsHelper'

export const publishNftMetadata = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network } = argv

  logger.info(chalk.dim(`Uploading NFT Metadata:`))

  let nftMetadata: NFTMetadata = {
    image: argv.image,
    name: argv.name,
    external_link: argv.externalUrl
  }

  if (argv.royalties != '') {
    if (argv.royalties < 0 || argv.royalties > 100) {
      logger.error('Royalties must be between 0 and 100%')
      return StatusCodes.ERROR
    }
    nftMetadata.seller_fee_basis_points = argv.royalties * 100
  }

  if (argv.description != '') nftMetadata.description = argv.description
  if (argv.animationUrl != '') nftMetadata.animation_url = argv.animationUrl
  if (argv.youtubeUrl != '') nftMetadata.youtube_url = argv.youtubeUrl
  if (argv.royaltiesReceiver != '')
    nftMetadata.fee_recipient = argv.royaltiesReceiver

  const jsonNFTMetadata = JSON.stringify(nftMetadata)
  logger.debug(chalk.dim(`NFT Metadata JSON: ${jsonNFTMetadata}`))

  try {
    const hash = await IpfsHelper.add(jsonNFTMetadata)
    const cidHash = `cid://${hash}`

    logger.info(
      chalk.dim(`NFT Metadata Created: ${chalk.yellowBright(cidHash)}\n`)
    )
  } catch (err) {
    logger.error('Unable to add files')
    logger.error(
      `Unable to create the Metadata file into IPFS. Error: ${
        (err as Error).message
      }`
    )
    return StatusCodes.ERROR
  }

  return StatusCodes.OK
}
