import {
  Keys,
  decodeBase64,
  DeployUtil,
  CLPublicKey,
} from "casper-js-sdk";

import {
  KEY_VARIANTS,
} from "../constants";

export const getKeysFromHexPrivKey = (
  key: string,
  variant: KEY_VARIANTS
): Keys.AsymmetricKey => {
  const rawPrivKeyBytes = decodeBase64(key);
  let keyPair: Keys.AsymmetricKey;

  if (variant === KEY_VARIANTS.SECP256K1) {
    const privKey = Keys.Secp256K1.parsePrivateKey(rawPrivKeyBytes);
    const pubKey = Keys.Secp256K1.privateToPublicKey(privKey);
    keyPair = new Keys.Secp256K1(pubKey, privKey);
    return keyPair;
  }

  if (variant === KEY_VARIANTS.ED25519) {
    const privKey = Keys.Ed25519.parsePrivateKey(rawPrivKeyBytes);
    const pubKey = Keys.Ed25519.privateToPublicKey(privKey);
    keyPair = Keys.Ed25519.parseKeyPair(pubKey, privKey);
    console.log(`Public key hex: ${keyPair.publicKey.toHex()}`);
    return keyPair;
  }

  throw Error("Unsupported key type");
};

  /**
   * Parse the key pair from a public key file and the corresponding private key file
   * @param {string} publicKeyPath Path of public key file
   * @param {string} privateKeyPath Path of private key file
   * @returns A new `AsymmetricKey`
   */
  // public static parseKeyFiles(
  //   publicKeyPath: string,
  //   privateKeyPath: string
  // ): AsymmetricKey {
  //   const publicKey = Ed25519.parsePublicKeyFile(publicKeyPath);
  //   const privateKey = Ed25519.parsePrivateKeyFile(privateKeyPath);
  //   // nacl expects that the private key will contain both.
  //   return new Ed25519({
  //     publicKey,
  //     secretKey: Buffer.concat([privateKey, publicKey])
  //   });
  // }
// export const USER1_KEYS = Keys.Ed25519.parseKeyFiles(
//   `${USER1_KEY_PAIR_PATH}/public_key.pem`,
//   `${USER1_KEY_PAIR_PATH}/secret_key.pem`
// );

export const makeTransferDeploy = (
  to: CLPublicKey,
  senderKey: Keys.AsymmetricKey,
  amount: string
) => {
  const networkName = process.env.CASPER_CHAIN_NAME!;
  const paymentAmount = 10000000000000;
  const transferAmount = 2500000000;
  const transferId = "3";

  let deployParams = new DeployUtil.DeployParams(
    senderKey.publicKey,
    networkName
  );
  let session = DeployUtil.ExecutableDeployItem.newTransfer(
    transferAmount,
    to,
    undefined,
    transferId
  );
  let payment = DeployUtil.standardPayment(paymentAmount);
  let deploy = DeployUtil.makeDeploy(deployParams, session, payment);
  deploy = DeployUtil.signDeploy(deploy, senderKey);
  return deploy;
};

export const generateKeyPair = () => {
  const naclKeyPair = Keys.Ed25519.new();
  const publicKeyInPem = naclKeyPair.exportPublicKeyInPem();
  const publicKeyInHex = naclKeyPair.accountHex();
  const privateKeyInPem = naclKeyPair.exportPrivateKeyInPem();

  return { publicKeyInPem, publicKeyInHex, privateKeyInPem };
};

