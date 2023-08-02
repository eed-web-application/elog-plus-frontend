import { ComponentProps } from "react";
import elogLogo from "../assets/temp_elog_logo.png";

export default function Logo(props: ComponentProps<"img">) {
  return <img src={elogLogo} alt="SLAC E-LOG logo" {...props} />;
}
