import mongoose, { Schema, Types, model, ObjectId } from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

import { DeployStatus, DeployTypes, KeyPairStatus, SubmissionType } from "./types";
import { EXTENSION_BY_SUBMIT_TYPE } from "./constants";

import { createSuccessMessage, sendEmail } from "./mailer";

import { s3, convertBase64ToBuffer } from "./s3";

const AutoIncrement = AutoIncrementFactory(mongoose as any);

const DB_USER = encodeURIComponent(process.env["MONGO_INITDB_ROOT_USERNAME"]!);
const DB_PASSWORD = encodeURIComponent(
  process.env["MONGO_INITDB_ROOT_PASSWORD"]!
);
const DB_URL = process.env["MONGO_CLUSTER_URL"];
//const DB_URI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_URL}?w=majority&retryWrites=false`;
const DB_URI = `mongodb://127.0.0.1:27017/content?w=majority&retryWrites=false`;
const DB_NAME = process.env.MONGO_INITDB_DATABASE;

export interface IDeploy {
  hash: string;
  status: DeployStatus;
  type: DeployTypes;
}

const DeploySchema = new Schema<IDeploy>(
  {
    hash: { type: String, required: true },
    status: { type: String, enum: DeployStatus, required: true },
    type: { type: String, enum: DeployTypes, required: true },
  },
  { timestamps: true }
);

DeploySchema.post("save", async (doc) => {
  if (doc.status === DeployStatus.Completed) {
    if (doc.type === DeployTypes.Transfer) {
      const keyPair = await KeyPair.findOne({ deploys: doc._id });
      if (!keyPair) throw Error("Missing referenced key pair");
      keyPair.status = KeyPairStatus.Funded;
      keyPair.save();
    }
    if (doc.type === DeployTypes.Mint) {
      const submission = await Submission.findOne({ deploys: doc._id });
      if (!submission) throw Error("Missing submission like this one.");

      // const buf = convertBase64ToBuffer(submission.content);
      const fileName = `${submission.contentHash}.${EXTENSION_BY_SUBMIT_TYPE[submission.submitType]}`;

      // const uploaded = await s3
      //   .copyObject({
      //     Bucket: process.env.AWS_BUCKET_NAME!,
      //     CopySource: `${process.env.AWS_BUCKET_NAME}/submited/${fileName}`,
      //     Key: `nft/${fileName}`
      //   })
      //   .promise();

      // await s3.deleteObject({
      //   Bucket: process.env.AWS_BUCKET_NAME!,
      //   Key: `submited/${fileName}`,
      // }).promise();

      sendEmail(
        createSuccessMessage(
          `Your NFT Selfie <${process.env.SMTP_FROM}>`,
          submission.email,
          submission.name,
          submission.code,
          doc.hash
        )
      );
    }
  }
});

export const Deploy = model<IDeploy>("Deploy", DeploySchema);

interface ISubmission {
  id: number;
  contentHash: string;
  url: string;
  email: string;
  code: string;
  name: string;
  description: string;
  organization?: string;
  content: string;
  submitType: SubmissionType,
  deploys: ObjectId[];
  assignedKeyPair: ObjectId;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    contentHash: { type: String, required: true },
    email: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String },
    organization: { type: String },
    content: { type: String, required: true },
    submitType: { type: String, enum: SubmissionType, default: SubmissionType.Photo },
    deploys: [{ type: Schema.Types.ObjectId, ref: "Deploy" }],
    assignedKeyPair: { type: Schema.Types.ObjectId, ref: "KeyPair" },
  },
  { timestamps: true }
);

SubmissionSchema.plugin(AutoIncrement as any, { inc_field: "id" });

export const Submission = model<ISubmission>("Submission", SubmissionSchema);

export interface IKeyPair {
  privateKeyInPem: string;
  publicKeyInHex: string;
  publicKeyInPem: string;
  deploys: ObjectId[];
  status: KeyPairStatus;
}

const KeyPairSchema = new Schema<IKeyPair>(
  {
    privateKeyInPem: String,
    publicKeyInHex: String,
    publicKeyInPem: String,
    deploys: [{ type: Schema.Types.ObjectId, ref: "Deploy" }],
    status: { type: String, enum: KeyPairStatus, required: true },
  },
  { timestamps: true }
);

export const KeyPair = model<IKeyPair>("KeyPair", KeyPairSchema);

export const runDB = async () => {
  const connection = await mongoose.connect(DB_URI);

  if (connection) {
    console.log(`Mongoose connected.`);
  }

  const db = mongoose.connection;

  return db;
};
