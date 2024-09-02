import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useTimer } from 'react-timer-hook';

import Button from "../components/Button";
import { StepHeader } from "../components/common";

const blobToBase64 = (blob: Blob) => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

const ImageProcessing = ({
  image,
  setImg,
}: {
  image: string;
  setImg: (image: string) => void;
}) => {
  return (
    <>
      <StepHeader>Personalize your selfie</StepHeader>
      <div className="flex">
        <div className="flex-1 flex justify-center items-center">
          <div className="max-w-lg w-full p-3">
            <img src={image} />
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="w-lg w-full p-3">
          </div>
        </div>
      </div>
    </>
  );
};

const Preview = ({ recordedChunks }: any) => {
  const blob = new Blob(recordedChunks, {
    type: "video/mp4"
  });
  const url = URL.createObjectURL(blob);

  return (
    <video src={url} autoPlay loop controls />
  );
}

const Photo = ({ onSubmit }: { onSubmit: (image: string) => void }) => {
  const [expiryTimestamp, setExpiryTimestamp] = useState(new Date());

  let now = new Date();
  now.setSeconds(now.getSeconds() + 15);
  let {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({ 
    autoStart: false,
    expiryTimestamp: now, 
    onExpire: () => {
      handleStopCaptureClick();
    }
  });

  const webcamRef = React.useRef<Webcam & HTMLVideoElement>(null);

  const [capturing, setCapturing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = React.useState([]);

  const capture = React.useCallback(() => {
    setCapturing(true);
    start();
    if (webcamRef.current && webcamRef.current.stream) {
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: "video/webm"
      });
      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current.start();
    }
  }, [webcamRef]);

  const handleDataAvailable = React.useCallback(
    ({ data }: { data: any }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStopCaptureClick = React.useCallback(() => {
    pause();
    restart(now, false);
    mediaRecorderRef.current!.stop();
    setCapturing(false);
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  const resetState = () => {
    setRecordedChunks([]);
    setCapturing(false);
  };

  const prepareVideoBase64 = async () => {
    const blob = new Blob(recordedChunks, {
      type: "video/mp4"
    });
    const result = await blobToBase64(blob);
    onSubmit(result as string);
  };

  const hasRecorded = recordedChunks.length > 0;

  if (!hasRecorded) {
    return (
      <div className="flex flex-col items-center justify-center">
          <StepHeader>{capturing ? "Recording..." : "Get ready!"}</StepHeader>
          <div className="p-3 m-6 bg-white">
            <Webcam
              audio={true}
              muted={true}
              ref={webcamRef}
            />
          </div>
          {!capturing && 
            <Button onClick={capture}>Start recording...</Button>
          }
          {capturing &&
            <Button onClick={handleStopCaptureClick}>{`Stop recording... (${seconds})`}</Button>
          }
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
        <>
          <StepHeader>Preview video</StepHeader>
          <div className="p-3 m-6 bg-white">
            <Preview recordedChunks={recordedChunks} /> 
          </div>
          <div className="flex">
            <Button onClick={resetState}>Record again</Button>
            <Button onClick={prepareVideoBase64}>Next</Button>
          </div>
        </>
    </div>
  );
};

export default Photo;

