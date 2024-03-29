export enum StatusCodes {
  OK = 0,
  ERROR,
  FAILED_TO_CONNECT,
  MINTER_NOT_OWNER,
  ADDRESS_NOT_AN_ACCOUNT,
  NFT_ALREADY_OWNED,
  INCONCLUSIVE,
  SELLER_NOT_OWNER,
  HOLDER_NOT_OWNER,
  DID_NOT_FOUND,
  NOT_IMPLEMENTED,
  UNKNOWN = 999
}

export const Constants = {
  ZeroAddress: '0x0000000000000000000000000000000000000000',
  ShortZeroAddress: '0x0',
  ETHDecimals: 18
}

export const ProvenanceMethods = [
  'wasGeneratedBy',
  'used',
  'wasDerivedFrom',
  'wasAssociatedWith',
  'ActedOnBehalf'
]
