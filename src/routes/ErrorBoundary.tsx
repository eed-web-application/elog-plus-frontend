import { Link, useRouteError } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { NotFoundError } from "../api";
import { Link as LinkStyle } from "../components/base";

export default function ErrorBoundary() {
  const routeError = useRouteError();

  const error = routeError;

  let is404 = false;

  if (error instanceof NotFoundError) {
    is404 = true;
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="text-4xl">{is404 ? "404" : "Uh oh 😕"}</div>
      <div className="text-xl">
        {is404 ? "Page not found" : "Something went wrong"}
      </div>
      {!is404 && (
        <div className="text-lg mt-3 text-center text-gray-500 max-w-sm">
          There was an unrecoverable error. Please try refreshing the page. If
          the issue persists, feel free to contact{" "}
          <a href="mailto:boogie@slac.stanford.edu">boogie@slac.stanford.edu</a>
          .
        </div>
      )}
      {is404 ? (
        <Link to="/" className={twMerge(LinkStyle, "mt-4")}>
          Home
        </Link>
      ) : (
        <button
          type="button"
          className={twMerge(LinkStyle, "mt-4")}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      )}
    </div>
  );
}
