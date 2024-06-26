import { LogLevel, LoggerInstance, NeverminedOptions, NvmAccount, makeWallets } from "@nevermined-io/sdk"

LoggerInstance.setLevel(LogLevel.Error)

const logLevel = Number(process.env['LOG_LEVEL']) || 1 // warn by default
const infuraToken = process.env['INFURA_TOKEN']

const ipfsGateway = process.env['IPFS_GATEWAY'] || 'https://ipfs.io'
const ipfsProjectId = process.env['IPFS_PROJECT_ID']
const ipfsProjectSecret = process.env['IPFS_PROJECT_SECRET']

const configBase: NeverminedOptions = {
  web3ProviderUri: 'http://contracts.nevermined.localnet',
  marketplaceUri: 'http://marketplace.nevermined.localnet',
  neverminedNodeUri: process.env.NEVERMINED_NODE_URI || 'http://node.nevermined.localnet',
  neverminedNodeAddress: '0x068ed00cf0441e4829d9784fcbe7b9e26d4bd8d0',
  marketplaceAuthToken: undefined,
  artifactsFolder: './artifacts',
  circuitsFolder: './circuits',
  graphHttpUri: process.env['GRAPH_HTTP_URI'],
  gasMultiplier: 1.1,
  ipfsGateway,
  ipfsProjectId,
  ipfsProjectSecret,
  verbose: logLevel,
}

if (process.env.NETWORK_NAME === 'mumbai') {
    Object.assign(configBase, {
      marketplaceUri: 'https://marketplace-api.mumbai.nevermined.app',
      neverminedNodeUri: 'https://node.mumbai.nevermined.app',
      web3ProviderUri: `https://polygon-mumbai.infura.io/v3/${infuraToken}`,
      neverminedNodeAddress: '0x5838B5512cF9f12FE9f2beccB20eb47211F9B0bc',
      graphHttpUri: 'https://api.thegraph.com/subgraphs/name/nevermined-io/public',
    } as NeverminedOptions)
}

if (process.env.SEED_WORDS) {
    configBase.accounts = makeWallets(process.env.SEED_WORDS).map((wallet) => NvmAccount.fromAccount(wallet))
}
  
export const config: NeverminedOptions & { forceVerbose: NeverminedOptions } = configBase as any
    ;(config as any).forceVerbose = { ...configBase, verbose: true }
    