import { toast } from "react-toastify";
import { ServerError } from "./api";
import ErrorToast from "./components/ErrorToast";

export default function reportServerError(message: string, error: ServerError) {
  toast.error(<ErrorToast message={message} error={error} />);
}
