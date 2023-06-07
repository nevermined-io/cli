import { execOpts, baseCommands } from '../helpers/Config'
import execCommand from '../helpers/ExecCommand'
import { Account, AssetPrice, BigNumber, ContractHandler, DDO, NFTAttributes, Nevermined, Nft721Contract, TransferNFT721Condition, ZeroAddress, generateId } from '@nevermined-io/sdk'
import { config } from '../config'
import { getMetadata } from '../helpers/ddo-metadata-generator'
import { ethers } from 'ethers'
import { JWTPayload, decodeJwt } from 'jose'
import { parseNFTOrderAgreementId } from '../helpers/StdoutParser'
import { ARTIFACTS_PATH } from '../../src/utils'


describe('Abort Agreements Testing', () => {

  let publisher: Account
  let collector1: Account

  let nevermined: Nevermined
  let transferNft721Condition: TransferNFT721Condition
  let ddo: DDO
  let agreementId: string
  
  const accessTimeout = 10
  const accessTimelock = 3
  const nftPrice = BigNumber.from(1)
  const metadata = getMetadata(Math.random(), generateId())
  let assetPrice: AssetPrice
  let neverminedNodeAddress

  let nft: ethers.Contract
  let nftContract: Nft721Contract

  let payload: JWTPayload


  beforeAll(async () => {
    config.artifactsFolder = ARTIFACTS_PATH
    nevermined = await Nevermined.getInstance(config)

    ;[collector1, publisher,,, ] = await nevermined.accounts.list()

    const networkName = (await nevermined.keeper.getNetworkName()).toLowerCase()
    const erc721ABI = await ContractHandler.getABI(
      'NFT721Upgradeable',
      config.artifactsFolder,
      networkName,
    )

    nft = await nevermined.utils.contractHandler.deployAbi(erc721ABI, publisher, [
      publisher.getId(),
      nevermined.keeper.didRegistry.address,
      'NFT721',
      'NVM',
      '',
      '0',
    ])

    nftContract = await Nft721Contract.getInstance(
      (nevermined.keeper as any).instanceConfig,
      nft.address,
    )

    await nevermined.contracts.loadNft721(nftContract.address)

    const clientAssertion = await nevermined.utils.jwt.generateClientAssertion(publisher)

    await nevermined.services.marketplace.login(clientAssertion)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    payload = decodeJwt(config.marketplaceAuthToken!)
    neverminedNodeAddress = await nevermined.services.node.getProviderAddress()

    metadata.userId = payload.sub

    // conditions
    ;({ transferNft721Condition } = nevermined.keeper.conditions)

    assetPrice = new AssetPrice()
      .setReceiver(publisher.getId(), nftPrice)
      .setTokenAddress(ZeroAddress)

    await nftContract.grantOperatorRole(transferNft721Condition.address, publisher)

    const nftAttributes = NFTAttributes.getNFT721Instance({
      metadata,
      price: assetPrice,
      providers: [neverminedNodeAddress],
      serviceTypes: ['nft-sales', 'nft-access'],
      nftContractAddress: nftContract.address,
      fulfillAccessTimeout: accessTimeout,
      fulfillAccessTimelock: accessTimelock,
    })
    ddo = await nevermined.nfts721.create(nftAttributes, publisher)
        
  })

  test('Abort an agreement', async () => {
    const did = ddo.id
    console.log(`Ordering Asset: ${ddo.id}`)
    const orderCommand = `${baseCommands.nfts721.order} "${did}"  `
    console.debug(`COMMAND: ${orderCommand}`)
    const stdout = execCommand(orderCommand, execOpts)
    console.debug(`STDOUT: ${stdout}`)
    agreementId = parseNFTOrderAgreementId(stdout)

    console.log(`Asset ordered: ${agreementId}`)
    expect(agreementId).toBeDefined()
    
    await mineBlocks(nevermined, collector1, accessTimeout + 1)

    const abortAgreementsCommand = `${baseCommands.agreements.abort} ${agreementId}`
    const stdoutAbort = execCommand(abortAgreementsCommand, execOpts)

    console.log(`Abort Agreement: ${stdoutAbort}`)
    expect(stdoutAbort.includes('Aborting agreement:'))
    expect(stdoutAbort.includes('Payment distributed back'))
    expect(stdoutAbort.includes('Status: 3 (Aborted)'))

    const showAgreementsCommand = `${baseCommands.agreements.show} ${agreementId}`
    const stdoutShow = execCommand(showAgreementsCommand, execOpts)

    console.log(`Show Agreements: ${stdoutShow}`)

  })  
})

export async function mineBlocks(nevermined: Nevermined, account: Account, blocksToWait: number) {
  for (let index = 0; index < blocksToWait; index++) {
    await nevermined.provenance.used(
      generateId(),
      generateId(),
      account.getId(),
      account.getId(),
      ethers.utils.hexZeroPad('0x0', 32),
      'mining',
      account,
    )
  }
}
