import { Account, Nft1155Contract, Nft721Contract, NvmApp } from '@nevermined-io/sdk'
import { ContractTransactionReceipt, ContractTransactionResponse, FunctionFragment, ethers } from 'ethers'
import {
  StatusCodes,
  printNftTokenBanner,
  getSignatureOfMethod
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import * as fs from 'fs'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const deployNft = async (
  nvmApp: NvmApp,
  creatorAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { abiPath } = argv

  const nftType = Number(argv.nftType)
  
  logger.info(chalk.dim('Deploying NFT contract...'))

  logger.debug(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`))

  const content = fs.readFileSync(abiPath)
  const artifact = JSON.parse(content.toString())
  
  const signer = config.signer
  const contract = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  )

  const isZos = contract.interface.fragments.some(
    (f: FunctionFragment) => f.name === 'initialize'
  )

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

  const argument = isZos ? [] : args
  const contractInstance: ethers.BaseContract = await contract.deploy(...argument)
  await contractInstance.waitForDeployment()
  

  if (isZos) {
    const methodSignature = getSignatureOfMethod(
      contractInstance,
      'initialize',
      args
    )
    const contract = contractInstance.connect(signer)
    const transactionResponse: ContractTransactionResponse = await contract[
      methodSignature
    ](...args)
    const contractReceipt: ContractTransactionReceipt = await transactionResponse.wait()
    if (contractReceipt.status !== 1) {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Error deploying contract ${artifact.name}`
      }
    }
  }

  logger.info(`Contract deployed into address: ${await contractInstance.getAddress()}\n`)

  // INFO: We allow the Nevermined Node to fulfill the transfer condition in behalf of the user
  // Typically this only needs to happen once per NFT contract
  const addressesToApprove: string[] = argv.approve.filter(
    (_key: string) => _key !== '' && _key !== undefined
  )
  //if (config.nvm.neverminedNodeAddress) addressesToApprove.push(config.nvm.neverminedNodeAddress!)


  if (nftType === 721)  {
    const nft721 = await nvmApp.sdk.contracts.loadNft721(
      await contractInstance.getAddress()
    )
  
    await printNftTokenBanner(nft721.getContract) 
    
    try {
      // INFO: We allow transferNFT condition to mint NFTs
      // Typically this only needs to happen once per NFT contract
      const erc721Contract = await Nft721Contract.getInstance(
        (nvmApp.sdk.keeper as any).instanceConfig,
        await contractInstance.getAddress()
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
      await contractInstance.getAddress()
    )    
    
    try {
      // INFO: We allow transferNFT condition to mint NFTs
      // Typically this only needs to happen once per NFT contract
      const erc1155Contract = await Nft1155Contract.getInstance(
        (nvmApp.sdk.keeper as any).instanceConfig,
        await contractInstance.getAddress()
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
      address: await contractInstance.getAddress()
    })
  }
}
