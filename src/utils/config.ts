import HDWalletProvider from '@truffle/hdwallet-provider'
import dotenv from 'dotenv'
import Web3 from 'web3'
import fs from 'fs'
import { mkdirSync, writeFileSync } from 'fs'
import os from 'os'
import { x } from 'tar'
import fetch from 'cross-fetch'
import { getLogger } from 'log4js'
import { ConfigEntry, CliConfig } from '../models/ConfigDefinition'

dotenv.config()

export const logger = getLogger()

export const LOCAL_CONF_PATH =
  process.env.LOCAL_CONF_PATH || `${os.homedir()}/.nevermined`
export const ARTIFACTS_PATH = `${LOCAL_CONF_PATH}/nevermined-contracts/artifacts`
export const CLI_PATH = `${LOCAL_CONF_PATH}/cli`
export const CLI_ENV = `${LOCAL_CONF_PATH}/nevermined-contracts/cli/.env`

export const ARTIFACTS_REPOSITORY =
  process.env.ARTIFACTS_REPO ||
  'https://artifacts-nevermined-rocks.s3.amazonaws.com'

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

  if (network.toLowerCase() === 'spree') {
    if (
      !fs.existsSync(abiTestPath) ||
      !fs.existsSync(`${ARTIFACTS_PATH}/ready`)
    ) {
      throw new Error(
        `The Spree ABI files are not in the artifacts folder: ${ARTIFACTS_PATH}. Make sure nevermined tools is up and running`
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
  return JSON.parse(fs.readFileSync('resources/networks.json').toString())
}

export function getConfig(network: string): ConfigEntry {
  if (!process.env.MNEMONIC) {
    if (!process.env.KEYFILE_PATH || !process.env.KEYFILE_PASSWORD) {
      throw new Error(
        "ERROR: 'MNEMONIC' or 'KEYFILE' not set in environment! Please see README.md for details."
      )
    }
  }
  let defaultConfig
  try {
    defaultConfig = JSON.parse(
      fs.readFileSync('resources/networks.json').toString()
    )[network] as ConfigEntry
  } catch (error) {
    throw new Error(`Network '${network}' is not supported`)
  }
  let config = defaultConfig

  if (process.env.NODE_URL) config.nvm.nodeUri = process.env.NODE_URL
  if (process.env.MARKETPLACE_API_URL)
    config.nvm.marketplaceUri = process.env.MARKETPLACE_API_URL
  if (process.env.FAUCET_URL) config.nvm.faucetUri = process.env.FAUCET_URL
  if (process.env.GRAPH_URL) config.nvm.graphHttpUri = process.env.GRAPH_URL
  if (process.env.GATEWAY_URL) config.nvm.gatewayUri = process.env.GATEWAY_URL
  if (process.env.GATEWAY_ADDRESS)
    config.nvm.gatewayAddress = process.env.GATEWAY_ADDRESS
  if (process.env.TOKEN_ADDRESS)
    config.erc20TokenAddress = process.env.TOKEN_ADDRESS
  if (process.env.GAS_MULTIPLIER)
    config.gasMultiplier = Number(process.env.GAS_MULTIPLIER)
  if (process.env.GAS_PRICE_MULTIPLIER)
    config.gasPriceMultiplier = Number(process.env.GAS_PRICE_MULTIPLIER)
  config.seed = process.env.MNEMONIC
  config.keyfilePath = process.env.KEYFILE_PATH
  config.keyfilePassword = process.env.KEYFILE_PASSWORD

  let hdWalletProvider: HDWalletProvider
  if (!process.env.MNEMONIC) {
    hdWalletProvider = new HDWalletProvider(
      [getPrivateKey(process.env.KEYFILE_PATH!, process.env.KEYFILE_PASSWORD!)],
      config.nvm.nodeUri
    )
  } else {
    hdWalletProvider = new HDWalletProvider(
      config.seed!,
      config.nvm.nodeUri,
      0,
      3
    )
  }

  return {
    ...config,
    nvm: {
      ...config.nvm,
      artifactsFolder: ARTIFACTS_PATH,
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
