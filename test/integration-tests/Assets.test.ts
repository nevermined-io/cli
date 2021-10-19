import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import { parseDIDFromNewAsset } from '../helpers/StdoutParser'
const { execSync } = require('child_process')

describe('Assets e2e Testing', () => {
  test('Registering a new dataset and resolve the DID', async () => {
    const registerDatasetCommand = `${baseCommands.assets.registerDataset} --title "${metadataConfig.title}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
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

  //   test('Registering a new algorithm', async () => {
  //     expect(false)
  //   })

  //   test('Registering a new workflow', async () => {
  //     expect(false)
  //   })

  //   test('Registering an asset using metadata from a JSON', async () => {
  //     expect(false)
  //   })

  //   test('Search for an asset', async () => {
  //     expect(false)
  //   })

  //   test('Download my own asset', async () => {
  //     expect(false)
  //   })

  //   test('Order and download an asset', async () => {
  //     expect(false)
  //   })
})
