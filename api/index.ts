import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Document } from "mongoose";
import blake from "blakejs";

import { runDB, Submission, IDeploy, IKeyPair } from "./src/db";
import { createMessage, sendEmail } from "./src/mailer";
import { guidGenerator } from "./src/utils";
import { CasperService } from "./src/casperservice";
import { ReedemStatus, DeployStatus, SubmissionType } from "./src/types";
//import { s3, convertBase64ToBuffer } from "./src/s3";
import { EXTENSION_BY_SUBMIT_TYPE } from "./src/constants";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;


app.use(express.urlencoded()); //Parse URL-encoded bodies
app.use(express.json({ limit: "5mb" })); //Parse URL-encoded bodies

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

enum FILTER_LIST {
  beauty = "filter=beauty&options=percent:45%", 
  dreaming = "filter=dreaming&options=percent:40%", 
  fairy = "filter=fairy&options=percent:50%", 
  floating = "filter=floating&options=percent:50%", 
  illusion = "filter=illusion&options=percent:50%", 
  kandinsky = "filter=kandinsky&options=percent:40%", 
  landscape = "filter=landscape&options=percent:50%", 
  picasso = "filter=picasso&options=percent:75%", 
  vangogh = "filter=vangogh&options=percent:70%"
};

// TODO: Move somewhere to utils
const processURL = (photoUrl: string, filter: string ) => {
  const index = Object.keys(FILTER_LIST).indexOf(filter);
  return `${process.env
    .RAPID_API_URL!}?url=${photoUrl}&${Object.values(FILTER_LIST)[index]}`
}

const run = async () => {
  await runDB();

  const casperService = new CasperService();

 /**
 * @api {post} content Create a new Content
 * @apiVersion 0.3.0
 * @apiName PostContent
 * @apiPermission none
 *
 * @apiDescription In this case "apiErrorStructure" is defined and used.
 * Define blocks with params that will be used in several functions, so you dont have to rewrite them.
 *
 * @apiBody {String} name Name of the Conent
 * @apiBody {String} description Description of the User
 * @apiBody {String} extraInfo.nickname Nickname of the user
 * @apiBody {Boolean} extraInfo.isVegan=true Is the user vegan? (boolean with default)
 * @apiBody {Boolean} extraInfo.isAlive Is the user alive? (boolean with no default)
 * @apiBody {String} extraInfo.secrets.crush The user secret crush
 * @apiBody {Number} extraInfo.secrets.hair=1000 Number of hair of user
 *
 * @apiSuccess {Number} id         The new Users-ID.
 *
 * @apiUse CreateUserError
 */ 

  app.post("/content", async (req: Request, res: Response) => {
    const { name, description, organization, email, contentHash, content, submitType } =
      req.body;

    // const uploaded = await s3
    //   .upload({
    //     Bucket: process.env.AWS_BUCKET_NAME!,
    //     Key: `submited/${contentHash}.${EXTENSION_BY_SUBMIT_TYPE[submitType as SubmissionType]}`,
    //     ContentEncoding: "base64",
    //     Body: convertBase64ToBuffer(content),
    //   })
    //   .promise();

    const code = guidGenerator();

    const submission = new Submission({
      contentHash,
      email,
      code,
      name,
      url: `${process.env.S3_URL}/nft/${contentHash}.${EXTENSION_BY_SUBMIT_TYPE[submitType as SubmissionType]}`,
      description,
      organization,
      content: `${process.env.S3_URL}/submited/${contentHash}.${EXTENSION_BY_SUBMIT_TYPE[submitType as SubmissionType]}`,
      submitType,
    });

    submission.save();

    sendEmail(
      createMessage(
        `Casper NFT Selfie <${process.env.SMTP_FROM}>`,
        email,
        name,
        code
      )
    );

    return res.json({ ok: true });
  });

  const validateReedem = async (
    code: string,
    email: string
  ): Promise<{
    ok: boolean;
    status: ReedemStatus;
    value: any;
  }> => {
    if (!code || !email) {
      return { ok: false, status: ReedemStatus.MissingFields, value: null };
    }

    const foundSubmission = await Submission.findOne({
      code,
      email,
      value: null,
    });

    if (!foundSubmission) {
      return { ok: false, status: ReedemStatus.WrongCode, value: null };
    }

    if (foundSubmission) {
      const populated = await foundSubmission.populate<{ deploys: IDeploy[] }>(
        "deploys"
      );

      const pendingDeploy = (populated.deploys as IDeploy[]).find(
        (d) => d.status === DeployStatus.Pending
      );

      const successfullDeploy = (populated.deploys as IDeploy[]).find(
        (d) => d.status === DeployStatus.Completed
      );

      if (successfullDeploy) {
        return {
          ok: false,
          status: ReedemStatus.Used,
          value: { deploy: successfullDeploy, foundSubmission },
        };
      }

      if (pendingDeploy) {
        return {
          ok: false,
          status: ReedemStatus.InProgress,
          value: pendingDeploy,
        };
      }
    }

    const alreadyOwnNFT = await Submission.find({
      email,
      assignedKeyPair: { $ne: null },
    });

    return {
      ok: true,
      status:
        alreadyOwnNFT.length > 0
          ? ReedemStatus.ReadyExistingUser
          : ReedemStatus.Ready,
      value: foundSubmission,
    };
  };

  app.get("/reedem", async (req: Request, res: Response) => {
    const { code, email } = req.query;
    const { ok, status, value } = await validateReedem(
      code as string,
      email as string
    );

    return res.json({ ok, status, value });
  });

  app.post("/reedem", async (req: Request, res: Response) => {
    const { code, email } = req.query;
    const { ok, status, value } = await validateReedem(
      code as string,
      email as string
    );

    if (!ok) {
      return res.json({ ok, status });
    }

    const existingUser = await Submission.findOne({
      email,
      assignedKeyPair: { $ne: null },
    });

    console.log( "code = %s, email = %s", code, email);
   // console.log( "assignedKeyPair: 111111111, assignedKeyPair", existingUser);
    if (existingUser) {
     // console.log( "assignedKeyPair: 2222222222, assignedKeyPair");
      const populatedKeyPair = await existingUser.populate<{
        assignedKeyPair: IKeyPair;
      }>("assignedKeyPair");

      console.log( "assignedKeyPair: 33333333333, assignedKeyPair");
      const sentDeploy = await casperService.mintToken(
        value.id,
        {
          contentHash: value.contentHash,
          name: value.name,
          url: value.url,
          description: value.description,
          organization: value.organization,
          event: '2024 Web3 Summit'
        },
        populatedKeyPair.assignedKeyPair.publicKeyInHex
      );

      value.assignedKeyPair = populatedKeyPair.assignedKeyPair;
      if (sentDeploy) {
        value.deploys.push(sentDeploy.deployInDB);
        value.save();
        return res.json({
          ok: true,
          value: { privateKeyInPem: null, hash: sentDeploy.hash },
        });
      }
    }

    console.log( "assignedKeyPair: 4444444444444, assignedKeyPair");
    const fundedAccount = await casperService.getFundedAccount();
    if (fundedAccount && value) {
      console.log( "assignedKeyPair: 555555555555, assignedKeyPair");
      const { privateKeyInPem } = fundedAccount;
      const sentDeploy = await casperService.mintToken(
        value.id,
        {
          contentHash: value.contentHash,
          name: value.name,
          url: value.url,
          description: value.description,
          organization: value.organization,
          event: '2024 Web3 Summit'
        },
        fundedAccount.publicKeyInHex
      );
      value.assignedKeyPair = fundedAccount;
      if (sentDeploy) {
        value.deploys.push(sentDeploy.deployInDB);
        value.save();
        res.json({
          ok: true,
          value: { privateKeyInPem, hash: sentDeploy.hash },
        });
      }
    }
  });

  app.post("/process-image", async (req: Request, res: Response) => {
    const { code, email } = req.query;
    const { image, filter } = req.body;

    const imageHash = blake.blake2bHex(image, undefined, 32);

    let isFileExisting: boolean;
    let s3FileURL: string;

    const filePath = `raw/${imageHash}.jpg`;

    const s3ReqParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: filePath,
    };

    try {
      const existingFile = await s3.headObject(s3ReqParams).promise();
      s3FileURL = `${process.env.S3_URL}/${filePath}`;
    } catch {
      const buf = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      // const uploaded = await s3
      //   .upload({
      //     Bucket: process.env.AWS_BUCKET_NAME!,
      //     Key: `raw/${imageHash}.jpg`,
      //     ContentEncoding: "base64",
      //     Body: buf,
      //     ContentType: "image/jpeg",
      //   })
      //   .promise();
       s3FileURL = `${process.env.S3_URL}/${filePath}`;
    }

    if (s3FileURL) {
      const apiResponse = await fetch(processURL(s3FileURL, filter), {
        method: "GET",
        headers: {
          "X-RapidAPI-Host": process.env.RAPID_API_HOST!,
          "X-RapidAPI-Key": process.env.RAPID_API_KEY!,
        },
      });
      if (apiResponse.ok) {
        const parsed = await apiResponse.json();
        if (parsed.result.length > 0) {
          const imgResponse = await fetch(parsed.result[0].url);
          if (imgResponse.ok) {
            const blob = await imgResponse.arrayBuffer();
            const base64 = `data:${imgResponse.headers.get(
              "content-type"
            )};base64,${Buffer.from(blob).toString("base64")}`;
            return res.json({ ok: true, image: base64 });
          }
        }
      }
    }

    // TODO: Add better error messages.
    return res.json({ ok: false, image: null });
  });

  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
  });
};

run();
