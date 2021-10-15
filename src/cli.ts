import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  showNft,
  mintNft,
  accountsList,
  accountsFund,
  orderNft,
  transferNft,
  showAgreement,
  createNft,
  listAgreements,
  downloadNft,
  searchNft
} from "./commands";
import chalk from "chalk";

const cmdHandler = async (cmd: Function, argv: any) => {
  const { network } = argv;

  console.log(chalk.dim(`Using network: '${chalk.whiteBright(network)}'\n`));
  return process.exit(await cmd(argv));
};

const y = yargs(hideBin(process.argv))
  .wrap(yargs.terminalWidth())
  .usage("usage: $0 <command>")
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging"
  })
  .option("network", {
    alias: "n",
    type: "string",
    default: "mainnet",
    description: "the network to use"
  });

// hidden default command to display the help when used without parameters
y.command(
  "$0",
  false,
  () => {},
  argv => {
    yargs.showHelp();
    return process.exit();
  }
);

y.command(
  "accounts",
  "Accounts functions",
  yargs => {
    return yargs
      .usage("usage: $0 accounts <command> parameters [options]")
      .command(
        "list",
        "List all accounts",
        yargs => {
          return yargs.option("with-inventory", {
            type: "boolean",
            default: false,
            description: "Load NFT inventory as well"
          });
        },
        async argv => {
          return cmdHandler(accountsList, argv);
        }
      )
      .command(
        "fund account",
        "Funds an account on a test net",
        yargs => {
          return yargs.positional("account", {
            describe: "the account to fund",
            type: "string"
          });
        },
        async argv => {
          return cmdHandler(accountsFund, argv);
        }
      );
  },
  () => {
    yargs.showHelp();
    return process.exit();
  }
);

y.command(
  "agreements",
  "Agreements functions",
  yargs => {
    return yargs
      .usage("usage: $0 agreements <command> parameters [options]")
      .command(
        "list did",
        "Lists all agreements for given DID",
        yargs => {
          return yargs.positional("did", {
            describe: "the did to list the agreements for",
            type: "string"
          });
        },
        async argv => {
          return cmdHandler(listAgreements, argv);
        }
      )
      .command(
        "show agreementId",
        "Shows details about an agreement",
        yargs => {
          return yargs.positional("agreementId", {
            describe: "the agreement id address",
            type: "string"
          });
        },
        async argv => {
          return cmdHandler(showAgreement, argv);
        }
      );
  },
  () => {
    yargs.showHelp();
    return process.exit();
  }
);

y.command(
  "nfts",
  "NFTs functions",
  yargs => {
    return yargs
      .usage("usage: $0 nfts <command> parameters [options]")
      .command(
        "show did",
        "Retrieves information about an NFT",
        yargs => {
          return yargs.positional("did", {
            describe: "the did to retrieve",
            type: "string"
          });
        },
        async argv => {
          return cmdHandler(showNft, argv);
        }
      )
      .command(
        "create [creator] [metadata]",
        "Creates an NFT",
        yargs => {
          return yargs
            .positional("creator", {
              describe: "the address of the author of the NFT",
              type: "string"
            })
            .positional("metadata", {
              describe: "the json file with the metadata",
              type: "string"
            });
        },
        async argv => {
          return cmdHandler(createNft, argv);
        }
      )
      .command(
        "mint did [minter] [uri]",
        "Mints an NFT",
        yargs => {
          return yargs
            .positional("did", {
              describe: "the did to mint",
              type: "string"
            })
            .positional("minter", {
              describe: "the address of the minter of the NFT",
              type: "string"
            })
            .positional("uri", {
              describe: "the token uri for the Asset Metadata",
              type: "string"
            })
        },
        async argv => {
          return cmdHandler(mintNft, argv);
        }
      )
      .command(
        "order did [buyer]",
        "Orders an NFT by paying for it to the escrow",
        yargs => {
          return yargs
            .positional("did", {
              describe: "the DID to retrieve",
              type: "string"
            })
            .positional("buyer", {
              describe: "the buyer address",
              type: "string"
            });
        },
        async argv => {
          return cmdHandler(orderNft, argv);
        }
      )
      .command(
        "transfer agreementId [seller]",
        "Transfers the NFT to the buyer and the funds from the escrow to the seller",
        yargs => {
          return yargs
            .positional("agreementId", {
              describe: "the agreement id address",
              type: "string"
            })
            .positional("seller", {
              describe: "the seller address",
              type: "string"
            });
        },
        async argv => {
          return cmdHandler(transferNft, argv);
        }
      )
      .command(
        "download did [consumer] [destination]",
        "Downloads the data of an NFT",
        yargs => {
          return yargs
            .positional("did", {
              describe: "the agreement id address",
              type: "string"
            })
            .positional("consumer", {
              describe: "the seller address",
              type: "string"
            })
            .positional("destination", {
              describe: "the destination of the files",
              type: "string"
            });
        },
        async argv => {
          return cmdHandler(downloadNft, argv);
        }
      )
      .command(
        "search [search]",
        "Searches for NFTs",
        yargs => {
          return yargs
            .positional("search", {
              describe: "search string",
              type: "string"
            })
            .positional("consumer", {
              describe: "the seller address",
              type: "string"
            });
        },
        async argv => {
          return cmdHandler(searchNft, argv);
        }
      );
  },
  () => {
    yargs.showHelp();
    return process.exit();
  }
);

y.argv;
