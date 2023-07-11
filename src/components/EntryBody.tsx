import { useState } from "react";
import cn from "classnames";
import {
  Attachment,
  Entry,
  getAttachmentDownloadURL,
  getAttachmentPreviewURL,
} from "../api";
import { BackDrop, IconButton } from "./base";
import {
  FloatingFocusManager,
  FloatingOverlay,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";

interface Props {
  entry: Entry;
  borderBottom?: boolean;
  showEmptyLabel?: boolean;
}

export default function EntryBody({
  entry,
  borderBottom,
  showEmptyLabel,
}: Props) {
  const figures = entry.attachments.filter(
    (attachment) => attachment.previewState === "Completed"
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

  function renderFigure(figure: Attachment, index: number) {
    return (
      <div key={figure.id}>
        <div className="flex">
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
          className={cn("cursor-pointer w-full")}
        />
      </div>
    );
  }

  return (
    <>
      {(showEmptyLabel || entry.text) && (
        <div
          className={cn(
            entry.text || "text-gray-500",
            (borderBottom || figures.length > 0) && "border-b",
            "pb-1"
          )}
          dangerouslySetInnerHTML={
            entry.text ? { __html: entry.text } : undefined
          }
        >
          {entry.text ? undefined : "No entry text"}
        </div>
      )}
      <div className="flex gap-3">
        <div className="flex flex-col">
          {figures
            .filter((_, index) => index % 2 === 0)
            .map((figure, index) => renderFigure(figure, index * 2))}
        </div>
        <div className="flex flex-col">
          {figures
            .filter((_, index) => index % 2 === 1)
            .map((figure, index) => renderFigure(figure, index * 2 + 1))}
        </div>
      </div>

      {viewingFigure && (
        <FloatingOverlay
          lockScroll
          className={cn("z-10 flex justify-center items-center", BackDrop)}
        >
          <FloatingFocusManager context={context}>
            <div ref={refs.setFloating} {...getFloatingProps()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={cn(
                  IconButton,
                  "absolute top-0 left-0 m-3 !w-10 !h-10 !p-1 bg-gray-700 hover:bg-gray-600 text-gray-200 ring-blue-50"
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
                className="max-h-full"
                src={getAttachmentPreviewURL(viewingFigure)}
              />
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      )}
    </>
  );
}
