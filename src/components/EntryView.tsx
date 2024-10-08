import { useContext } from "react";
import { twJoin } from "tailwind-merge";
import { EntryFull } from "../api";
import { Link } from "react-router-dom";
import EntryList from "./EntryList";
import EntryBodyText from "./EntryBodyText";
import Chip from "./Chip";
import AttachmentCard from "./AttachmentCard";
import EntryRow from "./EntryRow";
import EntryFigureList from "./EntryFigureList";
import TextDivider from "./TextDivider";
import useSpotlightProps from "../hooks/useSpotlightProps";
import useDisplayTags from "../hooks/useDisplayTags";
import FavoriteButton from "./FavoriteButton";
import Button from "./Button";
import IsPaneFullscreenContext from "../IsPaneFullscreenContext";
import { DEFAULT_QUERY, serializeQuery } from "../hooks/useEntryQuery";

export interface Props {
  entry: EntryFull;
}

// Detailed view of an entry with acitons such as supersede and follow up.
export default function EntryView({ entry }: Props) {
  const attachments = entry.attachments.filter(
    (attachment) => attachment.previewState !== "Completed",
  );

  const isPaneFullscreen = useContext(IsPaneFullscreenContext);
  const spotlightProps = useSpotlightProps(entry);
  const tagNames = useDisplayTags(entry.tags, entry.logbooks.length);

  return (
    <>
      {!entry.supersededBy && (
        <Button
          as={Link}
          variant="icon"
          {...spotlightProps}
          className="my-1 float-right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      )}
      <FavoriteButton className="float-right my-1" entryId={entry.id} />
      {entry.supersededBy && (
        <div className="clear-both border-b">
          <TextDivider>Superseded by</TextDivider>
          <EntryRow
            containerClassName="mt-1.5 mb-3.5 mx-3 rounded-lg border mb-2 overflow-hidden"
            entry={entry.supersededBy}
            showDate
            allowExpanding
          />
        </div>
      )}
      <div className={twJoin("px-3 pt-2", !entry.followingUp && "pb-2")}>
        <div className="-mb-1 text-lg">{entry.title}</div>
        <div className="text-sm text-gray-500 uppercase">
          {entry.logbooks.map(({ name }) => name).join(", ")}
        </div>
      </div>
      {entry.followingUp && (
        <>
          <TextDivider>Follows up</TextDivider>
          <EntryRow
            containerClassName="mt-1.5 mb-3.5 mx-3 rounded-lg border mb-2 overflow-hidden"
            entry={entry.followingUp}
            showDate
            allowExpanding
            allowSpotlight
          />
        </>
      )}
      <div className="flex flex-col gap-1 py-2 px-3 border-t">
        <div>
          <div className="text-gray-500">Logged by </div>
          {entry.loggedBy}
        </div>
        <div>
          <div className="text-gray-500">Logged at</div>
          {entry.loggedAt.toLocaleString("en-us", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hourCycle: "h23",
          })}
        </div>
        {entry.eventAt &&
          entry.eventAt.getTime() !== entry.loggedAt.getTime() && (
            <div>
              <div className="text-gray-500">Event occurred at</div>
              {entry.eventAt.toLocaleString("en-us", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hourCycle: "h23",
              })}
            </div>
          )}
        {entry.shifts.length > 0 && (
          <div>
            <div className="text-gray-500">During</div>
            <div className="flex flex-wrap">
              {entry.shifts.map(({ id, name, logbook }) => (
                <Chip
                  key={id}
                  className="mt-0.5 mr-1.5"
                  clickable
                  as={Link}
                  to={{
                    pathname: isPaneFullscreen ? "/" : undefined,
                    search: serializeQuery({
                      ...DEFAULT_QUERY,
                      logbooks: [logbook.name.toUpperCase()],
                      shifts: [id],
                    }).toString(),
                    hash: window.location.hash,
                  }}
                >
                  {logbook.name.toUpperCase()}:{name}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {entry.tags.length > 0 && (
          <div>
            <div className="text-gray-500">Tags</div>
            <div className="flex flex-wrap">
              {tagNames.map(({ label, ids }) => (
                <Chip
                  key={label}
                  className="mt-0.5 mr-1.5"
                  clickable
                  as={Link}
                  to={{
                    pathname: isPaneFullscreen ? "/" : undefined,
                    search: serializeQuery({
                      ...DEFAULT_QUERY,
                      tags: ids,
                      requireAllTags: ids.length > 1,
                    }).toString(),
                    hash: window.location.hash,
                  }}
                >
                  {/* search: `?tags=${ids.join(",")}${ids.length > 1 ? "&requireAllTags=true" : ""}`, */}
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
      {(entry.text.trim() || entry.attachments.length > 0) && (
        <div className="py-2 px-3 border-t">
          {entry.text.trim() && <EntryBodyText body={entry.text} />}
          <EntryFigureList attachments={entry.attachments} />
          {attachments.length > 0 && (
            <>
              <div className="mt-1 mb-1 text-gray-500">Attachments</div>
              <div className="flex overflow-hidden flex-wrap gap-3 pb-1 m-auto w-full">
                {attachments.map((attachment) => (
                  <AttachmentCard
                    key={attachment.id}
                    attachment={attachment}
                    downloadable
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {!entry.supersededBy && (
        <div className="p-3 text-right border-t">
          <Button
            as={Link}
            to={{
              pathname: `/${entry.id}/supersede`,
              search: window.location.search,
              hash: window.location.hash,
            }}
            className="mr-3 inline-block ml-auto w-fit"
          >
            Supersede
          </Button>
          <Button
            as={Link}
            to={{
              pathname: `/${entry.id}/follow-up`,
              search: window.location.search,
              hash: window.location.hash,
            }}
            className="inline-block ml-auto w-fit"
          >
            Follow up
          </Button>
        </div>
      )}
      {entry.history && entry.history.length > 0 && (
        <div className="px-3 mb-3">
          <EntryList
            header="History"
            entries={entry.history}
            allowExpanding
            showDate
          />
        </div>
      )}
      {entry.followUps.length > 0 && (
        <div className="px-3 mb-3">
          <EntryList
            header="Follow Ups"
            entries={entry.followUps}
            showDate
            showFollowUps
            allowExpanding
            allowSpotlight
          />
        </div>
      )}
      {!entry.referencesInBody &&
        entry.references &&
        entry.references.length > 0 && (
          <div className="px-3 mb-3">
            <EntryList
              header="References"
              entries={entry.references}
              showDate
              showFollowUps
              allowExpanding
              allowSpotlight
            />
          </div>
        )}
      {entry.referencedBy && entry.referencedBy.length > 0 && (
        <div className="px-3 mb-3">
          <EntryList
            header="Referenced By"
            entries={entry.referencedBy}
            showDate
            showFollowUps
            allowExpanding
            allowSpotlight
          />
        </div>
      )}
    </>
  );
}
