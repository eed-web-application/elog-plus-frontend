import { fetchQueuedAttachments } from "../api";
import { useQuery } from "@tanstack/react-query";

export default function useQueuedAttachments({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const { data } = useQuery({
    enabled,
    queryKey: ["queuedAttachments"],
    queryFn: () => fetchQueuedAttachments(),
    staleTime: 5 * 60 * 1000,
    meta: {
      resource: "queued attachments",
    },
  });

  return data;
}
