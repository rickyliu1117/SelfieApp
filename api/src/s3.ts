import AWS from "aws-sdk";

export const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

export const convertBase64ToBuffer = (str: string) => 
  Buffer.from(
    str.split(";base64,")[1],
    "base64"
  );
