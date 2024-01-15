# Testing CLI connected to GNOSIS network

We are gonna use this asset as reference:


## Ordering the asset

```bash

$ yarn dev -n appGnosis nfts1155 order did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195
yarn run v1.22.17
$ ts-node src/index.ts -n appGnosis nfts1155 order did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195
Ordering DID: 'did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195'!
Buyer: '0x824dbcE5E9C96C5b8ce2A35a25a5ab87eD1D00b1'
Price: 0.0 USDC
Purchase associated to NFT Contract: '0xa30DE8C6aC39B825192e5F1FADe0770332D279A8'
Creating nft-sales agreement and paying
NFT Agreement Created: 0xc8782d13bfb3ec4cf68bdea10eb75ac5f5f1a38b5284acccb7387b381cd14c4b for DID: did:nv:416e35cb209ecbfbf23e1192557b06e94c5d9a9afb025cce2e9baff23e907195 
Done in 20.29s.


```