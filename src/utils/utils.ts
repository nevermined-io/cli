import { Contract, FunctionFragment, HDNodeWallet, Wallet, getAddress } from 'ethers'
import {
  Account,
  DDO,
  Nevermined,  
  Nft721Contract,
  noZeroX,
  ProvenanceMethod,
  ProvenanceRegistry,
  QueryResult,
  ServiceType,
  Token,
  ConditionType,
  makeAccount
} from '@nevermined-io/sdk'
import chalk from 'chalk'
import { Constants } from './enums'
import { ARTIFACTS_PATH, logger } from './config'

import { Configuration, Logger } from 'log4js'
import { ethers } from 'ethers'
import { ConfigEntry } from '../models/ConfigDefinition'
import * as fs from 'fs'

export const loadNevermined = async (
  config: ConfigEntry,
  network: string,
  verbose = false
): Promise<Nevermined> => {
  try {
    const nvm = await Nevermined.getInstance({
      ...config.nvm,
      verbose: verbose ? verbose : config.nvm.verbose
    })
    
    const accounts = await nvm.accounts.list()
    logger.debug(`Accounts: ${accounts.length}`)
    accounts.map((a) => logger.debug(`ACCOUNT ${a.getId()}`))

    // await nvm.keeper.loadCurveRoyaltiesInstance()
    if (!nvm.keeper) {
      logger.error(
        chalk.red(`ERROR: Nevermined could not connect to '${network}'\n`)
      )
    }    
    return nvm
  } catch (error) {
    logger.error(chalk.red(`ERROR: ${(error as Error).message}\n`))
    process.exit(1)
  }

}

export const loginMarketplaceApi = async (
  nvm: Nevermined,
  account: Account
): Promise<boolean> => {  
  const clientAssertion = await nvm.utils.jwt.generateClientAssertion(account)  
  await nvm.services.marketplace.login(clientAssertion)  
  return true
}

export const loadNeverminedConfigContract = (config: ConfigEntry): Contract => {
  const abiNvmConfig = `${ARTIFACTS_PATH}/NeverminedConfig.${config.networkName?.toLowerCase()}.json`
  const nvmConfigAbi = JSON.parse(fs.readFileSync(abiNvmConfig).toString())

  return new ethers.Contract(
    nvmConfigAbi.address,
    nvmConfigAbi.abi,
    config.signer
  )
}

export const loadSubscriptionContract = (config: ConfigEntry, nftAddress: string): Contract => {
  const abiNvmConfig = `${ARTIFACTS_PATH}/NFT721SubscriptionUpgradeable.${config.networkName?.toLowerCase()}.json`
  const nvmConfigAbi = JSON.parse(fs.readFileSync(abiNvmConfig).toString())

  return new ethers.Contract(
    nftAddress,
    nvmConfigAbi.abi,
    config.signer
  )
}

export const getNFTAddressFromInput = (
  nftAddress: string | undefined,
  ddo: DDO,
  serviceType: ServiceType = 'nft-sales',
  conditionType: ConditionType = 'transferNFT'
): string | undefined => {

  if (!nftAddress || !ethers.isAddress(nftAddress)) {

    const salesService = ddo.findServiceByType(serviceType)
    if (!salesService) throw new Error(`No NFT contract address found`)

    const condition = DDO.findServiceConditionByName(salesService, conditionType)

    const _contractParam = condition.parameters.find(
      (p: { name: string }) => p.name === '_contractAddress' || p.name === '_contract'
    )
    
    return _contractParam?.value as string
  } else {
    return nftAddress
  }
}

export const getSignatureOfMethod = (
  contractInstace: ethers.BaseContract,
  methodName: string,
  args: any[]
): string => {
  const methods = contractInstace.interface.fragments.filter(
    (f: FunctionFragment) => f.name === methodName,
  )
  const foundMethod =
    methods.find((f) => f.inputs.length === args.length) || methods[0]
  if (!foundMethod) {
    throw new Error(`Method "${methodName}" not found in contract`)
  }
  return foundMethod.format()
}

export const getDidHash = (did: string): string => did.replace('did:nv:', '')

export const formatDid = (did: string): string => `did:nv:${noZeroX(did)}`


export const getWalletFromJSON = (
  keyfilePath: string, 
  password: string
): Wallet | HDNodeWallet => {
  const data = fs.readFileSync(keyfilePath)
  const keyfile = JSON.parse(data.toString())
  return ethers.Wallet.fromEncryptedJsonSync(keyfile, password)  
}

export const loadAccountFromSeedWords = (
  seedWords: string,
  index = 0
): Account => {
  const wallet = makeAccount(seedWords, index)
  return new Account(wallet.address)
}

export const findAccountOrFirst = (
  accounts: Account[],
  address: string
): Account => {
  let account
  
  accounts.map((a) => logger.info(`ACCOUNT ${a.getId()}`))

  if (ethers.isAddress(address)) {
    account = accounts.find(
      (a: Account) => a.getId().toLowerCase() === address.toLowerCase()
    )

    if (!account) {
      logger.debug(
        chalk.dim(
          `Account provided (${address}) not found, using : ${chalk.redBright(
            accounts[0].getId()
          )}`
        )
      )
    } else {
      return account
    }
  } else {
    logger.debug(
      chalk.dim(
        `Account address not valid, using : ${chalk.redBright(account)}`
      )
    )
    // throw new Error(`${StatusCodes[StatusCodes.ADDRESS_NOT_AN_ACCOUNT]}`)
  }

  return accounts[0]
}

export const printWallet = (wallet: ethers.HDNodeWallet) => {
  logger.info(
    chalk.dim(`Wallet address: ${chalk.yellowBright(wallet.address)}`)
  )
  logger.info(
    chalk.dim(`Wallet public key: ${chalk.yellowBright(wallet.publicKey)}`)
  )
  logger.info(
    chalk.dim(`Wallet private key: ${chalk.yellowBright(wallet.privateKey)}`)
  )
  logger.info(chalk.dim(`Wallet Seed Words:`))

  logger.info(
    chalk.dim(`  Phrase: ${chalk.yellowBright(wallet.mnemonic?.phrase)}`)
  )
  logger.info(chalk.dim(`  Path: ${chalk.yellowBright(wallet.path)}`))

  logger.info(
    chalk.dim(
      `\nIf you want to use it in the CLI run:\n${chalk.yellow(
        'export SEED_WORDS="' + wallet.mnemonic?.phrase + '"'
      )}\n`
    )
  )


}

export const printNftTokenBanner = async (nft721: Nft721Contract) => {
  const { address } = nft721

  logger.info('\n')
  logger.info(chalk.dim('===== NFT Contract ====='))
  logger.info(chalk.dim(`Address: ${chalk.whiteBright(address)}`))

  let owner = ''
  try {
    
    owner = await nft721.call('owner', [])
    logger.info(chalk.dim(`Owner: ${chalk.whiteBright(owner)}`))
  } catch {
    logger.info(`Owner: The NFT doesn't expose the owner`)
  }

  try {
    const name = await nft721.call('name', [])
    logger.info(chalk.dim(`Name: ${chalk.whiteBright(name)}`))
  } catch {
    logger.info(`Name: The NFT doesn't expose the name`)
  }
  try {
    const symbol = await await nft721.call('symbol', [])
    logger.info(chalk.dim(`Symbol: ${chalk.whiteBright(symbol)}`))
  } catch {
    logger.info(`Symbol: The NFT doesn't expose the symbol`)
  }
}

export const printTokenBanner = async (token: Token | null) => {
  if (token === null) {
    printNativeTokenBanner()
  } else {
    const { address } = token
    if (
      address.toLowerCase() === Constants.ZeroAddress.toLowerCase() ||
      address.toLowerCase() === Constants.ShortZeroAddress.toLowerCase()
    ) {
      printNativeTokenBanner()
    } else {
      printErc20TokenBanner(token)
    }
  }
}

export const printProvenanceEntry = (
  provenanceId: string,
  provenance: ProvenanceRegistry,
  logger: Logger
) => {
  logger.info(chalk.dim(`Provenance Id: ${provenanceId}`))
  logger.info(chalk.dim(`Method: ${ProvenanceMethod[provenance.method]}`))
  logger.info(chalk.dim(`DID: ${provenance.did}`))
  logger.info(chalk.dim(`Related DID: ${provenance.relatedDid}`))
  logger.info(chalk.dim(`Created by: ${provenance.createdBy}`))
  logger.info(chalk.dim(`Agent: ${provenance.agentId}`))
  logger.info(chalk.dim(`Agent involved: ${provenance.agentInvolvedId}`))
  logger.info(chalk.dim(`Activity: ${provenance.activityId}`))
  logger.info(chalk.dim(`Signature: ${provenance.signatureDelegate}`))
  logger.info(chalk.dim(`Block Number: ${provenance.blockNumberUpdated}`))
}

export const printProvenanceEvents = (
  events: {
    method: number
    provId: string
    did: string
    agentId: string
    activityId: string
    relatedDid: string
    agentInvolvedId: string
    attributes?: string
    blockNumberUpdated: number
  }[],
  logger: Logger
) => {
  logger.info(`# of Provenance events: ${chalk.bgBlue(events.length)}`)
  logger.info(`--------------------------`)

  events.map((e) => {
    logger.info(`\t Provenance Id: ${chalk.yellowBright(e.provId)}`)
    logger.info(`\t Method: ${chalk.yellowBright(ProvenanceMethod[e.method])}`)
    logger.info(`\t DID: ${e.did}`)
    logger.info(`\t Related DID: ${e.relatedDid}`)
    logger.info(`\t Agent: ${e.agentId}`)
    logger.info(`\t Agent involved: ${e.agentInvolvedId}`)
    logger.info(`\t Activity: ${e.activityId}`)
    logger.info(`\t Attributes: ${e.attributes}`)
    logger.info(`\t Block Number: ${chalk.bgRed(e.blockNumberUpdated)})`)
    logger.info(`-----`)
  })
}

export const getExtraInputParams = (argv: any) => {
  const _extra: { [k: string]: any } = {}
  process.argv.filter( (k: string) => k.startsWith('--+'))
  .forEach( (k: string) => {
    const paramKey = k.replace('--+', '')
     _extra[paramKey] = argv[`+${paramKey}`]
  })  
  return _extra
}

export const printSearchResult = async (
  queryResult: QueryResult,
  logger: Logger
) => {
  logger.info(
    chalk.dim(
      `Total Results: ${chalk.yellow(queryResult.totalResults.value)} - Total Pages: ${chalk.yellow(queryResult.totalPages)}`
    )
  )
  logger.info(chalk.dim(`Page: ${chalk.yellow(queryResult.page)}`))
  logger.info(chalk.dim(`---------------------------`))

  queryResult.results.forEach((_ddo: DDO) => {
    const _metadata = _ddo.findServiceByType('metadata')
    logger.info(
      chalk.dim(
        `${chalk.green(_metadata.attributes.main.type)} - ${_metadata.attributes.main.name} - ${chalk.blue(_metadata.serviceEndpoint)}`
      )
    )
  })
  logger.info(chalk.dim(`---------------------------`))
}

export const printNativeTokenBanner = async () => {
  try {
    logger.info(chalk.dim('\n===== Native Token (ETH, MATIC, etc) ====='))
    logger.info(
      chalk.dim(`Decimals: ${chalk.whiteBright(Constants.ETHDecimals)}\n`)
    )
  } catch (error) {
    logger.warn(`Error printing Native token banner: ${(error as Error).message}`)
  }
}

export const printErc20TokenBanner = async (token: Token) => {
  try {
    const { address } = token

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.totalSupply()
    ])
  
    logger.info(chalk.dim('\n===== ERC20 Contract ====='))
    logger.info(chalk.dim(`Address: ${chalk.whiteBright(address)}`))
    logger.info(chalk.dim(`Name: ${chalk.whiteBright(name)}`))
    logger.info(chalk.dim(`Symbol: ${chalk.whiteBright(symbol)}`))
    logger.info(chalk.dim(`Decimals: ${chalk.whiteBright(decimals)}`))
    logger.info(
      chalk.dim(
        `Total Supply: ${chalk.whiteBright(totalSupply / 10n ** BigInt(decimals))}`
      )
    )
  } catch (error) {
    logger.warn(`Error printing ERC20 token banner: ${(error as Error).message}`)
  }

}

export const getContractNameFromAddress = async (
  nvm: Nevermined,
  contractAddress: string
): Promise<string | undefined> => {
  const platformVersions = await nvm.utils.versions.get()

  let contractName = undefined
  Object.keys(platformVersions.sdk.contracts || {}).forEach((_name) => {
    if (
      platformVersions.sdk.contracts![_name] &&
      contractAddress.toLowerCase() ===
        platformVersions.sdk.contracts![_name].toLowerCase()
    ) {
      contractName = _name
    }
  })
  return contractName
}

export const loadToken = async (
  nvm: Nevermined,
  config: ConfigEntry,
  verbose: boolean
): Promise<Token | null> => {
  // default to no token
  let token: Token | null = null

  if (
    config.erc20TokenAddress!.toLowerCase() ===
      Constants.ZeroAddress.toLowerCase() ||
    config.erc20TokenAddress!.toLowerCase() ===
      Constants.ShortZeroAddress.toLowerCase()
  ) {
    logger.debug(
      chalk.yellow('INFO: Using native token (ETH, MATIC, etc) for payments!\n')
    )
  } else {    

    // if the token address is not zero try to load it
    logger.debug(
      `Loading ERC20 Token ${config.erc20TokenAddress}`
    )
    try {
      token = await nvm.contracts.loadErc20(
        getAddress(config.erc20TokenAddress)
      )

      logger.debug(`Using Token Address: ${token.address}`)
  
      if (verbose) {
        await printErc20TokenBanner(token)
      }
    } catch (error) {
      logger.error(`Error loading ERC20 token: ${(error as Error).message}`)
    }
    
  }
  return token
}

export const getDefaultLoggerConfig = (): Configuration => {
  return {
    appenders: {
      out: {
        type: 'stdout',
        level: 'info',
        layout: {
          type: 'pattern',
          pattern: '%m'
        }
      }
    },
    categories: {
      default: { appenders: ['out'], level: 'info' }
    }
  }
}

export const getJsonLoggerConfig = (): Configuration => {
  return {
    appenders: {
      json: {
        type: 'stdout',
        level: 'mark',
        layout: {
          type: 'json',
          separator: ','
        }
      }
    },
    categories: {
      default: { appenders: ['json'], level: 'mark' }
    }
  }
}

export const getFeesFromBigNumber = (fees: bigint): string => {
  return ((fees / 10000n) / 100n).toString()
}
