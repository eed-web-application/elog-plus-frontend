import { twJoin } from "tailwind-merge";
import { FormEvent, useCallback, useState } from "react";
import { Permission } from "../../api";
import Select, { ValuedOption } from "../Select";
import { IconButton } from "../base";
import ResourceListForm from "./ResourceListForm";

export interface Authorization {
  value: string;
  label: string;
  permission: Permission;
}

export interface Props {
  authorizations: Authorization[];
  emptyLabel: string;
  options: ValuedOption[];
  isOptionsLoading: boolean;
  setOptionsSearch?: (search: string) => void;
  updatePermission: (authorization: string, permission: Permission) => void;
  removeAuthorization: (authorization: string) => void;
  createAuthorization: (owner: string) => void;
  getMoreOptions?: () => void;
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
  getMoreOptions,
}: Props) {
  const [selectedNewOwner, setSelectedNewOwner] = useState<ValuedOption | null>(
    null,
  );

  const tryCreateAuthorization = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedNewOwner) {
        return;
      }

      createAuthorization(selectedNewOwner.value);
      setSelectedNewOwner(null);
    },
    [selectedNewOwner, setSelectedNewOwner, createAuthorization],
  );

  return (
    <ResourceListForm
      items={authorizations.map((authorization) => (
        <div
          key={authorization.value}
          className="flex justify-between items-center py-1 px-2"
        >
          <div className="flex-1 truncate">{authorization.label}</div>

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
      emptyLabel={emptyLabel}
      select={
        <Select
          className="pr-12 w-full"
          value={selectedNewOwner}
          onSearchChange={setOptionsSearch}
          isLoading={isOptionsLoading}
          options={options || []}
          setValue={(value) => {
            const option = options.find((option) => option.value === value);
            setSelectedNewOwner(option || null);
          }}
          onBottomVisible={getMoreOptions}
        />
      }
      disabled={!selectedNewOwner}
      onSubmit={tryCreateAuthorization}
    />
  );
}
