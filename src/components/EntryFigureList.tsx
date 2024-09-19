import { ComponentProps } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { Attachment, getAttachmentDownloadURL } from "../api";
import Figure from "./Figure";
import TruncatedFileName from "./TruncatedFileName";
import Button from "./Button";

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

  return (
    <div
      className={twMerge("flex flex-row flex-wrap pb-1", className)}
      {...rest}
    >
      {figures.map((figure, index) => (
        <Figure
          key={figure.id}
          figure={figure}
          label={
            <>
              Figure {index + 1} (
              <TruncatedFileName fileName={figure.fileName} />)
              <Button
                as="a"
                variant="iconSmall"
                download={figure.fileName}
                href={getAttachmentDownloadURL(figure.id)}
                className="flex-shrink-0"
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </Button>
            </>
          }
          className={twJoin(
            "overflow-hidden",
            figures.length > 1 ? "basis-1/2" : "flex-1",
            index % 2 === 0 ? "pr-1.5" : "pl-1.5",
          )}
        />
      ))}
    </div>
  );
}
