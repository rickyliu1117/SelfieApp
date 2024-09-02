export type FormData = {
  name: string;
  description: string;
  organization: string;
  email: string;
  submitType: SubmissionType;
};

export type FormComponentProps = FormData & {
  setForm: (
    key: string
  ) => (value: string) => void;
};

export type SelfieEntity = {
  contentHash: string;
  content: string;
} & FormData;

export enum SubmissionType {
  Photo = "Photo NFT",
  Video = "Video NFT"
}
