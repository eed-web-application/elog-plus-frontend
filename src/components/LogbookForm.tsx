import { FormEvent, useState } from "react";
import cn from "classnames";
import { Logbook } from "../api";
import { Button, IconButton, Input, InputInvalid, InputSmall } from "./base";
import { useLogbookFormsStore } from "../logbookFormsStore";

interface Props {
  logbook: Logbook;
}

let idCounter = 0;

export default function LogbookForm({ logbook }: Props) {
  const [form, setForm] = useLogbookFormsStore((state) =>
    state.startEditing(logbook)
  );

  const [newTag, setNewTag] = useState<string>("");
  const [newShift, setNewShift] = useState<string>("");

  const validators = {
    name: () => Boolean(form.name),
  };

  const shiftValidators = {
    shiftName: (id: string) =>
      Boolean(form.shifts.find((shift) => shift.id === id)?.name),
    shiftFrom: (id: string) =>
      Boolean(form.shifts.find((shift) => shift.id === id)?.from),
    shiftTo: (id: string) =>
      Boolean(form.shifts.find((shift) => shift.id === id)?.to),
  };

  type Ident =
    | keyof typeof validators
    | `${keyof typeof shiftValidators}/${string}`;

  const [invalid, setInvalid] = useState<Ident[]>([]);

  function onValidate(valid: boolean, field: Ident): boolean {
    if (valid) {
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
      if (
        onValidate(
          validators[field as keyof typeof validators](),
          field as Ident
        )
      ) {
        invalid = true;
      }
    }
    for (const shift of form.shifts) {
      for (const field in shiftValidators) {
        if (
          onValidate(
            shiftValidators[field as keyof typeof shiftValidators](shift.id),
            `${field}/${shift.id}` as Ident
          )
        ) {
          invalid = true;
        }
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
    setForm({ ...form, tags: [...form.tags, { name: newTag }] });
  }

  function createShift(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    idCounter += 1;

    setNewShift("");
    setForm({
      ...form,
      shifts: [...form.shifts, { id: idCounter.toString(), name: newShift }],
    });
  }

  function removeTag(index: number) {
    const newTags = [...form.tags];
    newTags.splice(index, 1);

    setForm({ ...form, tags: newTags });
  }

  function removeShift(index: number) {
    const newShifts = [...form.shifts];
    newShifts.splice(index, 1);

    setForm({ ...form, shifts: newShifts });
  }

  function changeShiftName(index: number, name: string) {
    const updatedShifts = [...form.shifts];
    updatedShifts[index] = { ...updatedShifts[index], name };

    setForm({
      ...form,
      shifts: updatedShifts,
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
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onBlur={() => onValidate(validators.name(), "name")}
        />
      </label>
      <div className="text-gray-500">Tags</div>
      <div
        className={cn(
          "mb-2 border rounded-lg bg-gray-50 w-full flex flex-col p-2",
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
      <div className="text-gray-500">Shifts</div>
      <div
        className={cn(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
          form.shifts.length === 0 &&
            "items-center justify-center text-lg text-gray-500"
        )}
      >
        {form.shifts.length === 0 ? (
          <div className="my-3">No Shifts. Create one below.</div>
        ) : (
          <>
            <div className="divide-y">
              {form.shifts.map((shift, index) => (
                <div
                  key={shift.id}
                  className="flex justify-between py-2 items-center gap-1"
                >
                  <input
                    type="text"
                    className={cn(
                      InputSmall,
                      invalid.includes(`shiftName/${shift.id}`) && InputInvalid,
                      "flex-1 min-w-0"
                    )}
                    value={shift.name}
                    onChange={(e) =>
                      changeShiftName(index, e.currentTarget.value)
                    }
                    onBlur={() =>
                      onValidate(
                        shiftValidators.shiftName(shift.id),
                        `shiftName/${shift.id}`
                      )
                    }
                  />
                  <div className="gap-2 self-end flex items-center">
                    <input
                      className={cn(
                        InputSmall,
                        invalid.includes(`shiftFrom/${shift.id}`) &&
                          InputInvalid,
                        "w-32"
                      )}
                      type="time"
                      onBlur={() =>
                        onValidate(
                          shiftValidators.shiftFrom(shift.id),
                          `shiftFrom/${shift.id}`
                        )
                      }
                    />
                    <div className="text-gray-500">to</div>
                    <input
                      className={cn(
                        InputSmall,
                        invalid.includes(`shiftTo/${shift.id}`) && InputInvalid,
                        "w-32"
                      )}
                      type="time"
                      onBlur={() =>
                        onValidate(
                          shiftValidators.shiftTo(shift.id),
                          `shiftTo/${shift.id}`
                        )
                      }
                    />
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    tabIndex={0}
                    className={cn(IconButton, "text-gray-500")}
                    onClick={() => removeShift(index)}
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
        <form
          noValidate
          className="relative mt-2 w-full"
          onSubmit={createShift}
        >
          <input
            className={cn(Input, "w-full pr-12")}
            type="text"
            value={newShift}
            onChange={(e) => setNewShift(e.currentTarget.value)}
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
