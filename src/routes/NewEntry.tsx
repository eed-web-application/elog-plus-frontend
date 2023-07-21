import { useNavigate } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import Pane from "../components/Pane";

export default function NewEntry() {
  const navigate = useNavigate();

  return (
    <Pane explicitHeader={false}>
      <div className="text-lg pl-3 pt-2 mb-2">New entry</div>
      <div className="w-full border-b mb-2" />
      <EntryForm
        onEntryCreated={(entryId) =>
          navigate({ pathname: `/${entryId}`, search: window.location.search })
        }
      />
    </Pane>
  );
}
