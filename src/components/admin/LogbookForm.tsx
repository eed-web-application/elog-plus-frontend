import { FormEvent, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogbookUpdation,
  ServerError,
  Shift,
  updateLogbook,
  LogbookWithAuth,
  Permission,
} from "../../api";
import { Button, IconButton, Input, InputInvalid, TextButton } from "../base";
import {
  useLogbookFormsStore,
  validateLogbookForm,
} from "../../logbookFormsStore";
import { localToUtc, utcToLocal } from "../../utils/datetimeConversion";
import reportServerError from "../../reportServerError";
import useUsers from "../../hooks/useUsers";
import useGroups from "../../hooks/useGroups";
import useApplications from "../../hooks/useApplications";
import AdminAuthorizationForm from "./AuthorizationForm";
import { saveAuthorizations } from "../../authorizationDiffing";
import ResourceListForm from "./ResourceListForm";

interface Props {
  logbook: LogbookWithAuth;
  onSave: () => void;
}

const DEFAULT_PERMISSION: Permission = "Read";

let idCounter = 0;

export default function LogbookForm({ logbook, onSave }: Props) {
  const { form, setForm, finishEditing } = useLogbookFormsStore((state) =>
    state.startEditing(logbook),
  );
  const queryClient = useQueryClient();

  const [newTag, setNewTag] = useState<string>("");
  const [newShift, setNewShift] = useState<string>("");

  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [applicationSearch, setApplicationSearch] = useState("");

  const {
    users,
    getMoreUsers,
    isLoading: isUsersLoading,
  } = useUsers({ search: userSearch });
  const {
    groups,
    getMoreGroups,
    isLoading: isGroupsLoading,
  } = useGroups({
    search: groupSearch,
  });
  const {
    applications,
    getMoreApplications,
    isLoading: isApplicationsLoading,
  } = useApplications({
    search: applicationSearch,
  });

  const invalid = validateLogbookForm(form);

  async function saveLogbook() {
    // Covers the case where a user deletes a tag and creates a new one with
    // the same name
    const resolvedTags = form.tags.map((tag) => {
      if (tag.id) {
        return tag;
      }

      return logbook.tags.find(({ name }) => name === tag.name) || tag;
    });

    const logbookUpdation: LogbookUpdation = {
      id: form.id,
      name: form.name,
      tags: resolvedTags,
      // Remove temp ids
      shifts: form.shifts.map(({ id, ...shift }) => ({
        ...(shift as Shift),
        id: id.startsWith("_") ? undefined : id,
      })),
    };

    await updateLogbook(logbookUpdation);

    queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        queryKey[0] === "tags" &&
        Array.isArray(queryKey[1]) &&
        (queryKey[1].includes(logbook.name) || queryKey[1].length === 0),
    });
  }

  async function save() {
    if (invalid.size > 0) {
      return;
    }

    try {
      await Promise.all([
        saveLogbook(),
        saveAuthorizations(logbook.authorizations, form.authorizations),
      ]);
    } catch (e) {
      if (e instanceof ServerError) {
        reportServerError("Could not save logbook", e);
        return;
      }

      throw e;
    }

    await queryClient.invalidateQueries({ queryKey: ["logbooks"] });

    finishEditing();
    onSave();
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
    ownerId: string,
    permission: Permission,
  ) {
    setForm({
      ...form,
      authorizations: form.authorizations.map((otherAuthorization) =>
        otherAuthorization.ownerId === ownerId
          ? { ...otherAuthorization, permission }
          : otherAuthorization,
      ),
    });
  }

  function removeAuthorization(ownerId: string) {
    setForm({
      ...form,
      authorizations: form.authorizations.filter(
        (otherAuthorization) => otherAuthorization.ownerId !== ownerId,
      ),
    });
  }

  function createAuthorization(
    ownerType: "User" | "Group" | "Token",
    ownerId: string,
    ownerLabel: string,
  ) {
    // If the user deletes an authorization and then creates a new one with the
    // same owner, we want to keep the ID so we don't create a new one.
    const existingAuthorization = logbook.authorizations.find(
      (authorization) => authorization.ownerId === ownerId,
    );

    setForm({
      ...form,
      authorizations: [
        ...form.authorizations,
        {
          id: existingAuthorization?.id,
          permission: DEFAULT_PERMISSION,
          ownerId,
          ownerType,
          ownerName: ownerLabel,
          resourceId: form.id,
          resourceType: "Logbook",
          resourceName: form.name,
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

  const updated = JSON.stringify(form) !== JSON.stringify(logbook);

  return (
    <div className="p-3 pt-5">
      <label className="block text-gray-500">
        Name
        <input
          required
          type="text"
          className={twMerge(
            Input,
            invalid.has("name") && InputInvalid,
            "block w-full",
          )}
          value={form.name.toUpperCase()}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value.toLowerCase() })
          }
        />
      </label>

      <div className="text-gray-500 mt-2">Tags</div>
      <ResourceListForm
        emptyLabel="No tags. Create one below."
        addable={
          Boolean(newTag) && !form.tags.find(({ name }) => name === newTag)
        }
        onSubmit={createTag}
        select={
          <input
            type="text"
            className={twMerge(Input, "w-full pr-12")}
            value={newTag}
            onChange={(e) => setNewTag(e.currentTarget.value)}
          />
        }
        items={form.tags.map((tag, index) => (
          <div
            key={tag.id || tag.name}
            className="flex justify-between items-center px-2"
          >
            <div className="truncate flex-1">{tag.name}</div>
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
      />

      <div className="text-gray-500 mt-2">Shifts</div>
      <ResourceListForm
        emptyLabel="No Shifts. Create one below."
        select={
          <input
            type="text"
            className={twMerge(Input, "w-full pr-12")}
            value={newShift}
            onChange={(e) => setNewShift(e.currentTarget.value)}
          />
        }
        onSubmit={createShift}
        addable={Boolean(newShift)}
        items={form.shifts.map((shift, index) => (
          <div
            key={shift.id}
            className="flex gap-1 justify-between items-center py-2"
          >
            <input
              type="text"
              className={twMerge(
                Input,
                invalid.has(`shiftName/${shift.id}`) && InputInvalid,
                "flex-1 min-w-0",
              )}
              value={shift.name}
              onChange={(e) => changeShiftName(index, e.currentTarget.value)}
            />
            <div className="flex gap-2 items-center self-end">
              <input
                className={twMerge(
                  Input,
                  invalid.has(`shiftFrom/${shift.id}`) && InputInvalid,
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
              />
              <div className="text-gray-500">to</div>
              <input
                className={twMerge(
                  Input,
                  invalid.has(`shiftTo/${shift.id}`) && InputInvalid,
                  "w-32",
                )}
                type="time"
                value={
                  form.shifts[index].to ? utcToLocal(form.shifts[index].to) : ""
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
      />

      <div className="text-gray-500 mt-2">User Authorizations</div>
      <AdminAuthorizationForm
        authorizations={form.authorizations
          .filter((authorization) => authorization.ownerType === "User")
          .map((authorization) => ({
            label: authorization.ownerName,
            value: authorization.ownerId,
            permission: authorization.permission,
          }))}
        emptyLabel="No user authorizations. Create one below."
        options={(users || [])
          .filter(
            (user) =>
              !form.authorizations.some(
                (authorization) =>
                  authorization.ownerType === "User" &&
                  authorization.ownerId === user.email,
              ),
          )
          .map((user) => ({
            label: `${user.gecos} (${user.email})`,
            value: user.email,
          }))}
        isOptionsLoading={isUsersLoading}
        getMoreOptions={getMoreUsers}
        setOptionsSearch={setUserSearch}
        updatePermission={updateAuthorizationPermission}
        removeAuthorization={removeAuthorization}
        createAuthorization={(ownerId, ownerLabel) =>
          createAuthorization("User", ownerId, ownerLabel)
        }
      />

      <div className="mt-2 text-gray-500">Group Authorizations</div>
      <AdminAuthorizationForm
        authorizations={form.authorizations
          .filter((authorization) => authorization.ownerType === "Group")
          .map((authorization) => ({
            label: authorization.ownerName,
            value: authorization.ownerId,
            permission: authorization.permission,
          }))}
        emptyLabel="No group authorizations. Create one below."
        options={(groups || [])
          .filter(
            (group) =>
              !form.authorizations.some(
                (authorization) =>
                  authorization.ownerType === "Group" &&
                  authorization.ownerId === group.id,
              ),
          )
          .map((group) => ({ label: group.name, value: group.id }))}
        isOptionsLoading={isGroupsLoading}
        getMoreOptions={getMoreGroups}
        setOptionsSearch={setGroupSearch}
        updatePermission={updateAuthorizationPermission}
        removeAuthorization={removeAuthorization}
        createAuthorization={(ownerId, ownerLabel) =>
          createAuthorization("Group", ownerId, ownerLabel)
        }
      />

      <div className="mt-2 text-gray-500">Application Authorizations</div>
      <AdminAuthorizationForm
        authorizations={form.authorizations
          .filter((authorization) => authorization.ownerType === "Token")
          .map((authorization) => ({
            label: authorization.ownerName,
            value: authorization.ownerId,
            permission: authorization.permission,
          }))}
        emptyLabel="No application authorizations. Create one below."
        options={(applications || [])
          .filter(
            (application) =>
              !form.authorizations.some(
                (authorization) =>
                  authorization.ownerType === "Token" &&
                  authorization.ownerId === application.id,
              ),
          )
          .map((application) => ({
            label: application.name,
            value: application.id,
          }))}
        isOptionsLoading={isApplicationsLoading}
        getMoreOptions={getMoreApplications}
        setOptionsSearch={setApplicationSearch}
        updatePermission={updateAuthorizationPermission}
        removeAuthorization={removeAuthorization}
        createAuthorization={(ownerId, ownerLabel) =>
          createAuthorization("Token", ownerId, ownerLabel)
        }
      />

      <div className="flex justify-end mt-3 gap-3">
        <button
          disabled={!updated}
          className={twJoin(TextButton, "block")}
          onClick={finishEditing}
        >
          Discard changes
        </button>
        <button
          disabled={!updated || invalid.size > 0}
          className={twJoin(Button, "block")}
          onClick={save}
        >
          Save
        </button>
      </div>
    </div>
  );
}
