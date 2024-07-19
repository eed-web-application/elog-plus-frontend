import { Link, useRouteError } from "react-router-dom";
import { twJoin } from "tailwind-merge";
import { NotFoundError, UnauthorizedError } from "../api";
import { Link as LinkStyle } from "../components/base";
import DevSelectUser from "../components/DevSelectUser";

function NotFound() {
  return (
    <>
      <div className="text-4xl">404</div>
      <div className="text-xl">{"Page not found"}</div>
      <Link to="/" className={twJoin(LinkStyle, "mt-4")}>
        Home
      </Link>
    </>
  );
}

function UnknownError() {
  return (
    <>
      <div className="text-4xl">Uh oh 😕</div>
      <div className="text-xl">Something went wrong</div>
      <button
        type="button"
        className={twJoin(LinkStyle, "mt-4")}
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </>
  );
}

function DevSelect() {
  return (
    <>
      <div className="text-4xl">Unauthorized</div>
      <div className="text-xl mb-3">Select user for use in Development</div>
      <DevSelectUser />
    </>
  );
}

export default function ErrorBoundary() {
  const routeError = useRouteError();

  const error = routeError;

  let inner;

  if (error instanceof NotFoundError) {
    inner = <NotFound />;
  } else if (
    import.meta.env.MODE === "development" &&
    error instanceof UnauthorizedError
  ) {
    inner = <DevSelect />;
  } else {
    inner = <UnknownError />;
  }

  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen">
      {inner}
    </div>
  );
}
