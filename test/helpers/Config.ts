const BASE_COMMAND = 'yarn start'
const VERBOSE = '-v'

export const metadataConfig = {
  name: 'CLI Testing Dataset #',
  author: 'Nevermined CLI',
  price: 1,
  url: 'https://raw.githubusercontent.com/nevermined-io/docs/master/README.md',
  contentType: 'text/plain',
  metadataFile: 'test/resources/example-1.json',
  metadataFileWorkflow: 'test/resources/metadata_workflow_coordinator.json'
}

export const execOpts = {
  env: {
    ...process.env,
    NODE_URL: 'http://localhost:8545',
    TOKEN_ADDRESS: '0x0',
    MNEMONIC: process.env.MNEMONIC
  },
  accounts: [
    '0xe2DD09d719Da89e5a3D0F2549c7E24566e947260',
    '0xBE5449a6A97aD46c8558A3356267Ee5D2731ab5e',
    '0xA78deb2Fa79463945C247991075E2a0e98Ba7A09'
  ]
}

export const baseCommands = {
  assets: {
    registerDataset: `${BASE_COMMAND} ${VERBOSE} assets register-dataset `,
    registerAlgorithm: `${BASE_COMMAND} ${VERBOSE} assets register-algorithm `,
    registerWorkflow: `${BASE_COMMAND} ${VERBOSE} assets register-workflow `,
    importMetadata: `${BASE_COMMAND} ${VERBOSE} assets import `,
    searchAsset: `${BASE_COMMAND} ${VERBOSE} assets search `,
    downloadAsset: `${BASE_COMMAND} ${VERBOSE} assets download `,
    orderAsset: `${BASE_COMMAND} ${VERBOSE} assets order `,
    getAsset: `${BASE_COMMAND} ${VERBOSE} assets get `,
    resolveDID: `${BASE_COMMAND} ${VERBOSE} assets resolve `
  },
  accounts: {
    list: `${BASE_COMMAND} ${VERBOSE} accounts list `,
    new: `${BASE_COMMAND} ${VERBOSE} accounts new `,
    balance: `${BASE_COMMAND} ${VERBOSE} accounts balance `,
    fund: `${BASE_COMMAND} ${VERBOSE} accounts fund `
  }
}
