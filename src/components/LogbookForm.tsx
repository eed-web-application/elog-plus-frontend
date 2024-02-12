import { FormEvent, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogbookUpdation,
  ServerError,
  Shift,
  updateLogbook,
  AuthorizationType,
  LogbookWithAuth,
} from "../api";
import { Button, IconButton, Input, InputInvalid } from "./base";
import { useLogbookFormsStore } from "../logbookFormsStore";
import { localToUtc, utcToLocal } from "../utils/datetimeConversion";
import reportServerError from "../reportServerError";
import Select from "./Select";
// import useGroups from "../hooks/useGroups";
import useUsers from "../hooks/useUsers";

interface Props {
  logbook: LogbookWithAuth;
  onSave: () => void;
}

const DEFAULT_AUTHORIZATION: AuthorizationType = "Read";

let idCounter = 0;

export default function LogbookForm({ logbook, onSave }: Props) {
  const [form, setForm, removeForm] = useLogbookFormsStore((state) =>
    state.startEditing(logbook)
  );
  const queryClient = useQueryClient();

  const [newTag, setNewTag] = useState<string>("");
  const [newShift, setNewShift] = useState<string>("");
  // const [newGroupAuthorization, setNewGroupAuthorization] = useState<
  //   string | null
  // >(null);
  const [newUserAuthorization, setNewUserAuthorizations] = useState<
    string | null
  >(null);
  // const [groupSearch, setGroupSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // const { groups, isLoading: isGroupsLoading } = useGroups({
  //   search: groupSearch,
  // });
  const { users, isLoading: isUsersLoading } = useUsers({ search: userSearch });

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

    // Covers the case whree a user deletes a tag and creates a new one with
    // the same name
    const resolvedTags = form.tags.map((tag) => {
      if (tag.id) {
        return tag;
      }

      return logbook.tags.find(({ name }) => name === tag.name) || tag;
    });

    const resolvedAuthorization = form.authorizations.map((authorization) => {
      if (authorization.id) {
        return authorization;
      }

      return (
        logbook.authorizations.find(
          ({ owner }) => owner === authorization.owner
        ) || authorization
      );
    });

    const logbookUpdation: LogbookUpdation = {
      id: form.id,
      name: form.name,
      tags: resolvedTags,
      authorization: resolvedAuthorization,
      // Remove temp ids
      shifts: form.shifts.map(({ id, ...shift }) => ({
        ...(shift as Shift),
        id: id.startsWith("_") ? undefined : id,
      })),
    };

    try {
      await updateLogbook(logbookUpdation);

      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "tags" &&
          Array.isArray(queryKey[1]) &&
          (queryKey[1].includes(logbook.name) || queryKey[1].length === 0),
      });

      await queryClient.invalidateQueries({ queryKey: ["logbooks"] });

      removeForm();
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

  // function createGroupAuthorization(e: FormEvent<HTMLFormElement>) {
  //   e.preventDefault();
  //
  //   if (!newGroupAuthorization) {
  //     return;
  //   }
  //
  //   setNewGroupAuthorization(null);
  //   setForm({
  //     ...form,
  //     authorizations: [
  //       ...form.authorizations,
  //       // FIXME
  //       // { group: newGroupAuthorization, authorizations: DEFAULT_authorizations },
  //     ],
  //   });
  // }

  function createUserAuthorization(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newUserAuthorization) {
      return;
    }

    setNewUserAuthorizations(null);
    setForm({
      ...form,
      authorizations: [
        ...form.authorizations,
        {
          owner: newUserAuthorization,
          authorizationType: DEFAULT_AUTHORIZATION,
          ownerType: "User",
        },
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

  function removeAuthorization(index: number) {
    const newAuthorizations = [...form.authorizations];
    newAuthorizations.splice(index, 1);

    setForm({ ...form, authorizations: newAuthorizations });
  }

  function changeShiftName(index: number, name: string) {
    const updatedShifts = [...form.shifts];
    updatedShifts[index] = { ...updatedShifts[index], name };

    setForm({
      ...form,
      shifts: updatedShifts,
    });
  }

  const userAuthorizations = form.authorizations;
  // FIXME
  // const groupAuthorizations = [];
  // const groupAuthorizations = form.authorizations.filter(
  //   (authorization) => "group" in authorization
  // ) as GroupAuthorization[];

  const updated = JSON.stringify(form) === JSON.stringify(logbook);

  return (
    <div className="px-3 pb-3">
      <label className="block mb-2 text-gray-500">
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
                  className="flex justify-between items-center px-2"
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
            className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg disabled:text-gray-100 disabled:bg-blue-300"
            disabled={Boolean(form.tags.find(({ name }) => name === newTag))}
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
                  className="flex gap-1 justify-between items-center py-2"
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
                  <div className="flex gap-2 items-center self-end">
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
            className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg"
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
      {/*
      <div className="text-gray-500">Group Authorizations</div>
      <div
        className={twJoin(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2 mb-2",
          groupAuthorizations.length === 0 &&
            "items-center justify-center text-lg text-gray-500"
        )}
      >
        {groupAuthorizations.length === 0 ? (
          <div className="my-3">No authorizations. Create one below.</div>
        ) : (
          <>
            <div className="divide-y">
              {groupAuthorizations.map((authorization) => (
                <div
                  key={authorization.group}
                  className="flex justify-between items-center py-1 px-2"
                >
                  <div className="flex-grow">{authorization.group}</div>

                  <Select
                    className="w-32"
                    value={
                      authorization.authorizations.write ? "Write" : "Read"
                    }
                    options={["Write", "Read"]}
                    setValue={(updatedAuthorization) => {
                      const updatedAuthorizations = [...form.authorizations];
                      const index = form.authorizations.findIndex(
                        (otherAuthorization) =>
                          otherAuthorization === authorization
                      );

                      updatedAuthorizations[index] = {
                        ...updatedAuthorizations[index],
                        authorizations:
                          updatedAuthorization === "Write"
                            ? { write: true, read: true }
                            : { write: false, read: true },
                      };
                      setForm({
                        ...form,
                        authorizations: updatedAuthorizations,
                      });
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
                    onClick={() =>
                      removeAuthorization(
                        form.authorizations.findIndex(
                          (otherAuthorization) =>
                            otherAuthorization === authorization
                        )
                      )
                    }
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
          onSubmit={createGroupAuthorization}
        >
          <Select
            className="pr-12 w-full"
            value={newGroupAuthorization}
            onSearchChange={setGroupSearch}
            isLoading={isGroupsLoading}
            options={(groups || [])
              .filter(
                (group) =>
                  !groupAuthorizations.some(
                    (authorization) => authorization.group === group.commonName
                  )
              )
              .map((group) => group.commonName)}
            setValue={setNewGroupAuthorization}
          />
          <button
            type="submit"
            className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg disabled:text-gray-100 disabled:bg-blue-300"
            disabled={!newGroupAuthorization}
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
      </div> */}
      <div className="text-gray-500">User Authorizations</div>
      <div
        className={twJoin(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
          userAuthorizations.length === 0 &&
            "items-center justify-center text-lg text-gray-500"
        )}
      >
        {userAuthorizations.length === 0 ? (
          <div className="my-3">No user authorizations. Create one below.</div>
        ) : (
          <>
            <div className="divide-y">
              {userAuthorizations.map((authorization) => (
                <div
                  key={authorization.owner}
                  className="flex justify-between items-center py-1 px-2"
                >
                  <div className="flex-grow">{authorization.owner}</div>

                  <Select
                    className="w-32"
                    value={authorization.authorizationType}
                    options={["Write", "Read"]}
                    setValue={(updatedAuthorization) => {
                      const updatedAuthorizations = [...form.authorizations];
                      const index = form.authorizations.findIndex(
                        (otherAuthorization) =>
                          otherAuthorization === authorization
                      );

                      if (
                        updatedAuthorization !== "Read" &&
                        updatedAuthorization !== "Write"
                      ) {
                        return;
                      }

                      updatedAuthorizations[index] = {
                        ...updatedAuthorizations[index],
                        authorizationType: updatedAuthorization,
                      };
                      setForm({
                        ...form,
                        authorizations: updatedAuthorizations,
                      });
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
                    onClick={() =>
                      removeAuthorization(
                        form.authorizations.findIndex(
                          (otherAuthorization) =>
                            otherAuthorization === authorization
                        )
                      )
                    }
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
          onSubmit={createUserAuthorization}
        >
          <Select
            className="pr-12 w-full"
            value={newUserAuthorization}
            onSearchChange={setUserSearch}
            isLoading={isUsersLoading}
            options={(users || [])
              .filter(
                (user) =>
                  !userAuthorizations.some(
                    (authorization) => authorization.owner === user.mail
                  )
              )
              .map((user) => ({ label: user.gecos, value: user.mail }))}
            setValue={setNewUserAuthorizations}
          />
          <button
            type="submit"
            className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg disabled:text-gray-100 disabled:bg-blue-300"
            disabled={!newUserAuthorization}
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
