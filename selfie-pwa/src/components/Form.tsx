import React, { useEffect, useState } from "react";

import { FormComponentProps, FormData } from "../types";

const FormInput = ({
  name,
  value,
  onChange,
  placeholder,
  prompt,
  error,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  prompt?: string;
  error?: string;
}) => {
  return (
    <div>
      <div className="my-3">
        <input
          name={name}
          id={name}
          className="text-black shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-lg p-3 border-gray-300 rounded-md"
          placeholder={placeholder}
          onChange={(ev) => onChange(ev.target.value)}
        />
        {prompt && (
          <p className="mt-1 text-sm text-gray-500" id="email-description">
            {prompt}
          </p>
        )}
      </div>
    </div>
  );
};

const Form = ({
  name,
  description,
  organization,
  email,
  setForm
}: FormComponentProps) => {
  return (
    <div className="flex flex-col justify-center">
      <FormInput
        name="name"
        value={name}
        onChange={setForm("name")}
        placeholder="Name"
      />
      <FormInput
        name="description"
        value={description}
        onChange={setForm("description")}
        placeholder="Short description, bio, or title"
      />
      <FormInput
        name="organization"
        value={organization}
        onChange={setForm("organization")}
        placeholder="Company/organization name"
      />
      <FormInput
        name="email"
        value={email}
        onChange={setForm("email")}
        placeholder="Email"
        prompt="Your email address will not be stored as metadata in the NFT."
      />
    </div>
  );
};

export default Form;
