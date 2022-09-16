import { execOpts, metadataConfig, baseCommands } from '../helpers/Config'
import {
  parseAddressOfContractDeployed,
  parseDIDFromNewNFT,
  parseNFTOrderAgreementId
} from '../helpers/StdoutParser'

import * as fs from 'fs'
import * as Path from 'path'
import execCommand from '../helpers/ExecCommand'

describe('NFTs (ERC-721) e2e Testing', () => {
  const abiPath = 'test/resources/nfts/TestERC721.json'
  const abiPath2 = 'test/resources/nfts/NFT721SubscriptionUpgradeable.json'
  let did = ''
  let orderAgreementId = ''
  let nftAddress = ''
  let metadataUri = 'http://nevermined.io/xxx'

  beforeAll(async () => {
    console.log(`Funding account: ${execOpts.accounts[0]}`)
    const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    const stdout = execCommand(fundCommand, execOpts)
  })

  test('Deploy a new NFT (ERC-721) contract with parameters', async () => {
    const deployCommand = `${baseCommands.nfts721.deploy} ${abiPath2}  --accountIndex 0 --params "Token Name" --params Symbol `
    console.debug(`COMMAND: ${deployCommand}`)

    const stdout = execCommand(deployCommand, execOpts)
  })

  test('Deploy a new NFT (ERC-721) contract without params', async () => {
    const deployCommand = `${baseCommands.nfts721.deploy} ${abiPath}  --accountIndex 0 `
    console.debug(`COMMAND: ${deployCommand}`)

    const stdout = execCommand(deployCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(`Contract deployed into address`))
    nftAddress = parseAddressOfContractDeployed(stdout)
    console.debug(`Nft Address: ${nftAddress}`)
    expect(nftAddress === '' ? false : nftAddress.startsWith('0x'))
  })

  test('Register an asset with a NFT (ERC-721) attached to it', async () => {
    const registerAssetCommand = `${baseCommands.nfts721.create} ${nftAddress}  --accountIndex 0 --name " NFTs 721 test ${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType} `
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execCommand(registerAssetCommand, execOpts)

    console.debug(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewNFT(registerStdout)
    console.debug(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))
  })

  test('Shows NFTs (721) information', async () => {
    const showCommand = `${baseCommands.nfts721.show} "${did}" --nftAddress ${nftAddress} `
    console.debug(`COMMAND: ${showCommand}`)

    const showStdout = execCommand(showCommand, execOpts)

    console.debug(`STDOUT: ${showStdout}`)
    expect(showStdout.includes(did))
  })

  test('It mints a NFT (ERC-721)', async () => {
    const mintCommand = `${baseCommands.nfts721.mint} "${did}" --nftAddress ${nftAddress} --uri ${metadataUri}  --accountIndex 0  `
    console.debug(`COMMAND: ${mintCommand}`)

    const stdout = execCommand(mintCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`Minted NFT (ERC-721)`))
  })

  test('Order a NFT (ERC-721)', async () => {
    const orderCommand = `${baseCommands.nfts721.order} "${did}"  --accountIndex 1  `
    console.debug(`COMMAND: ${orderCommand}`)

    const stdout = execCommand(orderCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    orderAgreementId = parseNFTOrderAgreementId(stdout)
    expect(orderAgreementId != '')
    expect(stdout.includes(did))
    expect(stdout.includes(`NFT Agreement Created`))
  })

  test('The seller transfer a NFT (ERC-721)', async () => {
    const transferCommand = `${baseCommands.nfts721.transfer} "${orderAgreementId}" --accountIndex 0 --buyerAccount "${execOpts.accounts[1]}" `
    console.debug(`COMMAND: ${transferCommand}`)

    const stdout = execCommand(transferCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`Transferring NFT (ERC-721)`))
    expect(stdout.includes(`Transfer done!`))
  })

  test('As NFT holder I can download the files associated to an asset', async () => {
    const destination = `/tmp/nevemined/cli/test/nft`
    const downloadCommand = `${baseCommands.nfts721.download} "${did}" --destination "${destination}" --accountIndex 1  `
    console.debug(`COMMAND: ${downloadCommand}`)

    const stdout = execCommand(downloadCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`NFT Assets downloaded to: ${destination}`))

    const files = fs.readdirSync(destination || '')
    expect(files.length == 1)

    files.forEach((file) => {
      expect(Path.extname(file) === '.md')
    })
  })

  test('It burns a NFT (ERC-721)', async () => {
    const burnCommand = `${baseCommands.nfts721.burn} "${did}" ${nftAddress} --accountIndex 0  `
    console.debug(`COMMAND: ${burnCommand}`)

    const stdout = execCommand(burnCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(did))
    expect(stdout.includes(`Burned NFT (ERC-721)`))
  })
})
