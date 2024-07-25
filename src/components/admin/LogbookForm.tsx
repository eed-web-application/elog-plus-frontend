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
import { Button, IconButton, Input, InputInvalid } from "../base";
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
    if (invalid.size > 0) {
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

    try {
      await updateLogbook(logbookUpdation);

      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] === "tags" &&
          Array.isArray(queryKey[1]) &&
          (queryKey[1].includes(logbook.name) || queryKey[1].length === 0),
      });
    } catch (e) {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not save logbook", e);
    }
  }

  async function save() {
    await Promise.all([
      saveLogbook(),
      saveAuthorizations(logbook.authorizations, form.authorizations),
    ]);

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
  ) {
    let ownerLabel: string | undefined;

    if (ownerType === "User") {
      ownerLabel = users?.find((user) => user.id === ownerId)?.name;
    } else if (ownerType === "Group") {
      ownerLabel = groups?.find((group) => group.id === ownerId)?.name;
    } else {
      ownerLabel = applications?.find(
        (application) => application.id === ownerId,
      )?.name;
    }

    // Should probably never happen, but we still want to catch it, because
    // if this throws something else is wrong.
    if (!ownerLabel) {
      throw new Error("Could not find label for new authorization");
    }

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
    <div className="p-3">
      <label className="block mb-2 text-gray-500">
        Name
        <input
          required
          type="text"
          className={twMerge(
            Input,
            invalid.has("name") && InputInvalid,
            "block w-full",
          )}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                      invalid.has(`shiftName/${shift.id}`) && InputInvalid,
                      "flex-1 min-w-0",
                    )}
                    value={shift.name}
                    onChange={(e) =>
                      changeShiftName(index, e.currentTarget.value)
                    }
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
                  authorization.ownerId === user.id,
              ),
          )
          .map((user) => ({ label: user.name, value: user.id }))}
        isOptionsLoading={isUsersLoading}
        getMoreOptions={getMoreUsers}
        setOptionsSearch={setUserSearch}
        updatePermission={updateAuthorizationPermission}
        removeAuthorization={removeAuthorization}
        createAuthorization={(ownerId) => createAuthorization("User", ownerId)}
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
        createAuthorization={(ownerId) => createAuthorization("Group", ownerId)}
      />

      <div className="mt-2 text-gray-500">Applications</div>
      <AdminAuthorizationForm
        authorizations={form.authorizations
          .filter((authorization) => authorization.ownerType === "Token")
          .map((authorization) => ({
            label: authorization.ownerId,
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
        createAuthorization={(ownerId) => createAuthorization("Token", ownerId)}
      />

      <button
        disabled={!updated}
        className={twJoin(Button, "block ml-auto mt-3")}
        onClick={save}
      >
        Save
      </button>
    </div>
  );
}
