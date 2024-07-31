import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Select from "./Select";
import { UnauthorizedError, fetch } from "../api";
import { __SET_DEV_ACCESS_CODE, __GET_DEV_ACCESS_CODE } from "../api";
import { twMerge } from "tailwind-merge";

export default function DevSelectUser({ className }: { className?: string }) {
  const callbackRef = useRef<(() => void) | null>(null);

  const setAccessCode = useCallback(function setAccessCode(
    accessCode: string | null,
  ) {
    __SET_DEV_ACCESS_CODE(accessCode);
    callbackRef.current?.();
    window.location.reload();
  }, []);

  const wrapper = () => {
    return __GET_DEV_ACCESS_CODE();
  };
  const [users, setUsers] = useState<Record<string, string> | null>(null);
  const accessCode = useSyncExternalStore((callback) => {
    callbackRef.current = callback;
    return () => (callbackRef.current = null);
  }, wrapper);

  async function fetchUsers() {
    let users;

    // GET /v1/mock/users-auth will return 401 if the access code is invalid.
    // So if we get a 401, we clear the access code and try again.
    try {
      users = await fetch("v1/mock/users-auth");
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        __SET_DEV_ACCESS_CODE(null);
        users = await fetchUsers();
      }
    }

    setUsers(users);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!users) {
    return;
  }

  return (
    <Select
      className={twMerge("w-48", className)}
      value={accessCode}
      setValue={setAccessCode}
      searchType="none"
      options={Object.entries(users).map(([name, accessCode]) => ({
        label: name,
        value: accessCode,
      }))}
    />
  );
}
