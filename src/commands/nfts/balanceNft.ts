import { Account, didZeroX, jsonReplacer, Nevermined, zeroX } from '@nevermined-io/sdk'
import { StatusCodes } from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const balanceNft = async (
  nvm: Nevermined,
  consumerAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { nftAddress } = argv

  const nftType = Number(argv.nftType)
   
  let balance
  const userAddress = argv.address ? argv.address : consumerAccount.getId()

  logger.info(
    chalk.dim(`Gets the balance of the account ${userAddress} for the NFT-${nftType} with address ${chalk.whiteBright(nftAddress)}`)
  )  
 
  if (nftType === 721) {     
    const nft = await nvm.contracts.loadNft721(nftAddress)
    balance = await nft.balanceOf(userAddress)
    logger.info(`The user holds ${balance} token/s of the ERC-${nftType} NFT`)
  } else {    
    const nft = await nvm.contracts.loadNft1155Contract(nftAddress)    
    balance = await nft.balance(userAddress, zeroX(didZeroX(argv.did)))
    logger.info(`The user holds ${balance} edition/s of the ERC-${nftType} NFT`)
  }    
  
  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      balance
    }, jsonReplacer)
  }

}
