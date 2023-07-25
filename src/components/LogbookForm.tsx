import { FormEvent, useEffect, useState } from "react";
import cn from "classnames";
import { Logbook, Tag } from "../api";
import { Button, IconButton, Input, InputInvalid } from "./base";

interface Props {
  logbook: Logbook;
}

interface LogbookForm extends Omit<Logbook, "tags"> {
  tags: (Omit<Tag, "id"> & { id?: string })[];
}

export default function LogbookForm({ logbook }: Props) {
  const [form, setForm] = useState<LogbookForm>(logbook);
  const [newTag, setNewTag] = useState<string>("");

  useEffect(() => {
    setForm(logbook);
  }, [logbook]);

  const validators = {
    name: () => Boolean(form.name),
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

  function save() {
    let invalid = false;
    for (const field in validators) {
      if (!validate(field as Field)) {
        invalid = true;
      }
    }
    if (invalid) {
      return;
    }

    // TODO
  }

  function createTag(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setNewTag("");
    setForm((form) => ({ ...form, tags: [...form.tags, { name: newTag }] }));
  }

  function removeTag(index: number) {
    setForm((form) => {
      const newTags = [...form.tags];
      newTags.splice(index, 1);
      return { ...form, tags: newTags };
    });
  }

  const updated = JSON.stringify(form) === JSON.stringify(logbook);

  return (
    <div className="px-3 pb-3">
      <label className="text-gray-500 block mb-2">
        Name
        <input
          required
          type="text"
          className={cn(
            Input,
            invalid.includes("name") && InputInvalid,
            "block w-full"
          )}
          value={form.name}
          onChange={(e) =>
            setForm((form) => ({ ...form, name: e.target.value }))
          }
          onBlur={() => validate("name")}
        />
      </label>
      <div className="text-gray-500">Tags</div>
      <div
        className={cn(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
          form.tags.length === 0 &&
            "items-center justify-center text-lg text-gray-500"
        )}
      >
        {form.tags.length === 0 ? (
          <div className="my-3">No tags. Create one below.</div>
        ) : (
          <>
            <div className="divide-y">
              {form.tags.map((tag, index) => (
                <div
                  key={tag.id || tag.name}
                  className="flex justify-between px-2 items-center"
                >
                  {tag.name}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    tabIndex={0}
                    className={cn(IconButton, "text-gray-500")}
                    onClick={() => removeTag(index)}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </>
        )}
        <form noValidate className="relative mt-2 w-full" onSubmit={createTag}>
          <input
            className={cn(Input, "w-full pr-12")}
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.currentTarget.value)}
          />
          <button
            type="submit"
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-blue-500 rounded-r-lg text-white p-2.5"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
        </form>
      </div>
      <button
        disabled={updated}
        className={cn(Button, "block ml-auto mt-3")}
        onClick={save}
      >
        Save
      </button>
    </div>
  );
}
