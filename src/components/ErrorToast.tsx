import { ServerError } from "../api";

export interface Props {
  message: string;
  error: ServerError;
}

export default function ErrorToast({ message, error }: Props) {
  return (
    <>
      <div>{message}</div>
      <div className="text-sm text-gray-500">
        {error.message}
        {error.context && (
          <div className="text-xs">
            Code: {error.context.errorCode},{" "}
            <code>{error.context.errorDomain}</code>
          </div>
        )}
      </div>
    </>
  );
}
