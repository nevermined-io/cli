import { Config } from '@nevermined-io/nevermined-sdk-js'
import HDWalletProvider from '@truffle/hdwallet-provider'
import dotenv from 'dotenv'
import { LogLevel } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import Web3 from 'web3'
import fs from 'fs'
import { configure, getLogger } from 'log4js'

dotenv.config()

interface CliConfig {
  [index: string]: ConfigEntry
}

export interface ConfigEntry {
  nvm: Config
  nativeToken: string
  etherscanUrl: string
  nftTokenAddress: string
  erc20TokenAddress: string
  seed?: string
  buyerKeyfile?: string
  buyerPassword?: string
  creatorKeyfile?: string
  creatorPassword?: string
  minterKeyfile?: string
  minterPassword?: string
}

configure({
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
})

export const logger = getLogger()

const config: CliConfig = {
  rinkeby: {
    nvm: {
      // default nvm rinkeby faucet
      faucetUri:
        process.env.FAUCET_URL || 'https://faucet.rinkeby.nevermined.rocks',
      metadataUri:
        process.env.METADATA_URL || 'https://metadata.rinkeby.nevermined.rocks',
      gatewayUri:
        process.env.GATEWAY_URL || 'https://gateway.rinkeby.nevermined.rocks',
      gatewayAddress:
        process.env.GATEWAY_ADDRESS ||
        '0xF8D50e0e0F47c5dbE943AeD661cCF25c3468c44f',
      // default infura rinkeby endpoint
      nodeUri: `${process.env.NODE_URL}`,
      verbose: LogLevel.Error
    } as Config,
    nativeToken: 'ETH',
    etherscanUrl: 'https://rinkeby.etherscan.io',
    nftTokenAddress:
      process.env.NFT_TOKEN_ADDRESS ||
      // NFT Test Contract
      '0xf0ff000512fC47ab52aC8e4f90E335a5Fe3dD024',
    erc20TokenAddress:
      process.env.TOKEN_ADDRESS ||
      // WETH
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    seed: process.env.MNEMONIC,
    buyerKeyfile: process.env.BUYER_KEYFILE,
    buyerPassword: process.env.BUYER_PASSWORD,
    creatorKeyfile: process.env.CREATOR_KEYFILE,
    creatorPassword: process.env.CREATOR_PASSWORD,
    minterKeyfile: process.env.MINTER_KEYFILE,
    minterPassword: process.env.MINTER_PASSWORD
  } as ConfigEntry,
  spree: {
    nvm: {
      faucetUri: process.env.FAUCET_URL || 'http://localhost:3001',
      metadataUri:
        process.env.METADATA_URL || 'http://nevermined-metadata:5000',
      gatewayUri: process.env.GATEWAY_URL || 'http://localhost:8030',
      gatewayAddress:
        process.env.GATEWAY_ADDRESS ||
        '0x068ed00cf0441e4829d9784fcbe7b9e26d4bd8d0',
      nodeUri: `${process.env.NODE_URL}`,
      verbose: LogLevel.Error
    } as Config,
    nativeToken: 'ETH',
    etherscanUrl: 'https://spree.etherscan.io',
    nftTokenAddress:
      process.env.NFT_TOKEN_ADDRESS ||
      // NFT Test Contract
      '0xf0ff000512fC47ab52aC8e4f90E335a5Fe3dD024',
    erc20TokenAddress:
      process.env.TOKEN_ADDRESS ||
      // ETH
      '0x0',
    seed: process.env.MNEMONIC,
    buyerKeyfile: process.env.BUYER_KEYFILE,
    buyerPassword: process.env.BUYER_PASSWORD,
    creatorKeyfile: process.env.CREATOR_KEYFILE,
    creatorPassword: process.env.CREATOR_PASSWORD,
    minterKeyfile: process.env.MINTER_KEYFILE,
    minterPassword: process.env.MINTER_PASSWORD
  } as ConfigEntry
}

export function getConfig(network: string): ConfigEntry {
  if (!config[network]) {
    throw new Error(`Network '${network}' is not supported`)
  }

  if (!process.env.NODE_URL) {
    throw new Error(
      "ERROR: 'NODE_URL' is not set in environment! Please see README.md for details."
    )
  }

  if (!process.env.MNEMONIC) {
    if (
      !process.env.CREATOR_KEYFILE ||
      !process.env.CREATOR_PASSWORD ||
      !process.env.BUYER_KEYFILE ||
      !process.env.BUYER_PASSWORD ||
      !process.env.MINTER_KEYFILE ||
      !process.env.MINTER_PASSWORD
    ) {
      throw new Error(
        "ERROR: 'MNEMONIC' or 'KEYFILE' not set in environment! Please see README.md for details."
      )
    }
  }

  let hdWalletProvider: HDWalletProvider
  if (!process.env.MNEMONIC) {
    hdWalletProvider = new HDWalletProvider(
      [
        getPrivateKey(
          process.env.CREATOR_KEYFILE!,
          process.env.CREATOR_PASSWORD!
        ),
        getPrivateKey(
          process.env.MINTER_KEYFILE!,
          process.env.MINTER_PASSWORD!
        ),
        getPrivateKey(process.env.BUYER_KEYFILE!, process.env.BUYER_PASSWORD!)
      ],
      config[network].nvm.nodeUri
    )
  } else {
    hdWalletProvider = new HDWalletProvider(
      config[network].seed!,
      config[network].nvm.nodeUri,
      0,
      3
    )
  }

  return {
    ...config[network],
    nvm: {
      ...config[network].nvm,
      web3Provider: hdWalletProvider
    }
  }
}

function getPrivateKey(keyfilePath: string, password: string): string {
  const w3 = new Web3()
  const data = fs.readFileSync(keyfilePath)
  const keyfile = JSON.parse(data.toString())

  return w3.eth.accounts.decrypt(keyfile, password).privateKey
}
