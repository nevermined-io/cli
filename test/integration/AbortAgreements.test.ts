import { execOpts, baseCommands, metadataConfig } from '../helpers/Config'
import execCommand from '../helpers/ExecCommand'
import { generateId } from '@nevermined-io/sdk'
import { parseAddressOfContractDeployed, parseDIDFromNewNFT, parseNFTOrderAgreementId } from '../helpers/StdoutParser'


describe('Abort Agreements Testing', () => {

  let did: string
  let agreementId: string
  const accessTimeout = 5
  const abiPath = 'test/resources/nfts/NFT721SubscriptionUpgradeable.json'

  beforeAll(async () => {
    
    const deployCommand = `${baseCommands.nfts721.deploy} ${abiPath}  --accountIndex 0`
    console.debug(`COMMAND: ${deployCommand}`)

    const stdout = execCommand(deployCommand, execOpts) 
    expect(stdout.includes(`Contract deployed into address`))
    const nftAddress = parseAddressOfContractDeployed(stdout)

    const registerAssetCommand = `${baseCommands.nfts721.create} ${nftAddress}  --accountIndex 0 --name " NFTs 721 test ${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType ${metadataConfig.contentType} --transfer false`
    console.debug(`COMMAND: ${registerAssetCommand}`)

    const registerStdout = execCommand(registerAssetCommand, execOpts)

    console.debug(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewNFT(registerStdout)

  })

  test('Abort an agreement', async () => {
    
    console.log(`Ordering Asset: ${did}`)
    const orderCommand = `${baseCommands.nfts721.order} "${did}"  `
    console.debug(`COMMAND: ${orderCommand}`)
    const stdout = execCommand(orderCommand, execOpts)
    console.debug(`STDOUT: ${stdout}`)
    agreementId = parseNFTOrderAgreementId(stdout)

    console.log(`Asset ordered: ${agreementId}`)
    expect(agreementId).toBeDefined()
    
    await mineBlocks(did, accessTimeout + 1)

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

export async function mineBlocks(did: string, blocksToWait: number) {
  for (let index = 0; index < blocksToWait; index++) {
    const activityId = generateId()
    const registerCommand = `${baseCommands.provenance.register} ${did} --accountIndex 0 --method used --agentId "${execOpts.accounts[0]}" --activityId "${activityId}" `
    execCommand(registerCommand, execOpts)
  }
}
