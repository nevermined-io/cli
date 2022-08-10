import { generateId } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parseProvenanceId
} from '../helpers/StdoutParser'
import execCommand from '../helpers/ExecCommand'

describe('Provenance e2e Testing', () => {
  let did = ''

  beforeAll(async () => {
    console.log(`Funding account: ${execOpts.accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execCommand(fundCommand, execOpts)

    const registerAssetCommand = `${baseCommands.assets.registerAsset} --account "${execOpts.accounts[0]}" --name "CLI Testing service agreement" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType}`
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execCommand(registerAssetCommand, execOpts)

    console.log(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewAsset(registerStdout)
    console.log(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))
  })

  test('Register the "used" provenance event and inspect', async () => {
    const activityId = generateId()
    const registerCommand = `${baseCommands.provenance.register} ${did} --account "${execOpts.accounts[0]}" --method used --agentId "${execOpts.accounts[1]}" --activityId "${activityId}" `
    const registerStdout = execCommand(registerCommand, execOpts)

    console.log(`Register Provenance: ${registerStdout}`)
    expect(registerStdout.includes('AgreementID:'))

    const provenanceId = parseProvenanceId(registerStdout)
    console.log(`Provenance Id: ${provenanceId}`)
    expect(provenanceId.length === 64)

    const inspectCommand = `${baseCommands.provenance.inspect} ${provenanceId} `
    console.debug(`COMMAND: ${inspectCommand}`)
    const inspectStdout = execCommand(inspectCommand, execOpts)
    console.log(`Inspect: ${inspectStdout}`)
    expect(inspectStdout.includes(did))
  })

  test('Show all the provenance history of a DID ', async () => {
    const historyCommand = `${baseCommands.provenance.history} ${did}  `
    const historyStdout = execCommand(historyCommand, execOpts)

    console.log(`Provenance History: ${historyStdout}`)
    expect(historyStdout.includes(did))
  })
})
