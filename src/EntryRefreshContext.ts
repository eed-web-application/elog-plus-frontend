import { createContext } from "react";

const EntryRefreshContext = createContext<() => void>(() => undefined);

export default EntryRefreshContext;
