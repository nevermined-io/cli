import { execOpts, baseCommands } from '../helpers/Config'
import execCommand from '../helpers/ExecCommand'
import fs from 'fs'

// TODO: Re-enable DTP tests when `sdk-dtp` is published back
describe('Assets e2e Testing', () => {
  const password = 'qwertyuiopasdfghjklzxcvbnm1234567890'

  test('Upload a file', async () => {
    const encryptCommand = `${baseCommands.utils.encrypt} --password ${password} README.md`
    console.debug(`COMMAND: ${encryptCommand}`)

    const encryptStdout = execCommand(encryptCommand, execOpts)
    console.log(`STDOUT: ${encryptStdout}`)

  })

  test('Decrypt the content', async () => {
    const decryptCommand = `${baseCommands.utils.decrypt} --password ${password}  README.md.encrypted`
    console.debug(`COMMAND: ${decryptCommand}`)

    const decryptStdout = execCommand(decryptCommand, execOpts)
    console.log(`STDOUT: ${decryptStdout}`)

    expect(decryptStdout.includes(`File decrypted successfully`))

    expect(fs.readFileSync('README.md.encrypted.decrypted') == fs.readFileSync('README.md'))

  })
})
