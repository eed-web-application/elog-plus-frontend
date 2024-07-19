import { twJoin } from "tailwind-merge";
import { Permission } from "../api";
import Select, { Option as SearchOpiton } from "./Select";
import { IconButton } from "./base";
import { FormEvent, useCallback, useState } from "react";

export interface Authorization {
  value: string;
  label: string;
  permission: Permission;
}

export interface Props {
  authorizations: Authorization[];
  emptyLabel: string;
  options: SearchOpiton[];
  isOptionsLoading: boolean;
  setOptionsSearch: (search: string) => void;
  updatePermission: (authorization: string, permission: Permission) => void;
  removeAuthorization: (authorization: string) => void;
  createAuthorization: (owner: string) => void;
}

export default function AdminAuthorizationForm({
  authorizations,
  emptyLabel,
  options,
  isOptionsLoading,
  setOptionsSearch,
  updatePermission,
  removeAuthorization,
  createAuthorization,
}: Props) {
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);

  const tryCreateAuthorization = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedNewOwner) {
        return;
      }

      createAuthorization(selectedNewOwner);
      setSelectedNewOwner(null);
    },
    [selectedNewOwner, setSelectedNewOwner, createAuthorization],
  );

  return (
    <div
      className={twJoin(
        "border rounded-lg bg-gray-50 w-full flex flex-col p-2",
        authorizations.length === 0 &&
          "items-center justify-center text-lg text-gray-500",
      )}
    >
      {authorizations.length === 0 ? (
        <div className="my-3">{emptyLabel}</div>
      ) : (
        <>
          <div className="divide-y">
            {authorizations.map((authorization) => (
              <div
                key={authorization.value}
                className="flex justify-between items-center py-1 px-2"
              >
                <div className="flex-grow">{authorization.label}</div>

                <Select
                  className="w-32"
                  value={authorization.permission}
                  options={["Write", "Read"]}
                  setValue={(updatedPermission) => {
                    if (
                      updatedPermission !== "Read" &&
                      updatedPermission !== "Write"
                    ) {
                      return;
                    }

                    updatePermission(authorization.value, updatedPermission);
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
                  onClick={() => removeAuthorization(authorization.value)}
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
        onSubmit={tryCreateAuthorization}
      >
        <Select
          className="pr-12 w-full"
          value={selectedNewOwner}
          onSearchChange={setOptionsSearch}
          isLoading={isOptionsLoading}
          options={options || []}
          setValue={setSelectedNewOwner}
        />
        <button
          type="submit"
          className="flex absolute top-0 right-0 bottom-0 justify-center items-center p-2.5 text-white bg-blue-500 rounded-r-lg disabled:text-gray-100 disabled:bg-blue-300"
          disabled={!selectedNewOwner}
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
  );
}
