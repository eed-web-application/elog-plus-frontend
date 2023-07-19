import { useNavigate } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import Pane from "../components/Pane";

export default function NewEntry() {
  const navigate = useNavigate();

  return (
    <Pane header="New Entry">
      <EntryForm
        onEntryCreated={(entryId) =>
          navigate({ pathname: `/${entryId}`, search: window.location.search })
        }
      />
    </Pane>
  );
}
