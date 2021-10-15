import {
  StatusCodes,
  getConfig,
  loadNftContract,
  findAccountOrFirst,
  printNftTokenBanner,
  loadNevermined,
} from "../../utils";
import chalk from "chalk";

export const searchNft = async (argv: any): Promise<number> => {
  const { verbose, network, search } = argv;

  console.log(chalk.dim(`Searching NFTs ...`));

  const config = getConfig(network as string);
  const { nvm } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const nft = loadNftContract(config);
  if (verbose) await printNftTokenBanner(nft);

  const s = await nvm.assets.search(search);

  console.log(s);

  return StatusCodes.OK;
};
