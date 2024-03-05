import { Account, NvmApp, NvmAppMetadata, MetaDataExternalResource } from '@nevermined-io/sdk'
import {
  StatusCodes} from '../../utils'
import chalk from 'chalk'
import { ExecutionOutput } from '../../models/ExecutionOutput'
import { Logger } from 'log4js'
import { ConfigEntry } from '../../models/ConfigDefinition'


export const registerFiles = async (
  nvmApp: NvmApp,
  publisherAccount: Account,
  argv: any,
  config: ConfigEntry,
  logger: Logger
): Promise<ExecutionOutput> => {  

  logger.info(chalk.dim(`Registering Files Asset ...`))

  logger.debug(chalk.dim(`Using publisher account: '${publisherAccount.getId()}'\n`))
  
  if (argv.name === '' || argv.url === '') {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `The following parameters need to be given: name, url`
    }
  }

  const urls: MetaDataExternalResource[] = []
  let index = 0
  argv.url.map((url: string) => {
    logger.debug(`Adding file with url: ${url}`)
    urls.push({
      index,
      contentType: 'text/plain',
      url
    })
    index++
  })

  if (urls.length === 0) {
    return {
      status: StatusCodes.ERROR,
      errorMessage: `Invalid url list. It should be a list of urls to remote files`
    }
  }

  const filesMetadata = NvmAppMetadata.getFileMetadataTemplate(
    argv.name,
    argv.author,
  )

  filesMetadata.main.files = urls
  
  const costInCredits = BigInt(argv.cost)

  const ddo = await nvmApp.registerFileAsset(
    filesMetadata,
    argv.subscriptionDid,    
    costInCredits
  )
  
  const assetUrl = `${config.nvm.appUrl}/en/file/${ddo.shortId()}`
  logger.info(
    chalk.dim(
      `File asset created with DID: ${chalk.whiteBright(
        ddo.id
      )}\n available on: ${chalk.whiteBright(assetUrl)}`
    )
  )
  
  return {
    status: StatusCodes.OK,
    results: JSON.stringify({
      did: ddo.id,
      url: assetUrl
    })
  }
}
