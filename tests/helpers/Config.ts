const BASE_COMMAND = 'yarn start'

export const metadataConfig = {
  title: 'CLI Testing Dataset #',
  author: 'Nevermined CLI',
  price: 1,
  url: 'https://raw.githubusercontent.com/nevermined-io/docs/master/README.md',
  contentType: 'text/text'
}

export const execOpts = {
  env: {
    NODE_URL: 'http://localhost:8545',
    TOKEN_ADDRESS: '0x0',
    MNEMONIC: process.env.MNEMONIC
  }
}

export const baseCommands = {
  assets: {
    registerDataset: `${BASE_COMMAND} -v assets register dataset `,
    resolveDID: `${BASE_COMMAND} -v assets resolve `
  }
}
