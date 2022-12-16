export const commandRegex = {
  assets: {
    did: new RegExp('.*Created Asset.(.{71}).*', 'g'),
    password: new RegExp('.*Got password (.*)\\n', 'g'),
    totalResultsQuery: new RegExp('.*Total Results:.(.*) - (.*)\\n', 'g'),
    downloadPath: new RegExp('.*Files downloaded to:.(.*)', 'gm'),
    downloadFile: new RegExp('.*Downloaded:.(.*)', 'gm'),
    serviceAgreement: new RegExp('.*Agreement Id:.(.*)\\n', 'g')
    //
  },
  nfts: {
    deploy: new RegExp('.*Contract deployed into address: (.{42}).*', 'gm'),
    create: new RegExp('.*Created DID: (.{71}).*', 'gm'),
    publishMetadata: new RegExp('.*NFT Metadata Created: (.*)', 'gm'),
    order: new RegExp('.*NFT Agreement Created: (.{66})', 'g')
    //order: new RegExp('(0x[a-fA-F|\d]{64})', 'g')
    // .*NFT Agreement Created:\s(0x[a-fA-F|\d]{64})
  },
  accounts: {
    newAccount: new RegExp(
      '.*Wallet address:.(.*)\\nWallet public key: (.*)\\n',
      'g'
    )
  },
  agreements: {
    listAgreements: new RegExp('.*AgreementID: (.*)', 'gm')
  },
  provenance: {
    register: new RegExp('.*Provenance Id: (.*)', 'gm')
  },
  utils: {
    upload: new RegExp('URL: (.*)\\nPassword: (.*)\\n', 'gm')
  },
  compute: {
    execute: new RegExp('.*Created Job (.*)', 'gm'),
    algorithm: new RegExp('.*Created Asset.(.{71}).*', 'g'),
    workflow: new RegExp('.*Created Asset.(.{71}).*', 'g')
  }
}

export const sleep = (ms: number): any => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const parseDIDFromNewAsset = (stdout: string): string => {
  const did = commandRegex.assets.did.exec(stdout)
  if (did != null) {
    return did[1]
  }
  return ''
}

export const parseUrlAndPassword = (stdout: string): any => {
  const parts = commandRegex.utils.upload.exec(stdout)
  if (parts != null) {
    return { url: parts[1], password: parts[2] }
  }
  return { url: '', password: '' }
}

export const parsePasswordFromOrder = (stdout: string): any => {
  const parts = commandRegex.assets.password.exec(stdout)
  if (parts != null) {
    return parts[1]
  }
  return ''
}

export const parseDIDFromNewNFT = (stdout: string): string => {
  const did = commandRegex.nfts.create.exec(stdout)
  if (did != null) {
    return did[1]
  }
  return ''
}

export const parseCIDFromNFTMetadata = (stdout: string): string => {
  const cid = commandRegex.nfts.publishMetadata.exec(stdout)
  if (cid != null) {
    return cid[1]
  }
  return ''
}

export const parseNumberResultsFromSearch = (stdout: string): string | null => {
  const totalResults = commandRegex.assets.totalResultsQuery.exec(stdout)
  if (totalResults != null) {
    return totalResults[1]
  }
  return null
}

export const parseDownloadPath = (stdout: string): string | null => {
  const path = commandRegex.assets.downloadPath.exec(stdout)
  if (path != null) {
    return path[1]
  }
  return null
}

export const parseDownloadFile = (stdout: string): string | null => {
  const path = commandRegex.assets.downloadFile.exec(stdout)
  if (path != null) {
    return path[1]
  }
  return null
}

export const parseServiceAgreementId = (stdout: string): string | null => {
  const serviceAgreementId = commandRegex.assets.serviceAgreement.exec(stdout)
  if (serviceAgreementId != null) {
    return serviceAgreementId[1]
  }
  return null
}

export const parseNewAccount = (stdout: string): [string, string] => {
  const accountDetails = commandRegex.accounts.newAccount.exec(stdout)
  if (accountDetails != null && accountDetails.length > 2) {
    return [accountDetails[1], accountDetails[2]]
  }
  return ['', '']
}

export const parseListAgreements = (stdout: string): string => {
  const parsed = commandRegex.agreements.listAgreements.exec(stdout)
  if (parsed != null) {
    return parsed[1]
  }
  return ''
}

export const parseProvenanceId = (stdout: string): string => {
  const parsed = commandRegex.provenance.register.exec(stdout)
  if (parsed != null) {
    return parsed[1]
  }
  return ''
}

export const parseNFTOrderAgreementId = (stdout: string): string => {
  const parsed = commandRegex.nfts.order.exec(stdout)
  console.log(`PARSED ${JSON.stringify(parsed)}`)
  if (parsed != null) {
    return parsed[1]
  }
  return ''
}

export const parseAddressOfContractDeployed = (stdout: string): string => {
  const parsed = commandRegex.nfts.deploy.exec(stdout)
  if (parsed != null) {
    return parsed[1]
  }
  return ''
}

export const parseComputeJobId = (stdout: string): string  => {
  const jobId = commandRegex.compute.execute.exec(stdout)
  if (jobId != null) {
    return jobId[1]
  }
  return ''
}

export const parseDIDFromNewAlgorithm = (stdout: string): string => {
  const did = commandRegex.compute.algorithm.exec(stdout)
  if (did != null) {
    return did[1]
  }
  return ''
}

export const parseDIDFromNewWorkflow = (stdout: string): string => {
  const did = commandRegex.compute.workflow.exec(stdout)
  if (did != null) {
    return did[1]
  }
  return ''
}

