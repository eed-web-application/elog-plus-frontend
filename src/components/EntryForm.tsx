import { FormEvent, Suspense, lazy, useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  EntryNew,
  ServerError,
  Shift,
  createEntry,
  followUp,
  supersede,
} from "../api";
import Select from "./Select";
import { Button, Checkbox, IconButton, Input, InputInvalid } from "./base";
import EntryRow from "./EntryRow";
import MultiSelect from "./MultiSelect";
import AttachmentCard from "./AttachmentCard";
import {
  DraftFactory,
  LocalUploadedAttachment,
  useDraftsStore,
} from "../draftsStore";
import TextDivider from "./TextDivider";
import useAttachmentUploader, {
  LocalAttachment,
} from "../hooks/useAttachmentUploader";
import Spinner from "./Spinner";
import {
  dateToDatetimeString,
  dateToYYYYMMDD,
} from "../utils/datetimeConversion";
import useLogbooks from "../hooks/useLogbooks";
import useTags from "../hooks/useTags";
import reportServerError from "../reportServerError";

const EntryBodyTextEditor = lazy(() => import("./EntryBodyTextEditor"));

export interface Props {
  onEntryCreated: (id: string) => void;
  kind?: DraftFactory;
}

/**
 * A form to either create a new entry, supersede an existing entry, or follow
 * up an entry
 */
export default function EntryForm({
  onEntryCreated,
  kind = "newEntry",
}: Props) {
  const queryClient = useQueryClient();
  const logbooks = useLogbooks({ critical: false });
  const [draft, updateDraft, removeDraft] = useDraftsStore((state) =>
    state.startDrafting(kind)
  );
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const { tags, bumpTag } = useTags({
    enabled: isTagsOpen,
    logbooks: draft.logbook ? [draft.logbook] : [],
  });
  const {
    uploading: attachmentsUploading,
    upload: uploadAttachment,
    cancel: cancelUploadingAttachment,
  } = useAttachmentUploader();
  let shifts: Shift[] | undefined;
  if (draft.logbook) {
    shifts = logbooks?.find(({ name }) => name === draft.logbook)?.shifts;
  }

  const saveEntry = useCallback(
    async (newEntry: EntryNew) => {
      try {
        if (kind === "newEntry") {
          return await createEntry(newEntry);
        }
        if (kind[0] === "superseding") {
          return await supersede(kind[1].id, newEntry);
        }
        return await followUp(kind[1].id, newEntry);
      } catch (e) {
        if (!(e instanceof ServerError)) {
          throw e;
        }

        reportServerError("Could not save entry", e);
      }
    },
    [kind]
  );

  const validators = {
    title: () => Boolean(draft.title),
    logbook: () => Boolean(draft.logbook),
    eventAt: () => draft.eventAt !== null,
    shiftName: () => !draft.summarizes || Boolean(draft.summarizes.shiftId),
    shiftDate: () => !draft.summarizes || Boolean(draft.summarizes.date),
    // Ensure all attachments are downloaded
    attachments: () => attachmentsUploading.length === 0,
  };

  type Field = keyof typeof validators;

  const [invalid, setInvalid] = useState<Field[]>([]);

  function validate(field: Field): boolean {
    if (validators[field]()) {
      setInvalid((invalid) =>
        invalid.filter((invalidField) => invalidField !== field)
      );
      return true;
    }

    if (!invalid.includes(field)) {
      setInvalid((invalid) => [...invalid, field]);
    }
    return false;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let invalid = false;
    for (const field in validators) {
      if (!validate(field as Field)) {
        invalid = true;
      }
    }
    if (invalid) {
      return;
    }

    const newEntry = {
      ...draft,
      attachments: draft.attachments.map(
        // We have already verified that all the ids are non null in the
        // attachment validator, so this is fine
        (attachment) => attachment.id as string
      ),
      // This should be fine as the validators should ensure that this Draft
      // is indeed a EntryNew
    } as EntryNew;

    const id = await saveEntry(newEntry);
    if (id) {
      removeDraft();

      queryClient.invalidateQueries({ queryKey: ["entries"] });
      if (kind !== "newEntry") {
        queryClient.invalidateQueries({ queryKey: ["entry", kind[1]] });
      }
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "tags" &&
          Array.isArray(queryKey[1]) &&
          (queryKey[1].includes(newEntry.logbook) || queryKey[1].length === 0),
      });
      if (newEntry.summarizes) {
        queryClient.setQueryData(
          [
            "shiftSummary",
            newEntry.summarizes.shiftId,
            newEntry.summarizes.date,
          ],
          id
        );
      }

      onEntryCreated(id);
    }
  }

  async function removeAttachment(attachment: LocalAttachment) {
    if (attachment.id) {
      updateDraft({
        ...draft,
        attachments: draft.attachments.filter(({ id }) => id !== attachment.id),
      });
      return;
    }

    cancelUploadingAttachment(attachment.fileName);
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const attachments = (
        await Promise.all(acceptedFiles.map(uploadAttachment))
      ).filter((x) => x) as LocalUploadedAttachment[];

      updateDraft({
        ...draft,
        attachments: draft.attachments.concat(attachments),
      });
    },
  });

  const attachments = (draft.attachments as LocalAttachment[]).concat(
    attachmentsUploading
  );

  return (
    <Suspense fallback={<Spinner large className="mx-auto w-full" />}>
      <Link
        to={{ pathname: "/", search: window.location.search }}
        className={twMerge(IconButton, "my-1 float-right")}
        onClick={() => removeDraft()}
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
        <form noValidate onSubmit={submit} className="px-3">
          <label className="text-gray-500 block mb-2">
            Title
            <input
              required
              type="text"
              className={twMerge(
                Input,
                invalid.includes("title") && InputInvalid,
                "block w-full"
              )}
              value={draft.title}
              onChange={(e) => updateDraft({ ...draft, title: e.target.value })}
              onBlur={() => validate("title")}
            />
          </label>
          {kind === "newEntry" && (
            <label className="text-gray-500 block mb-2">
              Logbook
              <Select
                required
                containerClassName="block w-full"
                className="w-full"
                options={(logbooks || []).map(({ name }) => name.toUpperCase())}
                isLoading={!logbooks}
                value={draft.logbook.toUpperCase()}
                setValue={(logbook) =>
                  updateDraft({
                    ...draft,
                    logbook: (logbook || "").toLowerCase(),
                  })
                }
                invalid={invalid.includes("logbook")}
                onBlur={() => validate("logbook")}
              />
            </label>
          )}
          <label className="text-gray-500 block mb-2">
            Tags
            <MultiSelect
              disabled={!tags}
              isLoading={!tags}
              predefinedOptions={tags || []}
              onOptionSelected={bumpTag}
              value={draft.tags}
              onFocus={() => setIsTagsOpen(true)}
              onBlur={() => setIsTagsOpen(false)}
              setValue={(tags) => updateDraft({ ...draft, tags: tags || [] })}
            />
          </label>
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
              invalid.includes("eventAt") && InputInvalid,
              "block w-full mb-2"
            )}
          />
          {kind === "newEntry" && (
            <>
              <label className="text-gray-500 mb-1 flex items-center">
                <input
                  type="checkbox"
                  className={twMerge(Checkbox, "mr-2")}
                  checked={draft.summarizes !== undefined}
                  onChange={() =>
                    updateDraft({
                      ...draft,
                      summarizes: draft.summarizes
                        ? undefined
                        : {
                            shiftId: "",
                            date: dateToYYYYMMDD(new Date()),
                          },
                    })
                  }
                />
                Shift summary
              </label>
              <div className="flex gap-3 mb-2">
                <Select
                  placeholder="Shift"
                  required
                  containerClassName="block w-full"
                  className="w-full"
                  noOptionsLabel={shifts ? undefined : "Select a logbook first"}
                  options={(shifts || []).map(({ name, id }) => ({
                    label: name,
                    value: id,
                  }))}
                  value={draft.summarizes?.shiftId || null}
                  setValue={(shift) =>
                    updateDraft({
                      ...draft,
                      summarizes: draft.summarizes && {
                        ...draft.summarizes,
                        shiftId: shift || "",
                      },
                    })
                  }
                  invalid={invalid.includes("shiftName")}
                  onBlur={() => validate("shiftName")}
                  disabled={!draft.summarizes}
                />
                <input
                  type="date"
                  value={draft.summarizes?.date || ""}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      summarizes: draft.summarizes && {
                        ...draft.summarizes,
                        date: e.currentTarget.value,
                      },
                    })
                  }
                  className={twMerge(
                    Input,
                    invalid.includes("shiftDate") && InputInvalid,
                    "block w-full"
                  )}
                  onBlur={() => validate("shiftDate")}
                  disabled={!draft.summarizes}
                />
              </div>
            </>
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
              className={twMerge(
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
            className={twMerge(Button, "block ml-auto mt-2")}
            value={
              kind === "newEntry"
                ? "Save"
                : kind[0] === "followingUp"
                ? "Follow up"
                : "Supersede"
            }
          />
        </form>
      </div>
    </Suspense>
  );
}
