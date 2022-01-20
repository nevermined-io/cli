const IpfsHttpClientLite = require('ipfs-http-client-lite')

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://ipfs.infura.io:5001'

export default class IpfsHelper {
  public static async add(content: any): Promise<string> {
    const ipfs = IpfsHttpClientLite(IPFS_GATEWAY)
    const addResult = await ipfs.add(content)
    return addResult[0].hash
  }
}
