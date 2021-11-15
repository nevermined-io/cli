import {
  StatusCodes,
  findAccountOrFirst,
  loadNevermined,
  ConfigEntry,
  printNftTokenBanner
} from '../../utils'
import chalk from 'chalk'
import { Logger } from 'log4js'
import Web3Provider from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider'
import * as fs from 'fs'

export const deployNft = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, account, abiPath } = argv

  logger.info(chalk.dim('Deploying NFT (ERC-721) contract...'))

  const { nvm, token } = await loadNevermined(config, network, verbose)

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  const web3 = Web3Provider.getWeb3(config.nvm)

  const accounts = await nvm.accounts.list()
  const creatorAccount = findAccountOrFirst(accounts, account)

  logger.debug(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`))

  const content = fs.readFileSync(abiPath)
  const artifact = JSON.parse(content.toString())
  artifact
  const contract = new web3.eth.Contract(artifact.abi)
  const isZos = !!contract.methods.initialize

  let args: string[] = []
  if (argv.name != '' && argv.symbol != '') args = [argv.name, argv.symbol]

  const deployData = {
    data: artifact.bytecode,
    arguments: isZos ? undefined : args
  }

  const gas = await contract.deploy(deployData).estimateGas({
    from: creatorAccount.getId()
  })
  const sendConfig = {
    from: creatorAccount.getId(),
    gas: gas,
    gasPrice: '10000'
  }

  const contractInstance = await contract.deploy(deployData).send(sendConfig)

  if (isZos) {
    let gasEstimation = await contractInstance.methods
      .initialize(...args)
      .estimateGas({
        from: creatorAccount.getId()
      })
    await contractInstance.methods.initialize(...args).send({
      from: creatorAccount.getId(),
      gas: gasEstimation,
      gasPrice: '10000'
    })
  }

  await printNftTokenBanner(contractInstance)

  logger.info(
    `Contract deployed into address: ${contractInstance.options.address}\n`
  )

  return StatusCodes.OK
}
