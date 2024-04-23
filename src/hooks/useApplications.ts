import reportServerError from "../reportServerError";
import { useQuery } from "@tanstack/react-query";


export default function useApplications<A extends boolean>({
    enabled = true,
    critical = true,
    requireWrite = false,
    includeAuth,
  }: {
    enabled?: boolean;
    critical?: boolean;
    requireWrite?: boolean;
    includeAuth?: A;
  } = {}): boolean {
    
    console.log(enabled);
    console.log(critical);
    console.log(requireWrite);
    console.log();
    return false;
  }