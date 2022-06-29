#!/usr/bin/env node

import { CLICommandsDefinition } from './models/CLICommandsDefinition'
import * as Eta from 'eta'
import fs from 'fs'
import path from 'path'
import { CliConfig } from './models/ConfigDefinition'

const commandsDefinition: CLICommandsDefinition = JSON.parse(
  fs.readFileSync('resources/commands.json').toString()
)

const mdCommandsContent = generateCommandsDocumentation(commandsDefinition)

mdCommandsContent.then((content) => {
  console.log(mdCommandsContent)
  fs.writeFileSync(`docs/cli_commands.md`, content)
})

const networksDefinition: CliConfig = JSON.parse(
  fs.readFileSync('resources/networks.json').toString()
)

const mdNetworksContent = generateEnvironmentsDocumentation(networksDefinition)

mdNetworksContent.then((content) => {
  console.log(mdNetworksContent)
  fs.writeFileSync(`docs/environments.md`, content)
})

async function generateCommandsDocumentation(
  commandsDefinition: CLICommandsDefinition
): Promise<string> {
  Eta.configure({
    views: path.join(__dirname, '../resources')
  })
  // commandsDefinition.commands.forEach((cmd) =>
  //   console.log(cmd.subcommands.length)
  // )
  const parsed = Eta.renderFile('commands_template', commandsDefinition)

  if (parsed !== undefined) {
    return await parsed
  }
  throw new Error(`Unable to generate commands documentation`)
}

async function generateEnvironmentsDocumentation(
  cliConfigDefinition: CliConfig
): Promise<string> {
  Eta.configure({
    views: path.join(__dirname, '../resources')
  })
  console.log(JSON.stringify(Object.keys(cliConfigDefinition)))
  const parsed = Eta.renderFile('environments_template', {
    _env: cliConfigDefinition,
    _keys: Object.keys(cliConfigDefinition)
  })

  if (parsed !== undefined) {
    return await parsed
  }
  throw new Error(`Unable to generate environments documentation`)
}
