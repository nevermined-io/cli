import { execOpts, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parseDownloadFile,
  parsePasswordFromOrder,
  parseUrlAndPassword
} from '../helpers/StdoutParser'
import execCommand from '../helpers/ExecCommand'

// TODO: Re-enable DTP tests when `sdk-dtp` is published back
describe('Assets e2e Testing', () => {
  let did = ''
  let url = ''
  let password = ''
  let downloadedPath: string | null = ''

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
    const uploadCommand = `${baseCommands.utils.upload} --encrypt --accountIndex 0 LICENSE`
    console.debug(`COMMAND: ${uploadCommand}`)

    const uploadStdout = execCommand(uploadCommand, execOpts)

    ;({ url, password } = parseUrlAndPassword(uploadStdout))

    console.log(`URL: ${url}`)
    console.log(`Password: ${password}`)
  })

  test('Registering a new dataset and resolve the DID', async () => {
    const registerAssetCommand = `${baseCommands.assets.registerAsset}  --accountIndex 0 --name a --author b --price 1 --urls "${url}" --password "${password}" --contentType text/plain`
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
    const getCommand = `${baseCommands.assets.getAsset} ${did} --accountIndex 1 --fileIndex 1 --password abde --destination /tmp/.cli-test`
    console.debug(`COMMAND: ${getCommand}`)

    const getStdout = execCommand(getCommand, execOpts)
    console.log(`STDOUT: ${getStdout}`)

    const pass = parsePasswordFromOrder(getStdout)
    console.log(`Password: ${pass}`)
    expect(pass).toEqual(password)

    downloadedPath = parseDownloadFile(getStdout)
    console.log(`Downloaded Path: ${downloadedPath}`)
  })

  test('Decrypt the content', async () => {
    const decryptCommand = `${baseCommands.utils.decrypt} ${downloadedPath} --password ${password}`
    console.debug(`COMMAND: ${decryptCommand}`)

    const decryptStdout = execCommand(decryptCommand, execOpts)
    console.log(`STDOUT: ${decryptStdout}`)

    expect(decryptStdout.includes(`File decrypted successfully`))
  })
})
