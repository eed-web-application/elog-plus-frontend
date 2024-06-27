import { FormEvent, useState } from "react";
import { twJoin } from "tailwind-merge";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserAuthorization,
  ServerError,
  updateUser,
  AuthorizationType,
  UserWithAuth,
} from "../api";
import { Button, IconButton } from "./base";
import { useUserFormsStore } from "../userFormsStore";
import reportServerError from "../reportServerError";
import Select from "./Select";
import useLogbooks from "../hooks/useLogbooks";

interface Props {
  user: UserWithAuth;
  onSave: () => void;
}

const DEFAULT_AUTHORIZATION: AuthorizationType = "Read";

let idCounter = 0;

export default function UserForm({ user, onSave }: Props) {
  const [form, setForm, removeForm] = useUserFormsStore((state) =>
    state.startEditing(user)
  );
  const queryClient = useQueryClient();

  const [newLogbookAuthorization, setNewLogbookAuthorization] = useState<string | null>(null);
  const [logbookSearch, setLogbookSearch] = useState("");

  const { logbooks, isLoading: isLogbooksLoading } = useLogbooks({ search: logbookSearch });

  const validators = {
    name: () => Boolean(form.name),
  };

  const [invalid, setInvalid] = useState<string[]>([]);

  function onValidate(valid: boolean, field: string): boolean {
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
          field as string
        )
      ) {
        invalid = true;
      }
    }
    if (invalid) {
      return;
    }

    const resolvedAuthorization = form.authorizations.map((authorization) => {
      if (authorization.id) {
        return authorization;
      }

      return (
        user.authorizations.find(
          ({ logbook }) => logbook === authorization.logbook
        ) || authorization
      );
    });

    const userUpdation: UserAuthorization = {
      id: form.id,
      name: form.name,
      authorization: resolvedAuthorization,
    };

    try {
      await updateUser(userUpdation);

      await queryClient.invalidateQueries({ queryKey: ["users"] });

      removeForm();
      onSave();
    } catch (e) {
      if (!(e instanceof ServerError)) {
        throw e;
      }
      reportServerError("Could not save user", e);
    }
  }

  function createLogbookAuthorization(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newLogbookAuthorization) {
      return;
    }

    setNewLogbookAuthorization(null);
    setForm({
      ...form,
      authorizations: [
        ...form.authorizations,
        {
          logbook: newLogbookAuthorization,
          authorizationType: DEFAULT_AUTHORIZATION,
        },
      ],
    });
  }

  function removeAuthorization(index: number) {
    const newAuthorizations = [...form.authorizations];
    newAuthorizations.splice(index, 1);

    setForm({ ...form, authorizations: newAuthorizations });
  }

  const logbookAuthorizations = form.authorizations;

  const updated = JSON.stringify(form) === JSON.stringify(user);

  return (
    <div className="px-3 pb-3">
      <div className="text-gray-500">Logbook Authorizations</div>
      <div
        className={twJoin(
          "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
          logbookAuthorizations.length === 0 &&
            "items-center justify-center text-lg text-gray-500"
        )}
      >
        {logbookAuthorizations.length === 0 ? (
          <div className="my-3">No logbook authorizations. Create one below.</div>
        ) : (
          <>
            <div className="divide-y">
              {logbookAuthorizations.map((authorization) => (
                <div
                  key={authorization.logbook}
                  className="flex justify-between items-center py-1 px-2"
                >
                  <div className="flex-grow">{authorization.logbook}</div>

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
          onSubmit={createLogbookAuthorization}
        >
          <Select
            className="pr-12 w-full"
            value={newLogbookAuthorization}
            onSearchChange={setLogbookSearch}
            isLoading={isLogbooksLoading}
            options={(logbooks || [])
              .filter(
                (logbook) =>
                  !logbookAuthorizations.some(
                    (authorization) => authorization.logbook === logbook.name
                  )
              )
              .map((logbook) => ({ label: logbook.name, value: logbook.name }))}
            setValue={setNewLogbookAuthorization}
          />
          <button
            type="submit"
            className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg disabled:text-gray-100 disabled:bg-blue-300"
            disabled={!newLogbookAuthorization}
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
