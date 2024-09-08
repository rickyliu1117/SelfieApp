import React, { useEffect, useState } from "react";
import { useBooleanState, usePrevious } from "webrix/hooks";
import { saveAs } from "file-saver";

import Button from "./components/Button";
import { API_URL, BLOCK_EXPLORER_URL } from "./constants";
import { SubmissionType } from "./types";
import { StepHeader } from "./components/common";

import "./App.css";

const Header = () => (
  <div className="md:flex md:items-center md:justify-center h-30 p-4">
    <img src="/casperpartyunderthebigtop.svg" alt="Logo" />
  </div>
);

const MediaContent = ({ value }: any) => {
  if (value.submitType === SubmissionType.Photo) { 
    return <img src={value.content} />
  }
  if (value.submitType === SubmissionType.Video) {
    return <video src={value.content} autoPlay loop controls />
  }
  return null;
};

const Summary = ({
  name,
  description,
  organization,
  email,
  image,
  date,
  deployHash,
  onClose,
  submitType
}: any
) => {
  const BiggerText = ({ children }: { children: string }) => (
    <h2 className="text-2xl p-0 m-0 font-bold">{children}</h2>
  );
  const Subtitle = ({ children }: { children: string }) => (
    <h2 className="text-sm p-0 m-0 pb-2">{children}</h2>
  );

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 w-full p-4">
            <MediaContent value={{content: image, submitType: submitType}} />
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center">
            <BiggerText>{name}</BiggerText>
            <Subtitle>Name</Subtitle>

            {description && 
              <>
                <BiggerText>{description}</BiggerText>
                <Subtitle>Bio</Subtitle>
              </>
            }

            {organization && 
              <>
                <BiggerText>{organization}</BiggerText>
                <Subtitle>Organization</Subtitle>
              </>
            }

            <>
              <BiggerText>at the Web3 Summit</BiggerText>
              <Subtitle>Event</Subtitle>
            </>

            <>
              <BiggerText>Hong Kong, China</BiggerText>
              <Subtitle>Location</Subtitle>
            </>

            <BiggerText>{date.split('T')[0]}</BiggerText>
            <Subtitle>Date</Subtitle>
          </div>
        </div>
        <div className="flex m-4">
          <a target="_blank" href={`${BLOCK_EXPLORER_URL}/deploy/${deployHash}`} rel="noreferrer">
            <Button onClick={() => {}}>
                Show on testnet.cspr.live
            </Button>
          </a>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

const MintedScreen = ({ value }: { value: any }) => {
  const [nftView, setNFTView] = useState(false);
  if (nftView) {
    return (
      <Summary name={value.foundSubmission.name} description={value.foundSubmission.description} organization={value.foundSubmission.organization} email={value.foundSubmission.email} image={value.foundSubmission.url} date={value.foundSubmission.createdAt} deployHash={value.deploy.hash} submitType={value.foundSubmission.submitType} onClose={() => setNFTView(false)} />
    );
  }

  return (
    <div className="flex flex-col max-w-lg text-center">
      <StepHeader>Mint complete!</StepHeader>
      <p>
        Your NFT Selfie now minted and in your full possession at your address
        on the blockchain.
      </p>
      <br />
      <p>
        Make sure you save the key file you downloaded in a safe place for
        future access.
      </p>
      <br />
      <p>
        Thanks for joining us at 2024 Web3 Summit!
      </p>
      <br />
      <div className="m-4">
        <Button onClick={() => setNFTView(true)}>Show NFT</Button>
      </div>
    </div>
  );
};

const MintingScreen = ({ refresh, deployHash }: any) => {
  useEffect(() => {
    const interval = setInterval(() => refresh(), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center center">
      <p>Your NFT Selfie is minting on the Casper blockchain.</p>
      <br />
      <div className="flex items-center justify-center">
        <img className="rotating" src="./logo-spinner.png" />
      </div>
      <br />
      <p>
        Check your deploy at:{" "}
        <a
          className="underline"
          target="_blank"
          href={`${BLOCK_EXPLORER_URL}/deploy/${deployHash}`} rel="noreferrer"
        >
          testnet.cspr.live
        </a>
      </p>
      <br />
      <p>
        Do not close out of this window.
        <br /> This will only take a minute.
      </p>
      <br />
      <p>You will be redirected once this process is complete.</p>
    </div>
  );
};

const StatusScreen = () => {
  const [isOK, setOK] = useState(false);
  const [status, setStatus] = useState(null);
  const [value, setValue] = useState<any>(null);

  const search = window.location.search;
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const email = params.get("email");

  const fetchStatus = () => {
    fetch(`${API_URL}/reedem?code=${encodeURIComponent(code!)}&email=${encodeURIComponent(email!)}`)
      .then((res) => res.json())
      .then((data) => {
        const { ok, status, value } = data;
        console.log(ok, status, value);
        setOK(ok);
        setStatus(status);
        setValue(value);
      });
  };


  useEffect(() => {
    fetchStatus();
  }, []);

  const mintNFT = () => {
    console.log( "api_url:", API_URL);
    fetch(`${API_URL}/reedem?code=${encodeURIComponent(code!)}&email=${encodeURIComponent(email!)}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        const { ok, value } = data;
        if (ok && value.privateKeyInPem !== null ) {
          const blob = new Blob([value.privateKeyInPem], {
            type: "text/plain;charset=utf-8",
          });
          saveAs(blob, "secret_key.pem");
        }
        fetchStatus();
      });
  };

  const renderInside = () => {
    if (status === "REEDEM_WRONG_CODE") {
      return <StepHeader>Wrong URL</StepHeader>;
    }
    if (status === "REEDEM_ALREADY_REEDEMED")
      return <MintedScreen value={value} />;
    if (status === "REEDEM_IN_PROGRESS")
      return <MintingScreen deployHash={value!.hash} refresh={fetchStatus} />;
    if (status === "REEDEM_READY" || status === "REEDEM_READY_EXISTING_USER" || status === "REEDEM_FAILED") {
      const existingUser = status === "REEDEM_READY_EXISTING_USER";
      return (
        <div className="flex flex-col items-center justify-center">
          <StepHeader>Your NFT is ready to mint!</StepHeader>
          <p className="text-lg m-0 p-0 pb-4">
            Take one final look before minting.
          </p>
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 w-full p-4">
              <MediaContent value={value} />
            </div>
            {!existingUser && (
              <div className="flex-1 p-4 flex flex-col justify-center">
                <div className="max-w-lg">
                  <p>
                    We've generated your private key file for you to download. It’s important
                    that you keep your secret key file in a safe place—do not lose
                    it!
                  </p>
                  <br />
                  <p>Your email address: {value!.email}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex m-4">
            <Button onClick={mintNFT}>Mint my NFT</Button>
          </div>
          <div>
            <p>
              Once you click mint, { existingUser ? "you will start the NFT minting process" : "your private key will be downloaded to your device" }.
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-column min-h-screen justify-center items-center">
      <div className="p-3">{renderInside()}</div>
    </div>
  );
  if (status === null) return null;
};

const App = () => {
  return (
    <div className="flex flex-col">
      <div
        className="min-h-screen flex-1 bg-cover mt-30"
        style={{ backgroundImage: "url(/casper-bg.png)" }}
      >
        <Header />
        <StatusScreen />
      </div>
    </div>
  );
};

export default App;
