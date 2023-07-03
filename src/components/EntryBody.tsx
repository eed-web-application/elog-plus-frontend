import { Entry, getAttachmentPreviewURL } from "../api";
import { Fragment } from "react";
import AttachmentCard from "./AttachmentCard";

interface Props {
  entry: Entry;
}

export default function EntryBody({ entry }: Props) {
  const figures = entry.attachments.filter(
    (attachment) => attachment.previewState === "Completed"
  );
  const attachments = entry.attachments.filter(
    (attachment) => attachment.previewState !== "Completed"
  );

  return (
    <>
      <div
        className={entry.text || "text-gray-500"}
        dangerouslySetInnerHTML={
          entry.text ? { __html: entry.text } : undefined
        }
      >
        {entry.text ? undefined : "No entry text"}
      </div>
      {figures.map((attachment, index) => (
        <Fragment key={attachment.id}>
          <div className="mt-2 mb-1 text-gray-500">Figure {index + 1}</div>
          <img
            src={getAttachmentPreviewURL(attachment.id)}
            className="w-full"
          />
        </Fragment>
      ))}
      {attachments.length > 0 && (
        <>
          <div className="mt-2 mb-1">Attachments</div>
          <div className="w-full overflow-hidden flex flex-wrap m-auto">
            {attachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                downloadable
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
