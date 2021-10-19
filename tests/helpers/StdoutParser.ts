export const commandRegex = {
  assets: {
    did: new RegExp('.*Registering DID.(.*)\n', 'g')
  }
}

export const parseDIDFromNewAsset = (stdout: string): string | null => {
  const did = commandRegex.assets.did.exec(stdout)
  if (did != null) {
    return did[1]
  }
  return null
}
