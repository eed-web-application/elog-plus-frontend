import {
  faFileImage,
  faFileAudio,
  faFileVideo,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileAlt,
  faFileCode,
  faFileArchive,
  faFile,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import FaIcon, { FaIconProps } from "./FaIcon";

// https://gist.github.com/colemanw/9c9a12aae16a4bfe2678de86b661d922
const iconClasses: { [key: string]: IconDefinition } = {
  // Media
  image: faFileImage,
  audio: faFileAudio,
  video: faFileVideo,
  // Documents
  "application/pdf": faFilePdf,
  "application/msword": faFileWord,
  "application/vnd.ms-word": faFileWord,
  "application/vnd.oasis.opendocument.text": faFileWord,
  "application/vnd.openxmlformats-officedocument.wordprocessingml": faFileWord,
  "application/vnd.ms-excel": faFileExcel,
  "application/vnd.openxmlformats-officedocument.spreadsheetml": faFileExcel,
  "application/vnd.oasis.opendocument.spreadsheet": faFileExcel,
  "application/vnd.ms-powerpoint": faFilePowerpoint,
  "application/vnd.openxmlformats-officedocument.presentationml":
    faFilePowerpoint,
  "application/vnd.oasis.opendocument.presentation": faFilePowerpoint,
  "text/plain": faFileAlt,
  "text/html": faFileCode,
  "application/json": faFileCode,
  // Archives
  "application/gzip": faFileArchive,
  "application/zip": faFileArchive,
};

export interface Props extends Omit<FaIconProps, "icon"> {
  mimeType: string;
}

/**
 * Given a mimeType, renders an icon representing that mimeType.
 */
export default function AttachmentIcon({ mimeType, ...rest }: Props) {
  const candidate = Object.entries(iconClasses).find(([k]) =>
    mimeType.startsWith(k),
  );

  const icon = candidate ? candidate[1] : faFile;

  return <FaIcon {...rest} icon={icon} />;
}
