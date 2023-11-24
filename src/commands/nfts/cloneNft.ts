import { Account, Nevermined, Nft1155Contract, Nft721Contract } from '@nevermined-io/sdk'
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

  if (!ethers.isAddress(nftAddress))
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Invalid contract address ${nftAddress}`
    }

  const operators: string[] = []
  
  argv.operators.forEach((_operator: string) => {
    if (ethers.isAddress(_operator)) operators.push(_operator)
  })

  let clonnedAddress

  logger.debug(`Clonning NFT-${nftType} using params:`)
  logger.debug(`\tName: ${argv.name}`)
  logger.debug(`\tSymbol: ${argv.symbol}`)
  logger.debug(`\tURI: ${argv.uri}`)
  logger.debug(`\tCap: ${argv.cap}`)

  if (!operators.includes(nvm.keeper.didRegistry.address))
    operators.push(nvm.keeper.didRegistry.address)

  if (nftType === 721)  {
    if (!operators.includes(nvm.keeper.conditions.transferNft721Condition.address))
      operators.push(nvm.keeper.conditions.transferNft721Condition.address)

    logger.debug(`\tOperators: ${JSON.stringify(operators)}`)

    const nftContract = await Nft721Contract.getInstance(
      (nvm.keeper as any).instanceConfig,
      nftAddress,
    )
    clonnedAddress = await nftContract.createClone(
      argv.name, 
      argv.symbol, 
      argv.uri, 
      BigInt(argv.cap), 
      operators, 
      creatorAccount
    )
  } else {
    if (!operators.includes(nvm.keeper.conditions.transferNftCondition.address))
      operators.push(nvm.keeper.conditions.transferNftCondition.address)



      const nftContract = await Nft1155Contract.getInstance(
        (nvm.keeper as any).instanceConfig,
        nftAddress,
      )
      
      clonnedAddress = await nftContract.createClone(
        argv.name, 
        argv.symbol, 
        argv.uri, 
        operators, 
        creatorAccount
      )    
  }

  logger.info(`Contract cloned at address: ${clonnedAddress}\n`)
  logger.info(`using operators: ${JSON.stringify(operators)}\n`)

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      address: clonnedAddress
    })
  }
}
