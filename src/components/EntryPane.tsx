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
import { Button, IconButton, Input, InputInvalid } from "./base";
import EntryRow from "./EntryRow";
import AttachmentIcon from "./AttachmentIcon";

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

function EntryForm({
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
    <>
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
    </>
  );
}

export type PaneKind =
  | ["followingUp", Entry]
  | ["newEntry"]
  | ["viewingEntry", Entry]
  | ["superseding", Entry];

export interface Props {
  kind: PaneKind;
  fullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
  onCancel: () => void;
  onEntryCreated: (id: string) => void;
}

export default function EntryPane({
  kind,
  fullscreen,
  setFullscreen,
  onCancel,
  onEntryCreated,
}: Props) {
  let headerText;
  if (kind[0] === "viewingEntry") {
    headerText = kind[1].title;
  } else if (kind[0] === "followingUp") {
    headerText = "Follow up";
  } else if (kind[0] === "superseding") {
    headerText = "Supersede";
  } else {
    headerText = "New Entry";
  }

  let body;
  if (kind[0] === "followingUp") {
    body = <EntryForm onEntryCreated={onEntryCreated} followingUp={kind[1]} />;
  } else if (kind[0] === "superseding") {
    body = <EntryForm onEntryCreated={onEntryCreated} superseding={kind[1]} />;
  } else if (kind[0] === "newEntry") {
    body = <EntryForm onEntryCreated={onEntryCreated} />;
  }

  return (
    <>
      <div
        className={cn(
          "overflow-y-auto mx-auto container absolute left-0 right-0 top-0 bottom-0 bg-white z-30 mt-6 rounded-lg",
          fullscreen ||
            "sm:w-1/2 sm:relative sm:rounded-none sm:mt-0 sm:bg-transparent"
        )}
      >
        <div className="flex items-center px-1 pt-1">
          {fullscreen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={IconButton}
              tabIndex={0}
              onClick={() => setFullscreen(false)}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={IconButton}
                tabIndex={0}
                onClick={onCancel}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                  className="block sm:hidden"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  className="hidden sm:block"
                />
              </svg>
            </>
          )}

          <div className="flex-1 text-center overflow-hidden text-ellipsis whitespace-nowrap">
            {headerText}
          </div>

          {fullscreen || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={cn(IconButton, "sm:block hidden")}
              tabIndex={0}
              onClick={() => setFullscreen(true)}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
          )}
        </div>
        <div
          className="p-3 pt-2"
          dangerouslySetInnerHTML={
            kind[0] === "viewingEntry" ? { __html: kind[1].text } : undefined
          }
        >
          {body}
        </div>
      </div>
      <div
        className={cn(
          "absolute left-0 right-0 bottom-0 top-0 bg-gray-500 bg-opacity-50 z-20",
          fullscreen || "sm:hidden"
        )}
      />
    </>
  );
}
