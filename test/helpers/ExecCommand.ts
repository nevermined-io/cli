import { execSync } from 'child_process'
import { baseCommands, execOpts } from './Config'

export default function execCommand(command: string, execOpts: any): string {
  try {
    return execSync(command, execOpts)
  } catch (e: any) {
    throw new Error(e.stdout + e.stderr)
  }
}

export function fundTestAccount(accountToFund: string): boolean {
  try {
    console.log(`Funding account: ${accountToFund}`)
    const fundCommand = `${baseCommands.accounts.fund} "${accountToFund}" --token erc20`
    console.debug(`COMMAND: ${fundCommand}`)

    execCommand(fundCommand, execOpts)
    return true
  } catch {
    console.debug(`Error getting funds`)
  }
  return false
}