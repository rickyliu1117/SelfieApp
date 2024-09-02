import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Webcam from "react-webcam";

import Button from "../components/Button";
import { StepHeader } from "../components/common";
import { API_URL } from "../constants";

const videoConstraints = {
  width: 500,
  height: 500,
  facingMode: "user"
};

const FILTER_LIST = ["beauty", "dreaming", "fairy", "floating", "illusion", "kandinsky", "landscape", "picasso", "vangogh"];

const ImageProcessing = ({
  image,
  resetPhoto,
  onSubmit
}: {
  image: string;
  resetPhoto: () => void;
  onSubmit: (image: string) => void;
}) => {
  const [processedImages, _setProcessedImage] = useState<string[]>([]);
  const [visibleIndex, _setVisibleIndex] = useState<null | number>(null);
  const [isFetching, setFetching] = useState(false);

  const setProcessedImage = (image: string, index: number) => {
    let newImages = [...processedImages];
    newImages[index] = image;
    _setProcessedImage(newImages);
  };

  const setVisibleIndex = (index: number | null) => {
    if (index === null) return _setVisibleIndex(null);
    if (processedImages[index]) return _setVisibleIndex(index);
    setFetching(true);
    fetch(
      `${API_URL}/process-image`, 
      { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, filter: FILTER_LIST[index] }) 
      })
        .then(resp => resp.json())
        .then(data => { 
          setProcessedImage(data.image, index);
          _setVisibleIndex(index);
          setFetching(false);
        })
        .catch(err => {
          console.log("err", err);
          setFetching(false);
        });
  };

  return (
    <>
      {isFetching && <div className="fixed top-0 left-0 right-0 bottom-0 bg-black opacity-60 flex justify-center items-center">
        <div className="loader" />
      </div>}
      <StepHeader>Personalize your selfie</StepHeader>
      <div className="flex">
        <div className="flex-1 flex justify-center items-center">
          <div className="max-w-lg w-full p-3 flex flex-col justify-center items-center">
            <img src={visibleIndex !== null ? processedImages[visibleIndex] : image} />
            <div className="mt-3">
              <Button variant="blue" onClick={() => { setVisibleIndex(null) }}>Reset Filter</Button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="max-w-lg w-full flex-wrap p-3 flex">
            {FILTER_LIST.map((name, idx) => (
              <div key={`filter-${name}`} className={`btn `} onClick={() => setVisibleIndex(idx)}><img className={`border-2 ${idx === visibleIndex ? "border-red-500" : "border-transparent"}`} style={{ width: 160, height: 160 }} src={`/filters/${name}.jpg`} /></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex">
        <Button onClick={() => resetPhoto()}>Retake photo</Button>
        <Button
          onClick={() => {
            visibleIndex ? onSubmit(processedImages[visibleIndex]) : onSubmit(image) 
          }}
        >
          Next
        </Button>
      </div>
    </>
  );
};

const Photo = ({ onSubmit }: { onSubmit: (image: string) => void }) => {
  // TODO: Fix the types
  const isOnline = useSelector((state: any) => state.offline.online);

  const webcamRef = React.useRef<Webcam & HTMLVideoElement>(null);
  const [imgSrc, setImgSrc] = React.useState<string | null>(null);
  const [filtersView, setFiltersView] = React.useState(false);

  const capture = React.useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current?.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const resetPhoto = () => {
    setImgSrc(null);
    setFiltersView(false);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {!imgSrc && (
        <>
          <StepHeader>Get ready!</StepHeader>
          <div className="p-3 m-6 bg-white">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              height={500}
              width={500}
              videoConstraints={videoConstraints}
              mirrored={false}
            />
          </div>
          <Button onClick={capture}>Take Photo</Button>
        </>
      )}
      {imgSrc && !filtersView && (
        <>
          <StepHeader>How does it look?</StepHeader>
          <div className="p-3 m-6 bg-white">
            <img src={imgSrc} />
          </div>
          <div className="flex">
            <Button onClick={() => resetPhoto()}>Retake photo</Button>
            <Button
              onClick={() =>
                !isOnline ? onSubmit(imgSrc) : setFiltersView(true)
              }
            >
              Next
            </Button>
          </div>
        </>
      )}
      {imgSrc && filtersView && (
        <ImageProcessing image={imgSrc} onSubmit={onSubmit} resetPhoto={resetPhoto} />
      )}
    </div>
  );
};

export default Photo;
