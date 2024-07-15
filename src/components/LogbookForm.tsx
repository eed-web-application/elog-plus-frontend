import { FormEvent, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogbookUpdation,
  ServerError,
  Shift,
  updateLogbook,
  AuthorizationPermission,
  LogbookWithAuth,
} from "../api";
import { Button, IconButton, Input, InputInvalid } from "./base";
import { LocalAuthorization, useLogbookFormsStore } from "../logbookFormsStore";
import { localToUtc, utcToLocal } from "../utils/datetimeConversion";
import reportServerError from "../reportServerError";
import useUsers from "../hooks/useUsers";
import useGroups from "../hooks/useGroups";
import useApplications from "../hooks/useApplications";
import AdminAuthorizationForm from "./AdminAuthorizationForm";

interface Props {
  logbook: LogbookWithAuth;
  onSave: () => void;
}

const DEFAULT_PERMISSION: AuthorizationPermission = "Read";

let idCounter = 0;

export default function LogbookForm({ logbook, onSave }: Props) {
  const [form, setForm, removeForm] = useLogbookFormsStore((state) =>
    state.startEditing(logbook),
  );
  const queryClient = useQueryClient();

  const [newTag, setNewTag] = useState<string>("");
  const [newShift, setNewShift] = useState<string>("");

  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  // const [applicationSearch, setApplicationSearch] = useState("");

  const { users, isLoading: isUsersLoading } = useUsers({ search: userSearch });
  const { groups, isLoading: isGroupsLoading } = useGroups({
    search: groupSearch,
  });
  // const { applications, isLoading: isApplicationsLoading } = useApplications({
  //   search: applicationSearch,
  // });

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
        invalid.filter((invalidField) => invalidField !== field),
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
          field as Ident,
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
            `${field}/${shift.id}` as Ident,
          )
        ) {
          invalid = true;
        }
      }
    }
    if (invalid) {
      return;
    }

    // Covers the case where a user deletes a tag and creates a new one with
    // the same name
    const resolvedTags = form.tags.map((tag) => {
      if (tag.id) {
        return tag;
      }

      return logbook.tags.find(({ name }) => name === tag.name) || tag;
    });

    // Same as above, but for authorizations
    const resolvedAuthorization = form.authorizations.map((authorization) => {
      if (authorization.id) {
        return authorization;
      }

      return (
        logbook.authorizations.find(
          ({ owner }) => owner === authorization.owner,
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

  function updateAuthorizationPermission(
    authorization: string,
    permission: AuthorizationPermission,
  ) {
    setForm({
      ...form,
      authorizations: form.authorizations.map((otherAuthorization) =>
        otherAuthorization.owner === authorization
          ? { ...otherAuthorization, permission }
          : otherAuthorization,
      ),
    });
  }

  function removeAuthorization(authorization: string) {
    setForm({
      ...form,
      authorizations: form.authorizations.filter(
        (otherAuthorization) => otherAuthorization.owner !== authorization,
      ),
    });
  }

  function createAuthorization(
    ownerType: LocalAuthorization["ownerType"],
    owner: string,
  ) {
    setForm({
      ...form,
      authorizations: [
        ...form.authorizations,
        {
          owner,
          permission: DEFAULT_PERMISSION,
          ownerType,
        },
      ],
    });
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
      <label className="block mb-2 text-gray-500">
        Name
        <input
          required
          type="text"
          className={twMerge(
            Input,
            invalid.includes("name") && InputInvalid,
            "block w-full",
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
          "items-center justify-center text-lg text-gray-500",
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
          "items-center justify-center text-lg text-gray-500",
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
                      "flex-1 min-w-0",
                    )}
                    value={shift.name}
                    onChange={(e) =>
                      changeShiftName(index, e.currentTarget.value)
                    }
                    onBlur={() =>
                      onValidate(
                        shiftValidators.shiftName(shift.id),
                        `shiftName/${shift.id}`,
                      )
                    }
                  />
                  <div className="flex gap-2 items-center self-end">
                    <input
                      className={twMerge(
                        Input,
                        invalid.includes(`shiftFrom/${shift.id}`) &&
                        InputInvalid,
                        "w-32",
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
                          `shiftFrom/${shift.id}`,
                        )
                      }
                    />
                    <div className="text-gray-500">to</div>
                    <input
                      className={twMerge(
                        Input,
                        invalid.includes(`shiftTo/${shift.id}`) && InputInvalid,
                        "w-32",
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
                          `shiftTo/${shift.id}`,
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

      <div className="text-gray-500">User Authorizations</div>
      <AdminAuthorizationForm
        authorizations={form.authorizations
          .filter((authorization) => authorization.ownerType === "User")
          .map((authorization) => ({
            label: authorization.owner,
            value: authorization.owner,
            permission: authorization.permission,
          }))}
        emptyLabel="No user authorizations. Create one below."
        options={(users || [])
          .filter(
            (user) =>
              !form.authorizations.some(
                (authorization) =>
                  authorization.ownerType === "User" &&
                  authorization.owner === user.email,
              ),
          )
          .map((user) => ({ label: user.name, value: user.email }))}
        isOptionsLoading={isUsersLoading}
        setOptionsSearch={setUserSearch}
        updatePermission={updateAuthorizationPermission}
        removeAuthorization={removeAuthorization}
        createAuthorization={(owner) => createAuthorization("User", owner)}
      />

      <div className="mt-2 text-gray-500">Group Authorizations</div>
      <AdminAuthorizationForm
        authorizations={form.authorizations
          .filter((authorization) => authorization.ownerType === "Group")
          .map((authorization) => ({
            label: authorization.owner,
            value: authorization.owner,
            permission: authorization.permission,
          }))}
        emptyLabel="No group authorizations. Create one below."
        options={(groups || [])
          .filter(
            (group) =>
              !form.authorizations.some(
                (authorization) =>
                  authorization.ownerType === "Group" &&
                  authorization.owner === group.id,
              ),
          )
          .map((group) => ({ label: group.name, value: group.id }))}
        isOptionsLoading={isGroupsLoading}
        setOptionsSearch={setGroupSearch}
        updatePermission={updateAuthorizationPermission}
        removeAuthorization={removeAuthorization}
        createAuthorization={(owner) => createAuthorization("Group", owner)}
      />

      {/* <div className="mt-2 text-gray-500">Applications</div> */}
      {/* <AdminAuthorizationForm */}
      {/*   authorizations={form.authorizations */}
      {/*     .filter((authorization) => authorization.ownerType === "Application") */}
      {/*     .map((authorization) => ({ */}
      {/*       label: authorization.owner, */}
      {/*       value: authorization.owner, */}
      {/*       permission: authorization.permission, */}
      {/*     }))} */}
      {/*   emptyLabel="No application authorizations. Create one below." */}
      {/*   options={(applications || []) */}
      {/*     .filter( */}
      {/*       (application) => */}
      {/*         !form.authorizations.some( */}
      {/*           (authorization) => */}
      {/*             authorization.ownerType === "Application" && */}
      {/*             authorization.owner === application.id, */}
      {/*         ), */}
      {/*     ) */}
      {/*     .map((application) => ({ */}
      {/*       label: application.name, */}
      {/*       value: application.id, */}
      {/*     }))} */}
      {/*   isOptionsLoading={isApplicationsLoading} */}
      {/*   setOptionsSearch={setApplicationSearch} */}
      {/*   updatePermission={updateAuthorizationPermission} */}
      {/*   removeAuthorization={removeAuthorization} */}
      {/*   createAuthorization={(owner) => */}
      {/*     createAuthorization("Application", owner) */}
      {/*   } */}
      {/* /> */}

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
