import { FormEvent, useCallback, useContext, useEffect, useState } from "react";
import cn from "classnames";
import { useDropzone } from "react-dropzone";
import {
  Attachment,
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
import { Button, Input, InputInvalid } from "./base";
import EntryRow from "./EntryRow";
import MultiSelect from "./MultiSelect";
import AttachmentCard from "./AttachmentCard";
import { useDraftsStore } from "../draftsStore";
import EntryRefreshContext from "../EntryRefreshContext";

type LocalAttachment = Omit<Attachment, "id" | "previewState"> & {
  id: null | string;
};

export default function EntryForm({
  onEntryCreated,
  followingUp,
  superseding,
}: {
  onEntryCreated: (id: string) => void;
  followingUp?: Entry;
  superseding?: Entry;
}) {
  const {
    newEntry,
    getOrCreateSupersedingDraft,
    getOrCreateFollowUpDraft,
    updateSupersedingDraft,
    updateFollowUpDraft,
    updateNewEntryDraft,
    removeFollowUpDraft,
    removeSupersedingDraft,
    removeNewEntryDraft,
  } = useDraftsStore();
  const [logbooks, setLogbooks] = useState<null | string[]>(null);
  const [tags, setTags] = useState<null | string[]>(null);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const refreshEntries = useContext(EntryRefreshContext);

  const getDraft = useCallback(() => {
    if (superseding) {
      return getOrCreateSupersedingDraft(superseding);
    }
    if (followingUp) {
      return getOrCreateFollowUpDraft(followingUp);
    }
    return newEntry;
  }, [
    superseding,
    followingUp,
    getOrCreateSupersedingDraft,
    getOrCreateFollowUpDraft,
    newEntry,
  ]);

  const [draft, setDraft] = useState<EntryFormType>(getDraft());

  useEffect(() => {
    setDraft(getDraft());
  }, [setDraft, getDraft]);

  useEffect(() => {
    if (superseding) {
      updateSupersedingDraft(superseding.id, draft);
    } else if (followingUp) {
      updateFollowUpDraft(followingUp.id, draft);
    } else {
      updateNewEntryDraft(draft);
    }
  }, [
    draft,
    superseding,
    followingUp,
    updateSupersedingDraft,
    updateFollowUpDraft,
    updateNewEntryDraft,
  ]);

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
    // Ensure all attachments are downloaded
    attachments: () => attachments.length === 0,
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

    let id;
    if (followingUp) {
      id = await followUp(followingUp.id, draft);
      removeFollowUpDraft(followingUp.id);
    } else if (superseding) {
      id = await supersede(superseding.id, draft);
      removeSupersedingDraft(superseding.id);
    } else {
      id = await createEntry(draft);
      removeNewEntryDraft();
    }

    refreshEntries();
    onEntryCreated(id);
  }

  async function startAttachmentUpload(file: File) {
    const id = await uploadAttachment(file);

    setDraft((draft) => ({
      ...draft,
      attachments: [...draft.attachments, id],
    }));
    setAttachments((attachments) => {
      const attachmentIndex = attachments.findIndex(
        ({ fileName }) => fileName === file.name
      );
      const newAttachments = attachments.slice();
      newAttachments[attachmentIndex].id = id;
      return newAttachments;
    });
  }

  async function removeAttachment(attachment: LocalAttachment) {
    if (attachment.id) {
      setDraft((draft) => ({
        ...draft,
        attachments: draft.attachments.filter((id) => id !== attachment.id),
      }));
    }
    setAttachments((attachments) =>
      attachments.filter(({ fileName }) => fileName !== attachment.fileName)
    );
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.filter((file) => {
        if (attachments.find(({ fileName }) => fileName === file.name)) {
          alert("Can't upload two files with the same name");
          return false;
        }
        return true;
      });

      newFiles.forEach(startAttachmentUpload);

      const newAttachments = newFiles.map((file) => ({
        id: null,
        contentType: file.type,
        fileName: file.name,
      }));

      setAttachments((attachments) => attachments.concat(newAttachments));
    },
  });

  const entryPreview = followingUp || superseding;

  return (
    <div className="px-3">
      {entryPreview && (
        <div className="border-b pb-2">
          <EntryRow entry={entryPreview} showDate expandable showFollowUps />
        </div>
      )}
      <form noValidate onSubmit={submit} className="mt-3">
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
            onChange={(e) =>
              setDraft((draft) => ({ ...draft, title: e.target.value }))
            }
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
                setDraft((draft) => ({ ...draft, logbook: logbook || "" }))
              }
              invalid={invalid.includes("logbook")}
              onBlur={() => validate("logbook")}
            />
          </label>
        )}
        <label className="text-gray-500 block mb-2">
          Tags
          <MultiSelect
            isLoading={!tags}
            predefinedOptions={tags || []}
            value={draft.tags}
            setValue={(tags) =>
              setDraft((draft) => ({ ...draft, tags: tags || [] }))
            }
          />
        </label>
        <label className="text-gray-500 block mb-2">
          Text
          <textarea
            value={draft.text}
            onChange={(e) =>
              setDraft((draft) => ({ ...draft, text: e.target.value }))
            }
            placeholder=""
            className={cn(Input, "block w-full h-48")}
          />
        </label>
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
                    key={attachment.fileName}
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
          value="Create"
        />
      </form>
    </div>
  );
}
