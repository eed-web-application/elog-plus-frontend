import { twJoin, twMerge } from "tailwind-merge";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import { Checkbox, Input, InputInvalid } from "../base";
import EntryRow from "../EntryRow";
import AttachmentCard from "../AttachmentCard";
import { DraftFactory } from "../../draftsStore";
import TextDivider from "../TextDivider";
import { LocalAttachment } from "../../hooks/useAttachmentUploader";
import { dateToDatetimeString } from "../../utils/datetimeConversion";
import useLogbooks from "../../hooks/useLogbooks";
import LogbookForm from "./LogbookForm";
import TagForm from "./TagForm";
import ShiftSummaryForm from "./ShiftSummaryForm";
import useEntryBuilder from "../../hooks/useEntryBuilder";
import DateTimeInput from "../DateTimeInput";
import useTags from "../../hooks/useTags";
import EntryBodyTextEditor from "../EntryBodyTextEditor";
import Button from "../Button";

export interface Props {
  onEntrySaved: (id: string) => void;
  kind: DraftFactory;
}

/**
 * A form to either create a new entry, supersede an existing entry, or follow
 * up an entry
 */
export default function EntryForm({ onEntrySaved, kind }: Props) {
  const { logbookMap, isLoading: isLogbooksLoading } = useLogbooks({
    critical: false,
  });
  const { tagMap } = useTags();

  const {
    draft,
    updateDraft,
    validateField,
    invalidFields,
    uploadAttachments,
    removeAttachment,
    attachmentsUploading,
    submitEntry,
    removeDraft,
  } = useEntryBuilder({
    kind,
    onEntrySaved: onEntrySaved,
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: uploadAttachments,
  });

  const attachments = (draft.attachments as LocalAttachment[]).concat(
    attachmentsUploading,
  );

  return (
    <>
      <Button
        as={Link}
        to={{
          pathname: "/",
          search: window.location.search,
          hash: window.location.hash,
        }}
        className="my-1 float-right"
        onClick={removeDraft}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </Button>
      <div className="pb-2">
        {kind[0] === "newEntry" ? (
          <div className="py-2 pl-3 mb-2 text-lg border-b">New entry</div>
        ) : (
          <>
            <TextDivider className="w-full">
              {kind[0] === "followingUp" ? "Following up" : "Superseding"}
            </TextDivider>
            <div className="px-3 pt-1.5 pb-2 mb-3 border-b">
              <EntryRow
                containerClassName="rounded-lg border mb-2 overflow-hidden"
                entry={kind[1]}
                showDate
                showFollowUps
                allowExpanding
                allowSpotlight
              />
            </div>
          </>
        )}
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submitEntry();
          }}
          className="px-3"
        >
          <label className="block mb-2 text-gray-500">
            Title
            <input
              required
              type="text"
              className={twMerge(
                Input,
                invalidFields.includes("title") && InputInvalid,
                "block w-full",
              )}
              value={draft.title}
              onChange={(e) => updateDraft({ ...draft, title: e.target.value })}
              onBlur={() => validateField("title")}
            />
          </label>

          <LogbookForm
            className="block mb-2"
            value={draft.logbooks}
            onChange={(logbooks) => {
              // Ensure all tags used are in a selected logbook
              const updatedTags = draft.tags.filter((tag) =>
                typeof tag === "string"
                  ? logbooks.includes(tagMap[tag].logbook.id)
                  : logbooks.includes(tag.logbook),
              );

              updateDraft({
                ...draft,
                logbooks,
                tags: updatedTags,
              });
            }}
            invalid={invalidFields.includes("logbooks")}
            onBlur={() => validateField("logbooks")}
          />

          <TagForm
            className="block mb-2"
            logbooks={
              isLogbooksLoading
                ? []
                : draft.logbooks.map((id) => logbookMap[id])
            }
            value={draft.tags}
            isLoading={isLogbooksLoading}
            onChange={(tags) =>
              updateDraft({
                ...draft,
                tags,
              })
            }
          />

          <label className="flex items-center mb-1 text-gray-500">
            <input
              type="checkbox"
              className={twMerge(Checkbox, "mr-2")}
              checked={draft.eventAt !== undefined}
              onChange={() =>
                updateDraft({
                  ...draft,
                  eventAt: draft.eventAt === undefined ? new Date() : undefined,
                })
              }
            />
            Override Event Time
          </label>
          {draft.eventAt && (
            <DateTimeInput
              invalid={invalidFields.includes("eventAt")}
              value={dateToDatetimeString(draft.eventAt)}
              onChange={(date) =>
                updateDraft({
                  ...draft,
                  eventAt: date || undefined,
                })
              }
              className="block mb-2 w-full"
            />
          )}
          {kind[0] === "newEntry" && (
            <ShiftSummaryForm
              tooltip={
                draft.logbooks.length !== 1
                  ? "Must have one logbook selected"
                  : ""
              }
              value={draft.summarizes}
              onChange={(summarizes) => updateDraft({ ...draft, summarizes })}
              shifts={logbookMap[draft.logbooks[0] || ""]?.shifts || []}
              disabled={draft.logbooks.length !== 1}
              invalidShiftName={invalidFields.includes("shiftName")}
              invalidDate={invalidFields.includes("shiftDate")}
              onShiftNameBlur={() => validateField("shiftName")}
              onDateBlur={() => validateField("shiftDate")}
            />
          )}

          {/* Not using a label here, because there are some weird */}
          {/* interactions with having multiple inputs under the same label */}
          <div className="block mb-2 text-gray-500">
            Text
            <EntryBodyTextEditor
              value={draft.text}
              onChange={(text) => updateDraft({ ...draft, text })}
            />
          </div>

          <label className="block mb-2 text-gray-500">
            Attachments
            <div
              className={twJoin(
                "relative cursor-pointer border rounded-lg bg-gray-50 w-full overflow-hidden flex flex-wrap m-auto",
                attachments.length === 0
                  ? "items-center justify-center text-xl h-24"
                  : "px-3 pt-3",
              )}
              {...getRootProps()}
            >
              {attachments.length === 0
                ? "Drag and drop"
                : attachments.map((attachment) => (
                    <AttachmentCard
                      key={attachment.id || attachment.fileName}
                      className="mr-3 mb-3"
                      isLoading={!attachment.id}
                      attachment={attachment}
                      onRemove={() => removeAttachment(attachment)}
                    />
                  ))}
              {isDragActive && (
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-20" />
              )}
            </div>
            <input {...getInputProps()} />
          </label>

          <Button className="block ml-auto mt-2">
            {kind[0] === "newEntry"
              ? "Save"
              : kind[0] === "followingUp"
                ? "Follow up"
                : "Supersede"}
          </Button>
        </form>
      </div>
    </>
  );
}
