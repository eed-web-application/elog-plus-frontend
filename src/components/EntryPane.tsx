import { FormEvent, useEffect, useState } from "react";
import { Entry, createEntry, fetchLogbooks } from "../api";
import Select from "./Select";
import { Button, IconButton, Input, InputInvalid } from "./base";
import cn from "classnames";

function EntryForm({
  onEntryCreated,
}: {
  onEntryCreated: (id: string) => void;
}) {
  const [logbooks, setLogbooks] = useState<null | string[]>(null);
  const [logbook, setLogbook] = useState<null | string>(null);
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

    const id = await createEntry({
      text,
      title,
      logbook: logbook as string,
      attachments: [],
      tags: [],
    });

    onEntryCreated(id);
  }

  return (
    <form noValidate onSubmit={submit}>
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
  );
}

export interface Props {
  entry?: Entry;
  fullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
  onCancel: () => void;
  onEntryCreated: (id: string) => void;
}

export default function EntryPane({
  entry,
  fullscreen,
  setFullscreen,
  onCancel,
  onEntryCreated,
}: Props) {
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
            {entry?.title || "New Entry"}
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
          dangerouslySetInnerHTML={entry ? { __html: entry.text } : undefined}
        >
          {entry ? undefined : <EntryForm onEntryCreated={onEntryCreated} />}
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
