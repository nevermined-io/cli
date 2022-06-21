import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parseListAgreements,
  parseServiceAgreementId
} from '../helpers/StdoutParser'
const { execSync } = require('child_process')

describe('Agreements e2e Testing', () => {
  let did = ''
  let stdoutList = ''

  beforeAll(async () => {
    console.log(`Funding account: ${execOpts.accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execSync(fundCommand, execOpts)

    const registerAssetCommand = `${baseCommands.assets.registerAsset} --account "${execOpts.accounts[0]}" --name "CLI Testing service agreement" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execSync(registerAssetCommand, execOpts)

    console.log(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewAsset(registerStdout)
    console.log(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))

    const orderCommand = `${baseCommands.assets.orderAsset} ${did} --account "${execOpts.accounts[0]}"  `
    console.debug(`COMMAND: ${orderCommand}`)

    const orderStdout = execSync(orderCommand, execOpts)
    console.log(`STDOUT: ${orderStdout}`)
    const serviceAgreementId = parseServiceAgreementId(orderStdout)

    const parentPath = '/tmp/nevermined/test-order-agreements'
    const getCommand = `${baseCommands.assets.getAsset} ${did} --agreementId ${serviceAgreementId} --account "${execOpts.accounts[0]}" --path ${parentPath} --fileIndex 0 `
    console.debug(`COMMAND: ${getCommand}`)

    const getStdout = execSync(getCommand, execOpts)
    console.log(`STDOUT: ${getStdout}`)
  })

  test('List all the agreements for a given DID', async () => {
    const listAgreementsCommand = `${baseCommands.agreements.list} ${did}`
    stdoutList = execSync(listAgreementsCommand, execOpts)

    console.log(`List Agreements: ${stdoutList}`)
    expect(stdoutList.includes('AgreementID:'))
  })

  test('Shows details about an agreement', async () => {
    const agreement = parseListAgreements(stdoutList)

    const showAgreementsCommand = `${baseCommands.agreements.show} ${agreement}`
    const stdoutShow = execSync(showAgreementsCommand, execOpts)

    console.log(`Show Agreements: ${stdoutShow}`)
    expect(stdoutShow.includes('Access Consumer:'))
    expect(stdoutShow.includes('Access Provider:'))
  })
})
