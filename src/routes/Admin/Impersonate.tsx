import { useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Checkbox } from "../../components/base";
import Select from "../../components/Select";
import useUsers from "../../hooks/useUsers";
import { useImpersonationStore } from "../../impersonationStore";
import useDebounce from "../../hooks/useDebounce";

export default function AdminImpersonate() {
  const [search, setSearch] = useState("");

  const onSearchChange = useDebounce(setSearch, 500);

  const impersonate = useImpersonationStore((state) => state.impersonate);
  const impersonating = useImpersonationStore((state) => state.impersonating);

  const [enabled, setEnabled] = useState(impersonating !== null);

  const { users, userMap, getMoreUsers, isLoading } = useUsers({
    search,
  });

  const onSelect = useCallback(
    (userId: string | null) => {
      const user = userId ? userMap[userId] || null : null;
      impersonate(user);
    },
    [impersonate, userMap],
  );

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-semibold mb-8">Impersonate</h1>

      <div className="bg-gray-50 border rounded-lg p-6 mb-3">
        <label className="flex items-center mb-2 text-gray-500">
          <input
            type="checkbox"
            className={twMerge(Checkbox, "mr-2")}
            checked={enabled}
            onChange={(e) => {
              if (e.target.checked) {
                setEnabled(true);
              } else {
                setEnabled(false);
                impersonate(null);
              }
            }}
          />
          Activate
        </label>

        <Select
          disabled={!enabled}
          value={
            impersonating
              ? { label: impersonating.gecos, value: impersonating.email }
              : null
          }
          setValue={onSelect}
          options={users.map((user) => ({
            label: `${user.gecos} (${user.email})`,
            value: user.email,
          }))}
          isLoading={isLoading}
          placeholder="Select a user..."
          onSearchChange={onSearchChange}
          searchType="managed"
          onBottomVisible={getMoreUsers}
        />
      </div>
    </div>
  );
}
