import {
  Account,
  NFT721Api,
  parseEther,
  formatEther,
  formatUnits,
  NvmApp,
} from '@nevermined-io/sdk'
import chalk from 'chalk'
import { Logger } from 'log4js'
import {
  Constants,
  loadToken,
  printNftTokenBanner,
  StatusCodes
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'

export const accountsList = async (
  nvmApp: NvmApp,
  _account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const nvm = nvmApp.sdk
  const { verbose, nftTokenAddress, address } = argv

  const token = await loadToken(nvm, config, verbose)

  let accounts: Account[] = []
  if (address) {
    logger.info(`Getting balance of account ${address}`)
    accounts = [await nvm.accounts.getAccount(address)]
  } else {
    logger.debug(chalk.dim('Loading account/s ...'))
    accounts = await nvm.accounts.list()
  }

  console.log(`We use the account ${accounts[0].getId()}`)

  // if we have a token use it, otherwise fall back to ETH decimals
  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : config.nativeToken

  let withInventory = false
  let nft721Api: NFT721Api
  if (nftTokenAddress != '') {
    withInventory = true
    nft721Api = await nvm.contracts.loadNft721(nftTokenAddress)

    if (verbose) {
      await printNftTokenBanner(nft721Api.getContract)
    }
  }

  const loadedAccounts = await Promise.all(
    accounts.map(async (a, index) => {
      
      const balanceFormatted = formatEther(await a.getEtherBalance())
      const ethBalance = parseEther(
        balanceFormatted
      )      

      const tokenBalance = (
        token ? await token.balanceOf(a.getId()) : 0n
      ) /10n * BigInt(decimals)

      const inventory = withInventory
        ? (
            await Promise.all(
              (                
                await nft721Api.nftContract.events.getPastEvents({
                  eventName: 'Transfer',
                  filterSubgraph: { where: { to: a.getId() } },
                  filterJsonRpc: { to: a.getId() },
                  result: {
                    tokenId: true
                  },
                })
              ).map(
                async (l: {
                  returnValues: { tokenId: { toHex: () => any } }
                  blockNumber: any
                }) => {
                  // check if the account is still the owner
                  if (
                    (
                      (await nft721Api.nftContract.call('ownerOf', [
                        l.returnValues.tokenId
                      ])) as string
                    ).toLowerCase() === a.getId().toLowerCase()
                  ) {
                    return {
                      block: l.blockNumber,
                      tokenId: l.returnValues.tokenId.toHex(),
                      url: `${config.etherscanUrl}/token/${nftTokenAddress}?a=${l.returnValues.tokenId}#inventory`
                    }
                  }
                }
              )
            )
          ).filter((inv) => Boolean(inv))
        : []

      return {
        index,
        address: a.getId(),
        ethBalance,
        tokenBalance,
        url: `${config.etherscanUrl}/address/${a.getId()}`,
        nftTokenUrl: `${config.etherscanUrl}/token/${nftTokenAddress}`,
        nftBalance: withInventory ? await nft721Api.balanceOf(a) : 0n,
        inventory
      }
    })
  )

  for (const a of loadedAccounts) {
    logger.info(
      chalk.dim(
        `===== Account ${chalk.green(a.address)} - Index: ${chalk.whiteBright(
          a.index
        )} =====`
      )
    )
    logger.info(
      chalk.dim(
        `${config.nativeToken} Balance: ${chalk.whiteBright(
          formatEther(a.ethBalance)
        )} ${config.nativeToken}`
      )
    )
    if (token !== null) {
      logger.info(
        chalk.dim(
          `Token Balance: ${chalk.whiteBright(
            formatUnits(a.tokenBalance, decimals)
          )} ${chalk.whiteBright(symbol)}`
        )
      )
    }
    logger.info(chalk.dim(`Etherscan Url: ${chalk.whiteBright(a.url)}`))
    logger.info(chalk.dim(`NFT Balance: ${chalk.whiteBright(a.nftBalance)}`))

    if (a.inventory.length > 0) {
      logger.info(chalk.dim('\nNFT Inventory'))
      for (const inv of a.inventory) {
        logger.info(
          chalk.dim(`===== NFT ${chalk.whiteBright(inv!.tokenId)} =====`)
        )
        logger.info(
          chalk.dim(`Received at block: ${chalk.whiteBright(inv!.block)}`)
        )
        logger.info(chalk.dim(`Etherscan Url: ${chalk.whiteBright(inv!.url)}`))
      }
    }

    logger.info('\n')
  }

  if (!config.isProduction) {
    logger.info('If you need ERC20 or Native tokens in a "testnet", you can see in the following link how to get some:')
    logger.info(chalk.blueBright('https://docs.nevermined.io/docs/tutorials/faucets \n'))
  }

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(loadedAccounts.map((a) => a.address))
  }
}
