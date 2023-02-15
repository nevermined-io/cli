import { Contract } from 'ethers'
import {
  Account,
  DDO,
  Nevermined,  
  BigNumber,
  findServiceConditionByName,
  Nft721Contract,
  noZeroX,
  ProvenanceMethod,
  ProvenanceRegistry,
  QueryResult,
  ServiceType,
  Token,
  ConditionType
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
  
  const nvm = await Nevermined.getInstance({
    ...config.nvm,
    verbose: verbose ? verbose : config.nvm.verbose
  })
  if (!nvm.keeper) {
    logger.error(
      chalk.red(`ERROR: Nevermined could not connect to '${network}'\n`)
    )
  }

  return nvm
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

export const getNFTAddressFromInput = (
  nftAddress: string | undefined,
  ddo: DDO,
  serviceType: ServiceType = 'nft-sales',
  conditionType: ConditionType = 'transferNFT'
): string | undefined => {

  if (!nftAddress || !ethers.utils.isAddress(nftAddress)) {

    const salesService = ddo.findServiceByType(serviceType)
    if (!salesService) throw new Error(`No NFT contract address found`)

    const condition = findServiceConditionByName(salesService, conditionType)

    const _contractParam = condition.parameters.find(
      (p) => p.name === '_contractAddress' || p.name === '_contract'
    )
    
    return _contractParam?.value as string
  } else {
    return nftAddress
  }
}

export const getSignatureOfMethod = (
  contractInstace: ethers.Contract,
  methodName: string,
  args: any[]
): string => {
  const methods = contractInstace.interface.fragments.filter(
    (f) => f.name === methodName
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

export const loadHDWalletFromSeedWords = (
  seedWords: string,
  index = 0
): ethers.utils.HDNode => {
  const hdNode = ethers.utils.HDNode.fromMnemonic(seedWords)
  return hdNode.derivePath(`m/44'/60'/0'/0/${index}`)
}

export const loadAccountFromSeedWords = (
  seedWords: string,
  index = 0
): Account => {
  const hdNode = ethers.utils.HDNode.fromMnemonic(seedWords)
  return new Account(hdNode.derivePath(`m/44'/60'/0'/0/${index}`).address)
}

export const findAccountOrFirst = (
  accounts: Account[],
  address: string
): Account => {
  let account

  accounts.map((a) => console.log(`ACCOUNT ${a.getId()}`))

  if (ethers.utils.isAddress(address)) {
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

export const printNftTokenBanner = async (nft721: Nft721Contract) => {
  const { address } = nft721

  logger.info('\n')
  logger.info(chalk.dim('===== NFT Contract ====='))
  logger.info(chalk.dim(`Address: ${chalk.whiteBright(address)}`))

  let owner = ''
  try {
    owner = await nft721.contract.call('owner', [])
    logger.info(chalk.dim(`Owner: ${chalk.whiteBright(owner)}`))
  } catch {
    logger.info(`Owner: The NFT doesn't expose the owner`)
  }

  try {
    const name = await nft721.contract.call('name', [])
    logger.info(chalk.dim(`Name: ${chalk.whiteBright(name)}`))
  } catch {
    logger.info(`Name: The NFT doesn't expose the name`)
  }
  try {
    const symbol = await await nft721.contract.call('symbol', [])
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
  logger.info(chalk.dim('\n===== Native Token (ETH, MATIC, etc) ====='))
  logger.info(
    chalk.dim(`Decimals: ${chalk.whiteBright(Constants.ETHDecimals)}\n`)
  )
}

export const printErc20TokenBanner = async (token: Token) => {
  const { address } = token

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.contract.name(),
    token.contract.symbol(),
    token.contract.decimals(),
    token.contract.totalSupply()
  ])

  logger.info(chalk.dim('\n===== ERC20 Contract ====='))
  logger.info(chalk.dim(`Address: ${chalk.whiteBright(address)}`))
  logger.info(chalk.dim(`Name: ${chalk.whiteBright(name)}`))
  logger.info(chalk.dim(`Symbol: ${chalk.whiteBright(symbol)}`))
  logger.info(chalk.dim(`Decimals: ${chalk.whiteBright(decimals)}`))
  logger.info(
    chalk.dim(
      `Total Supply: ${chalk.whiteBright(totalSupply / 10 ** decimals)}`
    )
  )
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
    token = nvm.keeper.token // eslint-disable-line
    const nvmTokenAddress = token.getAddress() || ''
    logger.debug(
      `Loading ERC20 Token ${config.erc20TokenAddress.toLowerCase()}`
    )

    // check if we have a different token configured
    if (
      config.erc20TokenAddress.toLowerCase() !== nvmTokenAddress.toLowerCase()
    ) {
      let tokenAddress
      try {
        tokenAddress = ethers.utils.getAddress(config.erc20TokenAddress)
      } catch {
        tokenAddress = nvmTokenAddress
      }

      token = await nvm.contracts.loadErc20(tokenAddress)
      config.erc20TokenAddress = tokenAddress
    } else {
      logger.debug(
        chalk.yellow(`WARNING: Using Nevermined token '${token.address}'!\n`)
      )
    }
    logger.debug(`Using Token Address: ${token.address}`)

    if (verbose) {
      await printErc20TokenBanner(token)
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

export const getFeesFromBigNumber = (fees: BigNumber): string => {
  return (fees.toNumber() / 10000).toPrecision(2).toString()
}
