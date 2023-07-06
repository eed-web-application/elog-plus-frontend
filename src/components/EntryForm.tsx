import { FormEvent, useEffect, useState } from "react";
import cn from "classnames";
import { useDropzone } from "react-dropzone";
import {
  Attachment,
  Entry,
  createEntry,
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
  const [logbooks, setLogbooks] = useState<null | string[]>(null);
  const [tags, setTags] = useState<null | string[]>(null);
  const [logbook, setLogbook] = useState<null | string>(
    followingUp?.logbook || superseding?.logbook || null
  );
  const [title, setTitle] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const validators = {
    title: () => Boolean(title),
    logbook: () => Boolean(logbook),
    // Ensure all attachments are downloaded
    attachments: () => attachments.every((attachment) => attachment.id),
  };

  type Field = keyof typeof validators;

  const [invalid, setInvalid] = useState<Field[]>([]);

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

    let id;
    const entry = {
      text,
      title,
      logbook: logbook as string,
      attachments: attachments.map(({ id }) => id) as string[],
      tags: selectedTags,
    };
    if (followingUp) {
      id = await followUp(followingUp.id, entry);
    } else if (superseding) {
      id = await supersede(superseding.id, entry);
    } else {
      id = await createEntry(entry);
    }

    onEntryCreated(id);
  }

  async function startUploadAttachment(file: File) {
    const id = await uploadAttachment(file);

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

      newFiles.forEach(startUploadAttachment);

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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
              value={logbook}
              setValue={setLogbook}
              invalid={invalid.includes("logbook")}
              onBlur={() => validate("logbook")}
            />
          </label>
        )}
        <label className="text-gray-500 block mb-2">
          Text
          <textarea
            onChange={(e) => setText(e.currentTarget.value)}
            value={text}
            placeholder=""
            className={cn(Input, "block w-full h-48")}
          />
        </label>
        <label className="text-gray-500 block mb-2">
          Tags
          <MultiSelect
            isLoading={!tags}
            predefinedOptions={tags || []}
            value={selectedTags}
            setValue={setSelectedTags}
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
