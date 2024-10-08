import React, { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import AttachmentIcon from "./AttachmentIcon";
import { Attachment, getAttachmentDownloadURL } from "../api";
import Tooltip from "./Tooltip";

export type Props = ComponentProps<"div"> & {
  isLoading?: boolean;
  onRemove?: () => void;
} & (
    | {
        attachment: Omit<Attachment, "previewState" | "miniPreview">;
        downloadable: true;
      }
    | {
        attachment: Omit<Attachment, "id" | "previewState" | "miniPreview">;
        downloadable?: false;
      }
  );

export default function AttachmentCard({
  isLoading,
  attachment,
  className,
  onRemove,
  downloadable,
  ...rest
}: Props) {
  function remove(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.stopPropagation();
    e.preventDefault();
    onRemove?.();
  }

  return (
    <div
      {...rest}
      className={twMerge(
        "relative w-20 overflow-hidden text-gray-500",
        className,
      )}
    >
      <div className="flex overflow-hidden relative flex-col justify-center items-center p-4 h-20 bg-gray-200 rounded-lg shadow">
        {isLoading ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-full h-full animate-spin"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        ) : (
          <>
            <AttachmentIcon
              mimeType={attachment.contentType}
              className="w-full h-full"
            />
            {downloadable && (
              <a
                className="flex absolute top-0 right-0 bottom-0 left-0 justify-center items-center text-white bg-black bg-opacity-50 opacity-0 cursor-pointer hover:opacity-100"
                download={attachment.fileName}
                href={getAttachmentDownloadURL(attachment.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </a>
            )}
          </>
        )}
      </div>
      <Tooltip label={attachment.fileName} placement="bottom">
        <div className="text-sm truncate">{attachment.fileName}</div>
      </Tooltip>
      {onRemove && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="absolute top-0 right-0 p-0.5 w-6 h-6 rounded-full cursor-pointer hover:bg-gray-300"
          onClick={remove}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </div>
  );
}
