import { FormEvent, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import {
  Logbook,
  LogbookUpdation,
  Permissions,
  ServerError,
  Shift,
  updateLogbook,
} from "../api";
import { Button, IconButton, Input, InputInvalid } from "./base";
import { useLogbookFormsStore } from "../logbookFormsStore";
import { localToUtc, utcToLocal } from "../utils/datetimeConversion";
import reportServerError from "../reportServerError";
import Select from "./Select";
import useGroups from "../hooks/useGroups";

interface Props {
  logbook: Logbook;
  onSave: () => void;
}

let idCounter = 0;

const DEFAULT_PERMISSIONS: Permissions = {
  read: true,
  write: false,
};

export default function LogbookForm({ logbook, onSave }: Props) {
  const [form, setForm, removeForm] = useLogbookFormsStore((state) =>
    state.startEditing(logbook)
  );
  const queryClient = useQueryClient();

  const { groups } = useGroups();

  const [newTag, setNewTag] = useState<string>("");
  const [newShift, setNewShift] = useState<string>("");
  const [newGroupPermission, setNewGroupPermission] = useState<string | null>(
    null
  );

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

  async function save() {
    let invalid = false;
    for (const field in validators) {
      if (
        !onValidate(
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
          !onValidate(
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

    // Remove temp ids
    const logbookUpdation: LogbookUpdation = {
      ...form,
      shifts: form.shifts.map(({ id, ...shift }) => ({
        ...(shift as Shift),
        id: id.startsWith("_") ? undefined : id,
      })),
    };

    try {
      await updateLogbook(logbookUpdation);
      removeForm();

      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "tags" &&
          Array.isArray(queryKey[1]) &&
          (queryKey[1].includes(logbook.name) || queryKey[1].length === 0),
      });
      queryClient.invalidateQueries({ queryKey: ["logbooks"] });

      onSave();
    } catch (e) {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not save logbook", e);
    }
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
      shifts: [
        ...form.shifts,
        { id: `_${idCounter.toString()}`, name: newShift, from: "", to: "" },
      ],
    });
  }

  function createPermission(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newGroupPermission) {
      return;
    }

    setNewGroupPermission(null);
    setForm({
      ...form,
      permissions: [
        ...form.permissions,
        { group: newGroupPermission, permissions: DEFAULT_PERMISSIONS },
      ],
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

  function removePermission(index: number) {
    const newPermissions = [...form.permissions];
    newPermissions.splice(index, 1);

    setForm({ ...form, permissions: newPermissions });
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
          className={twMerge(
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
        className={twJoin(
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
                    className={twJoin(IconButton, "text-gray-500")}
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
            className={twJoin(Input, "w-full pr-12")}
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
        className={twJoin(
          "border mb-2 rounded-lg bg-gray-50 w-full flex flex-col p-2",
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
                    className={twMerge(
                      Input,
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
                      className={twMerge(
                        Input,
                        invalid.includes(`shiftFrom/${shift.id}`) &&
                          InputInvalid,
                        "w-32"
                      )}
                      type="time"
                      value={
                        form.shifts[index].from
                          ? utcToLocal(form.shifts[index].from)
                          : ""
                      }
                      onChange={(e) => {
                        const updatedShifts = [...form.shifts];
                        updatedShifts[index] = {
                          ...updatedShifts[index],
                          from: e.currentTarget.value
                            ? localToUtc(e.currentTarget.value)
                            : "",
                        };
                        setForm({ ...form, shifts: updatedShifts });
                      }}
                      onBlur={() =>
                        onValidate(
                          shiftValidators.shiftFrom(shift.id),
                          `shiftFrom/${shift.id}`
                        )
                      }
                    />
                    <div className="text-gray-500">to</div>
                    <input
                      className={twMerge(
                        Input,
                        invalid.includes(`shiftTo/${shift.id}`) && InputInvalid,
                        "w-32"
                      )}
                      type="time"
                      value={
                        form.shifts[index].to
                          ? utcToLocal(form.shifts[index].to)
                          : ""
                      }
                      onChange={(e) => {
                        const updatedShifts = [...form.shifts];
                        updatedShifts[index] = {
                          ...updatedShifts[index],
                          to: e.currentTarget.value
                            ? localToUtc(e.currentTarget.value)
                            : "",
                        };
                        setForm({ ...form, shifts: updatedShifts });
                      }}
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
                    className={twJoin(IconButton, "text-gray-500")}
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
            className={twMerge(Input, "w-full pr-12")}
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
      <div className="text-gray-500">Permissions</div>
      <div
        className={twJoin(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
          form.permissions.length === 0 &&
            "items-center justify-center text-lg text-gray-500"
        )}
      >
        {form.permissions.length === 0 ? (
          <div className="my-3">No permissions. Create one below.</div>
        ) : (
          <>
            <div className="divide-y">
              {form.permissions.map((permission, index) => (
                <div
                  key={permission.group}
                  className="flex justify-between px-2 py-1 items-center"
                >
                  <div className="flex-grow">{permission.group}</div>

                  <Select
                    className="w-32"
                    value={permission.permissions.write ? "Write" : "Read"}
                    options={["Write", "Read"]}
                    setValue={(permission) => {
                      const updatedPermissions = [...form.permissions];
                      updatedPermissions[index] = {
                        ...updatedPermissions[index],
                        permissions:
                          permission === "Write"
                            ? { write: true, read: true }
                            : { write: false, read: true },
                      };
                      setForm({ ...form, permissions: updatedPermissions });
                    }}
                    nonsearchable
                  />

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    tabIndex={0}
                    className={twJoin(IconButton, "text-gray-500")}
                    onClick={() => removePermission(index)}
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
          onSubmit={createPermission}
        >
          <Select
            className={twMerge(Input, "w-full pr-12")}
            value={newGroupPermission}
            options={(groups || []).filter(
              (name) =>
                !form.permissions.find(
                  (permission) => permission.group === name
                )
            )}
            setValue={setNewGroupPermission}
          />
          <button
            type="submit"
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-blue-500 rounded-r-lg text-white p-2.5 disabled:bg-blue-300 disabled:text-gray-100"
            disabled={!newGroupPermission}
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
        className={twJoin(Button, "block ml-auto mt-3")}
        onClick={save}
      >
        Save
      </button>
    </div>
  );
}
