import { Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { StatusCodes, ConfigEntry, config } from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { NFTMetadata } from '../../models/NFTMetadata'

export const publishNftMetadata = async (
  nvm: Nevermined,
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
  logger.debug('HOOOOLA')
  logger.info(chalk.dim(`NFT Metadata JSON: ${jsonNFTMetadata}`))

  return StatusCodes.OK
}
