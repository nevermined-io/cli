import yargs, { config } from 'yargs'
import { hideBin } from 'yargs/helpers'
import {
  // Accounts
  accountsFund,
  accountsNew,
  accountsList,
  // NFTs
  createNft,
  deployNft,
  downloadNft,
  mintNft,
  burnNft,
  orderNft,
  showNft,
  transferNft,
  // Assets
  registerAsset,
  resolveDID,
  searchAsset,
  downloadAsset,
  orderAsset,
  getAsset,
  // Status
  networkStatus,
  networkList,
  // Agreements
  listAgreements,
  showAgreement,
  // Provenance
  registerProvenance,
  provenanceHistory,
  provenanceInspect
} from './commands'
import chalk from 'chalk'

import { getConfig, loadNevermined, logger } from '../src/utils'
import { ProvenanceMethods, StatusCodes } from './utils/enums'

const cmdHandler = async (cmd: Function, argv: any) => {
  const { verbose, network } = argv

  if (verbose) {
    logger.level = 'debug'
  }

  const config = getConfig(network as string)
  const nvm = await loadNevermined(config, network, verbose)

  logger.debug(chalk.dim(`Debug mode: '${chalk.greenBright('on')}'\n`))
  logger.debug(chalk.dim(`Using network: '${chalk.whiteBright(network)}'\n`))
  
  logger.debug(chalk.dim(`Gas Multiplier: '${chalk.whiteBright(config.gasMultiplier)}'\n`))
  logger.debug(chalk.dim(`Gas Price Multiplier: '${chalk.whiteBright(config.gasPriceMultiplier)}'\n`))

  if (!nvm.keeper) process.exit(StatusCodes.FAILED_TO_CONNECT)

  return process.exit(await cmd(nvm, argv, config, logger))
}

const y = yargs(hideBin(process.argv))
  .wrap(yargs.terminalWidth())
  .usage('usage: $0 <command>')
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .option('network', {
    alias: 'n',
    type: 'string',
    default: 'spree',
    description: 'The network to use'
  })
  .option('account', {
    alias: 'a',
    type: 'string',
    default: '',
    description: 'The account to use'
  })

// hidden default command to display the help when used without parameters
y.command(
  '$0',
  false,
  () => {},
  (argv) => {
    yargs.showHelp()
    return process.exit()
  }
)

y.command(
  'network',
  'Retrieve information about Nevermined deployments',
  (yargs) =>
    yargs
      .usage('usage: $0 network <command> parameters [options]')
      .command(
        'list',
        'List all the pre-configured Nevermined networks',
        (yargs) => yargs,
        async (argv) => cmdHandler(networkList, argv)
      )
      .command(
        'status',
        'List all the information about a Nevermined deployment',
        (yargs) => yargs,
        async (argv) => cmdHandler(networkStatus, argv)
      ),
  () => {
    yargs.showHelp()
    return process.exit()
  }
)

y.command(
  'accounts',
  'Management of accounts and the funds associted to them',
  (yargs) =>
    yargs
      .usage('usage: $0 accounts <command> parameters [options]')
      .command(
        'list',
        'List all accounts',
        (yargs) =>
          yargs
            .positional('account', {
              describe: 'the account to retrieve the balance',
              type: 'string'
            })
            .option('nftTokenAddress', {
              type: 'string',
              default: '',
              description: 'Load NFT (ERC-721) inventory as well'
            }),
        async (argv) => cmdHandler(accountsList, argv)
      )
      .command(
        'balance account',
        'Get the balance of a specific account',
        (yargs) =>
          yargs.option('nftTokenAddress', {
            type: 'string',
            default: '',
            description: 'Load NFT (ERC-721) inventory as well'
          }),
        async (argv) => cmdHandler(accountsList, argv)
      )
      .command(
        'fund account',
        'Funds an account on a test net',
        (yargs) =>
          yargs
            .positional('account', {
              describe: 'the account to fund',
              type: 'string'
            })
            .option('token', {
              type: 'string',
              default: 'both',
              description:
                'What kind of tokens you want to fund the account (native, erc20 or both)'
            }),
        async (argv) => cmdHandler(accountsFund, argv)
      )
      .command(
        'new',
        'Creates a new account',
        (yargs) => yargs,
        async (argv) => cmdHandler(accountsNew, argv)
      ),
  () => {
    yargs.showHelp()
    return process.exit()
  }
)

y.command(
  'assets',
  'Allows to register and manage assets in a Nevermined network',
  (yargs) =>
    yargs
      .usage('usage: $0 assets <command> parameters [options]')
      .command(
        'register-dataset',
        'Register a new dataset',
        (yargs) =>
          yargs
            .option('name', {
              type: 'string',
              demandOption: true,
              description: 'Asset name'
            })
            .option('author', {
              type: 'string',
              demandOption: true,
              description: 'The author of the file/s'
            })
            .option('dateCreated', {
              type: 'string',
              description: 'When the file was created'
            })
            .option('price', {
              type: 'number',
              demandOption: true,
              description: 'The asset price'
            })
            .option('urls', {
              type: 'array',
              demandOption: true,
              description:
                'The asset urls. It can be a comma separated list of urls for multiple files.'
            })
            .option('contentType', {
              type: 'string',
              demandOption: true,
              description: 'Files content type. Example: application/csv'
            })
            .option('license', {
              type: 'string',
              default: 'undefined',
              description: 'Asset license'
            })
            .option('assetType', {
              type: 'string',
              default: 'dataset',
              hidden: true
            }),
        async (argv) => cmdHandler(registerAsset, argv)
      )
      .command(
        'register-algorithm',
        'Register a new algorithm',
        (yargs) =>
          yargs
            .option('name', {
              type: 'string',
              demandOption: true,
              description: 'Asset name'
            })
            .option('author', {
              type: 'string',
              demandOption: true,
              description: 'The author of the file/s'
            })
            .option('dateCreated', {
              type: 'string',
              description: 'When the file was created'
            })
            .option('price', {
              type: 'number',
              default: '0',
              description: 'The asset price'
            })
            .option('urls', {
              type: 'array',
              demandOption: true,
              description:
                'The asset urls. It can be a comma separated list of urls for multiple files.'
            })
            .option('contentType', {
              type: 'string',
              demandOption: true,
              description: 'Files content type. Example: application/csv'
            })
            .option('license', {
              type: 'string',
              default: 'undefined',
              description: 'Asset license'
            })
            .option('language', {
              type: 'string',
              demandOption: true,
              description: 'The programing language of the algorithm'
            })
            .option('entrypoint', {
              type: 'string',
              demandOption: true,
              description:
                'The entrypoint for running the algorithm. Example: python word_count.py'
            })
            .option('container', {
              type: 'string',
              demandOption: true,
              description:
                'The docker container where the algorithm can be executed. Example: python:3.8-alpine'
            })
            .option('assetType', {
              type: 'string',
              default: 'algorithm',
              hidden: true
            }),
        async (argv) => cmdHandler(registerAsset, argv)
      )
      .command(
        'import',
        'Import an asset using the metadata in JSON format',
        (yargs) =>
          yargs.positional('metadata', {
            describe: 'The metadata file',
            type: 'string'
          }),
        async (argv) => cmdHandler(registerAsset, argv)
      )
      .command(
        'search query',
        'Searching for assets',
        (yargs) =>
          yargs
            .positional('query', {
              describe: 'The search query',
              type: 'string'
            })
            .option('offset', {
              type: 'number',
              default: '10',
              description: 'Search offset'
            })
            .option('page', {
              type: 'number',
              default: '1',
              description: 'Page to show'
            }),
        async (argv) => cmdHandler(searchAsset, argv)
      )
      .command(
        'download did',
        'Download an asset owned by me',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'The asset did',
              type: 'string'
            })
            .option('fileIndex', {
              type: 'number',
              default: '-1',
              description: 'The index of the file in the DDO'
            })
            .option('path', {
              type: 'string',
              default: '.',
              description:
                'Local path where the asset contents will be downloaded'
            }),
        async (argv) => cmdHandler(downloadAsset, argv)
      )
      .command(
        'order did',
        'Order an asset given a DID',
        (yargs) =>
          yargs.positional('did', {
            describe: 'The asset did',
            type: 'string'
          }),
        async (argv) => cmdHandler(orderAsset, argv)
      )
      .command(
        'get did',
        'Order & download or download directly a previously purchased asset',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'The asset did',
              type: 'string'
            })
            .option('agreementId', {
              type: 'string',
              default: '',
              description:
                'Agreement Id of a previously purchased asset. If not given a new purchase will be executed'
            })
            .option('fileIndex', {
              type: 'number',
              default: -1,
              description: 'The index of the file in the DDO'
            })
            .option('path', {
              type: 'string',
              default: '.',
              description:
                'Local path where the asset contents will be downloaded'
            }),
        async (argv) => cmdHandler(getAsset, argv)
      )
      .command(
        'resolve did',
        'Resolve an asset using a given DID',
        (yargs) =>
          yargs.positional('did', {
            describe: 'The asset did',
            type: 'string'
          }),
        async (argv) => cmdHandler(resolveDID, argv)
      ),
  () => {
    yargs.showHelp()
    return process.exit()
  }
)

y.command(
  'agreements',
  'Get information about the Service Execution Agreements',
  (yargs) =>
    yargs
      .usage('usage: $0 agreements <command> parameters [options]')
      .command(
        'list did',
        'Lists all agreements for given DID',
        (yargs) =>
          yargs.positional('did', {
            describe: 'the did to list the agreements for',
            type: 'string'
          }),
        async (argv) => cmdHandler(listAgreements, argv)
      )
      .command(
        'show agreementId',
        'Shows details about an agreement',
        (yargs) =>
          yargs.positional('agreementId', {
            describe: 'the agreement id address',
            type: 'string'
          }),
        async (argv) => cmdHandler(showAgreement, argv)
      ),
  () => {
    yargs.showHelp()
    return process.exit()
  }
)

y.command(
  'provenance',
  'Provenance functions',
  (yargs) =>
    yargs
      .usage('usage: $0 provenance <command> parameters [options]')
      .command(
        'register did',
        'Registers a provenance event associated to a DID',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'The asset did',
              type: 'string'
            })
            .option('method', {
              type: 'string',
              choices: ProvenanceMethods,
              description: 'The W3C Provenance event to report'
            })
            .option('agentId', {
              type: 'string',
              default: '',
              description: 'The address of the agent doing the action/activity'
            })
            .option('activityId', {
              type: 'string',
              default: '',
              description: 'The identifier of the activity to register'
            })
            .option('relatedDid', {
              type: 'string',
              default: '',
              description:
                'The additional DID related with the activity (if any)'
            })
            .option('agentInvolved', {
              type: 'string',
              default: '',
              description:
                'The address of the additional agent (if any) involved with the activity'
            })
            .option('signature', {
              type: 'string',
              default: '0x0',
              description: 'The signature associated to the provenance event'
            })
            .option('attributes', {
              type: 'string',
              default: '',
              description:
                'Additional attributes to register associated with the activity'
            }),
        async (argv) => cmdHandler(registerProvenance, argv)
      )
      .command(
        'history did',
        'Given a DID it gets all the provenance history for that asset',
        (yargs) =>
          yargs.positional('did', {
            describe: 'the did to list the provenance events',
            type: 'string'
          }),
        async (argv) => cmdHandler(provenanceHistory, argv)
      )
      .command(
        'inspect provenanceId',
        'Fetch the on-chain information regarding a Provenance Id event',
        (yargs) =>
          yargs.positional('provenanceId', {
            describe: 'the provenance id',
            type: 'string'
          }),
        async (argv) => cmdHandler(provenanceInspect, argv)
      ),
  () => {
    yargs.showHelp()
    return process.exit()
  }
)

y.command(
  'nfts721',
  'Create and manage NFTs (ERC-721) attached to Nevermined assets',
  (yargs) =>
    yargs
      .usage('usage: $0 nfts <command> parameters [options]')

      .command(
        'deploy abiPath',
        'It deploys a new NFT (ERC-721) contract',
        (yargs) =>
          yargs
            .positional('abiPath', {
              describe: 'the path to the ABI representing the ERC-721 contract',
              type: 'string'
            })
            .option('name', {
              describe: 'The NFT name',
              default: '',
              type: 'string'
            })
            .option('symbol', {
              describe: 'The NFT symbol',
              default: '',
              type: 'string'
            }),
        async (argv) => cmdHandler(deployNft, argv)
      )

      .command(
        'create [nftAddress]',
        'Registers a new asset and associates a ERC-721 NFT to it',
        (yargs) =>
          yargs
            .positional('nftAddress', {
              type: 'string',
              description: 'The address of the NFT (ERC-721) contract'
            })
            .option('metadata', {
              describe: 'The path to the json file describing the NFT metadata',
              default: '',
              type: 'string'
            })
            .option('nftMetadata', {
              describe:
                'The url (HTTP, IPFS, etc) including the NFT Metadata required by some marketplaces like OpenSea',
              default: '',
              type: 'string'
            })
            .option('name', {
              type: 'string',
              default: '',
              description: 'Asset name'
            })
            .option('author', {
              type: 'string',
              default: '',
              description: 'The author of the file/s'
            })
            .option('urls', {
              type: 'array',
              default: '',
              description:
                'The asset urls. It can be a comma separated list of urls for multiple files.'
            })
            .option('license', {
              type: 'string',
              default: '',
              description: 'When the file was created'
            })
            .option('price', {
              type: 'number',
              default: '',
              description: 'The NFT price'
            })
            .option('royalties', {
              type: 'number',
              default: '0',
              description:
                'The royalties (between 0 and 100%) to reward to the original creator in the secondary market'
            })            
            .option('nftType', {
              type: 'string',
              default: '721',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(createNft, argv)
      )

      .command(
        'show did',
        'Retrieves information about a NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the did to retrieve',
              type: 'string'
            })
            .option('nftAddress', {
              type: 'string',
              default: '',
              description: 'The address of the NFT (ERC-721) contract'
            })
            .option('abiPath', {
              describe: 'the path to the ABI representing the ERC-721 contract',
              default: '',
              type: 'string'
            })
            .option('is721', {
              type: 'boolean',
              default: true,
              hidden: true
            })
            .option('show1155', {
              type: 'boolean',
              default: false,
              description:
                'Show if there are any NFT ERC-1155 attached to the DID'
            }),
        async (argv) => cmdHandler(showNft, argv)
      )

      .command(
        'mint [did] [nftAddress]',
        'Mints a ERC-721 NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the did to mint',
              type: 'string'
            })
            .positional('nftAddress', {
              type: 'string',
              description: 'The address of the NFT (ERC-721) contract'
            })
            .option('uri', {
              type: 'string',
              demandOption: true,
              description: 'the token uri for the Asset Metadata'
            })
            .option('nftType', {
              type: 'string',
              default: '721',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(mintNft, argv)
      )

      .command(
        'burn [did] [nftAddress]',
        'It Burns a ERC-721 NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the did to burn',
              type: 'string'
            })
            .positional('nftAddress', {
              type: 'string',
              description: 'The address of the NFT (ERC-721) contract'
            })
            .option('nftType', {
              type: 'string',
              default: '721',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(burnNft, argv)
      )

      .command(
        'order did',
        'Orders an NFT (ERC-721) by paying for it to the escrow',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the DID to retrieve',
              type: 'string'
            })
            .option('nftType', {
              type: 'string',
              default: '721',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(orderNft, argv)
      )

      .command(
        'transfer agreementId',
        'Orders an NFT (ERC-721) by paying for it to the escrow',
        (yargs) =>
          yargs
            .positional('agreementId', {
              describe: 'the identifier of the agreement created by the buyer',
              type: 'string'
            })
            .option('nftType', {
              type: 'string',
              default: '721',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(transferNft, argv)
      )

      .command(
        'download [did]',
        'Downloads the data of an NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the asset identifier',
              type: 'string'
            })
            .option('destination', {
              describe: 'the destination of the files',
              demandOption: true,
              type: 'string'
            }),
        async (argv) => cmdHandler(downloadNft, argv)
      ),
  () => {
    yargs.showHelp()
    return process.exit()
  }
)

y.command(
  'nfts1155',
  'Create and manage NFTs (ERC-1155) attached to Nevermined assets',
  (yargs) =>
    yargs
      .usage('usage: $0 nfts <command> parameters [options]')
      .command(
        'create',
        'Registers a new asset and associates a NFT (ERC-1155) to it',
        (yargs) =>
          yargs
            .option('metadata', {
              describe:
                'The path to the json file with the metadata describing the asset',
              default: '',
              type: 'string'
            })
            .option('nftMetadata', {
              describe:
                'The url (HTTP, IPFS, etc) including the NFT Metadata required by some marketplaces like OpenSea',
              default: '',
              type: 'string'
            })
            .option('name', {
              type: 'string',
              default: '',
              description: 'Asset name'
            })
            .option('author', {
              type: 'string',
              default: '',
              description: 'The author of the file/s'
            })
            .option('urls', {
              type: 'array',
              default: '',
              description:
                'The asset urls. It can be a comma separated list of urls for multiple files.'
            })
            .option('license', {
              type: 'string',
              default: '',
              description: 'When the file was created'
            })
            .option('price', {
              type: 'number',
              default: '',
              description: 'The NFT price'
            })
            .option('cap', {
              type: 'number',
              default: '0',
              description: 'The NFT minting cap (0 means uncapped)'
            })
            .option('royalties', {
              type: 'number',
              default: '0',
              description:
                'The royalties (between 0 and 100%) to reward to the original creator in the secondary market'
            })
            .option('nftType', {
              type: 'string',
              default: '1155',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(createNft, argv)
      )

      .command(
        'show did',
        'Retrieves information about a NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the did to retrieve',
              type: 'string'
            })
            .option('nftAddress', {
              type: 'string',
              hidden: true,
              default: '',
              description: 'The address of the NFT (ERC-721) contract'
            })
            .option('show1155', {
              type: 'boolean',
              hidden: true,
              default: true,
              description:
                'Show the information about the NFT ERC-1155 attached to the DID'
            }),
        async (argv) => cmdHandler(showNft, argv)
      )

      .command(
        'mint [did]',
        'It Mints a ERC-1155 NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the did to mint',
              type: 'string'
            })
            .option('amount', {
              type: 'number',
              default: 1,
              description: 'the number of NFTs to mint'
            })
            .option('nftType', {
              type: 'string',
              default: '1155',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(mintNft, argv)
      )

      .command(
        'burn [did]',
        'It Burns a ERC-1155 NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the did to burn',
              type: 'string'
            })
            .option('amount', {
              type: 'number',
              default: 1,
              description: 'the number of NFTs to burn'
            })
            .option('nftType', {
              type: 'string',
              default: '1155',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(burnNft, argv)
      )

      .command(
        'order did',
        'Orders an NFT (ERC-1155) by paying for it to the escrow',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the DID to retrieve',
              type: 'string'
            })
            .option('amount', {
              type: 'number',
              default: 1,
              description: 'the number of NFTs to order'
            })
            .option('nftType', {
              type: 'string',
              default: '1155',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(orderNft, argv)
      )

      .command(
        'transfer agreementId',
        'Orders an NFT (ERC-1155) by paying for it to the escrow',
        (yargs) =>
          yargs
            .positional('agreementId', {
              describe: 'the identifier of the agreement created by the buyer',
              type: 'string'
            })
            .option('amount', {
              type: 'number',
              default: 1,
              description: 'the number of NFTs to burn'
            })
            .option('nftType', {
              type: 'string',
              default: '1155',
              hidden: true,
              description: 'The NFT type'
            }),
        async (argv) => cmdHandler(transferNft, argv)
      )

      .command(
        'download did',
        'Downloads the data associated to a ERC-1155 NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the agreement id address',
              type: 'string'
            })
            .option('destination', {
              describe: 'the destination of the files',
              demandOption: true,
              type: 'string'
            }),
        async (argv) => cmdHandler(downloadNft, argv)
      ),
  () => {
    yargs.showHelp()
    return process.exit()
  }
)

y.argv
