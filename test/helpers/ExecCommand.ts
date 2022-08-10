import { execSync } from 'child_process'

export default function execCommand(command: string, execOpts: any): string {
  try {
    return execSync(command, execOpts)
  } catch (e: any) {
    throw new Error(e.stdout + e.stderr)
  }
}
