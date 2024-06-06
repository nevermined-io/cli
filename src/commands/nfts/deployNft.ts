import { NvmAccount, Nft1155Contract, Nft721Contract, NvmApp, deployContractInstance, isValidAddress } from '@nevermined-io/sdk'
import {
  StatusCodes,
  printNftTokenBanner,
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import * as fs from 'fs'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const deployNft = async (
  nvmApp: NvmApp,
  creatorAccount: NvmAccount,
  argv: any,
  _config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { abiPath, operators } = argv

  const nftType = Number(argv.nftType)
  
  logger.info(chalk.dim('Deploying NFT contract...'))

  logger.debug(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`))

  const addressesToApprove: string[] = []
  logger.info(JSON.stringify(operators))
  // INFO: We allow the Nevermined Node to fulfill the transfer condition in behalf of the user
  // Typically this only needs to happen once per NFT contract
  operators.forEach((_addr: string) => {
    _addr = _addr.replace('\\', '')
    logger.debug(`Checking address: ${_addr}`)
    if (isValidAddress(_addr)) addressesToApprove.push(_addr)
  })

  console.log('addressesToApprove', addressesToApprove)
  // // eslint-disable-next-line no-constant-condition
  // if (true)
  //   return {
  //     status: StatusCodes.ERROR
  //   }

  const content = fs.readFileSync(abiPath)
  const artifact = JSON.parse(content.toString())
  
  const args: string[] = []

  args.push(creatorAccount.getId())
  args.push(nvmApp.sdk.keeper.didRegistry.address)
  args.push(argv.name)
  args.push(argv.symbol)
  args.push(argv.uri)

  if (nftType === 721)  {
    args.push(argv.cap)
  }
  args.push(nvmApp.sdk.keeper.nvmConfig.address)

  logger.debug(`NFT Type: ${nftType}`)
  logger.debug(`Params : ${JSON.stringify(args)}`)

  let contractAddress: string
  let contractInstance: any
  try {
    contractInstance = await deployContractInstance(artifact, creatorAccount, args, nvmApp.sdk.client)
    contractAddress = contractInstance.address
  } catch (error) {
    logger.error(`Error deploying contract: ${(error as Error).message}`)
    return {
      status: StatusCodes.ERROR,
      errorMessage: (error as Error).message
    }
  }
  

  logger.info(`Contract deployed into address: ${contractAddress}\n`)

  if (nftType === 721)  {
    const nft721 = await nvmApp.sdk.contracts.loadNft721(
      contractAddress
    )
  
    await printNftTokenBanner(nft721.getContract) 
    
    try {
      // INFO: We allow transferNFT condition to mint NFTs
      // Typically this only needs to happen once per NFT contract
      const erc721Contract = await Nft721Contract.getInstance(
        (nvmApp.sdk.keeper as any).instanceConfig,
        contractAddress
    )  
      await erc721Contract.grantOperatorRole(
        nvmApp.sdk.keeper.conditions.transferNft721Condition.address,
        creatorAccount
      )
      logger.info(`Adding TransferNFT721Condition with address ${nvmApp.sdk.keeper.conditions.transferNft721Condition.address} as operator`)  
    } catch (error) {
      logger.warn(`Unable to add TransferNFT721Condition as operator: ${(error as Error).message}`)
    }
    
    for await (const addr of addressesToApprove)  {
      await nft721.setApprovalForAll(addr, true, creatorAccount)        
      const isApproved = await nft721.isApprovedForAll(
        creatorAccount.getId(),
        addr
      )
      logger.info(`Address (${addr}) Approved: ${isApproved}\n`)
    }
  } else {

    const nft1155 = await nvmApp.sdk.contracts.loadNft1155(
      contractAddress
    )    
    
    try {
      // INFO: We allow transferNFT condition to mint NFTs
      // Typically this only needs to happen once per NFT contract
      const erc1155Contract = await Nft1155Contract.getInstance(
        (nvmApp.sdk.keeper as any).instanceConfig,
        contractAddress
    )  
      await erc1155Contract.grantOperatorRole(
        nvmApp.sdk.keeper.conditions.transferNftCondition.address,
        creatorAccount
      )
      logger.info(`Adding TransferNFTCondition with address ${nvmApp.sdk.keeper.conditions.transferNftCondition.address} as operator`)  
    } catch (error) {
      logger.warn(`Unable to add TransferNFTCondition as operator: ${(error as Error).message}`)
    }
    
    for await (const addr of addressesToApprove)  {
      logger.info(`Adding approval for address: ${addr}`)
      await nft1155.setApprovalForAll(addr, true, creatorAccount)        
      const isApproved = await nft1155.isApprovedForAll(
        creatorAccount.getId(),
        addr
      )
      logger.info(`Address (${addr}) Approved: ${isApproved}\n`)
    }

  }

  

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      address: contractAddress
    })
  }
}
