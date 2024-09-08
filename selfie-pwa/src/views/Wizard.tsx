import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import blake from "blakejs";

import classNames from "classnames";

import { sendStateAction } from "../redux/appSlice";
import { FormData, FormComponentProps, SubmissionType } from "../types";
import Button from "../components/Button";
import { TC_DOC_URL } from "../constants";

import { StepHeader, Checkbox, MediaContent } from "../components/common";
import Form from "../components/Form";
import Photo from "./Photo";
import Video from "./Video";
import Summary from "./Summary";

const validateEmail = (email: string) =>
  email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);

const StepOne = ({
  name,
  description,
  organization,
  email,
  setForm,
  submitType,
  setSubmitType,
  onSubmit,
}: FormComponentProps & { setSubmitType: (submitType: SubmissionType) => void, onSubmit: () => void }) => {
  const [isChecked, setChecked] = useState(false);

  const validatedEmail = validateEmail(email);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex-1 flex justify-center items-center">
        <div className="max-w-lg w-full p-3">
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              {Object.values(SubmissionType).map((tab) => (
                <a
                  key={tab}
                  onClick={() => setSubmitType(tab)}
                  className={classNames(
                    submitType === tab ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-700',
                    'px-3 py-2 font-medium text-sm rounded-md'
                  )}
                >
                  {tab}
                </a>
              ))}
            </nav>
          </div>
          <Form
            name={name}
            description={description}
            organization={organization}
            email={email}
            setForm={setForm}
            submitType={submitType}
          />

          <Checkbox
            isChecked={isChecked}
            onClick={() => setChecked(!isChecked)}
          >
            <span>
              I understand and agree to the{" "}
              <a
                className="underline"
                href={TC_DOC_URL}
                target="_blank"
                rel="noreferrer"
              >
                Terms & Conditions
              </a>
            </span>
          </Checkbox>
          <div className="my-4">
            <Button
              disabled={
                !isChecked ||
                !email ||
                !validatedEmail ||
                !name ||
                name.length < 2
              }
              onClick={onSubmit}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex justify-center items-center">
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold leading-normal">
            Mint your NFT selfie or video on the blockchain
          </h1>
        </div>
      </div>
    </div>
  );
};

const StepTwo = ({ onSubmit, submitType }: { onSubmit: (image: string) => void, submitType: SubmissionType }) => {
  const renderInside = () => {
    if (submitType === SubmissionType.Photo) {
      return <Photo onSubmit={onSubmit} />
    }
    if (submitType === SubmissionType.Video) {
      return <Video onSubmit={onSubmit} />
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center">
      {renderInside()}
    </div>
  );
};

const Claimed = ({
  submitedImage,
  submitType,
  resetState,
}: {
  submitedImage: string;
  submitType: SubmissionType;
  resetState: () => void;
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <StepHeader>
        <span>
          Congratulations!
          <br />
          You’ve claimed your NFT.
        </span>
      </StepHeader>
      <MediaContent submitType={submitType} data={submitedImage} />
      <div className="max-w-xl flex flex-col items-center text-center">
        <p className="mt-3">
          We’ve successfully paired your email address with your NFT Selfie.
        </p>
        <p>
          Check your inbox soon — you will receive an email to mint your NFT
          Selfie on the blockchain.
        </p>
        <p className="mb-4">
          If you have any questions, you can reach us at support@nftselfie.app.
        </p>
        <Button onClick={resetState}>Start over</Button>
      </div>
    </div>
  );
};

const DEFAULT_FORM = {
  name: "",
  description: "",
  organization: "",
  email: "",
};

const Wizard = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
  });
  const [submitedForm, setSubmitedForm] = useState(false);
  const [submitType, setSubmitType] = useState<SubmissionType>(SubmissionType.Photo);
  const [submitedImage, setSubmitedImage] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  const onSubmit = () => {
    if (!submitedImage) return;
    const contentHash = blake.blake2bHex(submitedImage, undefined, 32);
    console.log(submitedImage);
    dispatch(sendStateAction({ ...form, contentHash, content: submitedImage, submitType }));
    setClaimed(true);
  };

  const resetState = () => {
    setForm({
      ...DEFAULT_FORM,
    });
    setSubmitedForm(false);
    setSubmitedImage(null);
    setClaimed(false);
  };

  if (!submitedForm) {
    return (
      <StepOne
        {...form}
        submitType={submitType}
        setSubmitType={setSubmitType}
        setForm={(key: string) => (value: string) =>
          setForm({ ...form, [key]: value })}
        onSubmit={() => setSubmitedForm(true)}
      />
    );
  }

  if (submitedForm && !submitedImage && !claimed) {
    return <StepTwo onSubmit={(image: string) => setSubmitedImage(image)} submitType={submitType} />;
  }

  if (submitedForm && submitedImage && !claimed) {
    return <Summary {...form} onSubmit={onSubmit} image={submitedImage} submitType={submitType} />;
  }

  if (submitedImage && claimed) {
    return <Claimed submitedImage={submitedImage} submitType={submitType} resetState={resetState} />;
  }

  return null;
};

export default Wizard;
