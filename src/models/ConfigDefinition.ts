import { NeverminedOptions, NvmAccount } from '@nevermined-io/sdk'

export interface CliConfig {
  [index: string]: ConfigEntry
}

export interface ConfigEntry {
  nvm: NeverminedOptions
  signer: NvmAccount
  envDescription?: string
  envUrl?: string
  envName: string
  isProduction?: boolean
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
