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
* `METADATA_URL` - The url of the metadata api to use. If not given the default url is: `http://localhost:5000`
* `FAUCET_URL` - The url of the faucet to use. If not given the default url is: `http://localhost:3001`
* `GATEWAY_ADDRESS` - The public address of the gateway. If not given the default address is: `0x068ed00cf0441e4829d9784fcbe7b9e26d4bd8d0`


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

Options:
      --help     Show help                                                                                                                                                    [boolean]
      --version  Show version number                                                                                                                                          [boolean]
  -v, --verbose  Run with verbose logging                                                                                                                                     [boolean]
  -n, --network  The network to use                                                                                                                         [string] [default: "spree"]
  -a, --account  The account to use                                                                                                                              [string] [default: ""]
```

## Networks

The CLI has pre-configured some Nevermined environments. You can check what is pre-configured using the `network list` command:

```
$ ncli network list
Nevermined pre-configured networks:
 rinkeby:
   Gateway: https://gateway.rinkeby.nevermined.rocks
   Metadata API: https://metadata.rinkeby.nevermined.rocks
   Faucet: https://faucet.rinkeby.nevermined.rocks


 spree:
   Gateway: http://localhost:8030
   Metadata API: http://nevermined-metadata:5000
   Faucet: http://localhost:3001


 defiMumbai:
   Gateway: https://gateway.mumbai.nevermined.rocks
   Metadata API: https://metadata.mumbai.nevermined.rocks
   Faucet: https://faucet.mumbai.nevermined.rocks


 autonomiesMumbai:
   Gateway: https://gateway.autonomies.mumbai.nevermined.rocks
   Metadata API: https://metadata.autonomies.mumbai.nevermined.rocks
   Faucet: https://faucet.mumbai.nevermined.rocks

```

A part of these networks you can connect to any other network using the environment variables described above.

When you want to connect and interact with a different network of the default (`spree`), make sure you have exported the `NODE_URL` environment variable connected to the right environment, and pass the `-n NETWORK_NAME` parameter to your commands.


## License

```
Copyright 2021 Keyko GmbH

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

