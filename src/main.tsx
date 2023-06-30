import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Params, RouterProvider } from "react-router-dom";
import Home from "./routes/Home.tsx";
import Supersede from "./routes/Supersede.tsx";
import FollowUp from "./routes/FollowUp.tsx";
import NewEntry from "./routes/NewEntry.tsx";
import { useEntriesStore } from "./entriesStore.ts";
import ViewEntry from "./routes/ViewEntry.tsx";
import "./index.css";

function entryLoader({ params }: { params: Params }) {
  if (params.entryId) {
    return useEntriesStore.getState().getOrFetch(params.entryId);
  }
  return null;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children: [
      {
        path: ":entryId/supersede",
        loader: entryLoader,
        element: <Supersede />,
      },
      {
        path: ":entryId/follow-up",
        loader: entryLoader,
        element: <FollowUp />,
      },
      {
        path: ":entryId",
        loader: entryLoader,
        element: <ViewEntry />,
      },
      {
        path: "new-entry",
        element: <NewEntry />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
