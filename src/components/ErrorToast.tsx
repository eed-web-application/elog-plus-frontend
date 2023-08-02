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
        {error.context?.errorDomain &&
          error.context?.errorCode !== undefined && (
            <div className="text-xs">
              Error code: {error.context.errorCode},{" "}
              <code>{error.context.errorDomain}</code>
            </div>
          )}
      </div>
    </>
  );
}
