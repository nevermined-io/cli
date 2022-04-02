import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
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

  test('Get status information of a local network', async () => {
    const command = `${baseCommands.network.status} `
    const stdout = execSync(command, execOpts)

    console.log(`STDOUT: ${stdout}`)
    expect(stdout.includes(`Loading information from network`))
    expect(stdout.includes(`Status: Working`))
  })
})
