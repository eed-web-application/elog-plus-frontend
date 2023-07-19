import cn from "classnames";
import { PropsWithChildren, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BackDrop, IconButton } from "./base";
import IsPaneFullscreenContext from "../IsPaneFullscreenContext";
import {
  FloatingFocusManager,
  FloatingOverlay,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import useIsSmallScreen from "../useIsSmallScreen";

type Props = {
  header?: string;
  fullscreenByDefault?: boolean;
};

export default function Pane({
  children,
  header,
  fullscreenByDefault = false,
}: PropsWithChildren<Props>) {
  const [explicitFullscreen, setExplicitFullscreen] =
    useState(fullscreenByDefault);
  const isSmallScreen = useIsSmallScreen();
  const navigate = useNavigate();

  const fullscreen = explicitFullscreen || isSmallScreen;

  const { refs, context } = useFloating({
    open: fullscreen,
    onOpenChange: (open) => {
      if (open) {
        setExplicitFullscreen(true);
        return;
      }

      if (isSmallScreen) {
        navigate("/");
      } else {
        setExplicitFullscreen(false);
      }
    },
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown",
  });
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
    click,
  ]);

  const inner = (
    <div
      {...(fullscreen ? getFloatingProps() : {})}
      ref={fullscreen ? refs.setFloating : undefined}
      className={cn(
        "overflow-y-auto mx-auto container flex-1",
        fullscreen && "bg-white mt-6 rounded-lg w-auto"
      )}
    >
      <div className="flex items-center px-1 py-1">
        {fullscreen ? (
          <Link
            // We close the pane by redirecting to the root: "/"
            to={{ pathname: "/", search: window.location.search }}
            onClick={
              isSmallScreen
                ? undefined
                : (e) => {
                    e.preventDefault();
                    setExplicitFullscreen(false);
                  }
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={IconButton}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Link>
        ) : (
          <Link to={{ pathname: "/", search: window.location.search }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={IconButton}
            >
              {fullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              )}
            </svg>
          </Link>
        )}

        <div className="flex-1 text-center overflow-hidden text-ellipsis whitespace-nowrap">
          {header}
        </div>

        {fullscreen || (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={IconButton}
            tabIndex={0}
            ref={refs.setReference}
            {...getReferenceProps()}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <IsPaneFullscreenContext.Provider value={fullscreen}>
      {fullscreen ? (
        <FloatingOverlay lockScroll className={cn("z-10", BackDrop)}>
          <FloatingFocusManager context={context}>{inner}</FloatingFocusManager>
        </FloatingOverlay>
      ) : (
        inner
      )}
    </IsPaneFullscreenContext.Provider>
  );
}
