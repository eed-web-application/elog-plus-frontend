import React, { FormEvent, useEffect, useState } from "react";
import cn from "classnames";
import { useDropzone } from "react-dropzone";
import {
  Entry,
  createEntry,
  fetchLogbooks,
  followUp,
  supersede,
  uploadAttachment,
} from "../api";
import Select from "./Select";
import { Button, Input, InputInvalid } from "./base";
import EntryRow from "./EntryRow";
import AttachmentIcon from "./AttachmentIcon";
import MultiSelect from "./MultiSelect";

type Attachment = {
  id: null | string;
  filename: string;
  mimeType: string;
};

function AttachmentCard({
  isLoading,
  filename,
  mimeType,
  className,
  onRemove,
}: {
  isLoading?: boolean;
  filename: string;
  mimeType: string;
  className: string;
  onRemove: () => void;
}) {
  function remove(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.stopPropagation();
    onRemove();
  }

  return (
    <div className={cn(className, "relative w-20 overflow-hidden")}>
      <div className="p-4 h-20 bg-gray-200 shadow flex flex-col justify-center items-center rounded-lg">
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
          <AttachmentIcon mimeType={mimeType} className="w-full h-full" />
        )}
      </div>
      {/* TODO: Add tooltip */}
      <div className="text-sm truncate">{filename}</div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6 absolute top-0 right-0 p-0.5 hover:bg-gray-300 rounded-full cursor-pointer"
        onClick={remove}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  );
}

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
  const [logbook, setLogbook] = useState<null | string>(
    followingUp?.logbook || superseding?.logbook || null
  );
  const [title, setTitle] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const validators = {
    title: () => Boolean(title),
    logbook: () => Boolean(logbook),
    attachments: () => attachments.every((attachment) => attachment.id),
  };

  type Field = keyof typeof validators;

  const [invalid, setInvalid] = useState<Field[]>([]);

  useEffect(() => {
    if (!logbooks) {
      fetchLogbooks().then((logbooks) => setLogbooks(logbooks));
    }
  }, [logbooks]);

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
      tags: [],
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
        ({ filename }) => filename === file.name
      );
      const newAttachments = attachments.slice();
      newAttachments[attachmentIndex].id = id;
      return newAttachments;
    });
  }

  async function removeAttachment(attachment: Attachment) {
    setAttachments((attachments) =>
      attachments.filter(({ filename }) => filename !== attachment.filename)
    );
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.filter((file) => {
        if (attachments.find(({ filename }) => filename === file.name)) {
          alert("Can't upload two files with the same name");
          return false;
        }
        return true;
      });

      newFiles.forEach(startUploadAttachment);

      const newAttachments = newFiles.map((file) => ({
        id: null,
        mimeType: file.type,
        filename: file.name,
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
            options={["tag-1", "tag-2", "tag-3"]}
            value={tags}
            setValue={setTags}
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
                    key={attachment.filename}
                    className="mr-3 mb-3"
                    isLoading={!attachment.id}
                    filename={attachment.filename}
                    mimeType={attachment.mimeType}
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
