import { execOpts, baseCommands, getAccountsFromMnemonic } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parsePasswordFromOrder,
  parseUrlAndPassword
} from '../helpers/StdoutParser'
const { execSync } = require('child_process')

describe('Assets e2e Testing', () => {
  let did = ''
  let url = ''
  let password = ''
  let accounts: string[] = []
  
  beforeAll(async () => {
    accounts = await getAccountsFromMnemonic(execOpts.env.MNEMONIC)
    console.log('pwd', execSync('pwd', execOpts).toString())

    console.log(`Funding account: ${accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execSync(fundCommand, execOpts)
    console.log(stdout.toString())
  })

  test('Upload a file', async () => {
    const uploadCommand = `${baseCommands.utils.upload} --encrypt --account "${accounts[0]}" README.md`
    console.debug(`COMMAND: ${uploadCommand}`)

    const uploadStdout = execSync(uploadCommand, execOpts)

    ;({ url, password } = parseUrlAndPassword(uploadStdout))
  })

  test('Registering a new dataset and resolve the DID', async () => {
    const registerAssetCommand = `${baseCommands.assets.registerAsset} --account "${accounts[0]}" --name a --author b --price 1 --urls ${url} --password '${password}' --contentType text/plain`
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execSync(registerAssetCommand, execOpts)

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
    const getCommand = `${baseCommands.assets.getAsset} ${did} --account "${accounts[0]}" --fileIndex 0 --password abde`
    console.debug(`COMMAND: ${getCommand}`)

    const getStdout = execSync(getCommand, execOpts)
    console.log(`STDOUT: ${getStdout}`)

    const pass = parsePasswordFromOrder(getStdout)
    console.log(`Password: ${pass}`)
    expect(pass).toEqual(password)
  })
})
