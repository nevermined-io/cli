const IpfsHttpClientLite = require('ipfs-http-client-lite')
import fetch from 'cross-fetch'

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://ipfs.infura.io:5001'

export default class IpfsHelper {
  private static authToken: string

  public static async add(content: any): Promise<string> {
    const ipfs = IpfsHttpClientLite({
      apiUrl: IPFS_GATEWAY,
      headers: { Authorization: `Basic ${this.getAuthToken()}` }
    })
    const addResult = await ipfs.add(content)
    return addResult[0].hash
  }

  public static async get(cid: string): Promise<string> {
    const url = IPFS_GATEWAY + '/api/v0/cat?arg=' + cid.replace('cid://', '')
    var options = {
      method: 'POST',
      headers: { Authorization: `Basic ${this.getAuthToken()}` }
    }

    return fetch(url, options)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            `${res.status}: ${res.statusText} - ${await res.text()}`
          )
        }
        return res.text()
      })
      .catch((err) => {
        throw err
      })
  }

  private static getAuthToken(): string {
    if (!this.authToken) {
      const { IPFS_PROJECT_ID, IPFS_PROJECT_SECRET } = process.env

      if (!IPFS_PROJECT_ID || !IPFS_PROJECT_SECRET) {
        throw new Error(
          'Infura IPFS_PROJECT_ID and IPFS_PROJECT_SECRET need to be set'
        )
      } else {
        this.authToken = Buffer.from(
          `${IPFS_PROJECT_ID}:${IPFS_PROJECT_SECRET}`
        ).toString('base64')
      }
    }
    return this.authToken
  }
}
