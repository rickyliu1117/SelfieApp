import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import "./index.css";
import App from "./App";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(<App />);
