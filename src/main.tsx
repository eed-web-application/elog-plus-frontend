import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Params,
  RouterProvider,
  ShouldRevalidateFunction,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./routes/Home.tsx";
import Supersede from "./routes/Supersede.tsx";
import FollowUp from "./routes/FollowUp.tsx";
import NewEntry from "./routes/NewEntry.tsx";
import { useEntriesStore } from "./entriesStore.ts";
import ViewEntry from "./routes/ViewEntry.tsx";
import ErrorBoundary from "./routes/ErrorBoundary";
import Admin from "./routes/Admin.tsx";
import * as api from "./api";
import "./index.css";
import reportServerError from "./reportServerError.tsx";

function entryLoader({ params }: { params: Params }) {
  if (params.entryId) {
    return useEntriesStore.getState().getOrFetch(params.entryId);
  }
  return null;
}

function shouldRevalidate({
  currentParams,
  nextParams,
}: Parameters<ShouldRevalidateFunction>[0]) {
  return currentParams.entryId !== nextParams.entryId;
}

const router = createBrowserRouter([
  {
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/admin",
        element: <Admin />,
      },
      {
        path: "/admin/:logbookId",
        element: <Admin />,
      },
      {
        path: "/",
        element: <Home />,
        errorElement: <ErrorBoundary />,
        children: [
          {
            path: ":entryId/supersede",
            loader: entryLoader,
            shouldRevalidate,
            element: <Supersede />,
          },
          {
            path: ":entryId/follow-up",
            loader: entryLoader,
            shouldRevalidate,
            element: <FollowUp />,
          },
          {
            path: ":entryId",
            loader: entryLoader,
            shouldRevalidate,
            element: <ViewEntry />,
          },
          {
            path: "new-entry",
            element: <NewEntry />,
          },
        ],
      },
    ],
  },
]);

window.addEventListener("unhandledrejection", (e) => {
  if (e.reason instanceof api.ServerError) {
    reportServerError("Unexpected error", e.reason);
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <ToastContainer hideProgressBar={true} />
  </React.StrictMode>
);
