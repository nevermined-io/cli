import { Account, BigNumber, Nevermined } from '@nevermined-io/sdk'
import {
  StatusCodes
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { ethers } from 'ethers'

export const cloneNft = async (
  nvm: Nevermined,
  creatorAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  
  const { nftAddress, nftType } = argv

  logger.info(chalk.dim(`Clonning NFT contract from address ${nftAddress}...`))

  if (!ethers.utils.isAddress(nftAddress))
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Invalid contract address ${nftAddress}`
    }

  const operators: string[] = []
  argv.operators.forEach((_operator: string) => {
    if (ethers.utils.isAddress(_operator)) operators.push(_operator)
  })

  let clonnedAddress

  if (nftType == 721)  {
    await nvm.contracts.loadNft721(nftAddress)
    clonnedAddress = await nvm.nfts721.getContract.createClone(
      argv.name, 
      argv.symbol, 
      argv.uri, 
      BigNumber.from(argv.cap), 
      operators, 
      creatorAccount
    )
  } else {
    await nvm.contracts.loadNft721(nftAddress)
    clonnedAddress = await nvm.nfts721.getContract.createClone(
      argv.name, 
      argv.symbol, 
      argv.uri, 
      BigNumber.from(argv.cap), 
      operators, 
      creatorAccount
    )    
  }

  logger.info(`Contract clonned into address: ${clonnedAddress}\n`)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      address: clonnedAddress
    })
  }
}
