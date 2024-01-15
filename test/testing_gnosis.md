# Testing CLI connected to GNOSIS network

We are gonna use this asset as reference:

```
https://gnosis.nevermined.app/en/subscription/did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195
```

Which is connected to this NFT contract:

```
[0xa30DE8C6aC39B825192e5F1FADe0770332D279A8](https://gnosisscan.io/address/0xa30DE8C6aC39B825192e5F1FADe0770332D279A8)
```


## Pre-requisites

### Installing the CLI

The CLI is a NPM package, install instructions can be found here:
https://docs.nevermined.io/docs/cli/getting-started#how-to-install-the-ncli

The CLI needs an account (wallet) to be able to sign transactions. The account can be created with the CLI or imported from a private key. Instructions here:
https://docs.nevermined.io/docs/cli/getting-started#configure-your-account


### Connect to the right network

The CLI can inteact with any of the Nevermined deployments, in this case we are gonna use the CLI connected to the GNOSIS network. To do so you have 2 options:

1. Pass the `-n` parameter to the CLI with the name of the network we want to connect to. In this case `appGnosis`:
2. Set the environment variable `NETWORK` to `appGnosis`


```bash
$ ncli --version
2.0.1
$ ncli network status -n appGnosis

[...]

```

### Example configuration

This is an example of an environment file to connect to the GNOSIS network:
```bash
$ cat .env.gnosis.sh 
export NETWORK="appGnosis"
export WEB3_PROVIDER_URL="https://rpc.gnosischain.com/"
export SEED_WORDS="your seed phrase xxxx"
export TOKEN_ADDRESS="0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"
export LOCAL_CONF_DIR="/tmp/.nevermined/gnosis"
```

### JSON Output

All the commands can print their output in JSON format passing the `--json` parameter. This is useful to parse the output with other tools.



## Ordering the asset

First we order the asset. This will create a new agreement and pay for it:

```bash

aitor@tijuana:~/Projects/Nevermined/cli(main)$ ncli nfts1155 order did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195 

Ordering DID: 'did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195'!
Buyer: '0x824dbcE5E9C96C5b8ce2A35a25a5ab87eD1D00b1'
Price: 0.0 USDC
Purchase associated to NFT Contract: '0xa30DE8C6aC39B825192e5F1FADe0770332D279A8'
Creating nft-sales agreement and paying
NFT Agreement Created: 0x6f416a3da257cbe294156c98671976e505e21fa0055d218c9a1259a58fe224bc for DID: did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195 

```

With the NFT agreement generated, we claim the NFT:

```bash
aitor@tijuana:~/Projects/Nevermined/cli(main)$ ncli nfts1155 claim 0x6f416a3da257cbe294156c98671976e505e21fa0055d218c9a1259a58fe224bc --amount 1

Claiming NFT order by agreement: '0x6f416a3da257cbe294156c98671976e505e21fa0055d218c9a1259a58fe224bc'
Price 0.0 USDC
Claiming NFT (ERC-1155) 'did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195' ...
Claiming NFT using endpoint: https://node.gnosis.nevermined.app/api/v1/node/services/nft-transfer
Transfer done!

aitor@tijuana:~/Projects/Nevermined/cli(main)$ 

```

After claiming the NFT, we can check the balance of the account for that specific tokenId (the asset DID):

```bash
$ ncli nfts1155 balance 0xa30DE8C6aC39B825192e5F1FADe0770332D279A8 did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195

Gets the balance of the account 0x824dbcE5E9C96C5b8ce2A35a25a5ab87eD1D00b1 for the NFT-1155 with address 0xa30DE8C6aC39B825192e5F1FADe0770332D279A8
The user holds 2 edition/s of the ERC-1155 NFT

```

