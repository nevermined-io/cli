import {
  StatusCodes,
  getConfig,
  loadNftContract,
  findAccountOrFirst,
  printNftTokenBanner,
  loadNevermined
} from "../../utils";
import chalk from "chalk";
import { zeroX } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

export const mintNft = async (argv: any): Promise<number> => {
  const { verbose, network, did, minter, uri } = argv;

  console.log(chalk.dim(`Minting NFT: '${chalk.whiteBright(did)}'`));

  const config = getConfig(network as string);
  const { nvm } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const accounts = await nvm.accounts.list();

  let minterAccount = findAccountOrFirst(accounts, minter);

  if (verbose)
    console.log(
      chalk.dim(`Using Minter: ${chalk.whiteBright(minterAccount.getId())}`)
    );

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const contractOwner: string = await nft.methods.owner().call();

  if (contractOwner.toLowerCase() !== minterAccount.getId().toLowerCase()) {
    console.log(
      chalk.red(
        `ERROR: Account '${minterAccount.getId()}' is not the owner of the contract but '${contractOwner}' is`
      )
    );
    return StatusCodes.MINTER_NOT_OWNER;
  }

  const ddo = await nvm.assets.resolve(did);

  const register = (await nvm.keeper.didRegistry.getDIDRegister(
    zeroX(ddo.shortId())
  )) as {
    owner: string;
    url: string;
  };

  console.log(
    chalk.dim(
      `Minting NFT with service Endpoint! ${chalk.whiteBright(register.url)}`
    )
  );

  try {
    const oldOwner = await nft.methods.ownerOf(ddo.shortId()).call();
    console.log(
      chalk.red(`ERROR: NFT already existing and owned by: '${oldOwner}'`)
    );
    return StatusCodes.NFT_ALREADY_OWNED;
  } catch {}

  const to = await nvm.keeper.didRegistry.getDIDOwner(ddo.id);

  await nft.methods
    .mint(to, zeroX(ddo.shortId()), uri || register.url)
    .send({ from: minterAccount.getId() });

  console.log(
    chalk.dim(
      `Minted NFT '${chalk.whiteBright(ddo.id)}' to '${chalk.whiteBright(to)}'!`
    )
  );

  return StatusCodes.OK;
};
