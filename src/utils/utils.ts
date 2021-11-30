import { Contract } from 'web3-eth-contract'
import Web3Provider from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/Web3Provider'
import {
  findServiceConditionByName,
  noZeroX
} from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import {
  Account,
  Config,
  DDO,
  Nevermined,
  ProvenanceMethod,
  ProvenanceRegistry
} from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'
import Token from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/contracts/Token'
import ERC721 from '../abis/ERC721.json'
import { Constants, StatusCodes } from './enums'
import { ConfigEntry, getConfig, logger } from './config'
import { AbiItem } from 'web3-utils'
import CustomToken from './CustomToken'
import { QueryResult } from '@nevermined-io/nevermined-sdk-js/dist/node/metadata/Metadata'
import { Logger } from 'log4js'
import { ServiceType } from '@nevermined-io/nevermined-sdk-js/dist/node/ddo/Service'

export const cmdHandler = async (cmd: Function, argv: any) => {
  const { verbose, network } = argv

  if (verbose) {
    logger.level = 'debug'
  }

  logger.debug(chalk.dim(`Debug mode: '${chalk.greenBright('on')}'\n`))
  logger.info(chalk.dim(`Using network: '${chalk.whiteBright(network)}'\n`))

  const config = getConfig(network as string)

  return process.exit(await cmd(argv, config, logger))
}

export const loadContract = (
  config: Config,
  abi: AbiItem[] | AbiItem,
  address: string
): Contract => {
  const web3 = Web3Provider.getWeb3(config)
  web3.setProvider(config.web3Provider)

  // @ts-ignore
  return new web3.eth.Contract(abi, address)
}

export const loadNftContract = (
  config: ConfigEntry,
  nftTokenAddress: string
): Contract => {
  // @ts-ignore
  return loadContract(config.nvm, ERC721.abi, nftTokenAddress)
}

export const getNFTAddressFromInput = (
  nftAddress: string,
  ddo: DDO,
  serviceType: ServiceType
): string => {
  if (nftAddress === '' || !nftAddress.startsWith('0x')) {
    const salesService = ddo.findServiceByType(serviceType)

    if (!salesService) throw new Error(`No NFT contract address found`)

    const transfer = findServiceConditionByName(salesService, 'transferNFT')
    const _contractParam = transfer.parameters.find(
      (p) => p.name === '_contract'
    )
    return _contractParam?.value as string
  } else {
    return nftAddress
  }
}

export const formatDid = (did: string): string => `did:nv:${noZeroX(did)}`

export const findAccountOrFirst = (
  accounts: Account[],
  address: string
): Account => {
  let account: Account | undefined = accounts[0]!

  if (address) {
    account = accounts.find(
      (a: Account) => a.getId().toLowerCase() === address.toLowerCase()
    )

    if (!account) {
      console.log(chalk.red(`ERROR: '${address}' is not an account!\n`))
      throw new Error(`${StatusCodes[StatusCodes.ADDRESS_NOT_AN_ACCOUNT]}`)
    }
  }

  return account
}

export const printNftTokenBanner = async (nftContract: Contract) => {
  const { address } = nftContract.options

  console.log('\n')
  console.log(chalk.dim('===== NFT Contract ====='))

  let owner = ''
  try {
    owner = await nftContract.methods.owner().call()
    console.log(chalk.dim(`Owner: ${chalk.whiteBright(owner)}`))
  } catch {
    console.log(`Owner: The NFT doesn't expose the owner`)
  }

  const [name, symbol] = await Promise.all([
    nftContract.methods.name().call(),
    nftContract.methods.symbol().call()
  ])

  console.log(chalk.dim(`Address: ${chalk.whiteBright(address)}`))
  console.log(chalk.dim(`Name: ${chalk.whiteBright(name)}`))
  console.log(chalk.dim(`Symbol: ${chalk.whiteBright(symbol)}`))
  console.log('\n')
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
    attributes: string
    blockNumberUpdated: number
  }[],
  logger: Logger
) => {
  logger.info(chalk.dim(`# of Provenance events: ${events.length}`))
  logger.info(chalk.dim(`--------------------------`))

  events.map((e) => {
    logger.info(chalk.dim(`\t Provenance Id: ${e.provId}`))
    logger.info(chalk.dim(`\t Method: ${ProvenanceMethod[e.method]}`))
    logger.info(chalk.dim(`\t DID: ${e.did}`))
    logger.info(chalk.dim(`\t Related DID: ${e.relatedDid}`))
    logger.info(chalk.dim(`\t Agent: ${e.agentId}`))
    logger.info(chalk.dim(`\t Agent involved: ${e.agentInvolvedId}`))
    logger.info(chalk.dim(`\t Activity: ${e.activityId}`))
    logger.info(chalk.dim(`\t Attributes: ${e.attributes}`))
    logger.info(chalk.dim(`\t Block Number: ${e.blockNumberUpdated}`))
    logger.info(chalk.dim(`-----`))
  })
}

export const printSearchResult = async (
  queryResult: QueryResult,
  logger: Logger
) => {
  logger.info(
    chalk.dim(
      `Total Results: ${queryResult.totalResults} - Total Pages: ${queryResult.totalPages}`
    )
  )
  logger.info(chalk.dim(`Page: ${queryResult.page}`))
  logger.info(chalk.dim(`---------------------------`))

  queryResult.results.forEach((_ddo: DDO) => {
    let _metadata = _ddo.findServiceByType('metadata')
    logger.info(
      chalk.dim(
        `${_metadata.attributes.main.type} > Name: ${_metadata.attributes.main.name} - Url: ${_metadata.serviceEndpoint}`
      )
    )
  })
  logger.info(chalk.dim(`---------------------------`))
}

export const printNativeTokenBanner = async () => {
  console.log('\n')
  console.log(chalk.dim('===== Native Token (ETH, MATIC, etc) ====='))
  console.log(
    chalk.dim(`Decimals: ${chalk.whiteBright(Constants.ETHDecimals)}\n`)
  )
}

export const printErc20TokenBanner = async (token: Token) => {
  const { address } = token

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply()
  ])

  console.log('\n')
  console.log(chalk.dim('===== ERC20 Contract ====='))
  console.log(chalk.dim(`Address: ${chalk.whiteBright(address)}`))
  console.log(chalk.dim(`Name: ${chalk.whiteBright(name)}`))
  console.log(chalk.dim(`Symbol: ${chalk.whiteBright(symbol)}`))
  console.log(chalk.dim(`Decimals: ${chalk.whiteBright(decimals)}`))
  console.log(
    chalk.dim(
      `Total Supply: ${chalk.whiteBright(totalSupply / 10 ** decimals)}`
    )
  )
}


export const getContractNameFromAddress = async(
  nvm: Nevermined, 
  contractAddress: string): Promise<string | undefined> => {

  const platformVersions = await nvm.versions.get()
  
  let contractName = undefined
  Object.keys(platformVersions.sdk.contracts || {}).forEach((_name) => {
    if (contractAddress.toLowerCase() === platformVersions.sdk.contracts![_name].toLowerCase())    {
      contractName = _name
    }      
  }) 
  return contractName
}


export const loadNevermined = async (
  config: ConfigEntry,
  network: string,
  verbose = false
): Promise<{ token: Token | null; nvm: Nevermined }> => {
  const nvm = await Nevermined.getInstance({
    ...config.nvm,
    verbose: verbose ? verbose : config.nvm.verbose
  })

  if (!nvm.keeper) {
    console.log(
      chalk.red(`ERROR: Nevermined could not connect to '${network}'\n`)
    )
  }

  // default to no token
  let token: Token | null = null

  if (
    config.erc20TokenAddress.toLowerCase() ===
      Constants.ZeroAddress.toLowerCase() ||
    config.erc20TokenAddress.toLowerCase() ===
      Constants.ShortZeroAddress.toLowerCase()
  ) {
    if (verbose)
      console.debug(
        chalk.yellow(
          'INFO: Using native token (ETH, MATIC, etc) for payments!\n'
        )
      )
  } else {
    // if the token address is not zero try to load it
    token = nvm.keeper.token // eslint-disable-line

    // check if we have a different token configured
    if (
      config.erc20TokenAddress.toLowerCase() !==
      (token && nvm.keeper.token.address.toLowerCase())
    ) {
      token = await CustomToken.getInstanceByAddress(
        {
          nevermined: nvm,
          web3: Web3Provider.getWeb3(config.nvm)
        },
        config.erc20TokenAddress
      )
    } else {
      console.debug(
        chalk.yellow(
          `WARNING: Using Nevermined token '${config.erc20TokenAddress}'!\n`
        )
      )
    }

    if (verbose) {
      await printErc20TokenBanner(token)
    }
  }

  return {
    nvm,
    token
  }
}
