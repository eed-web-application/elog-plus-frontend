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
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

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
import { fetchEntry, ServerError } from "./api";
import "./index.css";
import reportServerError from "./reportServerError.tsx";
import ImpersonationContainer from "./components/ImpersonationContainer.tsx";
import { useImpersonationStore } from "./impersonationStore.ts";
import SheetErrorBoundary from "./components/SheetErrorBoundary.tsx";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (e, query) => {
      if (!(e instanceof ServerError)) {
        throw e;
      }

      if (query.meta?.resource) {
        reportServerError(`Could not retrieve ${query.meta.resource}`, e);
      } else {
        reportServerError("Unexpected error", e);
      }
    },
  }),
});

queryClient.setDefaultOptions({
  queries: {
    // There is a lot of nuance to retrying correctly (only retry on 5xx errors,
    // only retry on idempotent requests, etc.) and has a large impact on the
    // response time of errors, so we disable it for now.
    retry: false,
    // See #96
    queryKeyHashFn: (queryKey) => {
      const impersonating = useImpersonationStore.getState().impersonating;
      if (
        impersonating?.email &&
        !window.location.pathname.startsWith("/elog/admin")
      ) {
        queryKey = queryKey.concat(impersonating.email);
      }

      return JSON.stringify(queryKey);
    },
  },
});

async function entryLoader({ params }: { params: Params }) {
  if (params.entryId) {
    const entryId = params.entryId as string;

    await Promise.race([
      queryClient.prefetchQuery({
        queryKey: ["entry", entryId],
        queryFn: () => fetchEntry(entryId),
      }),
      new Promise((resolve) => setTimeout(resolve, 200)),
    ]);
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
              errorElement: <SheetErrorBoundary goal="supersede an entry" />,
            },
            {
              path: ":entryId/follow-up",
              loader: entryLoader,
              shouldRevalidate,
              element: <FollowUp />,
              errorElement: <SheetErrorBoundary goal="follow up an entry" />,
            },
            {
              path: ":entryId",
              loader: entryLoader,
              shouldRevalidate,
              element: <ViewEntry />,
              errorElement: <SheetErrorBoundary goal="view an entry" />,
            },
            {
              path: "new-entry",
              element: <NewEntry />,
              errorElement: <SheetErrorBoundary goal="create a new entry" />,
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
      <ImpersonationContainer>
        <RouterProvider router={router} />
      </ImpersonationContainer>
      <ToastContainer hideProgressBar={true} />
    </QueryClientProvider>
  </React.StrictMode>,
);
