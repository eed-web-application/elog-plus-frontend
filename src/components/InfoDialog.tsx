import { useCallback, useEffect, useState } from "react";
import Logo from "./Logo";
import { ServerError, ServerVersion, fetchVersion } from "../api";
import reportServerError from "../reportServerError";
import Dialog from "./Dialog";

export default function InfoDialog() {
  const [version, setVersion] = useState<ServerVersion | null>(null);

  const fetch = useCallback(async () => {
    try {
      setVersion((await fetchVersion()) || null);
    } catch (e) {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      reportServerError("Could not retrieve server version", e);
    }
  }, []);

  useEffect(() => {
    if (!version) {
      fetch();
    }
  }, [version]);

  return (
    <Dialog.Window
      showCloseButton
      className="flex flex-col items-center w-full max-w-sm"
    >
      <Dialog.Section>
        <Logo className="mb-8" />
        <div className="flex gap-2 justify-center items-center">
          <div className="flex flex-col text-gray-500">
            <div>Version:</div>
            <div>Server Version:</div>
          </div>
          <div className="flex flex-col">
            <div>
              {import.meta.env.APP_VERSION} ({import.meta.env.COMMIT_HASH})
            </div>
            <div>{version?.version || "\u00A0"}</div>
          </div>
        </div>
      </Dialog.Section>
    </Dialog.Window>
  );
}
