import { Config } from '@nevermined-io/nevermined-sdk-js'
import { Signer } from 'ethers'

export interface CliConfig {
  [index: string]: ConfigEntry
}

export interface ConfigEntry {
  nvm: Config
  signer: Signer
  envDescription?: string
  envUrl?: string
  isProduction?: boolean
  networkId?: string
  networkName?: string
  contractsVersion?: string
  tagName?: string
  nativeToken: string
  etherscanUrl: string
  nftTokenAddress: string
  erc20TokenAddress: string
  seed?: string
  keyfilePath?: string
  keyfilePassword?: string
  gasMultiplier?: number
  gasPriceMultiplier?: number
  externalNetwork?: boolean
}
