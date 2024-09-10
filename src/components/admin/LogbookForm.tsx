import { FormEvent, useState } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import {
  LogbookUpdation,
  ServerError,
  Shift,
  updateLogbook,
  LogbookWithAuth,
} from "../../api";
import { Checkbox, Input, InputInvalid } from "../base";
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
import Tooltip from "../Tooltip";
import Button from "../Button";

interface Props {
  logbook: LogbookWithAuth;
  onSave: () => void;
}

let idCounter = 0;

export default function LogbookForm({ logbook, onSave }: Props) {
  const {
    form,
    updated,
    setForm,
    finishEditing,
    createAuthorization,
    removeAuthorization,
    updateAuthorization,
  } = useLogbookFormsStore((state) => state.startEditing(logbook));
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);

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
      readAll: form.readAll,
      writeAll: form.writeAll,
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

    setSaving(true);
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
    setSaving(false);
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

  function changeShiftName(index: number, name: string) {
    const updatedShifts = [...form.shifts];
    updatedShifts[index] = { ...updatedShifts[index], name };

    setForm({
      ...form,
      shifts: updatedShifts,
    });
  }

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
            <Button
              variant="icon"
              className="text-gray-500"
              onClick={() => removeTag(index)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
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
            <Button
              variant="icon"
              className="text-gray-500"
              onClick={() => removeShift(index)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        ))}
      />
      {invalid.has("shiftOverlap") && (
        <div className="text-red-500 mt-1">Shifts cannot overlap</div>
      )}

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
        updatePermission={(ownerId, permission) =>
          updateAuthorization({ ownerId }, permission)
        }
        removeAuthorization={(ownerId) => removeAuthorization({ ownerId })}
        createAuthorization={(ownerId, ownerLabel) =>
          createAuthorization({
            ownerId,
            ownerType: "User",
            ownerName: ownerLabel,
            resourceId: form.id,
            resourceType: "Logbook",
            resourceName: form.name,
          })
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
        updatePermission={(ownerId, permission) =>
          updateAuthorization({ ownerId }, permission)
        }
        removeAuthorization={(ownerId) => removeAuthorization({ ownerId })}
        createAuthorization={(ownerId, ownerLabel) =>
          createAuthorization({
            ownerId,
            ownerType: "Group",
            ownerName: ownerLabel,
            resourceId: form.id,
            resourceType: "Logbook",
            resourceName: form.name,
          })
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
        updatePermission={(ownerId, permission) =>
          updateAuthorization({ ownerId }, permission)
        }
        removeAuthorization={(ownerId) => removeAuthorization({ ownerId })}
        createAuthorization={(ownerId, ownerLabel) =>
          createAuthorization({
            ownerId,
            ownerType: "Token",
            ownerName: ownerLabel,
            resourceId: form.id,
            resourceType: "Logbook",
            resourceName: form.name,
          })
        }
      />

      <div className="mt-2 text-gray-500">Global Authorizations</div>
      <div className="border rounded-lg bg-gray-50 p-2">
        <Tooltip label="Anyone or anything can read from this logbook">
          <label className="flex items-center text-gray-500">
            <Tooltip.PositionReference>
              <input
                type="checkbox"
                className={twJoin(Checkbox, "mr-2")}
                checked={form.readAll}
                onChange={(e) =>
                  setForm({
                    ...form,
                    readAll: e.target.checked,
                    writeAll: e.target.checked ? form.writeAll : false,
                  })
                }
              />
            </Tooltip.PositionReference>
            Publicly readable
          </label>
        </Tooltip>

        <Tooltip label="Anyone or anything can write to this logbook">
          <label
            className={twJoin(
              "flex mt-2 items-center",
              form.readAll ? "text-gray-500" : "text-gray-400",
            )}
          >
            <Tooltip.PositionReference>
              <input
                type="checkbox"
                className={twJoin(Checkbox, "mr-2")}
                checked={form.writeAll}
                onChange={(e) =>
                  setForm({ ...form, writeAll: e.target.checked })
                }
                disabled={!form.readAll}
              />
            </Tooltip.PositionReference>
            Publicly writable
          </label>
        </Tooltip>
      </div>

      <div className="flex justify-end mt-3 gap-3">
        <Button variant="text" disabled={!updated} onClick={finishEditing}>
          Discard changes
        </Button>
        <Button
          disabled={!updated || invalid.size > 0}
          onClick={save}
          isLoading={saving}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
