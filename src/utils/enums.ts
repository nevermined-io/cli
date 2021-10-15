import chalk from "chalk";

export enum StatusCodes {
  UNKNOWN = -999,
  ERROR = -1,
  OK = 0,
  FAILED_TO_CONNECT,
  MINTER_NOT_OWNER,
  ADDRESS_NOT_AN_ACCOUNT,
  NFT_ALREADY_OWNED,
  INCONCLUSIVE,
  SELLER_NOT_OWNER,
  HOLDER_NOT_OWNER,
}

export const Constants = {
  ZeroAddress: "0x0000000000000000000000000000000000000000",
  ETHDecimals: 18,
};
