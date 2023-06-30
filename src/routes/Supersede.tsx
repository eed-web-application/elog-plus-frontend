import { useLoaderData, useNavigate } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import Pane from "../components/Pane";
import { Entry } from "../api";

export default function Supersede() {
  const navigate = useNavigate();

  const entry = useLoaderData() as Entry;

  return (
    <Pane header="Supersede">
      <EntryForm
        superseding={entry}
        onEntryCreated={(entryId) => navigate(`/${entryId}`)}
      />
    </Pane>
  );
}
