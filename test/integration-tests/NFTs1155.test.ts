import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewNFT,
  parseNFTOrderAgreementId
} from '../helpers/StdoutParser'
import * as fs from 'fs'
import * as Path from 'path'
import execCommand from '../helpers/ExecCommand'

describe('NFTs (ERC-1155) e2e Testing (Gateway transfer)', () => {
  let did = ''
  const nftCap = 10
  const nftRoyalties = 5
  let orderAgreementId = ''

  beforeAll(async () => {
    console.log(`NETWORK: ${execOpts.env.NETWORK}`)
    try {
      if (
        execOpts.env.NETWORK === 'spree' ||
        execOpts.env.NETWORK === 'geth-localnet' ||
        execOpts.env.NETWORK === 'polygon-localnet'
      ) {
        console.log(
          `Funding accounts: ${execOpts.accounts[0]} + ${execOpts.accounts[1]} + ${execOpts.accounts[2]}`
        )
        execCommand(
          `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`,
          execOpts
        )

        execCommand(
          `${baseCommands.accounts.fund} "${execOpts.accounts[1]}" --token erc20`,
          execOpts
        )
        execCommand(
          `${baseCommands.accounts.fund} "${execOpts.accounts[2]}" --token erc20`,
          execOpts
        )
      }
    } catch (error) {
      console.warn(`Unable to fund accounts`)
    }
  })

  test('Register an asset with a NFT (ERC-1155) attached to it', async () => {
    const registerAssetCommand = `${baseCommands.nfts1155.create} --accountIndex 0 --name " NFTs 1155 test ${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType} --cap ${nftCap} --royalties ${nftRoyalties} --nftMetadata "${metadataConfig.metadataNFT}" `
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execCommand(registerAssetCommand, execOpts)

    console.debug(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewNFT(registerStdout)
    console.debug(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))
  })

  test('Shows NFTs (1155) information', async () => {
    const showCommand = `${baseCommands.nfts1155.show} "${did}" `
    console.debug(`COMMAND: ${showCommand}`)

    const showStdout = execCommand(showCommand, execOpts)

    console.debug(`STDOUT: ${showStdout}`)
    expect(showStdout.includes(did))
    expect(showStdout.includes(`Mint Cap: ${nftCap}`))
  })

  test('It mints a NFT (ERC-1155)', async () => {
    const mintCommand = `${baseCommands.nfts1155.mint} "${did}" --amount 10 --accountIndex 0  `
    console.debug(`COMMAND: ${mintCommand}`)

    const stdout = execCommand(mintCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`Minted 20 NFTs (ERC-1155)`))
  })

  test('It burns a NFT (ERC-1155)', async () => {
    const burnCommand = `${baseCommands.nfts1155.burn} "${did}" --amount 1 --accountIndex 0  `
    console.debug(`COMMAND: ${burnCommand}`)

    const stdout = execCommand(burnCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`Burned 1 NFTs (ERC-1155)`))
  })

  test('The buyer can order and get access to the files (through the gateway)', async () => {
    const orderCommand = `${baseCommands.nfts1155.order} "${did}" --amount 1 --accountIndex 1  `
    console.debug(`COMMAND: ${orderCommand}`)

    const orderStdout = execCommand(orderCommand, execOpts)

    console.debug(`STDOUT: ${orderStdout}`)
    orderAgreementId = parseNFTOrderAgreementId(orderStdout)
    expect(orderAgreementId != '')
    expect(orderStdout.includes(did))
    expect(orderStdout.includes(`NFT Agreement Created`))

    const destination = `/tmp/nevemined/cli/test-gateway/access`
    const downloadCommand = `${baseCommands.nfts1155.access} "${did}" --agreementId "${orderAgreementId}" --destination "${destination}" --accountIndex 1  `
    console.debug(`COMMAND: ${downloadCommand}`)

    const stdout = execCommand(downloadCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`NFT Assets downloaded`))

    const files = fs.readdirSync(destination || '')
    expect(files.length == 1)

    files.forEach((file) => {
      expect(Path.extname(file) === '.md')
    })
  })

  test('As NFT holder the buyer can download contents without an agreementID', async () => {

    const destination = `/tmp/nevemined/cli/test-gateway/access-2`
    const downloadCommand = `${baseCommands.nfts1155.access} "${did}" --destination "${destination}" --accountIndex 1  `
    console.debug(`COMMAND: ${downloadCommand}`)

    const stdout = execCommand(downloadCommand, execOpts)

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
