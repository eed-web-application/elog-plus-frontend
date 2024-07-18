import { ComponentProps, useCallback, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import {
  Attachment,
  getAttachmentDownloadURL,
  getAttachmentPreviewURL,
} from "../api";
import { BackDrop, IconButton } from "./base";
import Spinner from "./Spinner";

export interface Props extends ComponentProps<"div"> {
  attachments: Attachment[];
}

/**
 * Two column masonry figure list with download buttons and a image preview modal
 */
export default function EntryFigureList({
  attachments,
  className,
  ...rest
}: Props) {
  const figures = attachments.filter(
    (attachment) => attachment.previewState === "Completed",
  );
  const [viewingFigure, setViewingFigure] = useState<string | null>(null);

  const { refs, context } = useFloating({
    open: Boolean(viewingFigure),
    onOpenChange: (open) => {
      if (!open) {
        setViewingFigure(null);
      }
    },
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

  const Figure = useCallback(
    ({ figure, index }: { figure: Attachment; index: number }) => {
      const [isLoaded, setIsLoaded] = useState(false);

      return (
        <div key={figure.id}>
          <div className="flex relative">
            <div className="mt-2 mb-1 text-gray-500">Figure {index + 1}</div>
            <a
              className={IconButton}
              download={figure.fileName}
              href={getAttachmentDownloadURL(figure.id)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </a>
          </div>
          <img
            src={getAttachmentPreviewURL(figure.id)}
            tabIndex={0}
            {...getReferenceProps()}
            onClick={() => setViewingFigure(figure.id)}
            className={twJoin(
              "cursor-pointer w-full",
              isLoaded ? "block" : "hidden",
            )}
            onLoad={() => setIsLoaded(true)}
          />
          {!isLoaded && <Spinner className="my-3 w-full" />}
        </div>
      );
    },
    [getReferenceProps],
  );

  return (
    <>
      <div className={twMerge("flex gap-3 pb-1", className)} {...rest}>
        <div
          className={twJoin(
            "flex flex-col",
            figures.length > 1 ? "basis-1/2" : "flex-1",
          )}
        >
          {figures
            .filter((_, index) => index % 2 === 0)
            .map((figure, index) => (
              <Figure figure={figure} index={index * 2} />
            ))}
        </div>
        {figures.length > 1 && (
          <div className="flex flex-col basis-1/2">
            {figures
              .filter((_, index) => index % 2 === 1)
              .map((figure, index) => (
                <Figure figure={figure} index={index * 2 + 1} />
              ))}
          </div>
        )}
      </div>

      {viewingFigure && (
        <FloatingPortal>
          <FloatingOverlay
            lockScroll
            className={twMerge(
              BackDrop,
              "z-10 flex justify-center items-center",
            )}
          >
            <FloatingFocusManager context={context}>
              <div ref={refs.setFloating} {...getFloatingProps()}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={twMerge(
                    IconButton,
                    "absolute top-0 left-0 m-3 !w-10 !h-10 !p-1 bg-gray-700 hover:bg-gray-600 text-gray-200 ring-blue-50",
                  )}
                  tabIndex={0}
                  onClick={() => setViewingFigure(null)}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <img
                  className="max-h-screen"
                  src={getAttachmentPreviewURL(viewingFigure)}
                />
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  );
}
