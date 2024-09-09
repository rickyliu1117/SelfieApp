import React, { useEffect, useState } from "react";
import { useBooleanState, usePrevious } from "webrix/hooks";
import { useDispatch, useSelector } from "react-redux";

import Wizard from "./views/Wizard";

import "./App.css";

const Header = () => (
  <div className="md:flex md:items-center md:justify-center h-30 p-4">
    <img src="/web3forum.svg" alt="Logo" />
  </div>
);

const App = () => {
  const isOnline = useSelector((state: any) => state.offline.online);
  const outbox = useSelector((state: any) => state.offline.outbox);

  return (
    <div className="flex flex-col">
      <div
        className="min-h-screen flex-1 bg-cover mt-30"
        style={{ backgroundImage: "url(/app-bg.png)" }}
      >
        <Header />
        <Wizard />
      </div>
      <p className="text-center bg-indigo-900">
        status: {isOnline ? "online " : "false "} 
        | toSync: {outbox.length}
      </p>
    </div>
  );
};

export default App;
