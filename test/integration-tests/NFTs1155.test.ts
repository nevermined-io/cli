import { execOpts, metadataConfig, baseCommands, getAccountsFromMnemonic } from '../helpers/Config'
import {
  parseDIDFromNewNFT,
  parseNFTOrderAgreementId
} from '../helpers/StdoutParser'
import * as fs from 'fs'
import * as Path from 'path'
const { execSync } = require('child_process')

describe('NFTs (ERC-1155) e2e Testing (Gateway transfer)', () => {
  let did = ''
  let nftCap = 10
  let nftRoyalties = 5
  let orderAgreementId = ''
  let accounts: string[] = []

  beforeAll(async () => {
    accounts = await getAccountsFromMnemonic(execOpts.env.MNEMONIC)

    console.log(`Funding account: ${accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execSync(fundCommand, execOpts)
    execSync(
      `${baseCommands.accounts.fund} "${accounts[1]}" --token erc20`,
      execOpts
    )
    execSync(
      `${baseCommands.accounts.fund} "${accounts[2]}" --token erc20`,
      execOpts
    )
  })

  test('Register an asset with a NFT (ERC-1155) attached to it', async () => {
    const registerAssetCommand = `${baseCommands.nfts1155.create} --account "${accounts[0]}" --name " NFTs 1155 test ${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType} --cap ${nftCap} --royalties ${nftRoyalties} --nftMetadata "${metadataConfig.metadataNFT}" `
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execSync(registerAssetCommand, execOpts)

    console.debug(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewNFT(registerStdout)
    console.debug(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))
  })

  test('Shows NFTs (1155) information', async () => {
    const showCommand = `${baseCommands.nfts1155.show} "${did}" `
    console.debug(`COMMAND: ${showCommand}`)

    const showStdout = execSync(showCommand, execOpts)

    console.debug(`STDOUT: ${showStdout}`)
    expect(showStdout.includes(did))
    expect(showStdout.includes(`Mint Cap: ${nftCap}`))
  })

  test('It mints a NFT (ERC-1155)', async () => {
    const mintCommand = `${baseCommands.nfts1155.mint} "${did}" --amount 10 --account "${accounts[0]}"  `
    console.debug(`COMMAND: ${mintCommand}`)

    const stdout = execSync(mintCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`Minted 20 NFTs (ERC-1155)`))
  })

  test('It burns a NFT (ERC-1155)', async () => {
    const burnCommand = `${baseCommands.nfts1155.burn} "${did}" --amount 1 --account "${accounts[0]}"  `
    console.debug(`COMMAND: ${burnCommand}`)

    const stdout = execSync(burnCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`Burned 1 NFTs (ERC-1155)`))
  })

  test('The buyer can order and get access to the files (through the gateway)', async () => {
    const orderCommand = `${baseCommands.nfts1155.order} "${did}" --amount 1 --account "${accounts[1]}"  `
    console.debug(`COMMAND: ${orderCommand}`)

    const orderStdout = execSync(orderCommand, execOpts)

    console.debug(`STDOUT: ${orderStdout}`)
    orderAgreementId = parseNFTOrderAgreementId(orderStdout)
    expect(orderAgreementId != '')
    expect(orderStdout.includes(did))
    expect(orderStdout.includes(`NFT Agreement Created`))

    const destination = `/tmp/nevemined/cli/test-gateway/access`
    const downloadCommand = `${baseCommands.nfts1155.access} "${did}" "${orderAgreementId}" --destination "${destination}" --seller "${accounts[0]}" --account "${accounts[1]}"  `
    console.debug(`COMMAND: ${downloadCommand}`)

    const stdout = execSync(downloadCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`NFT Assets downloaded`))

    const files = fs.readdirSync(destination || '')
    expect(files.length == 1)

    files.forEach((file) => {
      expect(Path.extname(file) === '.md')
    })
  })
})
