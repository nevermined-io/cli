[![banner](https://raw.githubusercontent.com/nevermined-io/assets/main/images/logo/banner_logo.png)](https://nevermined.io)

# Nevermined Command Line Interface (CLI)

> Command Line Interface for interacting with Nevermined ecosystems
> [nevermined.io](https://nevermined.io)

![CI Build](https://github.com/nevermined-io/cli/workflows/Build/badge.svg)

---

## Table of Contents

   * [Nevermined Command Line Interface (CLI)](#nevermined-command-line-interface-cli)
      * [Table of Contents](#table-of-contents)
      * [Installation](#installation)
      * [Usage](#usage)
      * [Environment variables](#environment-variables)
      * [Commands](#commands)
      * [Networks](#networks)
      * [License](#license)

---


## Installation

```
npm install -g @nevermined-io/cli

or

yarn global add @nevermined-io/cli
```

After doing that you should have available in your system the `ncli` tool.

```
$ ncli --help
```

## Usage

**Setup Accounts**:

- Option 1: Use a mnemonic

```
export MNEMONIC="<your 12 words seed phrase>"
```

- Option 2: Use keyfiles

```
export KEYFILE_PATH="<path to keyfile>"
export KEYFILE_PASSWORD="<keyfile password>"
```

---

```
export NODE_URL="https://rinkeby.infura.io/v3/INFURA_TOKEN"
or
export NODE_URL="https://eth-rinkeby.alchemyapi.io/v2/-ALCHEMY_TOKEN"

to switch the token address (optional):
export TOKEN_ADDRESS="<your erc20 compatible token address>"
if you want to use the native token of the network where you are operating you can specify the 0x0 address
export TOKEN_ADDRESS=0x0
```


## Environment variables

* `NODE_URL` - JSON-RPC server. It could be an Infura or Alchemy url too. Example: `http://localhost:8545`
* `TOKEN_ADDRESS` - The ERC20 token address to use for the transactions. If not given or if is `0x0` the payments will be made in the network native token (ETH, Matic, ..)
* `GATEWAY_URL` - The url of the gateway to use. If not given the default url is: `http://localhost:8030`
* `MARKETPLACE_API_URL` - The url of the marketplace api to use. If not given the default url is: `http://localhost:3100`
* `FAUCET_URL` - The url of the faucet to use. If not given the default url is: `http://localhost:3001`
* `IPFS_GATEWAY` - The url of the IPFS gateway used to upload/download contents. By default is `https://ipfs.infura.io:5001`
* `GATEWAY_ADDRESS` - The public address of the gateway. If not given the default address is: `0x068ed00cf0441e4829d9784fcbe7b9e26d4bd8d0`
* `GAS_MULTIPLIER` - For networks with some congestion, this parameter can help to increase the gas spent and speed up the transactions. If not given the default is `0`. 


## Commands


```
$ ncli
usage: ncli <command>

Commands:
  ncli network     Retrieve information about Nevermined deployments
  ncli accounts    Management of accounts and the funds associted to them
  ncli assets      Allows to register and manage assets in a Nevermined network
  ncli agreements  Get information about the Service Execution Agreements
  ncli provenance  Provenance functions
  ncli nfts721     Create and manage NFTs (ERC-721) attached to Nevermined assets
  ncli nfts1155    Create and manage NFTs (ERC-1155) attached to Nevermined assets
  ncli utils       Utility commands to faciliate files management, encryption, etc

Options:
      --help     Show help                                                                                                                                                    [boolean]
      --version  Show version number                                                                                                                                          [boolean]
  -v, --verbose  Run with verbose logging                                                                                                                                     [boolean]
  -n, --network  The network to use                                                                                                                         [string] [default: "testnet"]
  -a, --accountIndex  The account to index referring to the account to use                                                                                                                              [string] [default: ""]
```

## Networks

The CLI has pre-configured some Nevermined environments. You can check what is pre-configured using the `network list` command:

```
$ ncli network list
Nevermined pre-configured networks:

 testnet:
        Public testnet environment where users can interact with Nevermined protocol.
        Is a Production environment? false

        Node Uri: https://rpc-mumbai.maticvigil.com
        Gateway: https://gateway.mumbai.public.nevermined.rocks
        Marketplace API: https://marketplace-api.mumbai.public.nevermined.rocks
        Faucet: https://faucet.mumbai.public.nevermined.rocks


 defiMumbai:
        Testnet environment for the DeFi Marketplace.
        Is a Production environment? false

        Node Uri: https://rpc-mumbai.maticvigil.com
        Gateway: https://defi.v2.gateway.mumbai.nevermined.rocks
        Marketplace API: https://defi.v2.marketplace-api.mumbai.nevermined.rocks
        Faucet: https://faucet.mumbai.public.nevermined.rocks


 autonomiesMumbai:
        Testnet environment for the Autonomies Marketplace.
        Is a Production environment? false

        Node Uri: https://rpc-mumbai.maticvigil.com
        Gateway: https://gateway.autonomies.test.nevermined.rocks
        Marketplace API: https://marketplace-api.autonomies.test.nevermined.rocks
        Faucet: https://faucet.mumbai.public.nevermined.rocks


```

A part of these networks you can connect to any other network using the environment variables described above.

When you want to connect and interact with a different network of the default (`testnet`), make sure you have exported the `NODE_URL` environment variable connected to the right environment, and pass the `-n NETWORK_NAME` parameter to your commands.


## License

```
Copyright 2022 Nevermined AG

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```


