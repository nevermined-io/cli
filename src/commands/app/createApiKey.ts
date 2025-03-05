import { NvmAccount, NvmApp, getFullZeroDevPermissions, createSessionKey, NvmApiKey } from '@nevermined-io/sdk'
import {
  StatusCodes,
  getNeverminedContractAbi,
} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'
import { createPublicClient, http, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'


export const createApiKey = async (
  nvmApp: NvmApp,
  publisherAccount: NvmAccount,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {

  const ZERO_PROJECT_ID = process.env.ZERO_PROJECT_ID || undefined
  if (!ZERO_PROJECT_ID) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Missing environment variable ZERO_PROJECT_ID`
    }
  }

  const NVM_BACKEND_URL = config.nvm.neverminedBackendUri || undefined
  if (!NVM_BACKEND_URL) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Missing Nevermined Backend URL`
    }
  }

  const BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${ZERO_PROJECT_ID}`
  
  const publicClient = createPublicClient({
    chain: nvmApp.sdk.client.chain,
    transport: http(BUNDLER_RPC),
  })
  logger.debug(`Public client created with chain: ${nvmApp.sdk.client.chain?.name}`)
  logger.debug(BUNDLER_RPC)
  
  logger.info(chalk.dim(`Creating a new NVM API Key ...`))


  const networkName = config.networkName || 'geth-localnet'
  const didRegistryAbi = getNeverminedContractAbi('DIDRegistry', networkName)
  const nftSalesTemplateAbi = getNeverminedContractAbi('NFTSalesTemplate', networkName)
  const nftPlansAbi = getNeverminedContractAbi('NFT1155SubscriptionUpgradeable', networkName)    

  logger.debug(`Generating permissions for the API Key ...`)
  const permissions = getFullZeroDevPermissions(
    didRegistryAbi.address, // DIDRegistry address
    nftSalesTemplateAbi.address, // Sales Template address
    config.erc20TokenAddress as `0x${string}`, // ERC20 address
    nftPlansAbi.address, // NFT1155 address
    nftPlansAbi.address,
  )
  
  logger.debug(`Permissions generated for network: ${networkName}`)
  logger.debug(`DIDRegistry: ${didRegistryAbi.address}`)
  logger.debug(`NFTSalesTemplate: ${nftSalesTemplateAbi.address}`)
  logger.debug(`NFTPlansAbi: ${nftPlansAbi.address}`)
  logger.debug(`ERC20 Address: ${config.erc20TokenAddress}`)
  // logger.debug(JSON.stringify(permissions))


  logger.debug(`Creating a new ZeroDev kernel client ...`)
  logger.debug(`Chain ID: ${nvmApp.sdk.client.chain?.id}`)
  
  const privateKey = toHex((publisherAccount.getAccountSigner() as any).getHdKey().privateKey)
  // const privateKey = toHex(publisherAccount.getAccountSigner()?.getHdKey().privateKey)
  
  const account = privateKeyToAccount(privateKey)
  logger.debug(`Private key Account: ${account.address}`)

  logger.debug(`Creating a new ZeroDev session key via account: ${account.address} ...`)
  const sessionKey = await createSessionKey(account, publicClient, permissions)    

  logger.debug(`Generating encrypted NVM API Key ...`)
  const encryptedNvmApiKey = await NvmApiKey.generate(
    nvmApp.sdk.utils.signature,
    publisherAccount,
    sessionKey,
    config.nvm.marketplaceAuthToken!,
    config.nvm.neverminedNodeAddress!,
    await nvmApp.sdk.services.node.getEcdsaPublicKey()
  )
  // logger.debug(encryptedNvmApiKey)

  logger.debug(`Registering NVM API Key ...`)
  const options = {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      name: argv.name,
      nvmKey: encryptedNvmApiKey
    })
  }
  
  // logger.debug(`POST ${NVM_BACKEND_URL} with options`)
  // logger.debug(JSON.parse(options.body))
  const _result = await fetch(`${NVM_BACKEND_URL}/api/v1/api-keys`, options)
  if (_result.status !== 200 && _result.status !== 201) {
    logger.error(`Error registering NVM API Key: ${_result.statusText}`)
    logger.error(await _result.text())
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Error registering NVM API Key: ${_result.statusText}`
    }
  }
    
  logger.info(chalk.green(`NVM API Key created successfully`))
  const keyResult = await _result.json()
  logger.info(chalk.dim(`API Key Wallet: ${chalk.yellow(keyResult.userWallet)}`))
  logger.info(chalk.dim(`API Key UserId: ${chalk.yellow(keyResult.userId)}`))
  logger.info(chalk.dim(`API Key Hash: ${chalk.yellow(keyResult.hash)}`))

  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      sessionKey,
      userWallet: keyResult.userWallet,
      userId: keyResult.userId,
      hash: keyResult.hash
    })
  }
}
