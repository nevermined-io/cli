import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset
} from '../helpers/StdoutParser'
import execCommand from '../helpers/ExecCommand'

describe('Compute e2e Testing', () => {
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

  test('Registering a workflow associating the data and the algorithm', async () => {
    console.error(`PENDING TO IMPLEMENT`)
  })

  test('Order a compute job', async () => {    
    console.error(`PENDING TO IMPLEMENT`)
    
  })

  test('Executing a compute job', async () => {    
    console.error(`PENDING TO IMPLEMENT`)
    
  })

  test('Fetching status of a compute job', async () => {    
    console.error(`PENDING TO IMPLEMENT`)
    
  })

  test('Fetching logs of a compute job', async () => {    
    console.error(`PENDING TO IMPLEMENT`)
    
  })
})
