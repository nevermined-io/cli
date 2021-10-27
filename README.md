# Nevermined CLI

Nevermined Command Line Interface

## Installation

```
npm install -g @nevermined-io/cli

or

yarn global add @nevermined-io/cli
```

## Usage

**Setup Accounts**:

- Option 1: Use a mnemonic

```
export MNEMONIC="<your 12 words seed phrase>"
```

- Option 2: Use keyfiles

```
export CREATOR_KEYFILE="<path to keyfile>"
export CREATOR_PASSWORD="<keyfile password>"

export BUYER_KEYFILE="<path to keyfile>"
export BUYER_PASSWORD="<keyfile password>"

export MINTER_KEYFILE="<path to keyfile>"
export MINTER_PASSWORD="<keyfile password>"
```

---

```
export NODE_URL="https://rinkeby.infura.io/v3/INFURA_TOKEN"
or
export NODE_URL="https://eth-rinkeby.alchemyapi.io/v2/-ALCHEMY_TOKEN"

to switch the NFT token address (optional):
export NFT_TOKEN_ADDRESS="<your erc721 compatible token address>"

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
* `GATEWAY_URL` - The public address of the gateway. If not given the default address is: `0x068ed00cf0441e4829d9784fcbe7b9e26d4bd8d0`


## Commands


```
$nvm --help

usage: nvm <command>

Commands:
  nvm accounts                                                      Accounts functions
  nvm accounts list                                                 List all accounts
  nvm accounts fund account                                         Funds an account on a test net
  nvm agreements                                                    Agreements functions
  nvm agreements list did                                           Lists all agreements for given DID
  nvm agreements show agreementId                                   Shows details about an agreement
  nvm nfts                                                          NFTs functions
  nvm nfts show did                                                 Retrieves information about an NFT
  nvm nfts create [creator] [metadata]                              Creates an NFT
  nvm nfts mint did [minter] [uri]                                  Mints an NFT
  nvm nfts order did [buyer]                                        Orders an NFT by paying for it to the escrow
  nvm nfts transfer agreementId [seller]                            Transfers the NFT to the buyer and the funds from the escrow to the seller
  nvm nfts download did [consumer] [destination]                    Downloads the data of an NFT
  nvm nfts search [search]                                          Searches for NFTs

Options:
      --help     Show help                                              [boolean]
      --version  Show version number                                    [boolean]
  -v, --verbose  Run with verbose logging                               [boolean]
  -n, --network  the network to use                 [string] [default: "mainnet"]
```
