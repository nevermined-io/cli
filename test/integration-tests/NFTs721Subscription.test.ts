import { execOpts, baseCommands } from '../helpers/Config'
import {
  parseAddressOfContractDeployed,
  parseDIDFromNewNFT,
  parseNFTOrderAgreementId
} from '../helpers/StdoutParser'

import * as fs from 'fs'
import * as Path from 'path'
import execCommand from '../helpers/ExecCommand'

describe('Subscription NFTs (ERC-721) e2e Testing', () => {
  const abiPathSubscription = 'test/resources/nfts/NFT721SubscriptionUpgradeable.json'
  let did = ''
  let nftAddress = ''
  let orderAgreementId = ''

  beforeAll(async () => {
    try {
      console.log(`Funding account: ${execOpts.accounts[0]}`)
      const fundCommand = `${baseCommands.accounts.fund} "${execOpts.accounts[0]}" --token erc20`
      console.debug(`COMMAND: ${fundCommand}`)
  
      execCommand(fundCommand, execOpts)
    } catch {
      console.error('Unable to fund account')
    }

  })

  test('Deploy a new NFT (ERC-721) Subscription contract with parameters', async () => {
    const deployCommand = `${baseCommands.nfts721.deploy} ${abiPathSubscription}  --accountIndex 0 --params "Token Name" --params Symbol --subscription true `
    console.debug(`COMMAND: ${deployCommand}`)

    const stdout = execCommand(deployCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(`Contract deployed into address`))
    nftAddress = parseAddressOfContractDeployed(stdout)
    console.debug(`Subscription Nft Address: ${nftAddress}`)
    expect(nftAddress === '' ? false : nftAddress.startsWith('0x'))
  })

  test('Register an asset with a NFT (ERC-721) attached to it', async () => {
    const registerAssetCommand = `${baseCommands.nfts721.create} ${nftAddress} --metadata test/resources/metadata-subscription.json --subscription true --duration 50000 --transfer false `
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

  test('As NFT holder I can download the files associated to an asset', async () => {
    const destination = `/tmp/nevemined/cli/test/nft-susbcription`
    const accessCommand = `${baseCommands.nfts721.access} "${did}" "${orderAgreementId}" --seller "${execOpts.accounts[0]}" --destination "${destination}" --accountIndex 1  `
    console.debug(`COMMAND: ${accessCommand}`)

    const stdout = execCommand(accessCommand, execOpts)

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
