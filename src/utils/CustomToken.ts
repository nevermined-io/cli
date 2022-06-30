import Token from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/contracts/Token'
import { abi } from '@nevermined-io/contracts/artifacts/NeverminedToken.development.json'
import { InstantiableConfig } from '@nevermined-io/nevermined-sdk-js/dist/node/Instantiable.abstract'
import { logger } from 'ethers'

export default class CustomToken extends Token {
  public static async getInstanceByAddress(
    config: InstantiableConfig,
    address: string
  ): Promise<CustomToken> {
    const token: CustomToken = new Token('CustomToken')

    token.setInstanceConfig(config)

    logger.info(`CustomToken with address ${address}`)

    const code = await token.web3.eth.getCode(address)
    if (code === '0x0') {
      // no code in the blockchain dude
      throw new Error(`No code deployed at address ${address}, sorry.`)
    }

    // @ts-ignore
    token.contract = new token.web3.eth.Contract(abi, address)

    return token
  }
}
