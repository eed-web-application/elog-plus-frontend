import { FormEvent, useCallback, useState } from "react";
import { Permission } from "../../api";
import Select, { ValuedOption } from "../Select";
import ResourceListForm from "./ResourceListForm";
import useDebounce from "../../hooks/useDebounce";
import Button from "../Button";

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
  disabled?: boolean;
  setOptionsSearch?: (search: string) => void;
  updatePermission: (authorization: string, permission: Permission) => void;
  removeAuthorization: (authorization: string) => void;
  createAuthorization: (ownerValue: string, ownerLabel: string) => void;
  getMoreOptions?: () => void;
}

export default function AdminAuthorizationForm({
  authorizations,
  emptyLabel,
  options,
  isOptionsLoading,
  disabled,
  setOptionsSearch = () => {},
  updatePermission,
  removeAuthorization,
  createAuthorization,
  getMoreOptions,
}: Props) {
  const [selectedNewOwner, setSelectedNewOwner] = useState<ValuedOption | null>(
    null,
  );

  const onSearchChange = useDebounce(setOptionsSearch, 500);

  const tryCreateAuthorization = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedNewOwner) {
        return;
      }

      createAuthorization(selectedNewOwner.value, selectedNewOwner.label);
      setSelectedNewOwner(null);
    },
    [selectedNewOwner?.value, setSelectedNewOwner, createAuthorization],
  );

  return (
    <ResourceListForm
      disabled={disabled}
      addable={Boolean(selectedNewOwner)}
      items={authorizations.map((authorization) => (
        <div
          key={authorization.value}
          className="flex justify-between items-center py-1 px-2"
        >
          <div className="flex-1 truncate">{authorization.label}</div>

          <Select
            className="w-32"
            value={authorization.permission}
            options={["Write", "Read", "Admin"]}
            setValue={(updatedPermission) => {
              if (
                updatedPermission !== "Read" &&
                updatedPermission !== "Write" &&
                updatedPermission !== "Admin"
              ) {
                return;
              }

              updatePermission(authorization.value, updatedPermission);
            }}
            searchType="none"
            disabled={disabled}
          />

          <Button
            variant="icon"
            className="text-gray-500"
            disabled={disabled}
            onClick={() => removeAuthorization(authorization.value)}
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
      emptyLabel={emptyLabel}
      select={
        <Select
          className="pr-12 w-full"
          value={selectedNewOwner}
          onSearchChange={onSearchChange}
          isLoading={isOptionsLoading}
          options={options || []}
          setValue={(value) => {
            const option = options.find((option) => option.value === value);
            setSelectedNewOwner(option || null);
          }}
          searchType="managed"
          onBottomVisible={getMoreOptions}
          disabled={disabled}
        />
      }
      onSubmit={tryCreateAuthorization}
    />
  );
}
