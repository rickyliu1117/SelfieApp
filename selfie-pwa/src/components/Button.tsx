import React, { useEffect, useState } from "react";

const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "red"
}: {
  children: JSX.Element | string;
  onClick: () => void;
  disabled?: boolean;
  variant? : string;
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${variant}-500 mr-2 border disabled:bg-gray-300 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
