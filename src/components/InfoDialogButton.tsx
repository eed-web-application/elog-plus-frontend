import { twJoin, twMerge } from "tailwind-merge";
import {
  FloatingFocusManager,
  FloatingOverlay,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { ComponentProps, useEffect, useState } from "react";
import { BackDrop, IconButton } from "./base";
import Logo from "./Logo";
import { ServerError, ServerVersion, fetchVersion } from "../api";
import reportServerError from "../reportServerError";

export default function InfoDialogButton({
  className,
  ...rest
}: ComponentProps<"svg">) {
  const [viewingInfoDialog, setViewingInfoDialog] = useState(false);
  const [version, setVersion] = useState<ServerVersion | null>(null);

  const { refs, context } = useFloating({
    open: viewingInfoDialog,
    onOpenChange: setViewingInfoDialog,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown",
  });
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  useEffect(() => {
    async function fetch() {
      try {
        setVersion((await fetchVersion()) || null);
      } catch (e) {
        if (!(e instanceof ServerError)) {
          throw e;
        }

        reportServerError("Could not retrieve server version", e);
      }
    }
    if (!version && viewingInfoDialog) {
      fetch();
    }
  }, [version, setVersion, viewingInfoDialog]);

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        {...rest}
        className={twMerge(
          "absolute m-3 top-0.5 right-0 w-8 h-8 p-1 text-gray-800 hover:bg-gray-200 rounded-full cursor-pointer",
          className
        )}
        {...getReferenceProps()}
        ref={refs.setReference}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
      {viewingInfoDialog && (
        <FloatingOverlay
          lockScroll
          className={twJoin(BackDrop, "z-10 flex justify-center items-center")}
        >
          <FloatingFocusManager context={context}>
            <div
              ref={refs.setFloating}
              {...getFloatingProps()}
              className="bg-white relative p-3 py-6 w-full max-w-sm flex flex-col items-center rounded-xl outline-none"
            >
              <Logo className="mb-8" />
              <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col text-gray-500">
                  <div>Version:</div>
                  <div>Server Version:</div>
                </div>
                <div className="flex flex-col">
                  <div>{import.meta.env.APP_VERSION}</div>
                  <div>{version?.version || "\u00A0"}</div>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={twJoin(IconButton, "absolute top-0 left-0 m-1")}
                onClick={() => setViewingInfoDialog(false)}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      )}
    </>
  );
}
