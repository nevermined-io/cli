import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parseDownloadPath,
  parseNumberResultsFromSearch,
  parseServiceAgreementId,
  parseUrlAndPassword
} from '../helpers/StdoutParser'
import * as fs from 'fs'
import * as Path from 'path'
const { execSync } = require('child_process')

describe('Assets e2e Testing', () => {
  let did = ''
  let url = ''
  let password = ''

  beforeAll(async () => {
    console.log('pwd', execSync('pwd', execOpts).toString())
  
    console.log(`Funding account: ${execOpts.accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execSync(fundCommand, execOpts)
    console.log(stdout.toString())

  })

  test('Upload a file', async () => {
    const uploadCommand = `${baseCommands.utils.upload} --encrypt --account "${execOpts.accounts[0]}" README.md`
    console.debug(`COMMAND: ${uploadCommand}`)

    const uploadStdout = execSync(uploadCommand, execOpts)
    const res = parseUrlAndPassword(uploadStdout)
    url = res.url
    password = res.password
  })

  test('Registering a new dataset and resolve the DID', async () => {
    const registerDatasetCommand = `${baseCommands.assets.registerDataset} --account "${execOpts.accounts[0]}" --name a --author b --price 1 --urls ${url} --password "${password}" --contentType text/plain`
    console.debug(`COMMAND: ${registerDatasetCommand}`)

    const registerStdout = execSync(registerDatasetCommand, execOpts)

    console.log(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewAsset(registerStdout)
    console.log(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))
    const resolveDIDCommand = `${baseCommands.assets.resolveDID} ${did}`
    const stdoutResolve = execSync(resolveDIDCommand, execOpts)

    console.log(`Resolved: ${stdoutResolve}`)
    expect(stdoutResolve.includes('DID found'))
    expect(stdoutResolve.includes(did))
  })

  test('Order and download an asset', async () => {
    const getCommand = `${baseCommands.assets.getAsset} ${did} --account "${execOpts.accounts[0]}" --fileIndex 0 --password abde`
    console.debug(`COMMAND: ${getCommand}`)

    const getStdout = execSync(getCommand, execOpts)
    console.log(`STDOUT: ${getStdout}`)

  })
})
