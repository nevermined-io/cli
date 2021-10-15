import {
  StatusCodes,
  getConfig,
  findAccountOrFirst,
  loadNevermined,
  Constants,
} from "../../utils";
import chalk from "chalk";
import { getAssetRewardsFromDDOByService } from "@nevermined-io/nevermined-sdk-js/dist/node/utils";

export const transferNft = async (argv: any): Promise<number> => {
  const { verbose, network, agreementId, seller } = argv;

  if (verbose)
    console.log(
      chalk.dim(`Executing agreement: '${chalk.whiteBright(agreementId)}'`)
    );

  const config = getConfig(network as string);
  const { nvm, token } = await loadNevermined(config, network, verbose);

  if (!nvm.keeper) {
    return StatusCodes.FAILED_TO_CONNECT;
  }

  const { agreementStoreManager } = nvm.keeper;

  const { did } = await agreementStoreManager.getAgreement(agreementId);

  const ddo = await nvm.assets.resolve(did);

  const accounts = await nvm.accounts.list();

  let sellerAccount = findAccountOrFirst(accounts, seller);

  if (verbose) {
    console.log(chalk.dim(`DID: '${chalk.whiteBright(ddo.id)}'`));
    console.log(chalk.dim(`AgreementId: '${chalk.whiteBright(agreementId)}'`));
    console.log(
      chalk.dim(`Seller: '${chalk.whiteBright(sellerAccount.getId())}'`)
    );
  }

  const decimals =
    token !== null ? await token.decimals() : Constants.ETHDecimals;

  const price =
    getAssetRewardsFromDDOByService(ddo, "nft721-sales").getTotalPrice() /
    10 ** decimals;

  const symbol = token !== null ? await token.symbol() : "ETH";

  console.log(
    chalk.dim(`Price ${chalk.whiteBright(price)} ${chalk.whiteBright(symbol)}`)
  );

  console.log(chalk.dim(`Transferring NFT '${chalk.whiteBright(ddo.id)}' ...`));
  await nvm.nfts.transfer721(
    agreementId,
    ddo.id,
    sellerAccount
  );

  console.log(chalk.dim("Releasing rewards ..."));
  await nvm.nfts.release721Rewards(agreementId, ddo.id, sellerAccount);

  console.log(chalk.dim("Transfer done!"));
  return StatusCodes.OK;
};
