import { Config, Nevermined } from '@nevermined-io/nevermined-sdk-js'
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
  keyfilePath?: string
  keyfilePassword?: string
  gasMultiplier?: number
  gasPriceMultiplier?: number
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

export const config: CliConfig = {
  spree: {
    nvm: {
      faucetUri: process.env.FAUCET_URL || 'http://localhost:3001',
      metadataUri: process.env.METADATA_URL || 'http://172.17.0.1:5000',
      gatewayUri: process.env.GATEWAY_URL || 'http://localhost:8030',
      gatewayAddress:
        process.env.GATEWAY_ADDRESS ||
        '0x068ed00cf0441e4829d9784fcbe7b9e26d4bd8d0',
      nodeUri: process.env.NODE_URL || 'http://localhost:8545',
      verbose: true
    } as Config,
    nativeToken: 'ETH',
    etherscanUrl: 'https://spree.etherscan.io',
    erc20TokenAddress: process.env.TOKEN_ADDRESS || '',
    seed: process.env.MNEMONIC,
    keyfilePath: process.env.KEYFILE_PATH,
    keyfilePassword: process.env.KEYFILE_PASSWORD,
    gasMultiplier: process.env.GAS_MULTIPLIER || 0,
    gasPriceMultiplier: process.env.GAS_PRICE_MULTIPLIER || 0
  } as ConfigEntry,
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
      verbose: true
    } as Config,
    nativeToken: 'ETH',
    etherscanUrl: 'https://rinkeby.etherscan.io',
    erc20TokenAddress:
      process.env.TOKEN_ADDRESS ||
      // WETH
      '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    seed: process.env.MNEMONIC,
    keyfilePath: process.env.KEYFILE_PATH,
    keyfilePassword: process.env.KEYFILE_PASSWORD,
    gasMultiplier: process.env.GAS_MULTIPLIER || 0,
    gasPriceMultiplier: process.env.GAS_PRICE_MULTIPLIER || 0
  } as ConfigEntry,
  celoAlfajores: {
    nvm: {
      faucetUri:
        process.env.FAUCET_URL || 'https://faucet.alfajores.nevermined.rocks',
      metadataUri:
        process.env.METADATA_URL ||
        'https://metadata.alfajores.nevermined.rocks',
      gatewayUri:
        process.env.GATEWAY_URL || 'https://gateway.alfajores.nevermined.rocks',
      gatewayAddress:
        process.env.GATEWAY_ADDRESS ||
        '0x7DFa856BC27b67bfA83F190755D6C7D0A0D7BBC0',
      nodeUri:
        process.env.NODE_URL || 'https://alfajores-forno.celo-testnet.org',
      verbose: true
    } as Config,
    nativeToken: 'CELO',
    etherscanUrl: 'https://alfajores-blockscout.celo-testnet.org',
    erc20TokenAddress:
      process.env.TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000', // CELO
    // process.env.TOKEN_ADDRESS || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // cUSD
    seed: process.env.MNEMONIC,
    keyfilePath: process.env.KEYFILE_PATH,
    keyfilePassword: process.env.KEYFILE_PASSWORD,
    gasMultiplier: process.env.GAS_MULTIPLIER || 0,
    gasPriceMultiplier: process.env.GAS_PRICE_MULTIPLIER || 0
  } as ConfigEntry,
  celoMainnet: {
    nvm: {
      faucetUri:
        process.env.FAUCET_URL ||
        'https://faucet.alities.celo.nevermined.rocks',
      metadataUri:
        process.env.METADATA_URL ||
        'https://metadata.alities.celo.nevermined.rocks',
      gatewayUri:
        process.env.GATEWAY_URL ||
        'https://gateway.alities.celo.nevermined.rocks',
      gatewayAddress:
        process.env.GATEWAY_ADDRESS ||
        '0x7f3661d22E89Ad3549c7fC034D94B53da731D36A',
      nodeUri: `${process.env.NODE_URL}` || 'https://forno.celo.org',
      verbose: true
    } as Config,
    nativeToken: 'CELO',
    etherscanUrl: 'https://explorer.celo.org',
    erc20TokenAddress:
      process.env.TOKEN_ADDRESS ||
      // CELO
      '0x0000000000000000000000000000000000000000',
    seed: process.env.MNEMONIC,
    keyfilePath: process.env.KEYFILE_PATH,
    keyfilePassword: process.env.KEYFILE_PASSWORD,
    gasMultiplier: process.env.GAS_MULTIPLIER || 0,
    gasPriceMultiplier: process.env.GAS_PRICE_MULTIPLIER || 0
  } as ConfigEntry,
  defiMumbai: {
    nvm: {
      faucetUri:
        process.env.FAUCET_URL || 'https://faucet.mumbai.nevermined.rocks',
      metadataUri:
        process.env.METADATA_URL || 'https://metadata.mumbai.nevermined.rocks',
      gatewayUri:
        process.env.GATEWAY_URL || 'https://gateway.mumbai.nevermined.rocks',
      gatewayAddress:
        process.env.GATEWAY_ADDRESS ||
        '0x7DFa856BC27b67bfA83F190755D6C7D0A0D7BBC0',
      nodeUri: `${process.env.NODE_URL}`,
      verbose: true
    } as Config,
    nativeToken: 'MATIC',
    etherscanUrl: 'https://explorer-mumbai.maticvigil.com',
    erc20TokenAddress:
      process.env.TOKEN_ADDRESS ||
      // MATIC
      '0x0000000000000000000000000000000000000000',
    seed: process.env.MNEMONIC,
    keyfilePath: process.env.KEYFILE_PATH,
    keyfilePassword: process.env.KEYFILE_PASSWORD,
    gasMultiplier: process.env.GAS_MULTIPLIER || 0,
    gasPriceMultiplier: process.env.GAS_PRICE_MULTIPLIER || 0
  } as ConfigEntry,
  autonomiesMumbai: {
    nvm: {
      faucetUri:
        process.env.FAUCET_URL || 'https://faucet.mumbai.nevermined.rocks',
      metadataUri:
        process.env.METADATA_URL ||
        'https://metadata.autonomies.mumbai.nevermined.rocks',
      gatewayUri:
        process.env.GATEWAY_URL ||
        'https://gateway.autonomies.mumbai.nevermined.rocks',
      gatewayAddress:
        process.env.GATEWAY_ADDRESS ||
        '0xe63a11dC61b117D9c2B1Ac8021d4cffEd8EC213b',
      nodeUri: `${process.env.NODE_URL}`,
      verbose: true
    } as Config,
    nativeToken: 'MATIC',
    etherscanUrl: 'https://explorer-mumbai.maticvigil.com/',
    erc20TokenAddress:
      process.env.TOKEN_ADDRESS ||
      // MATIC
      '0x0000000000000000000000000000000000000000',
    seed: process.env.MNEMONIC,
    keyfilePath: process.env.KEYFILE_PATH,
    keyfilePassword: process.env.KEYFILE_PASSWORD,
    gasMultiplier: process.env.GAS_MULTIPLIER || 0,
    gasPriceMultiplier: process.env.GAS_PRICE_MULTIPLIER || 0
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
    if (!process.env.KEYFILE_PATH || !process.env.KEYFILE_PASSWORD) {
      throw new Error(
        "ERROR: 'MNEMONIC' or 'KEYFILE' not set in environment! Please see README.md for details."
      )
    }
  }

  let hdWalletProvider: HDWalletProvider
  if (!process.env.MNEMONIC) {
    hdWalletProvider = new HDWalletProvider(
      [getPrivateKey(process.env.KEYFILE_PATH!, process.env.KEYFILE_PASSWORD!)],
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
