import { Choices, Options, PositionalOptionsType } from 'yargs'
import * as CliCommands from '../commands'
type CliCommands = typeof CliCommands

export interface CLICommandsDefinition {
  generalOptions: GeneralOption[]
  commands: CommandDefinition[]
}

export interface CommandDefinition {
  name: string
  description: string
  usage: string
  subcommands: SubcommandDefinition[]
}

export interface SubcommandDefinition {
  name: string
  description: string
  commandHandler: keyof CliCommands
  positionalArguments?: PositionalArgument[]
  optionalArguments?: OptionalArgument[]
}

export interface PositionalArgument {
  name: string
  type: PositionalOptionsType | undefined
  default: string | undefined
  description: string | undefined
}

export interface OptionalArgument {
  name: string
  type: PositionalOptionsType | undefined
  default: string | undefined
  description: string | undefined
  demandOption?: boolean
  hidden?: boolean
  choices?: Choices | undefined
}

export interface GeneralOption {
  name: string
  alias?: string | undefined
  default: string | boolean
  type: 'array' | 'count' | PositionalOptionsType | undefined
  description: string
}
