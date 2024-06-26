import { NvmAccount, jsonReplacer, NFT1155Api, NFT721Api, NvmApp, zeroX } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const holdNft = async (
  nvmApp: NvmApp,
  consumerAccount: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { did } = argv

  const nftType = Number(argv.nftType)

  logger.info(
    chalk.dim(`Checks if an address is a NFT holder of the ${chalk.whiteBright(did)}`)
  )

  const ddo = await nvmApp.sdk.assets.resolve(did)  
  
  let isHolder = false
  let balance
  let nftAddress = ''
  const userAddress = argv.address ? argv.address : consumerAccount.getId()

  const nftApi = nftType === 721 ? NFT721Api : NFT1155Api

  try {
    nftAddress = nftApi.getNFTContractAddress(ddo) as string  
  } catch {
    nftAddress = nvmApp.sdk.keeper.nftUpgradeable.address
  }
  
  logger.info(`NFT Contract Address [${nftType}]: ${nftAddress}`)
  logger.info(`Address to check: ${userAddress}`)

  if (nftType === 721) {     
    const nft = await nvmApp.sdk.contracts.loadNft721(nftAddress)
    balance = await nft.balanceOf(userAddress)
    isHolder = balance > 0

  } else {
    logger.info(`Checking balance`)
    const nft = await nvmApp.sdk.contracts.loadNft1155Contract(nftAddress)
    balance = await nft.balance(userAddress, zeroX(ddo.shortId()))
    isHolder = balance > 0
  }

  if (isHolder)
    logger.info(`The user holds ${balance} edition/s of the ERC-${nftType} NFT`)
  else
    logger.info(`The user doesnt hold any ERC-${nftType} NFT`)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      isHolder,
      balance
    }, jsonReplacer)
  }

}
