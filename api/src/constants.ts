export const FUND_ACCOUNT_SIZE = parseInt(
  process.env.CASPER_FUND_ACCOUNTS_SIZE!
);

export const CASPER_CHAIN_NAME = process.env.CASPER_CHAIN_NAME!;
export const CASPER_NODE_ADDRESS = process.env.CASPER_NODE_ADDRESS!;
//export const CASPER_EVENT_STREAM_ADDRESS = process.env.CASPER_EVENT_STREAM_ADDRESS!;
export const CASPER_EVENT_STREAM_ADDRESS = "http://135.181.165.233:9999/events/";
export const CASPER_CONTRACT_HASH = process.env.CASPER_CONTRACT_HASH!;
export const CASPER_PRIVATE_KEY = "MC4CAQAwBQYDK2VwBCIEIKwGNrhLkTx9w+7lVYk5wMghJl6hyYxrl/By4g2PlSf+" //process.env.CASPER_PRIVATE_KEY!;
export const CASPER_PRIVATE_KEY_VARIANT = process.env.CASPER_PRIVATE_KEY_VARIANT!;

export enum KEY_VARIANTS {
  ED25519,
  SECP256K1,
}

export const EXTENSION_BY_SUBMIT_TYPE = {
  'Video NFT': 'mp4',
  'Photo NFT': 'jpg'
};

