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
  
  const { nftAddress } = argv

  logger.info(chalk.dim(`Clonning NFT contract from address ${nftAddress}...`))

  const nftType = Number(argv.nftType) === 721 ? 721 : 1155

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

  logger.debug(`Clonning NFT-${nftType} using params:`)
  logger.debug(`\tName: ${argv.name}`)
  logger.debug(`\tSymbol: ${argv.symbol}`)
  logger.debug(`\tURI: ${argv.uri}`)
  logger.debug(`\tCap: ${argv.cap}`)

  if (nftType === 721)  {
    if (!operators.includes(nvm.keeper.conditions.transferNft721Condition.getAddress()))
      operators.push(nvm.keeper.conditions.transferNft721Condition.getAddress())

    logger.debug(`\tOperators: ${JSON.stringify(operators)}`)

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
    if (!operators.includes(nvm.keeper.conditions.transferNftCondition.getAddress()))
      operators.push(nvm.keeper.conditions.transferNftCondition.getAddress())

    await nvm.contracts.loadNft1155(nftAddress)
    clonnedAddress = await nvm.nfts1155.getContract.createClone(
      argv.name, 
      argv.symbol, 
      argv.uri, 
      operators, 
      creatorAccount
    )    
  }

  logger.info(`Contract cloned at address: ${clonnedAddress}\n`)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      address: clonnedAddress
    })
  }
}
