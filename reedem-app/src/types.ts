export type FormData = {
  fullName: string;
  description: string;
  organization: string;
  email: string;
};

export type FormComponentProps = FormData & {
  setForm: (
    key: string
  ) => (value: string) => void;
};

export type SelfieEntity = {
  id: string;
  img: string;
} & FormData;

export enum SubmissionType {
  Photo = "Photo NFT",
  Video = "Video NFT"
}
