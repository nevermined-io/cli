import { execOpts, baseCommands } from '../helpers/Config'
import {
  parseAddressOfContractDeployed,
  parseNewAccount
} from '../helpers/StdoutParser'
import execCommand from '../helpers/ExecCommand'

describe('Assets e2e Testing', () => {
  let accountAddress: string
  let accountPrivateKey: string
  const abiPath = 'test/resources/nfts/TestERC721.json'

  beforeAll(async () => {})

  test('List all the accounts ', async () => {
    const listCommand = `${baseCommands.accounts.list} `
    console.debug(`LIST COMMAND: ${listCommand}`)

    const stdout = execCommand(listCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
  })

  test('List all accounts with inventory', async () => {
    const deployCommand = `${baseCommands.nfts721.deploy} ${abiPath} --accountIndex 0  `
    console.debug(`COMMAND: ${deployCommand}`)

    const deployStdout = execCommand(deployCommand, execOpts)

    console.debug(`STDOUT: ${deployStdout}`)
    expect(deployStdout.includes(`Contract deployed into address`))
    const nftAddress = parseAddressOfContractDeployed(deployStdout)

    const listCommand = `${baseCommands.accounts.list} --nftAddress ${nftAddress}`
    console.debug(`LIST COMMAND: ${listCommand}`)

    const listStdout = execCommand(listCommand, execOpts)

    console.log(`STDOUT: ${listStdout}`)
  })

  test('Create a new account', async () => {
    const newAccountCommand = `${baseCommands.accounts.new} `
    console.debug(`NEW ACCOUNT COMMAND: ${newAccountCommand}`)

    const stdout = execCommand(newAccountCommand, execOpts)
    console.log(`STDOUT: ${stdout}`)

    const [address, privateKey] = parseNewAccount(stdout)
    accountAddress = address
    accountPrivateKey = privateKey

    console.log(`Address: ${address}`)
    expect(address === null ? false : address.startsWith('0x'))
    expect(privateKey === null ? false : privateKey.startsWith('0x'))
  })

  test('Fund an account', async () => {
    const fundCommand = `${baseCommands.accounts.fund} "${accountAddress}" --token both`
    console.debug(`FUND COMMAND: ${fundCommand}`)

    const stdout = execCommand(fundCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
  })

  test('Get the balance of an account', async () => {
    const balanceCommand = `${baseCommands.accounts.balance} "${accountAddress}" `
    console.debug(`BALANCE COMMAND: ${balanceCommand}`)

    const stdout = execCommand(balanceCommand, execOpts)

    console.log(`STDOUT: ${stdout}`)
  })
})
