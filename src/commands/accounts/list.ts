import { Account } from '@nevermined-io/nevermined-sdk-js'
import chalk from 'chalk'
import { Logger } from 'log4js'
import { Contract } from 'web3-eth-contract'
import utils from 'web3-utils'

import {
  ConfigEntry,
  Constants,
  loadNevermined,
  loadNftContract,
  printNftTokenBanner,
  StatusCodes
} from '../../utils'

export const accountsList = async (
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<number> => {
  const { verbose, network, nftTokenAddress, account } = argv
  const { nvm, token } = await loadNevermined(config, network, verbose)
  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT
  }

  logger.debug(chalk.dim('Loading account/s ...'))

  let accounts
  if (account) accounts = [new Account(account)]
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
      const ethBalance = utils.fromWei(
        (await a.getEtherBalance()).toString(),
        'ether'
      )

      const tokenBalance =
        (token ? await token.balanceOf(a.getId()) : 0) / 10 ** decimals

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
              ).map(async (l) => {
                // check if the account is still the owner
                if (
                  (
                    (await nft.methods
                      .ownerOf(l.returnValues.tokenId)
                      .call()) as string
                  ).toLowerCase() === a.getId().toLowerCase()
                ) {
                  return {
                    block: l.blockNumber,
                    tokenId: utils.toHex(l.returnValues.tokenId),
                    url: `${config.etherscanUrl}/token/${nftTokenAddress}?a=${l.returnValues.tokenId}#inventory`
                  }
                }
              })
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
        nftBalance: withInventory
          ? await nft.methods.balanceOf(a.getId()).call()
          : 0,
        inventory
      }
    })
  )

  for (const a of loadedAccounts) {
    logger.info(
      chalk.dim(`===== Account ${chalk.whiteBright(a.address)} =====`)
    )
    logger.info(chalk.dim(`ETH Balance: ${chalk.whiteBright(a.ethBalance)}`))
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

  return StatusCodes.OK
}
