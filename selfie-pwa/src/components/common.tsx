import { SubmissionType } from "../types";

export const StepHeader = ({
  children,
}: {
  children: string | JSX.Element;
}) => (
  <h1 className="text-5xl pb-0 mb-3 text-center font-bold leading-normal">
    {children}
  </h1>
);

export const Checkbox = ({
  isChecked,
  onClick,
  children
}: {
  isChecked: boolean;
  onClick: () => void;
  children: JSX.Element | string
}) => (
  <div className="relative flex items-start">
    <div className="flex items-center h-5">
      <input
        id="comments"
        aria-describedby="comments-description"
        name="comments"
        type="checkbox"
        checked={isChecked}
        onChange={onClick}
        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
      />
    </div>
    <div className="ml-3 text-sm">
      <label htmlFor="comments" className="font-medium text-white">
        {children}
      </label>
    </div>
  </div>
);

export const MediaContent = ({ submitType, data }: { submitType: SubmissionType, data: string }) => {
  if (submitType === SubmissionType.Photo) { 
    return <img src={data} />
  }
  if (submitType === SubmissionType.Video) {
    return <video src={data} autoPlay loop controls />
  }

  return null;
};

