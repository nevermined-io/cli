import Token from '@nevermined-io/nevermined-sdk-js/dist/node/keeper/contracts/Token'
import { InstantiableConfig } from '@nevermined-io/nevermined-sdk-js/dist/node/Instantiable.abstract'
import { logger } from 'ethers'
import { ethers, Contract } from 'ethers'
import { loadERC20Contract } from './utils'

export default class CustomToken extends Token {
  public static async getInstanceByAddress(
    config: InstantiableConfig,
    address: string,
    signer: ethers.Signer
  ): Promise<CustomToken> {
    const token: CustomToken = new Token('CustomToken')

    token.setInstanceConfig(config)

    logger.info(`CustomToken with address ${address}`)

    const code = await token.web3.getCode(address)
    if (code === '0x0') {
      // no code in the blockchain dude
      throw new Error(`No code deployed at address ${address}, sorry.`)
    }

    token.contract = loadERC20Contract(address, signer)
    // token.contract = loadContract(config.config!, JSON.stringify(ERC20.abi), address)
    // new ethers.Contract(address, abi)
    // @ts-ignore
    // token.contract = new token.web3.eth.Contract(abi, address)
    // console.log(token.contract.)
    return token
  }
}
