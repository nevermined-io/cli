import { execOpts, baseCommands } from '../helpers/Config'
import execCommand from '../helpers/ExecCommand'

describe('Status e2e Testing', () => {
  let did = ''
  let stdoutList = ''

  test('Get a list of the available pre-configured networks', async () => {
    const command = `${baseCommands.network.list} `
    const stdout = execCommand(command, execOpts)

    console.log(`STDOUT: ${stdout}`)
    expect(stdout.includes('geth-localnet'))
    expect(stdout.includes('matic'))
  })

  test('Get status information of a local network', async () => {
    const command = `${baseCommands.network.status} `
    const stdout = execCommand(command, execOpts)

    console.log(`STDOUT: ${stdout}`)
    expect(stdout.includes(`Loading information from network`))
    expect(stdout.includes(`Status: Working`))
  })
})
