export enum DeployTypes {
  Mint = 'MINT',
  Transfer = 'TRANSFER'
};

export interface IPendingDeploy {
  hash: string;
  type: DeployTypes;
}

export enum DeployStatus {
  Pending = 'PENDING',
  Failed = 'FAILED',
  Completed = 'COMPLETED'
}

export enum KeyPairStatus {
  New = 'New',
  PendingDeploy = 'PENDING_DEPLOY',
  Funded = 'FUNDED',
  Assigned = 'ASSIGNED'
}

export enum ReedemStatus {
  MissingFields = "MISSING_FIELDS",
  WrongCode = "REEDEM_WRONG_CODE",
  Ready = "REEDEM_READY",
  ReadyExistingUser = "REEDEM_READY_EXISTING_USER",
  Used = "REEDEM_ALREADY_REEDEMED",
  InProgress = "REEDEM_IN_PROGRESS",
  Failed = "REEDEM_FAILED"
}

export interface NFTMetaData {
  name: string;
  description: string;
  organization: string;
  contentHash: string;
  url: string;
  event: string;
}

export enum SubmissionType {
  Photo = "Photo NFT",
  Video = "Video NFT"
}


