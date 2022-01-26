import { execOpts, baseCommands, metadataConfig } from '../helpers/Config'
import {
  parseCIDFromNFTMetadata,
  parseDIDFromNewNFT
} from '../helpers/StdoutParser'
const { execSync } = require('child_process')

describe('Utils e2e Testing', () => {
  let cid = ''
  let did = ''

  // NFT Metadata info
  const imageUrl =
    'https://www.artribune.com/wp-content/uploads/2013/09/2_Francisco-Goya-Saturno-devorando-a-su-hijos-1819-1823.jpg'
  const name = 'Saturn NFTs'
  const description = 'Sturn eating his son'
  const externalUrl =
    'https://www.franciscogoya.com/saturn-devouring-his-son.jsp'
  const animationUrl =
    'https://i1.wp.com/hyperallergic.com/wp-content/uploads/2016/04/goya-saturn-pigeons.gif?resize=470%2C470&quality=100'
  const youtubeUrl = 'https://youtu.be/zLhqd1tXmao'
  const royalties = '1'
  const royaltiesReceiver = '0x068ed00cf0441e4829d9784fcbe7b9e26d4bd8d0'

  beforeAll(async () => {})

  test('Publishing NFT Metadata', async () => {
    const command = `${baseCommands.utils.publishMetadata} --image "${imageUrl}" --name "${name}" --description "${description}" --externalUrl "${externalUrl}" --animationUrl "${animationUrl}" --royalties ${royalties} --royaltiesReceiver ${royaltiesReceiver} `
    console.debug(`COMMAND: ${command}`)

    const stdout = execSync(command, execOpts).toString()

    console.log(`STDOUT: ${stdout}`)

    expect(stdout).toContain('NFT Metadata JSON')
    expect(stdout).toContain(imageUrl)

    cid = parseCIDFromNFTMetadata(stdout)
    console.log(`CID: ${cid}`)
    expect(cid === '' ? false : cid.startsWith('cid://'))
  })

  test('Register a NFT with IPFS Metadata and get access to it', async () => {
    const registerCommand = `${baseCommands.nfts1155.create} --account "${execOpts.accounts[0]}" --name " NFTs 1155 test ${metadataConfig.name}" --author "${metadataConfig.author}" --price "${metadataConfig.price}" --urls ${metadataConfig.url} --contentType text/text --cap 10 --royalties 5 --nftMetadata "${cid}" `
    console.debug(`COMMAND: ${registerCommand}`)

    const registerStdout = execSync(registerCommand, execOpts)

    console.debug(`STDOUT: ${registerStdout}`)
    did = parseDIDFromNewNFT(registerStdout)
    console.debug(`DID: ${did}`)
    expect(did === '' ? false : did.startsWith('did:nv:'))

    const getCommand = `${baseCommands.utils.getMetadata} "${did}" `
    console.debug(`COMMAND: ${getCommand}`)

    const stdout = execSync(getCommand, execOpts).toString()

    console.log(`STDOUT: ${stdout}`)

    expect(stdout).toContain(cid)
    expect(stdout).toContain(imageUrl)
  })
})
