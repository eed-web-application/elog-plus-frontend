import { FormEvent, useCallback, useContext, useEffect, useState } from "react";
import cn from "classnames";
import { useDropzone } from "react-dropzone";
import {
  Entry,
  EntryForm as EntryFormType,
  createEntry,
  createTag,
  fetchLogbooks,
  fetchTags,
  followUp,
  supersede,
  uploadAttachment,
} from "../api";
import Select from "./Select";
import { Button, Checkbox, Input, InputInvalid } from "./base";
import EntryRow from "./EntryRow";
import MultiSelect from "./MultiSelect";
import AttachmentCard from "./AttachmentCard";
import {
  DEFAULT_DRAFT,
  Draft,
  LocalUploadedAttachment,
  useDraftsStore,
} from "../draftsStore";
import EntryRefreshContext from "../EntryRefreshContext";
import EntryTextEditor from "./EntryTextEditor";
import TextDivider from "./TextDivider";

type LocalAttachment = {
  id?: string;
} & Omit<LocalUploadedAttachment, "id">;

export default function EntryForm({
  onEntryCreated,
  followingUp,
  superseding,
}: {
  onEntryCreated: (id: string) => void;
  followingUp?: Entry;
  superseding?: Entry;
}) {
  const [logbooks, setLogbooks] = useState<null | string[]>(null);
  const [tags, setTags] = useState<null | string[]>(null);
  const [attachmentsUploading, setAttachmentsUploading] = useState<
    LocalAttachment[]
  >([]);
  const refreshEntries = useContext(EntryRefreshContext);
  const [draft, setDraft, removeDraft] = useDraftsStore((state) => {
    if (superseding) {
      return [
        state.supersedes[superseding.id] || { ...superseding },
        (draft: Draft) => state.updateSupersedingDraft(superseding.id, draft),
        () => state.removeSupersedingDraft(superseding.id),
      ];
    }
    if (followingUp) {
      return [
        state.followUps[followingUp.id] || {
          ...DEFAULT_DRAFT,
          logbook: followingUp.logbook,
        },
        (draft: Draft) => state.updateFollowUpDraft(followingUp.id, draft),
        () => state.removeFollowUpDraft(followingUp.id),
      ];
    }
    return [
      state.newEntry,
      state.updateNewEntryDraft,
      state.removeNewEntryDraft,
    ];
  });

  const submitEntry = useCallback(
    (newEntry: EntryFormType) => {
      if (superseding) {
        return supersede(superseding.id, newEntry);
      }
      if (followingUp) {
        return followUp(followingUp.id, newEntry);
      }
      return createEntry(newEntry);
    },
    [superseding, followingUp]
  );

  useEffect(() => {
    if (!logbooks) {
      fetchLogbooks().then(setLogbooks);
    }
  }, [logbooks]);

  useEffect(() => {
    if (!tags) {
      fetchTags().then(setTags);
    }
  }, [tags]);

  const validators = {
    title: () => Boolean(draft.title),
    logbook: () => Boolean(draft.logbook),
    // It can either be undefined (meaning off) or a valid time, but it can't
    // be an empty string which signifies on with no time selected.
    eventAt: () => Boolean(draft.eventAt !== ""),
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

    await Promise.all(
      draft.tags.filter((tag) => !tags?.includes(tag)).map(createTag)
    );

    const newEntry: EntryFormType = {
      ...draft,
      // Zero seconds
      attachments: draft.attachments.map(
        // We have already verified that all the ids are non null in the
        // attachment validator, so this is fine
        (attachment) => attachment.id as string
      ),
    };

    if (draft.eventAt) {
      newEntry.eventAt = draft.eventAt + ".000";
    }

    const id = await submitEntry(newEntry);
    removeDraft();

    refreshEntries();
    onEntryCreated(id);
  }

  async function startUploadingAttachment(
    file: File
  ): Promise<LocalUploadedAttachment | undefined> {
    if (
      attachmentsUploading.some(
        (attachment) => attachment.fileName === file.name
      )
    ) {
      alert("Can't upload two files with the same name at the same time");
      return;
    }

    setAttachmentsUploading((attachments) => [
      ...attachments,
      { fileName: file.name, contentType: file.type },
    ]);

    const id = await uploadAttachment(file);

    setAttachmentsUploading((attachments) =>
      attachments.filter((attachment) => attachment.fileName !== file.name)
    );
    return { fileName: file.name, contentType: file.type, id };
  }

  async function removeAttachment(attachment: LocalAttachment) {
    if (attachment.id) {
      setDraft({
        ...draft,
        attachments: draft.attachments.filter(({ id }) => id !== attachment.id),
      });
      return;
    }

    setAttachmentsUploading((attachments) =>
      attachments.filter(({ fileName }) => fileName !== attachment.fileName)
    );
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const attachments = (
        await Promise.all(acceptedFiles.map(startUploadingAttachment))
      ).filter((x) => x) as LocalUploadedAttachment[];

      setDraft({
        ...draft,
        attachments: draft.attachments.concat(attachments),
      });
    },
  });

  const entryPreview = followingUp || superseding;
  const attachments = (draft.attachments as LocalAttachment[]).concat(
    attachmentsUploading
  );

  return (
    <div className="pb-2">
      {entryPreview && (
        <>
          <TextDivider>
            {followingUp ? "Following up" : "Superseding"}
          </TextDivider>
          <div className="border-b pb-2 px-3 mb-3">
            <EntryRow
              entry={entryPreview}
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
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            onBlur={() => validate("title")}
          />
        </label>
        {!followingUp && !superseding && (
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
                setDraft({ ...draft, logbook: logbook || "" })
              }
              invalid={invalid.includes("logbook")}
              onBlur={() => validate("logbook")}
            />
          </label>
        )}
        <label className="text-gray-500 mb-2 flex items-center">
          <input
            type="checkbox"
            className={cn(Checkbox, "mr-2")}
            checked={draft.eventAt !== undefined}
            onChange={() =>
              setDraft({
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
            setDraft({ ...draft, eventAt: e.currentTarget.value })
          }
          className={cn(
            Input,
            invalid.includes("eventAt") && InputInvalid,
            "block w-full"
          )}
        />

        <label className="text-gray-500 block mb-2">
          Tags
          <MultiSelect
            isLoading={!tags}
            predefinedOptions={tags || []}
            value={draft.tags}
            setValue={(tags) => setDraft({ ...draft, tags: tags || [] })}
          />
        </label>
        {/* Not using a label here, because there are some weird */}
        {/* interactions with having multiple inputs under the same label */}
        <div className="text-gray-500 block mb-2">
          Text
          <EntryTextEditor
            value={draft.text}
            onChange={(text) => setDraft({ ...draft, text })}
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
          value={followingUp ? "Follow up" : superseding ? "Supersede" : "Save"}
        />
      </form>
    </div>
  );
}
