import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, REEDEM_URL, BLOCK_EXPLORER_URL } = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: 587,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
});

export const createMessage = (
  from: string,
  to: string,
  recipient: string,
  code: string
) => ({
  from,
  to,
  subject: "Mint your NFT Selfie from Casper!",
  html: `<p>Thanks for joining us at Casper’s Party Under the Big Top… It's time to mint your NFT Selfie!</p>
<p>Please click the link below to open a page with a few simple instructions.</p>
<p>You will need to safely save and store your private key file which we will download to your device during the minting process, as this will allow you to access the unique address where your NFT Selfie will live on the Casper blockchain.</p>

${"https:" + REEDEM_URL + "/?" + "code=" + encodeURIComponent(code) + "&email=" + encodeURIComponent(to)}

<p>If at any time you need help or have questions, you can reach out to support@nftselfie.app for assistance.</p>
<p>- NFT Selfie Team</p>
`,
});

export const createSuccessMessage = (
  from: string,
  to: string,
  recipient: string,
  code: string,
  deployHash: string
) => ({
  from,
  to,
  subject: "Your NFT Selfie is Minted from Casper!",
  html: `<p>Congratulations… Your NFT Selfie is Minted!</p>
${"https:" + REEDEM_URL + "/?" + "code=" + encodeURIComponent(code) + "&email=" + encodeURIComponent(to)}
<p>You can also view your NFT and public key on the cspr.live block explorer:</p>
<p>https:${BLOCK_EXPLORER_URL}/deploy/${deployHash}</p>
<p>Your keys were downloaded to your device when minting the NFT Selfie. Please store the keys and keep them safe. Don't worry... if you lose or misplace your keys, you will be able to recover them.</p>
<p>Thanks for joining us at Casper’s Party Under the Big Top in Austin 2022!</p>
<p>- NFT Selfie Team</p>
`,
});

export const sendEmail = (message: {
  from: string;
  to: string;
  subject: string;
  html: string;
}) => {
  transporter.sendMail(message, function (err, info) {
    if (err) {
      console.log("Error", message, err);
    } else {
      console.log(new Date());
      console.log(`E-mail sent to: ${message.to}`);
      console.log(`*** Log:`);
      console.log(JSON.stringify(info));
    }
  });
};
