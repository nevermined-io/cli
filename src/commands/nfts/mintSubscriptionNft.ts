import { NvmAccount, NvmApp, isValidAddress } from '@nevermined-io/sdk'
import {
  StatusCodes,
  loadSubscriptionContract,
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const mintSubscriptionNft = async (
  nvmApp: NvmApp,
  minterAccount: NvmAccount,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { nftAddress } = argv

  logger.info(chalk.dim(`Minting Subscription NFT: '${chalk.whiteBright(nftAddress)}'`))

  logger.debug(
    chalk.dim(`Using Minter: ${chalk.whiteBright(minterAccount.getId())}`)
  )

  if (!isValidAddress(nftAddress)) {
    return {
      status: StatusCodes.ERROR,      
      errorMessage: `Invalid NFT address '${nftAddress}'`
    }
  }

  const exists = await nvmApp.sdk.utils.blockchain.checkExists(nftAddress)
  if (!exists) {
    logger.error(`Could not find a deployed contract on address: ${nftAddress}`)
    return {
      status: StatusCodes.ERROR,      
      errorMessage: `Invalid NFT address '${nftAddress}'`
    }
  }

  let receiver
  if (isValidAddress(argv.receiver)) receiver = argv.receiver as `0x${string}`
  else receiver = minterAccount.getId()

  logger.debug(
    chalk.dim(`Receiver: ${chalk.whiteBright(receiver)}`)
  )
  
  const tokenId = argv.tokenId && argv.tokenId.toString().length > 0 ? argv.tokenId as bigint : 0n
  
  const subscriptionContract = await loadSubscriptionContract(nvmApp.sdk, config, nftAddress)
  logger.info(`Contract loaded with address: ${subscriptionContract.address}`)
  const args = [receiver, tokenId, 0n]
  logger.debug(args)
  
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await subscriptionContract.write.mint({ args, account: minterAccount.getAccountSigner() })
  
  logger.info(
    chalk.dim(
      `Minted NFT Subscription (ERC-721) '${chalk.whiteBright(
        nftAddress
      )}' to '${chalk.whiteBright(receiver)}'! with TokenId ${chalk.whiteBright(tokenId)}`
    )
  )

  return {
    status: StatusCodes.OK
  }
}
