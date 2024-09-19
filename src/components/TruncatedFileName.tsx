import Tooltip from "./Tooltip";

export default function TruncatedFileName({ fileName }: { fileName: string }) {
  // We want to show the extension of the file name while truncating the rest
  const fileNameSplit = fileName.split(".");

  return (
    <Tooltip label={fileName}>
      <div className="flex-shrink flex overflow-hidden">
        {fileNameSplit.length === 1 ? (
          fileNameSplit[0]
        ) : (
          <>
            <span className="truncate">
              {fileNameSplit.slice(0, -1).join(".")}
            </span>
            .{fileNameSplit[fileNameSplit.length - 1]}
          </>
        )}
      </div>
    </Tooltip>
  );
}
