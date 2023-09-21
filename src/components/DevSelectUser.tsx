import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Select from "./Select";
import { fetch } from "../api";
import { __SET_DEV_ACCESS_CODE, __GET_DEV_ACCESS_CODE } from "../api";
import { twMerge } from "tailwind-merge";

export default function DevSelectUser({ className }: { className?: string }) {
  const callbackRef = useRef<(() => void) | null>(null);

  const setAccessCode = useCallback(function setAccessCode(
    accessCode: string | null
  ) {
    __SET_DEV_ACCESS_CODE(accessCode);
    callbackRef.current?.();
  },
  []);

  const wrapper = () => {
    return __GET_DEV_ACCESS_CODE();
  };
  const [users, setUsers] = useState<Record<string, string> | null>(null);
  const accessCode = useSyncExternalStore((callback) => {
    callbackRef.current = callback;
    return () => (callbackRef.current = null);
  }, wrapper);

  useEffect(() => {
    fetch("v1/mock/users-auth").then((users) => {
      setUsers(users);
    });
  }, []);

  if (!users) {
    return;
  }

  return (
    <Select
      className={twMerge("w-48", className)}
      value={accessCode}
      setValue={setAccessCode}
      nonsearchable
      options={Object.entries(users).map(([name, accessCode]) => ({
        label: name,
        value: accessCode,
      }))}
    />
  );
}
