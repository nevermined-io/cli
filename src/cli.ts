import yargs, { config } from 'yargs'
import { hideBin } from 'yargs/helpers'
import {
  accountsFund,
  accountsNew,
  accountsList,
  createNft,
  downloadNft,
  listAgreements,
  mintNft,
  orderNft,
  registerAsset,
  resolveDID,
  searchAsset,
  downloadAsset, 
  orderAsset,
  getAsset,
  searchNft,
  showAgreement,
  showNft,
  transferNft
} from './commands'
import chalk from 'chalk'

import { StatusCodes, getConfig, loadNevermined, logger } from '../src/utils'

const cmdHandler = async (cmd: Function, argv: any) => {
  const { verbose, network } = argv

  if (verbose) {
    logger.level = 'debug'
  }

  logger.debug(chalk.dim(`Debug mode: '${chalk.greenBright('on')}'\n`))
  logger.info(chalk.dim(`Using network: '${chalk.whiteBright(network)}'\n`))

  const config = getConfig(network as string)

  return process.exit(await cmd(argv, config, logger))
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
  'accounts',
  'Accounts functions',
  (yargs) =>
    yargs
      .usage('usage: $0 accounts <command> parameters [options]')
      .command(
        'list',
        'List all accounts',
        (yargs) =>
          yargs.positional('account', {
            describe: 'the account to retrieve the balance',
            type: 'string'
          })
          .option('with-inventory', {
            type: 'boolean',
            default: false,
            description: 'Load NFT inventory as well'
          }),
        async (argv) => cmdHandler(accountsList, argv)
      )
      .command(
        'balance account',
        'Get the balance of a specific account',
        (yargs) =>
          yargs.option('with-inventory', {
            type: 'boolean',
            default: false,
            description: 'Load NFT inventory as well'
          }),
        async (argv) => cmdHandler(accountsList, argv)
      )      
      .command(
        'fund account',
        'Funds an account on a test net',
        (yargs) =>
          yargs.positional('account', {
            describe: 'the account to fund',
            type: 'string'
          })
          .option('token', {
            type: 'string',
            default: 'both',
            description: 'What kind of tokens you want to fund the account (native, erc20 or both)'
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
  'Assets functions',
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
              description: 'The asset urls'
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
              description: 'The asset urls'
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
              description: 'The entrypoint for running the algorithm. Example: python word_count.py'
            })
            .option('container', {
              type: 'string',
              demandOption: true,
              description: 'The docker container where the algorithm can be executed. Example: python:3.8-alpine'
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
          yargs.positional('query', {
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
          yargs.positional('did', {
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
            description: 'Local path where the asset contents will be downloaded'
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
          yargs.positional('did', {
            describe: 'The asset did',
            type: 'string'
          })
          .option('agreementId', {
            type: 'string',
            default: '',
            description: 'Agreement Id of a previously purchased asset. If not given a new purchase will be executed'
          })          
          .option('fileIndex', {
            type: 'number',
            default: -1,
            description: 'The index of the file in the DDO'
          })
          .option('path', {
            type: 'string',
            default: '.',
            description: 'Local path where the asset contents will be downloaded'
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
  'Agreements functions',
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
  'nfts',
  'NFTs functions',
  (yargs) =>
    yargs
      .usage('usage: $0 nfts <command> parameters [options]')
      .command(
        'show did',
        'Retrieves information about an NFT',
        (yargs) =>
          yargs.positional('did', {
            describe: 'the did to retrieve',
            type: 'string'
          }),
        async (argv) => cmdHandler(showNft, argv)
      )
      .command(
        'create [creator] [metadata]',
        'Creates an NFT',
        (yargs) =>
          yargs
            .positional('creator', {
              describe: 'the address of the author of the NFT',
              type: 'string'
            })
            .positional('metadata', {
              describe: 'the json file with the metadata',
              type: 'string'
            }),
        async (argv) => cmdHandler(createNft, argv)
      )
      .command(
        'mint did [minter] [uri]',
        'Mints an NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the did to mint',
              type: 'string'
            })
            .positional('minter', {
              describe: 'the address of the minter of the NFT',
              type: 'string'
            })
            .positional('uri', {
              describe: 'the token uri for the Asset Metadata',
              type: 'string'
            }),
        async (argv) => cmdHandler(mintNft, argv)
      )
      .command(
        'order did [buyer]',
        'Orders an NFT by paying for it to the escrow',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the DID to retrieve',
              type: 'string'
            })
            .positional('buyer', {
              describe: 'the buyer address',
              type: 'string'
            }),
        async (argv) => cmdHandler(orderNft, argv)
      )
      .command(
        'transfer agreementId [seller]',
        'Transfers the NFT to the buyer and the funds from the escrow to the seller',
        (yargs) =>
          yargs
            .positional('agreementId', {
              describe: 'the agreement id address',
              type: 'string'
            })
            .positional('seller', {
              describe: 'the seller address',
              type: 'string'
            }),
        async (argv) => cmdHandler(transferNft, argv)
      )
      .command(
        'download did [consumer] [destination]',
        'Downloads the data of an NFT',
        (yargs) =>
          yargs
            .positional('did', {
              describe: 'the agreement id address',
              type: 'string'
            })
            .positional('consumer', {
              describe: 'the seller address',
              type: 'string'
            })
            .positional('destination', {
              describe: 'the destination of the files',
              type: 'string'
            }),
        async (argv) => cmdHandler(downloadNft, argv)
      )
      .command(
        'search [search]',
        'Searches for NFTs',
        (yargs) =>
          yargs
            .positional('search', {
              describe: 'search string',
              type: 'string'
            })
            .positional('consumer', {
              describe: 'the seller address',
              type: 'string'
            }),
        async (argv) => cmdHandler(searchNft, argv)
      ),
  () => {
    yargs.showHelp()
    return process.exit()
  }
)

y.argv
