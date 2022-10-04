import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import chalk from 'chalk'
import path from 'path'

import {
  getConfig,
  getDefaultLoggerConfig,
  getJsonLoggerConfig,
  loadNevermined,
  logger,
  loginMarketplaceApi,
  configureLocalEnvironment,
  loadAccountFromMnemonic
} from '../src/utils'
import { StatusCodes } from './utils/enums'
import { configure, addLayout } from 'log4js'
import { ExecutionOutput } from './models/ExecutionOutput'
import fs from 'fs'
import * as CliCommands from './commands'
import { CLICommandsDefinition } from './models/CLICommandsDefinition'
import { Account, Nevermined } from '@nevermined-io/nevermined-sdk-js'
import { ConfigEntry } from './models/ConfigDefinition'
type CliCommands = typeof CliCommands

const cmdHandler = async (
  cmd: keyof CliCommands,
  argv: any,
  requiresAccount: boolean = true
) => {
  const { verbose, network, accountIndex } = argv

  let config: ConfigEntry
  let nvm: Nevermined
  let userAccount: Account
  try {
    config = getConfig(network as string, requiresAccount, accountIndex)
    await configureLocalEnvironment(network as string, config)
  } catch (err) {
    console.error(`Error setting up the CLI: ${(err as Error).message}`)
    return process.exit(StatusCodes.ERROR)
  }

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

  try {
    if (requiresAccount) {
      nvm = await loadNevermined(config, network, verbose)
      if (!nvm.keeper) process.exit(StatusCodes.FAILED_TO_CONNECT)

      const networkId = await nvm.keeper.getNetworkId()
      if (networkId !== Number(config.networkId)) {
        logger.warn(chalk.red(`\nWARNING: Network connectivity issue`))
        logger.warn(
          `The network id obtained from the blockchain node (${networkId}), is not the same we have in the configuration for the network ${network} (${config.networkId}) `
        )
        logger.warn(
          `Please, check if you are connected to the right node url. Currently using: ${config.nvm.nodeUri}\n`
        )
      }
      userAccount = loadAccountFromMnemonic(config.seed!, accountIndex)

      logger.debug(
        chalk.dim(
          `Using account: '${chalk.whiteBright(userAccount.getId())}'\n`
        )
      )

      await loginMarketplaceApi(nvm, userAccount)
    }
  } catch (err) {
    logger.error(`Error Connecting to Nevermined: ${(err as Error).message}`)
    return process.exit(StatusCodes.ERROR)
  }

  try {
    const executionOutput: ExecutionOutput = await CliCommands[cmd](
      nvm!,
      userAccount!,
      argv,
      config,
      logger
    )
    if (argv.json) {
      logger.mark(executionOutput)
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

const commandJsonPath = path.join(__dirname, '../resources', 'commands.json')

const commandsParser: CLICommandsDefinition = JSON.parse(
  fs.readFileSync(commandJsonPath).toString()
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

commandsParser.commands.map((_cmd) => {
  y.command(_cmd.name, _cmd.description, (yargs) => {
    yargs.usage(_cmd.usage)
    _cmd.subcommands.map((sc) => {
      yargs
        .command(
          sc.name,
          sc.description +
            '\nExamples: \n' +
            sc.examples
              ?.map((e) => `\t$ ${e}`)
              .toString()
              .replace(',', '\n'),
          //sc.examples?.forEach((e) => `  $ ${e} \n`),
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
          async (argv) =>
            cmdHandler(sc.commandHandler, argv, sc.requiresAccount)
        )
        .showHelpOnFail(true)
        .demandCommand(1, '')
    })
  })
})
y.argv
