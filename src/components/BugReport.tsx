import {
  FloatingArrow,
  FloatingPortal,
  arrow,
  autoUpdate,
  offset,
  useFloating,
} from "@floating-ui/react";
import { ComponentProps, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { twJoin, twMerge } from "tailwind-merge";
import { Link as LinkStyle } from "./base";

const ARROW_HEIGHT = 7;
const GAP = 2;

export default function BugReport({
  className,
  ...rest
}: Omit<ComponentProps<typeof Link>, "to">) {
  const [isOpen, setIsOpen] = useState(
    !localStorage.getItem("bugReportDismissed"),
  );

  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: "bottom-end",
    open: isOpen,
    middleware: [
      offset(ARROW_HEIGHT + GAP),
      arrow({
        element: arrowRef,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  return (
    <>
      <Link
        to="https://github.com/eed-web-application/elog-plus-frontend/issues/new"
        className={twMerge(
          "relative ml-2 p-1 h-8 w-8 text-gray-800 hover:bg-gray-200 rounded-full cursor-pointer",
          className,
        )}
        ref={refs.setReference}
        {...rest}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0 1 12 12.75Zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 0 1-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 0 0 2.248-2.354M12 12.75a2.25 2.25 0 0 1-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 0 0-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 0 1 .4-2.253M12 8.25a2.25 2.25 0 0 0-2.248 2.146M12 8.25a2.25 2.25 0 0 1 2.248 2.146M8.683 5a6.032 6.032 0 0 1-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0 1 15.318 5m0 0c.427-.283.815-.62 1.155-.999a4.471 4.471 0 0 0-.575-1.752M4.921 6a24.048 24.048 0 0 0-.392 3.314c1.668.546 3.416.914 5.223 1.082M19.08 6c.205 1.08.337 2.187.392 3.314a23.882 23.882 0 0 1-5.223 1.082"
          />
        </svg>
      </Link>

      {isOpen && (
        <FloatingPortal>
          <div
            className="z-10 py-2 px-3 text-sm text-black bg-yellow-200 rounded-lg shadow-sm transition-opacity duration-300 flex items-center justify-center flex-col"
            ref={refs.setFloating}
            style={floatingStyles}
          >
            Please report bugs here
            <button
              className={twJoin(LinkStyle, "block mt-1 text-gray-800")}
              onClick={() => {
                localStorage.setItem("bugReportDismissed", "true");
                setIsOpen(false);
              }}
            >
              Dismiss
            </button>
            <FloatingArrow
              className="fill-yellow-200"
              ref={arrowRef}
              context={context}
              height={ARROW_HEIGHT}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
