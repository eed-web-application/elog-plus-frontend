import {
  FormEvent,
  Suspense,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import cn from "classnames";
import { useDropzone } from "react-dropzone";
import {
  EntryForm as EntryFormType,
  createEntry,
  fetchLogbooks,
  fetchTags,
  followUp,
  supersede,
} from "../api";
import Select from "./Select";
import { Button, Checkbox, Input, InputInvalid } from "./base";
import EntryRow from "./EntryRow";
import MultiSelect from "./MultiSelect";
import AttachmentCard from "./AttachmentCard";
import {
  DraftFactory,
  LocalUploadedAttachment,
  useDraftsStore,
} from "../draftsStore";
import EntryRefreshContext from "../EntryRefreshContext";
import TextDivider from "./TextDivider";
import dateToDateString from "../utils/dateToDateString";
import useAttachmentUploader, {
  LocalAttachment,
} from "../hooks/useAttachmentUploader";
import Spinner from "./Spinner";

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
  const [logbooks, setLogbooks] = useState<null | string[]>(null);
  const [tagsLoaded, setTagsLoaded] = useState<Record<string, string[]>>({});
  const [shifts, setShifts] = useState<null | string[]>(null);
  const refreshEntries = useContext(EntryRefreshContext);
  const [draft, updateDraft, removeDraft] = useDraftsStore((state) =>
    state.startDrafting(kind)
  );
  const {
    uploading: attachmentsUploading,
    upload: uploadAttachment,
    cancel: cancelUploadingAttachment,
  } = useAttachmentUploader();

  let tags: string[] | undefined;
  if (draft.logbook) {
    tags = tagsLoaded[draft.logbook];
  }

  const submitEntry = useCallback(
    (newEntry: EntryFormType) => {
      if (kind === "newEntry") {
        return createEntry(newEntry);
      }
      if (kind[0] === "superseding") {
        return supersede(kind[1].id, newEntry);
      }
      return followUp(kind[1].id, newEntry);
    },
    [kind]
  );

  useEffect(() => {
    if (!logbooks) {
      fetchLogbooks().then((logbooks) =>
        setLogbooks(logbooks.map(({ name }) => name))
      );
    }
  }, [logbooks]);

  useEffect(() => {
    if (!tags) {
      fetchTags({ logbooks: [draft.logbook] }).then((tags) =>
        setTagsLoaded((tagsLoaded) => ({
          ...tagsLoaded,
          [draft.logbook]: tags,
        }))
      );
    }
  }, [tags, draft.logbook]);

  useEffect(() => {
    if (!shifts) {
      // TODO: fetch shifts
      setShifts(["Day shift", "Night shift"]);
    }
  }, [shifts]);

  const validators = {
    title: () => Boolean(draft.title),
    logbook: () => Boolean(draft.logbook),
    // It can either be undefined (meaning off) or a valid time, but it can't
    // be an empty string which signifies on with no time selected.
    eventAt: () => Boolean(draft.eventAt !== ""),
    shiftName: () => !draft.summarize || Boolean(draft.summarize.shift),
    shiftDate: () => !draft.summarize || Boolean(draft.summarize.date),
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

    const newEntry: EntryFormType = {
      ...draft,
      // Zero seconds
      attachments: draft.attachments.map(
        // We have already verified that all the ids are non null in the
        // attachment validator, so this is fine
        (attachment) => attachment.id as string
      ),
    };

    const id = await submitEntry(newEntry);
    removeDraft();

    refreshEntries();
    onEntryCreated(id);
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
    <div className="pb-2">
      <Suspense fallback={<Spinner className="m-auto" />}>
        {kind !== "newEntry" && (
          <>
            <TextDivider>
              {kind[0] === "followingUp" ? "Following up" : "Superseding"}
            </TextDivider>
            <div className="border-b pb-2 px-3 mb-3">
              <EntryRow
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
              className={cn(
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
                options={logbooks || []}
                isLoading={!logbooks}
                value={draft.logbook}
                setValue={(logbook) =>
                  updateDraft({ ...draft, logbook: logbook || "" })
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
              value={draft.tags}
              setValue={(tags) => updateDraft({ ...draft, tags: tags || [] })}
            />
          </label>
          <label className="text-gray-500 mb-1 flex items-center">
            <input
              type="checkbox"
              className={cn(Checkbox, "mr-2")}
              checked={draft.eventAt !== undefined}
              onChange={() =>
                updateDraft({
                  ...draft,
                  eventAt: draft.eventAt === undefined ? "" : undefined,
                })
              }
            />
            Explicit event time
          </label>
          <input
            type="datetime-local"
            disabled={draft.eventAt === undefined}
            step="1"
            onChange={(e) =>
              updateDraft({ ...draft, eventAt: e.currentTarget.value })
            }
            className={cn(
              Input,
              invalid.includes("eventAt") && InputInvalid,
              "block w-full mb-2"
            )}
          />
          <label className="text-gray-500 mb-1 flex items-center">
            <input
              type="checkbox"
              className={cn(Checkbox, "mr-2")}
              checked={draft.summarize !== undefined}
              onChange={() =>
                updateDraft({
                  ...draft,
                  summarize: draft.summarize
                    ? undefined
                    : { shift: "", date: dateToDateString(new Date()) },
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
              options={shifts || []}
              isLoading={!shifts}
              value={draft.summarize?.shift || null}
              setValue={(shift) =>
                updateDraft({
                  ...draft,
                  summarize: draft.summarize && {
                    ...draft.summarize,
                    shift: shift || "",
                  },
                })
              }
              invalid={invalid.includes("shiftName")}
              onBlur={() => validate("shiftName")}
              disabled={!draft.summarize}
            />
            <input
              type="date"
              value={draft.summarize?.date || ""}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  summarize: draft.summarize && {
                    ...draft.summarize,
                    date: e.currentTarget.value,
                  },
                })
              }
              className={cn(
                Input,
                invalid.includes("shiftDate") && InputInvalid,
                "block w-full"
              )}
              onBlur={() => validate("shiftDate")}
              disabled={!draft.summarize}
            />
          </div>

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
              className={cn(
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
            className={cn(Button, "block ml-auto mt-2")}
            value={
              kind === "newEntry"
                ? "Save"
                : kind[0] === "followingUp"
                ? "Follow up"
                : "Supersede"
            }
          />
        </form>
      </Suspense>
    </div>
  );
}
