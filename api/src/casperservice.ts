import {
  Keys,
  DeployUtil,
  CLPublicKey,
  decodeBase64,
  EventStream,
  EventName,
  Contracts,
  RuntimeArgs,
  CLValueBuilder,
  CLString,
  CLKeyParameters,
  CLKey,
  CasperServiceByJsonRPC,
} from "casper-js-sdk";

import {
  CEP78Client,
} from "casper-cep78-js-client";

import { KeyPair, Deploy } from "./db";

import {
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


const FUND_ACCOUNT_SIZE = 1;


const hostKeys = getKeysFromHexPrivKey(
  CASPER_PRIVATE_KEY,
  KEY_VARIANTS.ED25519
);


export class CasperService {
  pendingDeploys: IPendingDeploy[] = [];
  eventStream: EventStream;
  cep78Client: CEP78Client;

  constructor() {
    this.bootstrapPendingDeploys();
    this.bootstrapAccounts();

    this.cep78Client = new CEP78Client(process.env.CASPER_NODE_ADDRESS!, process.env.CASPER_CHAIN_NAME!);
    this.cep78Client.setContractHash(process.env.CASPER_CONTRACT_HASH!);
    this.eventStream = new EventStream(process.env.CASPER_EVENT_STREAM_ADDRESS!);

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
      console.log("event processed", deploy_hash);

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
  
  async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

        const deployHash = await transferDeploy.send(process.env.CASPER_NODE_ADDRESS!);

        console.log("Sent transfer deploy: ", deployHash);

        await this.sleep(1000);

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
    console.log("recipientPK: ", recipientPK);
    console.log("value id: ", id);
    console.log("metadata: ", metadata);
    console.log('hostkeys.publickey: ', hostKeys.publicKey);
    const runtimeArguments = RuntimeArgs.fromMap({ message: CLValueBuilder.string("Hello World") });

    const mintArgs = {
      owner: recipientPK,
      // meta: {
      //   contentHash: '6d6b4b2e04f161d73003da81d15f0b88614578edc9d8e4d43ec846b086c401be',
      //   name: 'Micky',
      //   url: 'https://aws.amazon.com/nft/6d6b4b2e04f161d73003da81d15f0b88614578edc9d8e4d43ec846b086c401be.jpg',
      //   description: 'Micky',
      //   organization: 'Company',
      //   event: '2024 Web3 Summit'
      //   },
      // };

      meta: {
        name: 'Micky',
        token_uri: 'https://aws.amazon.com/nft/6d6b4b2e04f161d73003da81d15f0b88614578edc9d8e4d43ec846b086c401be.jpg',
        checksum: "940bffb3f2bba35f84313aa26da09ece3ad47045c6a1292c2bbd2df4ab1a55fb",
      },
    };

    const runtimeArgs = RuntimeArgs.fromMap({
      token_owner: CLValueBuilder.key(mintArgs.owner),
      token_meta_data: CLValueBuilder.string(JSON.stringify(mintArgs.meta)),
    });

    const useSessionCode = false;

    const mintDeploy = this.cep78Client.mint(
      {
        owner: recipientPK,
        meta: {
          contentHash: '6d6b4b2e04f161d73003da81d15f0b88614578edc9d8e4d43ec846b086c401be',
          name: 'Micky',
          url: 'https://aws.amazon.com/nft/6d6b4b2e04f161d73003da81d15f0b88614578edc9d8e4d43ec846b086c401be.jpg',
          description: 'Micky',
          organization: 'Company',
          event: '2024 Web3 Summit'
        },
        // meta: {
        //   name: 'Micky',
        //   token_uri: 'https://aws.amazon.com/nft/6d6b4b2e04f161d73003da81d15f0b88614578edc9d8e4d43ec846b086c401be.jpg',
        //   checksum: "940bffb3f2bba35f84313aa26da09ece3ad47045c6a1292c2bbd2df4ab1a55fb",
        //   },
      },
      { useSessionCode },
      "5000000000", // 1 CSPR (10^9 Motes)
      hostKeys.publicKey,
      [hostKeys],
    )

    try {
      const hash = await mintDeploy.send(process.env.CASPER_NODE_ADDRESS!);
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
