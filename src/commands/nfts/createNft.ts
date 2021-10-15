import {
  StatusCodes,
  getConfig,
  loadNftContract,
  findAccountOrFirst,
  printNftTokenBanner,
  loadNevermined,
  Constants
} from "../../utils";
import chalk from "chalk";
import { MetaDataMain, File } from "@nevermined-io/nevermined-sdk-js";
import AssetRewards from "@nevermined-io/nevermined-sdk-js/dist/node/models/AssetRewards";
import readline from "readline";
import { zeroX } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export const createNft = async (argv: any): Promise<number> => {
  const { verbose, network, creator, metadata } = argv;

  console.log(chalk.dim(`Creating NFT ...`));

  const config = getConfig(network as string);
  const { nvm, token } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const accounts = await nvm.accounts.list();
  let creatorAccount = findAccountOrFirst(accounts, creator);

  if (verbose)
    console.log(chalk.dim(`Using creator: '${creatorAccount.getId()}'\n`));

  let ddoMetadata;
  let ddoPrice: Number;
  if (!metadata) {
    const authorInput = await new Promise(resolve =>
      rl.question("Author Name: ", author => {
        resolve(author);
      })
    );

    const name = await new Promise(resolve =>
      rl.question("Asset Name: ", name => {
        resolve(name);
      })
    );

    const url = await new Promise(resolve =>
      rl.question("URL to the Asset: ", url => {
        resolve(url);
      })
    );

    const price: number = await new Promise(resolve =>
      rl.question("Price of the Asset: ", price => {
        resolve(Number(price));
      })
    );

    const license = await new Promise(resolve =>
      rl.question("License of the Asset: ", license => {
        resolve(license);
      })
    );

    const decimals =
      token !== null ? await token.decimals() : Constants.ETHDecimals;

    ddoPrice = (price * 10 ** decimals);

    ddoMetadata = {
      main: {
        name,
        type: "dataset",
        dateCreated: new Date().toISOString().replace(/\.[0-9]{3}/, ""),
        author: authorInput,
        license,
        price: ddoPrice.toString(),
        files: [
          {
            url
          } as File
        ]
      } as MetaDataMain
    }
  } else {
      ddoMetadata = JSON.parse(fs.readFileSync(metadata).toString())
      ddoPrice = Number(ddoMetadata.main.price);
  }

  console.log(chalk.dim("\nCreating Asset ..."));

  const ddo = await nvm.nfts.create721(
    ddoMetadata,
    creatorAccount,
    // @ts-ignore
    new AssetRewards(creatorAccount.getId(), ddoPrice),
    config.nftTokenAddress,
    token ? token.getAddress() : config.erc20TokenAddress
  );

  const register = (await nvm.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    owner: string;
    url: string;
  };

  console.log(
    chalk.dim(
      `Created NFT '${chalk.whiteBright(ddo.id)} with service endpoint: ${chalk.whiteBright(register.url)}`
    )
  );

  console.log("Now please mint the token on the NFT Contract!");

  return StatusCodes.OK;
};
