import {
  Keys,
  DeployUtil,
  CLPublicKey,
  decodeBase64,
  EventStream,
  EventName,
} from "casper-js-sdk";

import {
  CEP47Client,
  CEP47Events,
  CEP47EventParser,
} from "casper-cep47-js-client";

import { KeyPair, Deploy } from "./db";

import {
  FUND_ACCOUNT_SIZE,
  CASPER_CHAIN_NAME,
  CASPER_NODE_ADDRESS,
  CASPER_EVENT_STREAM_ADDRESS,
  CASPER_CONTRACT_HASH,
  CASPER_PRIVATE_KEY,
  CASPER_PRIVATE_KEY_VARIANT,
  KEY_VARIANTS,
} from "./constants";

import {
  IPendingDeploy,
  DeployTypes,
  DeployStatus,
  KeyPairStatus,
  NFTMetaData,
} from "./types";

import {
  makeTransferDeploy,
  getKeysFromHexPrivKey,
  generateKeyPair,
} from "./utils/casper";

console.log( CASPER_PRIVATE_KEY);
const hostKeys = getKeysFromHexPrivKey(
  CASPER_PRIVATE_KEY,
  KEY_VARIANTS.ED25519
);

export class CasperService {
  pendingDeploys: IPendingDeploy[] = [];
  eventStream: EventStream;
  contractClient: CEP47Client;

  constructor() {
    this.bootstrapPendingDeploys();
    this.bootstrapAccounts();

    this.contractClient = new CEP47Client(
      CASPER_NODE_ADDRESS,
      CASPER_CHAIN_NAME
    );
    console.log ("hash-d6d8b876d8b51680db08c51bf4a9b5ebe2042d874099d9cfba5b398f477a221");
    this.contractClient.setContractHash("hash-d6d8b876d8b51680db08c51bf4a9b5ebe2042d874099d9cfba5b398f477a221");
    this.eventStream = new EventStream(CASPER_EVENT_STREAM_ADDRESS);


    this.startListeningEE();
  }

  async bootstrapPendingDeploys() {
    const pendingFromDB = await Deploy.find({
      status: DeployStatus.Pending,
    }).exec();

    this.pendingDeploys = pendingFromDB.map((d: IPendingDeploy) => ({
      type: d.type,
      hash: d.hash,
    }));
  }

  startListeningEE() {
    this.eventStream.subscribe(EventName.DeployProcessed, async (event) => {
      const { deploy_hash, execution_result } = event.body.DeployProcessed;

      const foundDeploy = this.pendingDeploys.find(
        (d) => d.hash === deploy_hash
      );

      if (foundDeploy) {
        this.pendingDeploys = this.pendingDeploys.filter(
          (d) => d.hash !== deploy_hash
        );
        const deployInDB = await Deploy.findOne({ hash: deploy_hash });
        if (!deployInDB) throw Error("No Deploy found!");
        if (execution_result.Success) {
          deployInDB.status = DeployStatus.Completed;
        } else {
          deployInDB.status = DeployStatus.Failed;
        }
        deployInDB.save();

      }
    });

    this.eventStream.start();
  }

  async getFundedAccount() {
    const readyToUse = await KeyPair.findOne({
      status: KeyPairStatus.Funded,
    });

    if (readyToUse) {
      readyToUse.status = KeyPairStatus.Assigned;
      await readyToUse.save();
      this.bootstrapAccounts();
      return readyToUse;
    }
  }

  async bootstrapAccounts() {
    const readyToUse = await KeyPair.find({
      $or: [
        { status: KeyPairStatus.Funded },
        { status: KeyPairStatus.PendingDeploy },
      ],
    }).exec();

    if (readyToUse.length < FUND_ACCOUNT_SIZE) {
      for (let i = readyToUse.length; i < FUND_ACCOUNT_SIZE; i++) {
        const { publicKeyInPem, publicKeyInHex, privateKeyInPem } =
          generateKeyPair();

        const transferDeploy = makeTransferDeploy(
          CLPublicKey.fromHex(publicKeyInHex),
          hostKeys,
          "5000000000"
        );

        const deployHash = await transferDeploy.send(CASPER_NODE_ADDRESS);

        console.log("Sent transfer deploy: ", deployHash);

        this.pendingDeploys = [
          ...this.pendingDeploys,
          { hash: deployHash, type: DeployTypes.Transfer },
        ];

        const deploy = new Deploy({
          hash: deployHash,
          status: DeployStatus.Pending,
          type: DeployTypes.Transfer,
        });

        await deploy.save();

        const keyPair = new KeyPair({
          publicKeyInPem,
          publicKeyInHex,
          privateKeyInPem,
          deploys: [deploy],
          status: KeyPairStatus.PendingDeploy,
        });

        keyPair.save();
      }
    }
  }

  async mintToken(id: number, metadata: NFTMetaData, recipient: string) {
    const recipientPK = CLPublicKey.fromHex(recipient);
    const deploy = await this.contractClient.mint(
      recipientPK,
      [`${id}`],
      [new Map(Object.entries(metadata))],
      "2000000000",
      hostKeys.publicKey,
      [hostKeys]
    );

    try {
      const hash = await deploy.send(CASPER_NODE_ADDRESS);
      this.pendingDeploys = [
        ...this.pendingDeploys,
        { hash, type: DeployTypes.Mint },
      ];
      const deployInDB = new Deploy({
        hash: hash,
        status: DeployStatus.Pending,
        type: DeployTypes.Mint,
      });
      await deployInDB.save();

      return { hash, deployInDB };
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
