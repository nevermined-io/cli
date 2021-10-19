import {
  Constants,
  StatusCodes,
  getConfig,
  loadNevermined,
  loadNftContract,
  printNftTokenBanner
} from '../../utils'
import { DDO } from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'
import {
  getAssetRewardsFromDDOByService,
  zeroX
} from '@nevermined-io/nevermined-sdk-js/dist/node/utils'

export const showNft = async (argv: any): Promise<number> => {
  const { verbose, network, did } = argv

  console.log(
    chalk.dim(`Loading information for DID: '${chalk.whiteBright(did)}'`)
  )

  const config = getConfig(network as string)
  const { nvm, token } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  const ddo = await nvm.assets.resolve(did)

  const nft = loadNftContract(config)
  if (verbose) {
    await printNftTokenBanner(nft)
  }

  const [contractTokenUri, contractTokenOwner] = await Promise.all([
    nft.methods.tokenURI(zeroX(ddo.shortId())).call(),
    nft.methods.ownerOf(zeroX(ddo.shortId())).call()
  ])

  const { url } = (await nvm.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    url: string
  }

  const metadata = ddo.findServiceByType('metadata')

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : 'ETH'
  const price =
    getAssetRewardsFromDDOByService(ddo, 'nft721-sales').getTotalPrice() /
    10 ** decimals

  console.log(chalk.dim(`====== ${chalk.whiteBright('Nevermined')} ======`))
  console.log(chalk.dim(`====== ${chalk.whiteBright(ddo.id)} ======`))
  console.log(chalk.dim(`Url: ${chalk.whiteBright(url)}`))
  console.log(
    chalk.dim(`Name: ${chalk.whiteBright(metadata.attributes.main.name)}`)
  )
  console.log(
    chalk.dim(`Author: ${chalk.whiteBright(metadata.attributes.main.author)}`)
  )
  console.log(
    chalk.dim(`License: ${chalk.whiteBright(metadata.attributes.main.license)}`)
  )
  console.log(
    chalk.dim(
      `Files: ${chalk.whiteBright(metadata.attributes.main.files?.length || 1)}`
    )
  )
  console.log(
    chalk.dim(`Price: ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  )

  console.log('\n')

  console.log(chalk.dim(`====== ${chalk.whiteBright('NFT Contract')} ======`))
  console.log(
    chalk.dim(`====== ${chalk.whiteBright(zeroX(ddo.shortId()))} ======`)
  )
  console.log(chalk.dim(`Url: ${chalk.whiteBright(contractTokenUri)}`))
  console.log(chalk.dim(`Owner: ${chalk.whiteBright(contractTokenOwner)}`))

  console.log('\n')

  if (verbose) {
    console.log(chalk.dim(DDO.serialize(ddo)))
  }

  return StatusCodes.OK
}
