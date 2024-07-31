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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home from "./routes/Home.tsx";
import Supersede from "./routes/Supersede.tsx";
import FollowUp from "./routes/FollowUp.tsx";
import NewEntry from "./routes/NewEntry.tsx";
import ViewEntry from "./routes/ViewEntry.tsx";
import ErrorBoundary from "./routes/ErrorBoundary";
import Admin from "./routes/Admin";
import AdminLogbooks from "./routes/Admin/Logbooks.tsx";
import AdminGroups from "./routes/Admin/Groups.tsx";
import AdminUsers from "./routes/Admin/Users.tsx";
import AdminApplications from "./routes/Admin/Applications.tsx";
import AdminImpersonate from "./routes/Admin/Impersonate.tsx";
import { fetchEntry, ServerError, UnauthorizedError } from "./api";
import "./index.css";
import reportServerError from "./reportServerError.tsx";

const queryClient = new QueryClient();

queryClient.setDefaultOptions({
  queries: {
    retry: (failureCount, error) => {
      if (error instanceof UnauthorizedError) {
        return false;
      }
      return failureCount < 3;
    },
  },
});

function entryLoader({ params }: { params: Params }) {
  if (params.entryId) {
    const entryId = params.entryId as string;

    return queryClient
      .prefetchQuery({
        queryKey: ["entry", entryId],
        queryFn: () => fetchEntry(entryId),
      })
      .then(() => null);
  }
  return null;
}

function shouldRevalidate({
  currentParams,
  nextParams,
}: Parameters<ShouldRevalidateFunction>[0]) {
  return currentParams.entryId !== nextParams.entryId;
}

const router = createBrowserRouter(
  [
    {
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: "/admin",
          element: <Admin />,
          children: [
            {
              path: "logbooks",
              element: <AdminLogbooks />,
            },
            {
              path: "logbooks/:logbookId",
              element: <AdminLogbooks />,
            },

            {
              path: "users",
              element: <AdminUsers />,
            },
            {
              path: "users/:userId",
              element: <AdminUsers />,
            },

            {
              path: "groups",
              element: <AdminGroups />,
            },
            {
              path: "groups/:groupId",
              element: <AdminGroups />,
            },

            {
              path: "applications",
              element: <AdminApplications />,
            },
            {
              path: "applications/:applicationId",
              element: <AdminApplications />,
            },

            {
              path: "impersonate",
              element: <AdminImpersonate />,
            },
          ],
        },
        {
          path: "/",
          element: <Home />,
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
  ],
  { basename: "/elog" },
);

window.addEventListener("unhandledrejection", (e) => {
  if (e.reason instanceof ServerError) {
    reportServerError("Unexpected error", e.reason);
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer hideProgressBar={true} />
    </QueryClientProvider>
  </React.StrictMode>,
);
