import { Nevermined, Account } from '@nevermined-io/nevermined-sdk-js'
import { Contract, ethers } from 'ethers'
import chalk from 'chalk'
import { Logger } from 'log4js'
import {
  Constants,
  loadNftContract,
  loadToken,
  printNftTokenBanner,
  StatusCodes
} from '../../utils'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { ConfigEntry } from '../../models/ConfigDefinition'
import BigNumber from '@nevermined-io/nevermined-sdk-js/dist/node/utils/BigNumber'

export const accountsList = async (
  nvm: Nevermined,
  account: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {
  const { verbose, network, nftTokenAddress } = argv

  const token = await loadToken(nvm, config, verbose)

  logger.debug(chalk.dim('Loading account/s ...'))

  let accounts
  if (account !== undefined) accounts = [account]
  else accounts = await nvm.accounts.list()

  // if we have a token use it, otherwise fall back to ETH decimals
  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals

  const symbol = token !== null ? await token.symbol() : config.nativeToken

  let withInventory = false
  let nft: Contract
  if (nftTokenAddress != '') {
    withInventory = true
    nft = loadNftContract(config, nftTokenAddress)
    if (verbose) {
      await printNftTokenBanner(nft)
    }
  }

  const loadedAccounts = await Promise.all(
    accounts.map(async (a, index) => {
      const ethBalance = ethers.utils.parseEther(
        (await a.getEtherBalance()).toString()
      )

      const tokenBalance = (
        token ? await token.balanceOf(a.getId()) : BigNumber.from(0)
      )
        .div(10)
        .mul(decimals)

      const inventory = withInventory
        ? (
            await Promise.all(
              (
                await nft.getPastEvents('Transfer', {
                  fromBlock: 0,
                  toBlock: 'latest',
                  filter: {
                    to: a.getId()
                  }
                })
              ).map(
                async (l: {
                  returnValues: { tokenId: { toHex: () => any } }
                  blockNumber: any
                }) => {
                  // check if the account is still the owner
                  if (
                    (
                      (await nft.ownerOf(l.returnValues.tokenId)) as string
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
        nftBalance: withInventory ? await nft.balanceOf(a.getId()) : 0,
        inventory
      }
    })
  )

  for (const a of loadedAccounts) {
    logger.info(
      chalk.dim(`===== Account ${chalk.whiteBright(a.address)} =====`)
    )
    logger.info(
      chalk.dim(
        `${config.nativeToken} Balance: ${chalk.whiteBright(a.ethBalance)}`
      )
    )
    if (token !== null) {
      logger.info(
        chalk.dim(
          `Token Balance: ${chalk.whiteBright(
            a.tokenBalance
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

  return {
    status: StatusCodes.OK,
    results: JSON.stringify(loadedAccounts.map((a) => a.address))
  }
}
