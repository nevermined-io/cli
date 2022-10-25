---
sidebar_position: 2
---

# Getting Started

The Nevermined CLI (aka NVM CLI or `ncli`) allows to interact with a Nevermined deployment from the command line interface allowing to do everything is supported from a traditional Nevermined web environment like a Marketplace or similar DApp.

The `ncli` allows to connect to a local Nevermined environment (see in the [Nevermined Tools tutorial](https://docs.nevermined.io/docs/tutorials/running-locally) how to do that) or with a remote one.

This section provides links to information about how to get started with the Nevermined Command Line Interface (NVM CLI or `ncli`).

## Pre-requisites

The Nevermined CLI is an application built with Typescript and ready to be used in the user command line to interact with a remote (or local) Nevermined deployment.
The `ncli` requires [Node JS](https://nodejs.org/) v14 or higher. You can find online instructions about [How to install Node JS](https://nodejs.dev/learn/how-to-install-nodejs).


## How to install the `ncli`?

The `ncli` is packaged in `NPM` format. This means you can installed easilly in your environment running one of the following commands:

```
npm install -g @nevermined-io/cli

or

yarn global add @nevermined-io/cli
```

After doing that you should have available in your system the `ncli` tool.

```
$ ncli --help
```

## Configure your account

### Using your existing account

The `ncli` requires a wallet to connect with the blockchain network (EVM compatible). To use an existing wallet with the `ncli` there are 2 options:

### Use seed words

You just need to export your **seed words** in the command line:

```bash
export SEED_WORDS="<your 12/24 words seed phrase>"
```

### Use a keyfile

If you have a keyfile storing your credentials you can use them providing the path to the keyfile and the keyfile password:

```bash
export KEYFILE_PATH="<path to keyfile>"
export KEYFILE_PASSWORD="<keyfile password>"
```

### Creating a new account

If you don't have an account locally or you want to use a new one to use the `ncli`, create it is very simple, you just need to use the `ncli`:

```
ncli accounts new

Creating wallet ...
Wallet address: 0x37434d6673ff106446c9224884D54201e5Ae46A4
Wallet public key: 0x0482d6aac219607b47c0a840784909e19694cf66d35262c0ddbf41d753962388812e5394e083a0c54bce10282b6ec0fd86be7f77d296868184e6fd999c4c1fa7e6
Wallet private key: 0x0acb0253593fcbbd20e0fd82b8ff35c8a6e6c1f32c09d1bc8b41cec9031c0986
Wallet Seed Words:
  Phrase: street fever feed resource place adapt venue mobile hill try armed feature
  Path: m/44'/60'/0'/0/0
  Locale: en

If you want to use it in the CLI run:
export SEED_WORDS="street fever feed resource place adapt venue mobile hill try armed feature"
```

As the command output says, you just need to export the `SEED_WORDS` environment variable and start using the `ncli`.

```bash
export SEED_WORDS="street fever feed resource place adapt venue mobile hill try armed feature"
```

:::caution

Remember to store your **SEED_WORDS** in a secure place and don't share it with anyone.

:::


## Getting Funds

You can find some information about how to get funds in a `testnet` in the [Faucets tutorial](https://docs.nevermined.io/docs/tutorials/faucets).
