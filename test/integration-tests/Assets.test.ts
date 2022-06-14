import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parseDownloadPath,
  parseNumberResultsFromSearch,
  parseServiceAgreementId,
  sleep
} from '../helpers/StdoutParser'
import * as fs from 'fs'
import { mkdtempSync, writeFileSync } from 'fs'
import * as Path from 'path'
import { generateId } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
const { execSync } = require('child_process')

describe('Assets e2e Testing', () => {
  let did = ''

  beforeAll(async () => {
    console.log(`Funding account: ${execOpts.accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execSync(fundCommand, execOpts)

    const registerDatasetCommand = `${baseCommands.assets.registerDataset} --account "${execOpts.accounts[0]}" --name "${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerDatasetCommand}`)

    const registerStdout = execSync(registerDatasetCommand, execOpts)

    console.log(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewAsset(registerStdout)
    console.log(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))
  })

  test('Registering a new dataset and resolve the DID', async () => {
    const resolveDIDCommand = `${baseCommands.assets.resolveDID} ${did}`
    const stdoutResolve = execSync(resolveDIDCommand, execOpts)

    console.log(`Resolved: ${stdoutResolve}`)
    expect(stdoutResolve.includes('DID found'))
    expect(stdoutResolve.includes(did))
  })

  test('Registering a new algorithm', async () => {
    const registerAlgorithmCommand = `${baseCommands.assets.registerAlgorithm} --name "Test Algorithm" --author "${metadataConfig.author}" --price "0" --language "python" --entrypoint "python word_count.py" --container "python:3.8-alpine"  --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerAlgorithmCommand}`)

    const stdout = execSync(registerAlgorithmCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const algoDid = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${algoDid}`)
    expect(algoDid === null ? false : algoDid.startsWith('did:nv:'))
  })

  test('Registering an asset using metadata from a JSON', async () => {
    let jsonImported = JSON.parse(fs.readFileSync(metadataConfig.metadataFile).toString())
    jsonImported.main.author = jsonImported.main.author + generateId()
    const tempDir = mkdtempSync('/tmp/cli_test_')
    const randomMetadataFile = `${tempDir}/random_metadata.json`
    fs.writeFileSync(randomMetadataFile,  JSON.stringify(jsonImported, null, 4))

    const importCommand = `${baseCommands.assets.importMetadata} --metadata ${randomMetadataFile}`
    console.debug(`COMMAND: ${importCommand}`)

    const stdout = execSync(importCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const didImport = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${didImport}`)
    expect(didImport === null ? false : didImport.startsWith('did:nv:'))
  })

  test('Search for an asset', async () => {
    const registerDatasetCommand = `${baseCommands.assets.registerDataset} --name "searching test" --author "john.doe" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerDatasetCommand}`)

    const stdout = execSync(registerDatasetCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const didSearch = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${didSearch}`)
    expect(didSearch === null ? false : didSearch.startsWith('did:nv:'))

    const searchAssetCommand = `${baseCommands.assets.searchAsset} "searching" `
    console.debug(`COMMAND: ${searchAssetCommand}`)

    const searchStdout = execSync(searchAssetCommand, execOpts)
    console.log(`STDOUT: ${searchStdout}`)

    const numberResults = parseNumberResultsFromSearch(searchStdout)
    console.log(`Number of Results: ${numberResults}`)
    expect(numberResults === null ? false : Number(numberResults) > 0)
  })

  test('Download my own asset', async () => {
    const downloadCommand = `${baseCommands.assets.downloadAsset} ${did} --account "${execOpts.accounts[0]}" --path /tmp --fileIndex 0`
    console.debug(`COMMAND: ${downloadCommand}`)

    const downloadStdout = execSync(downloadCommand, execOpts)
    console.log(`STDOUT: ${downloadStdout}`)

    const path = parseDownloadPath(downloadStdout)
    console.log(`Path: ${path}`)
    expect(path != null)

    const files = fs.readdirSync(path || '').entries
    expect(files.length == 1)
  })

  test('Order and download an asset', async () => {
    const orderCommand = `${baseCommands.assets.orderAsset} ${did} --account "${execOpts.accounts[0]}"  `
    console.debug(`COMMAND: ${orderCommand}`)

    const orderStdout = execSync(orderCommand, execOpts)
    console.log(`STDOUT: ${orderStdout}`)
    const serviceAgreementId = parseServiceAgreementId(orderStdout)

    const parentPath = '/tmp/nevermined/test-order'
    const getCommand = `${baseCommands.assets.getAsset} ${did} --agreementId ${serviceAgreementId} --account "${execOpts.accounts[0]}" --path ${parentPath} --fileIndex 0 `
    console.debug(`COMMAND: ${getCommand}`)

    const getStdout = execSync(getCommand, execOpts)
    console.log(`STDOUT: ${getStdout}`)

    const files = fs.readdirSync(parentPath || '')
    expect(files.length == 1)

    files.forEach((file) => {
      expect(Path.extname(file) === '.md')
    })
  })
})

