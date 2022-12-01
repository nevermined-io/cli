import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parseDownloadPath,
  parseNumberResultsFromSearch,
  parseServiceAgreementId
} from '../helpers/StdoutParser'
import * as fs from 'fs'
import { mkdtempSync } from 'fs'
import * as Path from 'path'
import { generateId } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import execCommand from '../helpers/ExecCommand'

describe('Assets e2e Testing', () => {
  let did = ''

  beforeAll(async () => {
    console.log(`NETWORK: ${execOpts.env.NETWORK}`)
    try {
      if (
        execOpts.env.NETWORK === 'spree' ||
        execOpts.env.NETWORK === 'geth-localnet' ||
        execOpts.env.NETWORK === 'polygon-localnet'
      ) {
        console.log(
          `Funding accounts: ${execOpts.accounts[0]} + ${execOpts.accounts[1]}`
        )
        
        let fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token both`
        console.log(fundCommand)
        console.log(execCommand(fundCommand, execOpts))
        fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[1]}" --token both`
        console.log(fundCommand)
        console.log(execCommand(fundCommand, execOpts))
      }
    } catch (error) {
      console.warn(`Unable to fund accounts`)
    }
    const registerAssetCommand = `${baseCommands.assets.registerAsset}  --accountIndex 0 --name "${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execCommand(registerAssetCommand, execOpts)

    console.log(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewAsset(registerStdout)
    console.log(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))
  })

  test('Registering a new dataset and resolve the DID', async () => {
    const resolveDIDCommand = `${baseCommands.assets.resolveDID} ${did}`
    const stdoutResolve = execCommand(resolveDIDCommand, execOpts)

    console.log(`Resolved: ${stdoutResolve}`)
    expect(stdoutResolve.includes('DID found'))
    expect(stdoutResolve.includes(did))
  })

  test('Registering a new algorithm', async () => {
    const registerAlgorithmCommand = `${baseCommands.assets.registerAlgorithm} --name "Test Algorithm" --author "${metadataConfig.author}" --price "0" --language "python" --entrypoint "python word_count.py" --container "python:3.8-alpine"  --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerAlgorithmCommand}`)

    const stdout = execCommand(registerAlgorithmCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const algoDid = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${algoDid}`)
    expect(algoDid === null ? false : algoDid.startsWith('did:nv:'))
  })

  test('Registering an asset using metadata from a JSON', async () => {
    const jsonImported = JSON.parse(
      fs.readFileSync(metadataConfig.metadataFile).toString()
    )
    jsonImported.main.author = jsonImported.main.author + generateId()
    const tempDir = mkdtempSync('/tmp/cli_test_')
    const randomMetadataFile = `${tempDir}/random_metadata.json`
    fs.writeFileSync(randomMetadataFile, JSON.stringify(jsonImported, null, 4))

    const importCommand = `${baseCommands.assets.importMetadata} --metadata ${randomMetadataFile} --price 1`
    console.debug(`COMMAND: ${importCommand}`)

    const stdout = execCommand(importCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const didImport = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${didImport}`)
    expect(didImport === null ? false : didImport.startsWith('did:nv:'))
  })

  test('Search for an asset', async () => {
    const registerAssetCommand = `${baseCommands.assets.registerAsset} --name "searching test" --author "john.doe" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const stdout = execCommand(registerAssetCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const didSearch = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${didSearch}`)
    expect(didSearch === null ? false : didSearch.startsWith('did:nv:'))

    const searchAssetCommand = `${baseCommands.assets.searchAsset} "searching" `
    console.debug(`COMMAND: ${searchAssetCommand}`)

    const searchStdout = execCommand(searchAssetCommand, execOpts)
    console.log(`STDOUT: ${searchStdout}`)

    const numberResults = parseNumberResultsFromSearch(searchStdout)
    console.log(`Number of Results: ${numberResults}`)
    expect(numberResults === null ? false : Number(numberResults) > 0)
  })


  test('Search for an asset by query', async () => {

    const query = "{\"bool\":{\"must\":[{\"query_string\":{\"query\":\"**\",\"fields\":[\"service.attributes.main.name\"]}}]}}"

    const queryAssetCommand = `${baseCommands.assets.queryAsset} ${query} `
    console.debug(`COMMAND: ${queryAssetCommand}`)

    const searchStdout = execCommand(queryAssetCommand, execOpts)
    console.log(`STDOUT: ${searchStdout}`)

    const numberResults = parseNumberResultsFromSearch(searchStdout)
    console.log(`Number of Results: ${numberResults}`)
    expect(numberResults === null ? false : Number(numberResults) > 0)
  })

  test('Download my own asset', async () => {
    const downloadCommand = `${baseCommands.assets.downloadAsset} ${did}  --accountIndex 0 --destination /tmp --fileIndex 0`
    console.debug(`COMMAND: ${downloadCommand}`)

    const downloadStdout = execCommand(downloadCommand, execOpts)
    console.log(`STDOUT: ${downloadStdout}`)

    const path = parseDownloadPath(downloadStdout)
    console.log(`Path: ${path}`)
    expect(path != null)

    const files = fs.readdirSync(path || '').entries
    expect(files.length == 1)
  })

  test('Order and download an asset', async () => {
    const orderCommand = `${baseCommands.assets.orderAsset} ${did}  --accountIndex 1  `
    console.debug(`COMMAND: ${orderCommand}`)

    const orderStdout = execCommand(orderCommand, execOpts)
    console.log(`STDOUT: ${orderStdout}`)
    const serviceAgreementId = parseServiceAgreementId(orderStdout)

    const parentPath = '/tmp/nevermined/test-order'
    const getCommand = `${baseCommands.assets.getAsset} ${did} --agreementId ${serviceAgreementId}  --accountIndex 0 --destination ${parentPath} --fileIndex 0 `
    console.debug(`COMMAND: ${getCommand}`)

    const getStdout = execCommand(getCommand, execOpts)
    console.log(`STDOUT: ${getStdout}`)

    const files = fs.readdirSync(parentPath || '')
    expect(files.length == 1)

    files.forEach((file) => {
      expect(Path.extname(file) === '.md')
    })
  })
})
