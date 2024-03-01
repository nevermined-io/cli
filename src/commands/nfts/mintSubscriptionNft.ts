import { Account, NvmApp } from '@nevermined-io/sdk'
import {
  StatusCodes,
  loadSubscriptionContract,
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { ethers } from 'ethers'

export const mintSubscriptionNft = async (
  _nvmApp: NvmApp,
  minterAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { nftAddress } = argv

  logger.info(chalk.dim(`Minting Subscription NFT: '${chalk.whiteBright(nftAddress)}'`))

  logger.debug(
    chalk.dim(`Using Minter: ${chalk.whiteBright(minterAccount.getId())}`)
  )

  if (!ethers.isAddress(nftAddress)) {
    return {
      status: StatusCodes.ERROR,      
      errorMessage: `Invalid NFT address '${nftAddress}'`
    }
  }

  let receiver
  if (ethers.isAddress(argv.receiver)) receiver = argv.receiver
  else receiver = minterAccount.getId()

  logger.debug(
    chalk.dim(`Receiver: ${chalk.whiteBright(receiver)}`)
  )

  const tokenId = argv.tokenId && argv.tokenId.toString().length > 0 ? Number(argv.tokenId) : Number(0)
  
  const subscriptionContract = loadSubscriptionContract(config, nftAddress)
    
  await subscriptionContract["mint(address,uint256,uint256)"](receiver as string, tokenId, 0)


  logger.info(
    chalk.dim(
      `Minted NFT Subscription (ERC-721) '${chalk.whiteBright(
        nftAddress
      )}' to '${chalk.whiteBright(receiver)}'! with TokenId ${chalk.whiteBright(tokenId)}`
    )
  )

  return {
    status: StatusCodes.OK
  }
}
