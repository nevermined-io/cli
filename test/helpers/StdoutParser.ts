import { listAgreements } from '../../src/commands/agreements/listAgreements'
export const commandRegex = {
  assets: {
    //did: new RegExp('.*Registering DID.(.*)\n', 'g'),
    did: new RegExp('.*Created Asset.(.{71}).*', 'g'),
    totalResultsQuery: new RegExp('.*Total Results:.(.*) - (.*)\n', 'g'),
    downloadPath: new RegExp('.*Files downloaded to:.(.*)', 'gm'),
    serviceAgreement: new RegExp('.*Agreement Id:.(.*)\n', 'g')
    //
  },
  accounts: {
    newAccount: new RegExp(
      '.*Account address:.(.*)\nAccount private key: (.*)\n',
      'g'
    )
  },
  agreements: {
    listAgreements: new RegExp('.*AgreementID: (.*)', 'gm')
  }
}

export const parseDIDFromNewAsset = (stdout: string): string => {
  const did = commandRegex.assets.did.exec(stdout)
  if (did != null) {
    return did[1]
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
