import { useCallback, useEffect, useState } from "react";
import { Logbook, ServerError, fetchLogbooks } from "../api";
import reportServerError from "../reportServerError";

export default function useLogbooks() {
  const [logbooks, setLogbooks] = useState<Logbook[] | null>(null);

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
    fetch();
  }, [fetch]);

  return { logbooks, refresh: fetch };
}
