import { FormEvent, useEffect, useState } from "react";
import { Entry, createEntry, fetchLogbooks, followUp, supersede } from "../api";
import Select from "./Select";
import { Button, IconButton, Input, InputInvalid } from "./base";
import cn from "classnames";
import EntryRow from "./EntryRow";

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

  const validators = {
    title: () => Boolean(title),
    logbook: () => Boolean(logbook),
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
      attachments: [],
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

  const entryPreview = followingUp || superseding;

  return (
    <>
      {entryPreview && (
        <div className="border-b pb-2">
          <EntryRow entry={entryPreview} showDate previewable showFollowUps />
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
