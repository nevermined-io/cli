import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseDIDFromNewNFT,
  parseNFTOrderAgreementId
} from '../helpers/StdoutParser'
import * as fs from 'fs'
import * as Path from 'path'
const { execSync } = require('child_process')

describe('NFTs (ERC-1155) e2e Testing (Seller transfer)', () => {
  let did = ''
  let nftCap = 10
  let nftRoyalties = 5
  let orderAgreementId = ''

  beforeAll(async () => {
    console.log(`Funding account: ${execOpts.accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execSync(fundCommand, execOpts)
    execSync(`${baseCommands.accounts.fund} "${execOpts.accounts[1]}" --token erc20`, execOpts)
    execSync(`${baseCommands.accounts.fund} "${execOpts.accounts[2]}" --token erc20`, execOpts)

  })

  test('The buyer order and the seller transfer a NFT (directly)', async () => {
    const registerDatasetCommand = `${baseCommands.nfts1155.create} --account "${execOpts.accounts[0]}" --preMint true --name " NFTs 1155 test2 ${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType} --cap ${nftCap} --royalties ${nftRoyalties} --nftMetadata "${metadataConfig.metadataNFT}" `
    console.debug(`COMMAND: ${registerDatasetCommand}`)

    const registerStdout = execSync(registerDatasetCommand, execOpts)

    console.debug(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewNFT(registerStdout)

    expect(did.length > 0)

    const orderCommand = `${baseCommands.nfts1155.order} "${did}" --amount 1 --account "${execOpts.accounts[2]}"  `
    console.debug(`COMMAND: ${orderCommand}`)

    const orderStdout = execSync(orderCommand, execOpts).toString()

    console.debug(`ORDER STDOUT: ${orderStdout}`)
    const orderAgreementId = parseNFTOrderAgreementId(orderStdout)

    expect(orderAgreementId.length > 0)

    const transferCommand = `${baseCommands.nfts1155.transfer} "${orderAgreementId}" --amount 1 --account "${execOpts.accounts[0]}" --buyerAccount "${execOpts.accounts[2]}" `
    console.debug(`COMMAND: ${transferCommand}`)

    const stdout = execSync(transferCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`Transferring NFT (ERC-1155)`))
    expect(stdout.includes(`Transfer done!`))
  })

  test('As NFT holder I can download the files associated to an asset', async () => {
    const destination = `/tmp/nevemined/cli/test/nft`
    const downloadCommand = `${baseCommands.nfts1155.download} "${did}" --destination "${destination}" --account "${execOpts.accounts[2]}"  `
    console.debug(`COMMAND: ${downloadCommand}`)

    const stdout = execSync(downloadCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`NFT Assets downloaded to: ${destination}`))

    const files = fs.readdirSync(destination || '')
    expect(files.length == 1)

    files.forEach((file) => {
      expect(Path.extname(file) === '.md')
    })
  })
})
