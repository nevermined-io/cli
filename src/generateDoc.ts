#!/usr/bin/env node

import { CLICommandsDefinition } from './models/CLICommandsDefinition'
import * as Eta from 'eta'
import fs from 'fs'
import path from 'path'

const commandsDefinition: CLICommandsDefinition = JSON.parse(
  fs.readFileSync('resources/commands.json').toString()
)

const mdContent = generateDocumentation(commandsDefinition)

mdContent.then((content) => {
  console.log(mdContent)
  fs.writeFileSync(`docs/cli_commands.md`, content)
})


async function generateDocumentation(
  commandsDefinition: CLICommandsDefinition
): Promise<string> {

  Eta.configure({
    views: path.join(__dirname, '../resources')
  })
  const parsed = Eta.renderFile('documentation_template', commandsDefinition)

  if (parsed !== undefined) {
    return await parsed
  }
  throw new Error(`Unable to generate documentation`)
}
