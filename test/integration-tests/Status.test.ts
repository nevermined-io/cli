import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewAsset,
  parseListAgreements,
  parseServiceAgreementId
} from '../helpers/StdoutParser'
const { execSync } = require('child_process')

describe('Status e2e Testing', () => {
  let did = ''
  let stdoutList = ''

  test('Get a list of the available pre-configured networks', async () => {    
    const command = `${baseCommands.network.list} `
    const stdout = execSync(command, execOpts)

    console.log(`STDOUT: ${stdout}`)
    expect(stdout.includes('spree'))
    expect(stdout.includes('rinkeby'))
  })

  test('Get status information of a local network (spree)', async () => {
    const network = 'spree'
    const command = `${baseCommands.network.status} --network ${network} `
    const stdout = execSync(command, execOpts)

    console.log(`STDOUT: ${stdout}`)
    expect(stdout.includes(`Loading information from network ${network}`))
    expect(stdout.includes(`Status: Working`))
  })

})
