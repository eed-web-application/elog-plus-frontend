import { createContext } from "react";
import { Entry } from "./api";

const SpotlightContext = createContext<((entry: Entry) => void) | null>(null);

export default SpotlightContext;
