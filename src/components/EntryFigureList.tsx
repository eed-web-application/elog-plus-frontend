import { ComponentProps, useState } from "react";
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
import Tooltip from "./Tooltip";

export interface Props extends ComponentProps<"div"> {
  attachments: Attachment[];
}

function Figure({
  figure,
  index,
  ...rest
}: {
  figure: Attachment;
  index: number;
} & ComponentProps<"div">) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
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

  return (
    <>
      <div {...rest}>
        <div className="flex relative items-center text-gray-500">
          <div className="flex whitespace-nowrap overflow-hidden">
            Figure {index + 1} (
            <Tooltip label={figure.fileName}>
              {/* https://stackoverflow.com/questions/27983100/text-ellipsis-at-start-of-string-with-css */}
              <div
                className="flex-shrink truncate"
                style={{ direction: "rtl" }}
              >
                &lrm;
                {figure.fileName}
              </div>
            </Tooltip>
            )
          </div>
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
          ref={refs.setReference}
          {...getReferenceProps({
            tabIndex: 0,
            src: getAttachmentPreviewURL(figure.id),
            className: twJoin(
              "cursor-pointer w-full my-0 max-h-48 object-contain object-left-top",
              isLoaded ? "block" : "hidden",
            ),
            onLoad: () => setIsLoaded(true),
          })}
        />
        {!isLoaded && <Spinner className="my-3 w-full" />}
      </div>

      {isOpen && (
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
                  onClick={() => setIsOpen(false)}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <img
                  className="max-h-screen"
                  src={getAttachmentPreviewURL(figure.id)}
                />
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  );
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

  return (
    <>
      <div className={twMerge("flex gap-3 pb-1", className)} {...rest}>
        <div
          className={twJoin(
            "flex flex-col",
            figures.length > 1 ? "basis-1/2 w-1/2" : "flex-1",
          )}
        >
          {figures
            .filter((_, index) => index % 2 === 0)
            .map((figure, index) => (
              <Figure
                key={figure.id}
                figure={figure}
                index={index * 2}
                className="flex-shrink overflow-hidden"
              />
            ))}
        </div>
        {figures.length > 1 && (
          <div className="flex flex-col basis-1/2 w-1/2">
            {figures
              .filter((_, index) => index % 2 === 1)
              .map((figure, index) => (
                <Figure
                  key={figure.id}
                  figure={figure}
                  index={index * 2 + 1}
                  className="flex-shrink overflow-hidden"
                />
              ))}
          </div>
        )}
      </div>
    </>
  );
}
