import { execOpts, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parsePasswordFromOrder,
  parseUrlAndPassword
} from '../helpers/StdoutParser'
import execCommand from '../helpers/ExecCommand'

// TODO: Re-enable DTP tests when `sdk-dtp` is published back
describe('Assets e2e Testing', () => {
  let did = ''
  let url = ''
  let password = ''

  beforeAll(async () => {
    try {
      console.log(`Funding account: ${execOpts.accounts[0]}`)
      const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
      console.debug(`COMMAND: ${fundCommand}`)
  
      execCommand(fundCommand, execOpts)
    } catch {
      console.error('Unable to fund account')
    }
  })

  test('Upload a file', async () => {
    const uploadCommand = `${baseCommands.utils.upload} --encrypt  --accountIndex 0 README.md`
    console.debug(`COMMAND: ${uploadCommand}`)

    const uploadStdout = execCommand(uploadCommand, execOpts)

    ;({ url, password } = parseUrlAndPassword(uploadStdout))
  })

  test('Registering a new dataset and resolve the DID', async () => {
    const registerAssetCommand = `${baseCommands.assets.registerAsset}  --accountIndex 0 --name a --author b --price 1 --urls ${url} --password '${password}' --contentType text/plain`
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execCommand(registerAssetCommand, execOpts)

    console.log(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewAsset(registerStdout)
    console.log(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))
    const resolveDIDCommand = `${baseCommands.assets.resolveDID} ${did}`
    const stdoutResolve = execCommand(resolveDIDCommand, execOpts)

    console.log(`Resolved: ${stdoutResolve}`)
    expect(stdoutResolve.includes('DID found'))
    expect(stdoutResolve.includes(did))
  })

  test('Order and download an asset', async () => {
    const getCommand = `${baseCommands.assets.getAsset} ${did} --accountIndex 0 --fileIndex 0 --password abde`
    console.debug(`COMMAND: ${getCommand}`)

    const getStdout = execCommand(getCommand, execOpts)
    console.log(`STDOUT: ${getStdout}`)

    const pass = parsePasswordFromOrder(getStdout)
    console.log(`Password: ${pass}`)
    expect(pass).toEqual(password)
  })
})
