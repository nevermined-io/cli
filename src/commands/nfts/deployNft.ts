import { Account, Nevermined, Nft721 } from '@nevermined-io/nevermined-sdk-js'
import SubscriptionNft721 from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/contracts/SubscriptionNft721'
import { ContractReceipt, ethers } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import {
  StatusCodes,
  printNftTokenBanner,
  getSignatureOfMethod
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import Web3Provider from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider'
import * as fs from 'fs'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const deployNft = async (
  nvm: Nevermined,
  creatorAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { account, abiPath } = argv

  logger.info(chalk.dim('Deploying NFT (ERC-721) contract...'))

  const web3 = Web3Provider.getWeb3(config.nvm)

  logger.debug(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`))

  const content = fs.readFileSync(abiPath)
  const artifact = JSON.parse(content.toString())

  const signer = web3.getSigner(account)
  const contract = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  )

  const isZos = contract.interface.fragments.some(
    (f) => f.name === 'initialize'
  )

  const args: string[] = argv.params.filter(
    (_key: string) => _key !== '' && _key !== undefined
  )

  if (args.length > 0) logger.info(`Using Params: ${JSON.stringify(args)}`)

  const argument = isZos ? [] : args
  const contractInstance: ethers.Contract = await contract.deploy(...argument)
  await contractInstance.deployTransaction.wait()

  if (isZos) {
    const methodSignature = getSignatureOfMethod(
      contractInstance,
      'initialize',
      args
    )
    const contract = contractInstance.connect(signer)
    const transactionResponse: TransactionResponse = await contract[
      methodSignature
    ](...args)
    const contractReceipt: ContractReceipt = await transactionResponse.wait()
    if (contractReceipt.status !== 1) {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Error deploying contract ${artifact.name}`
      }
    }
  }
  const nft721: Nft721 = await nvm.contracts.loadNft721(
    contractInstance.address
  )

  await printNftTokenBanner(nft721)

  logger.info(`Contract deployed into address: ${contractInstance.address}\n`)

  
  try {
    // INFO: We allow transferNFT condition to mint NFTs
    // Typically this only needs to happen once per NFT contract
    const erc721Contract = await SubscriptionNft721.getInstance(
      (nvm.keeper as any).instanceConfig,
      contractInstance.address
  )  
    await erc721Contract.addMinter(
      nvm.keeper.conditions.transferNft721Condition.address,
      creatorAccount.getId()
    )
    logger.info(`Adding TransferNFT721Condition with address ${nvm.keeper.conditions.transferNft721Condition.address} as minter`)  
  } catch (error) {
    logger.warn(`Unable to add TransferNFT721Condition as minter: ${(error as Error).message}`)
  }



  // INFO: We allow the gateway to fulfill the transfer condition in behalf of the user
  // Typically this only needs to happen once per NFT contract
  const addressesToApprove: string[] = argv.approve.filter(
    (_key: string) => _key !== '' && _key !== undefined
  )
  if (config.nvm.gatewayAddress) addressesToApprove.push(config.nvm.gatewayAddress!)

  for await (const addr of addressesToApprove)  {
    await nft721.setApprovalForAll(addr, true, creatorAccount)        
    const isApproved = await nft721.isApprovedForAll(
      creatorAccount.getId(),
      addr
    )
    logger.info(`Address (${addr}) Approved: ${isApproved}\n`)
  }
  

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      address: contractInstance.address
    })
  }
}
