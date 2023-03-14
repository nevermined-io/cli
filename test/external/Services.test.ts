import { execOpts, baseCommands } from '../helpers/Config'
import {
  parseAddressOfContractDeployed,
  parseDIDFromNewAsset,
  parseDIDFromNewNFT,
  parseJWTToken,
  parseNFTOrderAgreementId
} from '../helpers/StdoutParser'
import execCommand from '../helpers/ExecCommand'
import { RequestInit } from 'node-fetch'
import fetch from 'node-fetch'

describe('Services e2e Testing', () => {
  const abiPathSubscription = 'test/resources/nfts/NFT721SubscriptionUpgradeable.json'
  const endpoints = process.env.SERVICE_ENDPOINT || 'http://127.0.0.1:3000'
  const proxyUrl = process.env.PROXY_URL || 'http://127.0.0.1:3128'
  const authToken = process.env.AUTHORIZATION_TOKEN || 'authorization_token'

  // Required because we are dealing with self signed certificates locally
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  let didSubscription = ''
  let didService = ''
  let nftAddress = ''
  let orderAgreementId = ''
  let jwtToken = ''
  
  jest.setTimeout(30000)

  test('Deploy a new NFT (ERC-721) Subscription contract with parameters', async () => {
    const deployCommand = `${baseCommands.nfts721.deploy} ${abiPathSubscription}  --accountIndex 0 --params "Subscription NFT" --params Symbol --addMinter true `
    console.debug(`COMMAND: ${deployCommand}`)

    const stdout = execCommand(deployCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(`Contract deployed into address`))
    nftAddress = parseAddressOfContractDeployed(stdout)
    console.debug(`Subscription Nft Address: ${nftAddress}`)
    expect(nftAddress === '' ? false : nftAddress.startsWith('0x'))
  })

  test('Register a Subscription NFT (ERC-721)', async () => {    
    const registerAssetCommand = `${baseCommands.nfts721.create} ${nftAddress} --metadata test/resources/metadata-subscription.json --subscription true --duration 1000 --transfer false --services nft-sales`
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execCommand(registerAssetCommand, execOpts)

    console.debug(`STDOUT: ${registerStdout}`)
    didSubscription = parseDIDFromNewNFT(registerStdout)
    console.debug(`DID (Subscription): ${didSubscription}`)
    expect(didSubscription === '' ? false : didSubscription.startsWith('did:nv:'))    
  })


  test('Order the subscription NFT', async () => {
    const orderCommand = `${baseCommands.nfts721.order} "${didSubscription}"  --accountIndex 1  `
    console.debug(`COMMAND: ${orderCommand}`)

    const stdout = execCommand(orderCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    orderAgreementId = parseNFTOrderAgreementId(stdout)
    expect(orderAgreementId != '')
    expect(stdout.includes(didSubscription))
    expect(stdout.includes(`NFT Agreement Created`))
  })

  test('The buyer ask for transfer a NFT (ERC-721)', async () => {
    const transferCommand = `${baseCommands.nfts721.transfer} "${orderAgreementId}" "${execOpts.accounts[0]}" --accountIndex 1  `
    console.debug(`COMMAND: ${transferCommand}`)

    const stdout = execCommand(transferCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(didSubscription))
    expect(stdout.includes(`Transferring NFT (ERC-721)`))
    expect(stdout.includes(`Transfer done!`))
  })


  test('Register the web service', async () => {
    const registerAssetCommand = `${baseCommands.assets.registerService} --name "My Open AI" --access subscription --author "John Doe" --subscriptionNFT "${nftAddress}" --urls ${endpoints} --authToken "${authToken}" `
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execCommand(registerAssetCommand, execOpts)    

    console.log(`STDOUT: ${registerStdout}`)
    didService = parseDIDFromNewAsset(registerStdout)
    console.log(`DID (Service): ${didService}`)
    expect(didService === '' ? false : didService.startsWith('did:nv:'))
  })


  test('The subscriber is a holder', async () => {
    const holdCommand = `${baseCommands.nfts721.hold} "${didService}" --accountIndex 1  `
    console.debug(`COMMAND: ${holdCommand}`)

    const stdout = execCommand(holdCommand, execOpts)

    console.debug(`STDOUT: ${stdout}`)
    expect(stdout.includes(`The user holds`))
  }) 
  
  test('The subscriber can get the JWT token', async () => {
    const jwtCommand = `${baseCommands.nfts721.jwt} "${didService}" --accountIndex 1  `
    console.debug(`COMMAND: ${jwtCommand}`)

    const stdout = execCommand(jwtCommand, execOpts)
    jwtToken = parseJWTToken(stdout)

    console.debug(`STDOUT: ${stdout}`)
    console.log(`JWT Token: ${jwtToken}`)
    expect(stdout.includes(`JWT Token`))
    expect(jwtToken.length > 0)
  })   

  
  test('The subscriber access the service endpoints using the JWT', async () => {
    const url = new URL(endpoints)
    const proxyEndpoint = `${proxyUrl}${url.pathname}`

    const opts: RequestInit = {}
    opts.headers = {
      'nvm-authorization': `Bearer ${jwtToken}`,
      'content-type': 'application/json',
      host: url.port ? url.hostname.concat(`:${url.port}`) : url.hostname,
    }

    if (process.env.REQUEST_DATA) {
      opts.method = 'POST'
      opts.body = JSON.stringify(JSON.parse(process.env.REQUEST_DATA))
    }
    console.log(`Proxy Url = ${proxyUrl}`)
    console.log(`Proxy Endpoint = ${proxyEndpoint}`)

    console.log(JSON.stringify(opts))


    const result = await fetch(proxyEndpoint, opts)

    console.debug(` ${result.status} - ${await result.text()}`)

    expect(result.ok)
    expect(result.status === 200)

  }) 

})
