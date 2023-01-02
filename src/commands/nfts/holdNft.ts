import { Account, Nevermined, NFT1155Api, NFT721Api } from '@nevermined-io/nevermined-sdk-js'
import { loadNFT1155Contract, StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'

export const holdNft = async (
  nvm: Nevermined,
  consumerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did, nftType } = argv

  logger.info(
    chalk.dim(`Checks if an address is a NFT holder of the ${chalk.whiteBright(did)}`)
  )

  const ddo = await nvm.assets.resolve(did)  
  
  let isHolder = false
  let balance
  let nftAddress = ''
  const userAddress = argv.address ? argv.address : consumerAccount.getId()

  const nftApi = nftType == '721' ? NFT721Api : NFT1155Api

  try {
    nftAddress = nftApi.getNFTContractAddress(ddo) as string  
  } catch {
    nftAddress = nvm.keeper.nftUpgradeable.address
  }
  
  logger.info(`NFT Contract Address: ${nftAddress}`)
  logger.info(`Address to check: ${userAddress}`)

  if (nftType == 721) {     
    const nft = await nvm.contracts.loadNft721(nftAddress)
    balance = await nft.balanceOf(new Account(userAddress))
    isHolder = balance.gt(0)

  } else {
    logger.info(`Checking balance`)
    const nftContract = loadNFT1155Contract(config, nftAddress)
    balance = await nftContract.balanceOf(userAddress, zeroX(ddo.shortId()))
    isHolder = balance.gt(0)
  }

  if (isHolder)
    logger.info(`The user holds ${balance} edition/s of the ERC-${argv.nftType} NFT`)
  else
    logger.info(`The user doesnt hold any ERC-${argv.nftType} NFT`)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      isHolder,
      balance
    })
  }

}
