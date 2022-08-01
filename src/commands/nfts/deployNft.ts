import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
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
  const { verbose, network, account, abiPath } = argv

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
  // const contract = new web3.eth.Contract(artifact.abi)
  // const isZos = !!contract.methods.initialize

  let args: string[] = argv.params.filter(
    (_key: string) => _key !== '' && _key !== undefined
  )

  if (args.length > 0) logger.info(`Using Params: ${JSON.stringify(args)}`)

  const deployData = {
    data: artifact.bytecode,
    arguments: isZos ? undefined : args
  }

  // Set gas limit and gas price, using the default Ropsten provider
  const price = ethers.utils.formatUnits(await web3.getGasPrice(), 'gwei')
  const sendOptions = {
    gasLimit: 100000,
    gasPrice: ethers.utils.parseUnits(price, 'gwei')
  }

  const argument = isZos ? [] : args
  const contractInstance: ethers.Contract = await contract.deploy(
    ...argument
  )
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
  // ](...args, sendOptions)
    const contractReceipt: ContractReceipt = await transactionResponse.wait()
    if (contractReceipt.status !== 1) {
      return {
        status: StatusCodes.ERROR,
        errorMessage: `Error deploying contract ${artifact.name}`
      }
    }
  }

  // const gas = await contract.deploy(deployData).estimateGas({
  //   from: creatorAccount.getId()
  // })
  // const sendConfig = {
  //   from: creatorAccount.getId(),
  //   gas: gas,
  //   gasPrice: '10000'
  // }

  // const contractInstance = await contract.deploy(deployData).send(sendConfig)

  // if (isZos) {
  //   let gasEstimation = await contractInstance.methods
  //     .initialize(...args)
  //     .estimateGas({
  //       from: creatorAccount.getId()
  //     })
  //   await contractInstance.methods.initialize(...args).send({
  //     from: creatorAccount.getId(),
  //     gas: gasEstimation,
  //     gasPrice: '10000'
  //   })
  // }

  await printNftTokenBanner(contractInstance)


  logger.info(
    `Contract deployed into address: ${contractInstance.address}\n`
  )

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      address: contractInstance.address
    })
  }
}
