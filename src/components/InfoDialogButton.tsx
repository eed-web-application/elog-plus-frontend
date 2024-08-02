import { twMerge } from "tailwind-merge";
import { ComponentProps, useCallback, useState } from "react";
import Logo from "./Logo";
import { ServerError, ServerVersion, fetchVersion } from "../api";
import reportServerError from "../reportServerError";
import Dialog from "./Dialog";

export default function InfoDialogButton({
  className,
  ...rest
}: ComponentProps<"svg">) {
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

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (isOpen && !version) {
          fetch();
        }
      }}
    >
      <Dialog.Trigger>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={twMerge(
            "absolute m-3 top-0.5 right-0 w-8 h-8 p-1 text-gray-800 hover:bg-gray-200 rounded-full cursor-pointer",
            className,
          )}
          {...rest}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
      </Dialog.Trigger>
      <Dialog.Content
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
      </Dialog.Content>
    </Dialog>
  );
}
