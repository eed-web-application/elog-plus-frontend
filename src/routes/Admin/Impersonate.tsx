import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Checkbox } from "../../components/base";
import Select from "../../components/Select";
import useUsers from "../../hooks/useUsers";

export default function AdminImpersonate() {
  const [impersonating, setImpersonating] = useState<null | string>(null);
  const [search, setSearch] = useState("");
  const { users, userMap, getMoreUsers } = useUsers({ search });

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-semibold mb-8">Impersonate</h1>

      <div className="bg-gray-50 border rounded-lg p-6 mb-3">
        <label className="flex items-center mb-2 text-gray-500">
          <input
            type="checkbox"
            className={twMerge(Checkbox, "mr-2")}
            checked={impersonating !== null}
            onChange={(e) => setImpersonating(e.target.checked ? "" : null)}
          />
          Activate
        </label>

        <Select
          disabled={impersonating === null}
          value={impersonating}
          setValue={setImpersonating}
          options={users.map((user) => ({
            label: user.name,
            value: user.id,
          }))}
          placeholder="Select a user..."
          onSearchChange={setSearch}
          onBottomVisible={getMoreUsers}
        />
      </div>
    </div>
  );
}
