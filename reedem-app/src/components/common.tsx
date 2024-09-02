export const StepHeader = ({
  children,
}: {
  children: string | JSX.Element;
}) => (
  <h1 className="text-5xl pb-0 mb-3 text-center font-bold leading-normal">{children}</h1>
);
