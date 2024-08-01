import useTrueMe from "./useTrueMe";

export default function useIsRoot() {
  const me = useTrueMe();

  if (!me) {
    return false;
  }

  return me.authorizations.some((auth) => auth.resourceType === "All");
}
