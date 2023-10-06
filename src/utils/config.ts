import ethers, { HDNodeWallet, Mnemonic } from 'ethers'
import dotenv from 'dotenv'
import fs from 'fs'
import { mkdirSync, writeFileSync } from 'fs'
import os from 'os'
import { x } from 'tar'
import fetch from 'cross-fetch'
import { getLogger } from 'log4js'
import { ConfigEntry, CliConfig } from '../models/ConfigDefinition'
import path from 'path'
import { Wallet, Signer } from 'ethers'
import { Web3Provider, makeAccounts } from '@nevermined-io/sdk'
import { getWalletFromJSON } from './utils'

dotenv.config()

export const logger = getLogger()

export const LOCAL_CONF_DIR =
  process.env.LOCAL_CONF_DIR || `${os.homedir()}/.nevermined`
export const ARTIFACTS_PATH = `${LOCAL_CONF_DIR}/artifacts`
export const CIRCUITS_PATH = `${LOCAL_CONF_DIR}/circuits`
export const CLI_PATH = `${LOCAL_CONF_DIR}/cli`
export const CLI_ENV = `${LOCAL_CONF_DIR}/cli/.env`

export const ARTIFACTS_REPOSITORY =
  process.env.ARTIFACTS_REPO ||
  'https://artifacts.nevermined.network'

export const DEFAULT_ENCRYPTION_METHOD = 'PSK-RSA'

// INFO: This seed words is only used to initialize the HDWallet in commands not requiring network connectivity
export const DUMMY_SEED_WORDS =
  'kitchen proud renew agent print clap trigger ladder poverty salad marriage hotel'

export const execOpts = {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024
}

export async function configureLocalEnvironment(
  network: string,
  config: ConfigEntry
): Promise<boolean> {
  if (!fs.existsSync(CLI_PATH)) {
    console.debug(`Creating folder: ${CLI_PATH}`)
    mkdirSync(CLI_PATH, { recursive: true })
  }

  const abiTestPath = `${ARTIFACTS_PATH}/DIDRegistry.${config.networkName?.toLowerCase()}.json`

  if (
    network.toLowerCase() === 'spree' ||
    network.toLowerCase() === 'geth-localnet'
  ) {
    if (
      !fs.existsSync(abiTestPath) ||
      !fs.existsSync(`${ARTIFACTS_PATH}/ready`)
    ) {
      throw new Error(
        `The Local Network ABI files are not in the artifacts folder: ${ARTIFACTS_PATH}. Make sure nevermined tools is up and running`
      )
    }
  } else {
    if (!fs.existsSync(abiTestPath)) {
      console.debug(
        `Remote network artifacts not found: ${ARTIFACTS_PATH}. Downloading them.`
      )
      const artifactPackageUrl = `${ARTIFACTS_REPOSITORY}/${config.networkId}/${config.tagName}/contracts_v${config.contractsVersion}.tar.gz`
      const destinationPackage = `${ARTIFACTS_PATH}/contracts_${config.contractsVersion}.tar.gz`
      const response = await fetch(artifactPackageUrl)
      if (response.status !== 200) {
        throw new Error(
          `Unable to download the artifacts from: ${artifactPackageUrl}.` +
            +` ${JSON.stringify(response)}`
        )
      }
      try {
        if (!fs.existsSync(ARTIFACTS_PATH)) {
          console.debug(`Creating folder: ${ARTIFACTS_PATH}`)
          mkdirSync(ARTIFACTS_PATH, { recursive: true })
        }

        const buffer = Buffer.from(await response.arrayBuffer())
        writeFileSync(destinationPackage, buffer, 'binary')
        await x({
          file: destinationPackage,
          cwd: ARTIFACTS_PATH
        })
        console.log(
          `Artifacts downloaded (${destinationPackage} file) and de-compressed in the destination folder (${ARTIFACTS_PATH})`
        )
      } catch (error) {
        throw new Error(
          `Unable to write and unpack the artifacts from: ${destinationPackage}`
        )
      }
    }
  }

  return true
}

export function getNetworksConfig(): CliConfig {
  const networksJsonPath = path.join(
    __dirname,
    '../../resources',
    'networks.json'
  )
  return JSON.parse(fs.readFileSync(networksJsonPath).toString())
}

export async function getConfig(
  network: string,
  requiresAccount = true,
  _accountIndex = 0
): Promise<ConfigEntry> {
  if (!process.env.SEED_WORDS) {
    if (!process.env.KEYFILE_PATH || !process.env.KEYFILE_PASSWORD) {
      const accountMessage =
        "'SEED_WORDS' or 'KEYFILE' not set in environment! Please see http://docs.nevermined.io/docs/cli/getting-started/#configure-your-account for details."
      if (requiresAccount) throw new Error(accountMessage)
    }
  }
  let defaultConfig
  try {
    const networksJsonPath = path.join(
      __dirname,
      '../../resources',
      'networks.json'
    )
    defaultConfig = JSON.parse(fs.readFileSync(networksJsonPath).toString())[
      network
    ] as ConfigEntry
  } catch (error) {
    throw new Error(`Network '${network}' is not supported`)
  }

  if (!defaultConfig) throw new Error(`Network '${network}' is not supported`)

  const config = defaultConfig

  if (process.env.WEB3_PROVIDER_URL) config.nvm.web3ProviderUri = process.env.WEB3_PROVIDER_URL
  if (process.env.MARKETPLACE_API_URL)
    config.nvm.marketplaceUri = process.env.MARKETPLACE_API_URL
  if (process.env.GRAPH_URL) config.nvm.graphHttpUri = process.env.GRAPH_URL
  if (process.env.NO_GRAPH) config.nvm.graphHttpUri = undefined
  if (process.env.NVM_NODE_URL) config.nvm.neverminedNodeUri = process.env.NVM_NODE_URL
  if (process.env.NODE_ADDRESS)
    config.nvm.neverminedNodeAddress = process.env.NODE_ADDRESS
  if (process.env.TOKEN_ADDRESS)
    config.erc20TokenAddress = process.env.TOKEN_ADDRESS
  if (process.env.GAS_MULTIPLIER)
    config.gasMultiplier = Number(process.env.GAS_MULTIPLIER)
  if (process.env.GAS_PRICE_MULTIPLIER)
    config.gasPriceMultiplier = Number(process.env.GAS_PRICE_MULTIPLIER)
  config.seed = process.env.SEED_WORDS
  config.keyfilePath = process.env.KEYFILE_PATH
  config.keyfilePassword = process.env.KEYFILE_PASSWORD

  if (!config.nvm.web3ProviderUri || config.nvm.web3ProviderUri.length < 1) {
    if (!process.env.NETWORK) {
      throw new Error(
        `You need to configure a 'NETWORK' or a 'WEB3_PROVIDER_URL' environment variable pointing to the right network. \nFor complete reference please visit: \nhttp://docs.nevermined.io/docs/cli/advanced_configuration#connecting-to-different-environments documentation \n`
      )
    } else {
      config.nvm.web3ProviderUri = defaultConfig.nvm.web3ProviderUri
    }
  }

  const provider = await Web3Provider.getWeb3(config.nvm)

  let signer: Signer
  let accounts: ethers.Wallet[] = []
  if (requiresAccount) {
    if (!process.env.SEED_WORDS) {
      signer = Wallet.fromEncryptedJsonSync(
        process.env.KEYFILE_PATH!,
        process.env.KEYFILE_PASSWORD!
      ) 
      accounts.push(
        getWalletFromJSON(process.env.KEYFILE_PATH!, process.env.KEYFILE_PASSWORD!) as Wallet
      )
    } else {

      signer = Wallet.fromPhrase(config.seed!)
      accounts = makeAccounts(config.seed!)
    }
  } else {
    signer = HDNodeWallet.fromPhrase(DUMMY_SEED_WORDS)
    accounts = makeAccounts(DUMMY_SEED_WORDS, 1)
  }
  
  return {
    ...config,
    signer: signer.connect(provider),
    nvm: {
      ...config.nvm,
      artifactsFolder: ARTIFACTS_PATH,
      circuitsFolder: CIRCUITS_PATH,
      accounts,
    }
  }
}
