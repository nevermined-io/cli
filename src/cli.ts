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
  accessNft,
  // Assets
  registerAsset,
  resolveDID,
  retireDID,
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
  provenanceInspect,
  // Utils
  decryptFile,
  uploadFile,
  publishNftMetadata,
  getNftMetadata
} from './commands'
import chalk from 'chalk'

import {
  findAccountOrFirst,
  getConfig,
  getDefaultLoggerConfig,
  getJsonLoggerConfig,
  loadNevermined,
  logger,
  loginMarketplaceApi
} from '../src/utils'
import { ProvenanceMethods, StatusCodes } from './utils/enums'
import { configure, getLogger, addLayout } from 'log4js'
import { ExecutionOutput } from './models/ExecutionOutput'
import fs from 'fs'
import * as CliCommands from './commands'
import { CLICommandsDefinition } from './models/CLICommandsDefinition'
type CliCommands = typeof CliCommands
let cliCommands: CliCommands

const cmdHandler = async (cmd: keyof CliCommands, argv: any) => {
  const { verbose, network } = argv

  const config = getConfig(network as string)
  const nvm = await loadNevermined(config, network, verbose)

  if (argv.json) {
    // The `--json` parameter was given so we setup logs in json format
    addLayout('json', function (config) {
      return function (logEvent) {
        return JSON.stringify(logEvent) + config.separator
      }
    })
    configure(getJsonLoggerConfig())
    logger.level = 'mark' // we disable regular login
    chalk.level = 0 // we disable chalk colors to facilitate readability
  } else {
    configure(getDefaultLoggerConfig())
    if (verbose) {
      logger.level = 'debug'
    } else {
      logger.level = 'info'
    }
  }

  logger.debug(chalk.dim(`Debug mode: '${chalk.greenBright('on')}'\n`))
  logger.debug(chalk.dim(`Using network: '${chalk.whiteBright(network)}'\n`))
  logger.debug(
    chalk.dim(`Using node url: '${chalk.whiteBright(config.nvm.nodeUri)}'\n`)
  )

  logger.debug(
    chalk.dim(`Gas Multiplier: '${chalk.whiteBright(config.gasMultiplier)}'\n`)
  )
  logger.debug(
    chalk.dim(
      `Gas Price Multiplier: '${chalk.whiteBright(
        config.gasPriceMultiplier
      )}'\n`
    )
  )

  if (!nvm.keeper) process.exit(StatusCodes.FAILED_TO_CONNECT)

  const accounts = await nvm.accounts.list()
  const userAccount = findAccountOrFirst(accounts, argv.account)

  await loginMarketplaceApi(nvm, userAccount)

  try {
    const executionOutput: ExecutionOutput = await CliCommands[cmd](
      nvm,
      userAccount,
      argv,
      config,
      logger
    )
    if (argv.json) {
      logger.mark(JSON.stringify(executionOutput))
    }
    if (executionOutput.status > 0) {
      logger.error(`Command error: ${executionOutput.errorMessage}`)
    }

    return process.exit(executionOutput.status)
  } catch (err) {
    logger.error(`Command failed: ${(err as Error).message}`)
    return process.exit(StatusCodes.ERROR)
  }
}

const commandsParser: CLICommandsDefinition = JSON.parse(
  fs.readFileSync('resources/commands.json').toString()
)

const y = yargs(hideBin(process.argv))
  .wrap(yargs.terminalWidth())
  .usage('Usage: $0 <command>')
  .command(
    '$0',
    false,
    () => {},
    (argv) => {
      yargs.showHelp()
      return process.exit()
    }
  )

commandsParser.generalOptions.map((generalOption) => {
  y.option(generalOption.name, {
    alias: generalOption.alias,
    default: generalOption.default,
    type: generalOption.type,
    description: generalOption.description
  })
})

// TODO: Add `choices`
// choices: ProvenanceMethods,

commandsParser.commands.map((_cmd) => {
  y.command(_cmd.name, _cmd.description, (yargs) => {
    yargs.usage(_cmd.usage)
    _cmd.subcommands.map((sc) => {
      yargs
        .command(
          sc.name,
          sc.description,
          (yargs) => {
            sc.positionalArguments?.map((a) => {
              yargs.positional(a.name, {
                describe: a.description,
                default: a.default,
                type: a.type
              })
            })
            sc.optionalArguments?.map((a) => {
              yargs.option(a.name, {
                describe: a.description,
                default: a.default,
                demandOption: a.demandOption,
                hidden: a.hidden,
                type: a.type,
                choices: a.choices
              })
            })
          },
          async (argv) => cmdHandler(sc.commandHandler, argv)
        )
        .showHelpOnFail(true)
        .demandCommand(1, '')
    })
  })
})
y.argv
