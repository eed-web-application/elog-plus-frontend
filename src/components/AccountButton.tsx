import { ComponentProps, useState } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import useTrueMe from "../hooks/useTrueMe";
import Spinner from "./Spinner";
import { twMerge } from "tailwind-merge";
import { TextButton } from "./base";

export default function AccountButton({
  className,
  ...rest
}: ComponentProps<"svg">) {
  const me = useTrueMe();
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom",

    middleware: [offset(4), shift()],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    delay: { open: 0, close: 300 },
    handleClose: safePolygon(),
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
  ]);

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        tabIndex={0}
        className={twMerge("w-8 h-8", className)}
        ref={refs.setReference}
        {...getReferenceProps(rest)}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="rounded-lg shadow-lg drop-shadow-lg bg-white z-10 overflow-hidden"
              {...getFloatingProps()}
            >
              {!me ? (
                <Spinner />
              ) : (
                <>
                  <div className="p-3 border-b">
                    <div>{me.gecos}</div>
                    <div className="text-gray-500 text-sm">{me.email}</div>
                  </div>
                  <button
                    className={twMerge(
                      TextButton,
                      "p-3 rounded-none w-full text-left",
                    )}
                    onClick={() => {
                      window.location.href =
                        "https://vouch.slac.stanford.edu/logout?returnTo=https://accel-webapp-dev.slac.stanford.edu/elog";
                    }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
