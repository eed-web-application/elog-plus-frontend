import { Suspense, lazy } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import { Button, Checkbox, IconButton, Input, InputInvalid } from "../base";
import EntryRow from "../EntryRow";
import AttachmentCard from "../AttachmentCard";
import { DraftFactory } from "../../draftsStore";
import TextDivider from "../TextDivider";
import { LocalAttachment } from "../../hooks/useAttachmentUploader";
import Spinner from "../Spinner";
import { dateToDatetimeString } from "../../utils/datetimeConversion";
import useLogbooks from "../../hooks/useLogbooks";
import useTagLogbookSelector from "../../hooks/useTagLogbookSelector";
import LogbookForm from "./LogbookForm";
import TagForm from "./TagForm";
import ShiftSummaryForm from "./ShiftSummaryForm";
import useEntryBuilder from "../../hooks/useEntryBuilder";

const EntryBodyTextEditor = lazy(() => import("../EntryBodyTextEditor"));

export interface Props {
  onEntrySaved: (id: string) => void;
  kind?: DraftFactory;
}

/**
 * A form to either create a new entry, supersede an existing entry, or follow
 * up an entry
 */
export default function EntryForm({ onEntrySaved, kind = "newEntry" }: Props) {
  const { logbookMap } = useLogbooks({ critical: false });
  const {
    getReferenceProps: getReferencePropsForLogbookSelector,
    Dialog: LogbookSelectorDialog,
    select: selectLogbook,
  } = useTagLogbookSelector();

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
    selectLogbookForNewTag: selectLogbook,
    onEntrySaved: onEntrySaved,
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: uploadAttachments,
  });

  const attachments = (draft.attachments as LocalAttachment[]).concat(
    attachmentsUploading
  );

  return (
    <Suspense fallback={<Spinner large className="mx-auto w-full" />}>
      <Link
        to={{ pathname: "/", search: window.location.search }}
        className={twJoin(IconButton, "my-1 float-right")}
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
      </Link>
      <div className="pb-2">
        {kind === "newEntry" ? (
          <div className="text-lg pl-3 py-2 mb-2 border-b">New entry</div>
        ) : (
          <>
            <TextDivider className="w-full">
              {kind[0] === "followingUp" ? "Following up" : "Superseding"}
            </TextDivider>
            <div className="border-b pt-1.5 pb-2 px-3 mb-3">
              <EntryRow
                containerClassName="rounded-lg border mb-2 overflow-hidden"
                entry={kind[1]}
                showDate
                expandable
                showFollowUps
                selectable
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
          <label className="text-gray-500 block mb-2">
            Title
            <input
              required
              type="text"
              className={twMerge(
                Input,
                invalidFields.includes("title") && InputInvalid,
                "block w-full"
              )}
              value={draft.title}
              onChange={(e) => updateDraft({ ...draft, title: e.target.value })}
              onBlur={() => validateField("title")}
            />
          </label>
          {kind === "newEntry" && (
            <LogbookForm
              className="block mb-2"
              value={draft.logbooks}
              onChange={(logbooks) =>
                updateDraft({
                  ...draft,
                  logbooks,
                })
              }
              invalid={invalidFields.includes("logbooks")}
              onBlur={() => validateField("logbooks")}
            />
          )}
          <TagForm
            className="block mb-2"
            logbooks={draft.logbooks}
            value={draft.tags}
            onChange={(tags) =>
              updateDraft({
                ...draft,
                tags,
              })
            }
          />
          <label className="text-gray-500 mb-1 flex items-center">
            <input
              type="checkbox"
              className={twMerge(Checkbox, "mr-2")}
              checked={draft.eventAt !== undefined}
              onChange={() =>
                updateDraft({
                  ...draft,
                  eventAt: draft.eventAt === undefined ? null : undefined,
                })
              }
            />
            Explicit event time
          </label>
          <input
            type="datetime-local"
            disabled={draft.eventAt === undefined}
            step="1"
            value={draft.eventAt ? dateToDatetimeString(draft.eventAt) : ""}
            onChange={(e) =>
              updateDraft({
                ...draft,
                eventAt: new Date(e.currentTarget.value),
              })
            }
            className={twMerge(
              Input,
              invalidFields.includes("eventAt") && InputInvalid,
              "block w-full mb-2"
            )}
          />
          {kind === "newEntry" && (
            <ShiftSummaryForm
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
          <div className="text-gray-500 block mb-2">
            Text
            <EntryBodyTextEditor
              value={draft.text}
              onChange={(text) => updateDraft({ ...draft, text })}
            />
          </div>
          <label className="text-gray-500 block mb-2">
            Attachments
            <div
              className={twJoin(
                "relative cursor-pointer border rounded-lg bg-gray-50 w-full overflow-hidden flex flex-wrap m-auto",
                attachments.length === 0
                  ? "items-center justify-center text-xl h-24"
                  : "px-3 pt-3"
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
                <div className="absolute left-0 right-0 top-0 bottom-0 bg-opacity-20 bg-gray-500" />
              )}
            </div>
            <input {...getInputProps()} />
          </label>
          <input
            type="submit"
            className={twJoin(Button, "block ml-auto mt-2")}
            value={
              kind === "newEntry"
                ? "Save"
                : kind[0] === "followingUp"
                ? "Follow up"
                : "Supersede"
            }
            {...getReferencePropsForLogbookSelector()}
          />
        </form>
      </div>
      {LogbookSelectorDialog}
    </Suspense>
  );
}
