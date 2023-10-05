import { generateId, makeAccounts } from '@nevermined-io/sdk'
import { Mnemonic, ethers } from 'ethers'

const NETWORK = process.env.NETWORK || 'geth-localnet'
const BASE_COMMAND = `yarn start -n ${NETWORK}`
const VERBOSE = '-v'

export const metadataConfig = {
  name: 'CLI Testing Dataset #' + generateId(),
  author: 'Nevermined CLI',
  price: 10,
  url: 'https://www.apache.org/licenses/LICENSE-2.0',
  contentType: 'text/plain',
  metadataFile: 'test/resources/example-1.json',
  metadataFileWorkflow: 'test/resources/metadata_workflow_coordinator.json',
  metadataNFT: 'cid://QmVT3wfySvZJqAvkBCyxoz3EvD3yeLqf3cvAssFDpFFXNm'
}

export const loadAddressesFromSeedWords = (
  seedWords: string | undefined,
  numberOfAccounts = 10
): string[] => {
  if (seedWords) {
    const accounts: ethers.Wallet[] = makeAccounts(seedWords, numberOfAccounts)
    const addresses = accounts.map(account => { return account.address })
    return addresses
  }
  // If no seed words we return a list of pre-defined addresses for testing purposes
  return [
    '0xe2DD09d719Da89e5a3D0F2549c7E24566e947260',
    '0xBE5449a6A97aD46c8558A3356267Ee5D2731ab5e',
    '0xA78deb2Fa79463945C247991075E2a0e98Ba7A09'
  ]
}


export const execOpts = {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
  env: {
    ...process.env,
    NETWORK: NETWORK,
    WEB3_PROVIDER_URL: `${process.env.WEB3_PROVIDER_URL}` || 'http://contracts.nevermined.localnet',
    TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
    SEED_WORDS: process.env.SEED_WORDS,
    LOCAL_CONF_DIR: '/tmp/.nevermined'
  },
  accounts: loadAddressesFromSeedWords(process.env.SEED_WORDS)
}

export const baseCommands = {
  assets: {
    registerAsset: `${BASE_COMMAND} ${VERBOSE} assets register-asset `,
    registerAlgorithm: `${BASE_COMMAND} ${VERBOSE} assets register-algorithm `,
    registerService: `${BASE_COMMAND} ${VERBOSE} assets register-service `,
    registerWorkflow: `${BASE_COMMAND} ${VERBOSE} assets register-workflow `,
    importMetadata: `${BASE_COMMAND} ${VERBOSE} assets import `,
    searchAsset: `${BASE_COMMAND} ${VERBOSE} assets search `,
    queryAsset: `${BASE_COMMAND} ${VERBOSE} assets query `,
    downloadAsset: `${BASE_COMMAND} ${VERBOSE} assets download `,
    orderAsset: `${BASE_COMMAND} ${VERBOSE} assets order `,
    getAsset: `${BASE_COMMAND} ${VERBOSE} assets get `,
    resolveDID: `${BASE_COMMAND} ${VERBOSE} assets resolve `
  },
  nfts721: {
    deploy: `${BASE_COMMAND} ${VERBOSE} nfts721 deploy `,
    clone: `${BASE_COMMAND} ${VERBOSE} nfts721 clone `,
    create: `${BASE_COMMAND} ${VERBOSE} nfts721 create `,
    show: `${BASE_COMMAND} ${VERBOSE} nfts721 show `,
    mint: `${BASE_COMMAND} ${VERBOSE} nfts721 mint `,
    mintSubscription: `${BASE_COMMAND} ${VERBOSE} nfts721 mint-subscription `,
    hold: `${BASE_COMMAND} ${VERBOSE} nfts721 hold `,
    balance: `${BASE_COMMAND} ${VERBOSE} nfts721 balance `,
    burn: `${BASE_COMMAND} ${VERBOSE} nfts721 burn `,
    order: `${BASE_COMMAND} ${VERBOSE} nfts721 order `,
    claim: `${BASE_COMMAND} ${VERBOSE} nfts721 claim `,
    access: `${BASE_COMMAND} ${VERBOSE} nfts721 access `,
    jwt: `${BASE_COMMAND} ${VERBOSE} nfts721 get-jwt `,
    download: `${BASE_COMMAND} ${VERBOSE} nfts721 download `
  },
  nfts1155: {
    deploy: `${BASE_COMMAND} ${VERBOSE} nfts1155 deploy `,
    clone: `${BASE_COMMAND} ${VERBOSE} nfts1155 clone `,
    create: `${BASE_COMMAND} ${VERBOSE} nfts1155 create `,
    show: `${BASE_COMMAND} ${VERBOSE} nfts1155 show `,
    hold: `${BASE_COMMAND} ${VERBOSE} nfts1155 hold `,
    balance: `${BASE_COMMAND} ${VERBOSE} nfts721 balance `,
    mint: `${BASE_COMMAND} ${VERBOSE} nfts1155 mint `,
    burn: `${BASE_COMMAND} ${VERBOSE} nfts1155 burn `,
    order: `${BASE_COMMAND} ${VERBOSE} nfts1155 order `,
    access: `${BASE_COMMAND} ${VERBOSE} nfts1155 access `,
    claim: `${BASE_COMMAND} ${VERBOSE} nfts1155 claim `,
    download: `${BASE_COMMAND} ${VERBOSE} nfts1155 download `
  },
  accounts: {
    list: `${BASE_COMMAND} ${VERBOSE} accounts list `,
    new: `${BASE_COMMAND} ${VERBOSE} accounts new `,
    balance: `${BASE_COMMAND} ${VERBOSE} accounts balance `,
    fund: `${BASE_COMMAND} ${VERBOSE} accounts fund `
  },
  network: {
    status: `${BASE_COMMAND} ${VERBOSE} network status `,
    list: `${BASE_COMMAND} ${VERBOSE} network list `
  },
  agreements: {
    list: `${BASE_COMMAND} ${VERBOSE} agreements list `,
    show: `${BASE_COMMAND} ${VERBOSE} agreements show `,
    abort: `${BASE_COMMAND} ${VERBOSE} agreements abort `
  },
  provenance: {
    register: `${BASE_COMMAND} ${VERBOSE} provenance register `,
    history: `${BASE_COMMAND} ${VERBOSE} provenance history `,
    inspect: `${BASE_COMMAND} ${VERBOSE} provenance inspect `
  },
  utils: {
    encodeDID: `${BASE_COMMAND} ${VERBOSE} utils encode-did `,
    decodeDID: `${BASE_COMMAND} ${VERBOSE} utils decode-did `,
    upload: `${BASE_COMMAND} ${VERBOSE} utils upload `,
    decrypt: `${BASE_COMMAND} ${VERBOSE} utils decrypt `,
    encrypt: `${BASE_COMMAND} ${VERBOSE} utils encrypt `,
    publishMetadata: `${BASE_COMMAND} ${VERBOSE} utils publish-nft-metadata `,
    getMetadata: `${BASE_COMMAND} ${VERBOSE} utils get-nft-metadata `
  }
}
