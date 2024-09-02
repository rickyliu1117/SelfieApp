import React from "react";

import Button from "../components/Button";
import { StepHeader } from "../components/common";
import { FormData, SubmissionType } from "../types";

const Summary = ({
  name,
  description,
  organization,
  email,
  submitType,
  onSubmit,
  image,
}: FormData & {
  onSubmit: () => void;
  image: string;
}) => {
  const BiggerText = ({ children }: { children: string }) => (
    <h2 className="text-2xl p-0 m-0 font-bold">{children}</h2>
  );
  const Subtitle = ({ children }: { children: string }) => (
    <h2 className="text-sm p-0 m-0 pb-2">{children}</h2>
  );

  const type = image.split(";")[0].replace("data:", "");

  const renderContent = () => {
    if (submitType === SubmissionType.Photo) { 
      return <img src={image} />
    }
    if (submitType === SubmissionType.Video) {
      return <video src={image} autoPlay loop controls />
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <StepHeader>Time to claim your NFT!</StepHeader>
        <p className="text-lg m-0 p-0 pb-4">Take one final look to make sure your details are correct.</p>
        <div className="flex">
          <div className="flex-1 w-full p-4">
            {renderContent()}
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

            <BiggerText>Casper's Party Under the Big Top</BiggerText>
            <Subtitle>Event</Subtitle>

            <BiggerText>Austin, Texas</BiggerText>
            <Subtitle>Location</Subtitle>

            <BiggerText>{new Date().toISOString().split('T')[0]}</BiggerText>
            <Subtitle>Date</Subtitle>
          </div>
        </div>
        <div className="flex m-4">
        <Button onClick={onSubmit}>Claim my NFT</Button>
        </div>
      </div>
    </div>
  );
};

export default Summary;
