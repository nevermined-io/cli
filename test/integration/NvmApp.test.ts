import { execOpts, baseCommands, metadataConfig } from '../helpers/Config'
import { generateId } from '@nevermined-io/sdk'

import {
  parseDIDFromNewAgent,
  parseDIDFromNewFileAsset,
  parseDIDFromNewPlan,
  parseOrderPlan} from '../helpers/StdoutParser'

import execCommand from '../helpers/ExecCommand'

describe('Nevermined App integration e2e Testing', () => {

  const openApiUrl = 'https://chatgpt-plugin.nevermined.app/openapi.json'
  const serviceHTTPVerb = 'POST'
  const serviceEndpoint = 'https://chatgpt-plugin.nevermined.app/ask'
  const serviceCredentials = process.env.SERVICE_CREDENTIALS || ''

  let agentDID = ''
  let fileDID = ''
  let orderAgreementId = ''
  let creditsSubsDID = ''

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
        // execCommand(
        //   `${baseCommands.accounts.fund} "${execOpts.accounts[2]}" --token erc20`,
        //   execOpts
        // )
      }
    } catch (error) {
      console.warn(`Unable to fund accounts`)
    }
  })

  test('Creates a Credits Subscription', async () => {
    const commandCredits = `${baseCommands.app.createCreditsPlan} --name "My Credits Plan ${generateId()}" --author "Nevermined" --credits 50 --price 1 `
    const registerCreditsStdout = execCommand(commandCredits, execOpts)

    console.debug(`STDOUT: ${registerCreditsStdout}`)
    creditsSubsDID = parseDIDFromNewPlan(registerCreditsStdout)
    console.debug(`Credits Plan DID: ${creditsSubsDID}`)
    expect(creditsSubsDID === '' ? false : creditsSubsDID.startsWith('did:nv:'))
    
  })

  test('Create a Time Subscription', async () => {
    const commandTime = `${baseCommands.app.createTimePlan} --name "My Time Plan ${generateId()}" --author "Nevermined" --duration 30 --period days --price 1  `
    const registerTimeStdout = execCommand(commandTime, execOpts)

    console.debug(`STDOUT: ${registerTimeStdout}`)
    const timeSubsDID = parseDIDFromNewPlan(registerTimeStdout)
    console.debug(`Time Plan DID: ${timeSubsDID}`)
    expect(timeSubsDID === '' ? false : timeSubsDID.startsWith('did:nv:'))
    
  })


  test('Shows Plan information', async () => {
    const showCommand = `${baseCommands.app.show} "${creditsSubsDID}" `
    console.debug(`COMMAND: ${showCommand}`)

    const showStdout = execCommand(showCommand, execOpts)

    console.debug(`STDOUT: ${showStdout}`)
    expect(showStdout.includes(creditsSubsDID))
    expect(showStdout.includes(`Plan Type: credits`))
    
  })


  test('Register a new agent', async () => {
    const commandNewAgent = `${baseCommands.app.registerAgent} "${creditsSubsDID}" --name "My Test Agent ${generateId()}" --author "Nevermined" --openApiUrl ${openApiUrl} --authType bearer --credentials ${serviceCredentials} --endpoint ${serviceHTTPVerb}@${serviceEndpoint} --cost 1 `
    const newAgentStdout = execCommand(commandNewAgent, execOpts)

    console.debug(`STDOUT: ${newAgentStdout}`)
    agentDID = parseDIDFromNewAgent(newAgentStdout)
    console.debug(`Agent created with DID: ${agentDID}`)
    expect(agentDID === '' ? false : agentDID.startsWith('did:nv:'))
    
  })

  test('Shows Agent', async () => {
    const showCommand = `${baseCommands.app.show} "${agentDID}" `
    console.debug(`COMMAND: ${showCommand}`)

    const showStdout = execCommand(showCommand, execOpts)

    console.debug(`STDOUT: ${showStdout}`)
    expect(showStdout.includes(creditsSubsDID))
    expect(showStdout.includes(`Plan Type: credits`))
    
  })

  test('Register a new files asset', async () => {
    const commandNewFiles = `${baseCommands.app.registerFiles} "${creditsSubsDID}" --name "My Test Files asset ${generateId()}" --author "Nevermined" --url ${metadataConfig.url} --cost 1 `
    const newFilesStdout = execCommand(commandNewFiles, execOpts)

    console.debug(`STDOUT: ${newFilesStdout}`)
    fileDID = parseDIDFromNewFileAsset(newFilesStdout)
    console.debug(`Files asset created with DID: ${fileDID}`)
    expect(fileDID === '' ? false : fileDID.startsWith('did:nv:'))
    
  })

  test('Make a purchase', async () => {
    const orderCommand = `${baseCommands.app.order} "${creditsSubsDID}"  --accountIndex 1  `
    console.debug(`COMMAND: ${orderCommand}`)

    const orderStdout = execCommand(orderCommand, execOpts)

    console.debug(`STDOUT: ${orderStdout}`)
    orderAgreementId = parseOrderPlan(orderStdout)
    expect(orderAgreementId != '')
    expect(orderStdout.includes(creditsSubsDID))
    expect(orderStdout.includes(`Plan purchased succesfully`))
    
  })

  test('Check if a user is a subscriber', async () => {
    const balanceCommand = `${baseCommands.app.balance} "${creditsSubsDID}" --accountIndex 1`
    console.debug(`COMMAND: ${balanceCommand}`)

    const balanceStdout = execCommand(balanceCommand, execOpts)

    console.debug(`STDOUT: ${balanceStdout}`)
    expect(balanceStdout.includes(creditsSubsDID))
    expect(balanceStdout.includes(`is a subscriber with a balance of`))
    
  })

  test('Get a JWT token given access to an agent', async () => {
    const getTokenCommand = `${baseCommands.app.getToken} "${agentDID}" --accountIndex 1`
    console.debug(`COMMAND: ${getTokenCommand}`)

    const getTokenStdout = execCommand(getTokenCommand, execOpts)

    console.debug(`STDOUT: ${getTokenStdout}`)
    expect(getTokenStdout.includes(creditsSubsDID))
    expect(getTokenStdout.includes(`JWT Access Token:`))
    
  })

  test('Download a file', async () => {
    const downloadCommand = `${baseCommands.app.download} "${fileDID}" --agreementId ${orderAgreementId} --destination /tmp/.nevermined/cli-test-downloads/ --accountIndex 1`
    console.debug(`COMMAND: ${downloadCommand}`)

    const downloadStdout = execCommand(downloadCommand, execOpts)

    console.debug(`STDOUT: ${downloadStdout}`)
    expect(downloadStdout.includes(fileDID))
    expect(downloadStdout.includes(`Files downloaded succesfully`))
    
  })

})
