import { createContext } from "react";

export type Context = {
  zIndex: number;
  usedHeight: number;
};

const StickyEntryRow = createContext<Context>({ zIndex: 100, usedHeight: 0 });

export default StickyEntryRow;
