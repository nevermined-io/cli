import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import { parseDIDFromNewAsset, parseDownloadPath, parseNumberResultsFromSearch, parseServiceAgreementId } from '../helpers/StdoutParser'
import * as fs from 'fs'
const { execSync } = require('child_process')

describe('Assets e2e Testing', () => {

  beforeAll(async () => {
    console.log(`Funding account: ${execOpts.accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execSync(fundCommand, execOpts)  
  })

  test('Registering a new dataset and resolve the DID', async () => {

    const registerDatasetCommand = `${baseCommands.assets.registerDataset} --account "${execOpts.accounts[0]}" --name "${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerDatasetCommand}`)

    const stdout = execSync(registerDatasetCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const did = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${did}`)
    expect(did === null ? false : did.startsWith('did:nv:'))

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
    const did = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${did}`)
    expect(did === null ? false : did.startsWith('did:nv:'))

  })

  test('Registering an asset using metadata from a JSON', async () => {

    const importCommand = `${baseCommands.assets.importMetadata} --metadata ${metadataConfig.metadataFile}`
    console.debug(`COMMAND: ${importCommand}`)

    const stdout = execSync(importCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const did = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${did}`)
    expect(did === null ? false : did.startsWith('did:nv:'))

  })

  test('Search for an asset', async () => {

    const registerDatasetCommand = `${baseCommands.assets.registerDataset} --name "searching test" --author "john.doe" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerDatasetCommand}`)

    const stdout = execSync(registerDatasetCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const did = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${did}`)
    expect(did === null ? false : did.startsWith('did:nv:'))

    const searchAssetCommand = `${baseCommands.assets.searchAsset} "searching" `
    console.debug(`COMMAND: ${searchAssetCommand}`)

    const searchStdout = execSync(searchAssetCommand, execOpts)
    console.log(`STDOUT: ${searchStdout}`)

    const numberResults = parseNumberResultsFromSearch(searchStdout)
    console.log(`Number of Results: ${numberResults}`)
    expect(numberResults === null ? false : Number(numberResults) > 0)    
  })


  test('Download my own asset', async () => {

    const registerDatasetCommand = `${baseCommands.assets.registerDataset} --account "${execOpts.accounts[0]}" --name "searching test" --author "john.doe" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerDatasetCommand}`)

    const stdout = execSync(registerDatasetCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const did = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${did}`)
    expect(did === null ? false : did.startsWith('did:nv:'))

    const downloadCommand = `${baseCommands.assets.downloadAsset} ${did} --account "${execOpts.accounts[0]}" --path /tmp `
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

    const registerDatasetCommand = `${baseCommands.assets.registerDataset} --account "${execOpts.accounts[0]}" --name "order test" --author "john.doe" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerDatasetCommand}`)

    const stdout = execSync(registerDatasetCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
    const did = parseDIDFromNewAsset(stdout)
    console.log(`DID: ${did}`)
    expect(did === null ? false : did.startsWith('did:nv:'))    

    const orderCommand = `${baseCommands.assets.orderAsset} ${did} --account "${execOpts.accounts[0]}"  `
    console.debug(`COMMAND: ${orderCommand}`)

    const orderStdout = execSync(orderCommand, execOpts)
    console.log(`STDOUT: ${orderStdout}`)
    const serviceAgreementId = parseServiceAgreementId(orderStdout)

    const getCommand = `${baseCommands.assets.getAsset} ${did} --agreementId ${serviceAgreementId} --account "${execOpts.accounts[0]}" --path /tmp/ `
    console.debug(`COMMAND: ${getCommand}`)

    const getStdout = execSync(getCommand, execOpts)
    console.log(`STDOUT: ${getStdout}`)    

    const path = parseDownloadPath(getStdout)
    console.log(`Path: ${path}`)
    expect(path != null) 
    
    const files = fs.readdirSync(path || '').entries    
    expect(files.length == 1)    
  })
})
