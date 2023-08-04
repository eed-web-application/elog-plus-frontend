import { useCallback, useEffect, useState } from "react";
import { Logbook, ServerError, fetchLogbooks } from "../api";
import reportServerError from "../reportServerError";

export default function useLogbooks(lazy = false) {
  const [logbooks, setLogbooks] = useState<Logbook[] | null>(null);
  const hasLoaded = Boolean(logbooks);

  const fetch = useCallback(async () => {
    try {
      setLogbooks(await fetchLogbooks());
    } catch (e) {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not retrieve logbooks", e);
    }
  }, []);

  useEffect(() => {
    if (!lazy && !hasLoaded) {
      fetch();
    }
  }, [fetch, lazy, hasLoaded]);

  const loadInitial = useCallback(() => {
    if (!hasLoaded) {
      fetch();
    }
  }, [hasLoaded, fetch]);

  return { logbooks, loadInitial, refresh: fetch };
}
