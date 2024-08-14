import { useEffect, useState } from "react";
import Select from "./Select";
import { UnauthorizedError, fetch } from "../api";
import { twMerge } from "tailwind-merge";

export default function DevSelectUser({ className }: { className?: string }) {
  // Since the backend is using token-based authentication during development,
  // we set a cookie, so that all requests, including image and file downloads,
  // will include the access code. Then, the development reverse proxy will
  // read the cookie and pass the access code as a header to the backend.
  const [users, setUsers] = useState<Record<string, string> | null>(null);

  async function fetchUsers() {
    let users;

    // GET /v1/mock/users-auth will return 401 if the access code is invalid.
    // So if we get a 401, we clear the access code and try again.
    try {
      users = await fetch("v1/mock/users-auth");
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        document.cookie = "";
        users = await fetchUsers();
      }
    }

    setUsers(users);
  }

  useEffect(() => {
    if (!users) {
      fetchUsers();
    }
  }, []);

  function setAccessCode(accessCode: string | null) {
    if (!accessCode) {
      return;
    }

    document.cookie = `dev-slac-vouch=${accessCode}; path=/`;
    window.location.reload();
  }

  return (
    <Select
      className={twMerge("w-48", className)}
      value={null}
      setValue={setAccessCode}
      searchType="none"
      isLoading={!users}
      options={Object.entries(users || []).map(([name, accessCode]) => ({
        label: name,
        value: accessCode,
      }))}
    />
  );
}
