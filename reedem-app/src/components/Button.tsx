import React, { useEffect, useState } from "react";

const Button = ({
  children,
  onClick,
  disabled,
}: {
  children: JSX.Element | string;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mx-2"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
