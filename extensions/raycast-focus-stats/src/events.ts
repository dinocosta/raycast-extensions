import type { Event } from "./types";
import { Cache } from "@raycast/api";
import { execSync } from "child_process";
import { formatDate } from "./utils";

const cache = new Cache();

// Command to be run in order to fetch the MacOS System Logs corresponding to Raycast Focus' Events.
//
// - The `--predicate` flag is used to filter the logs based on Raycast's
// subsystem (com.raycast-x.macos) and only keep messages mentioning a Focus
// session. It seems Raycast no longer uses a single category for all Focus
// messages, so filtering by `eventMessage` instead lets us capture both
// regardless of category.
// - The `--info` flag is used to include messages with the `info` level (Focus
// messages are logged at this level).
const COMMAND = `log show --predicate 'subsystem == "com.raycast-x.macos" AND eventMessage CONTAINS "Focus session"' --info`;

/*
 * Function responsible for reading messages from MacOS' system logs belonging to Raycast Focus and
 * creating an array of events from these messages.
 *
 * It doesn't care about every single possible message logged by Raycast Focus, looking only for the
 * following messages:
 *
 * - Start Focus Session – Emitted at the start of a Raycast Focus Session. The
 * session's goal is found in the `Title` field.
 *
 * ```
 * 2026-06-22 23:17:58.385386+0100 0x1e514c9  Info        0x0                  434    0    Raycast Beta: [com.raycast-x.macos:macos-app] Starting Focus session
 * 	Blocked Apps:
 * 	Duration: 1500
 * 	Title: Linear
 * 	Mode: block
 * 	Blocked Websites:
 * ```
 *
 * - Focus Session Summary – Emitted after a session has been completed,
 * contains the (actual) duration of the session, in seconds.
 *
 * ```
 * 2026-06-22 23:18:58.920949+0100 0x1e5152e  Info        0x0                  434    0    Raycast Beta: [com.raycast-x.macos:macos-node] [handler::focus] Focus session activity summary tracked {
 *   source: "command",
 *   duration: 60.521,
 *   pauseEventCount: 0,
 *   blockEventCount: 0,
 *   snoozeEventCount: 0
 * }
 * ```
 */
export function getEvents(): Event[] {
  // Figure out when was the last time that the events were fetched, so we can start fetching only
  // from that point onwards.
  let refreshedAt = cache.get("refreshedAt");

  // If there's no previous timestamp for when the events were fetched, we'll try to fetch the
  // events for the last 24 hours.
  if (refreshedAt === undefined) {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    refreshedAt = formatDate(date);
  }

  // Add the `--start` flag to the `log` command to ensure only log messages starting from the
  // provided date and time are provided.
  const command = `${COMMAND} --start '${refreshedAt}'`;
  const lines = execSync(command, { timeout: 10000 }).toString().split("\n");
  const events: Event[] = [];

  // Build list of events from the command output.
  let start = new Date();
  let goal = "";
  let inSummary = false;

  for (const line of lines) {
    if (line.includes("Starting Focus session")) {
      const [dateString, timeString] = line.split(" ").slice(0, 2);
      start = new Date(`${dateString} ${timeString}`);
    } else if (line.includes("Title: ")) {
      goal = line.replace(/.*Title: /, "");
      events.push({ type: "start", start, goal });
    } else if (line.includes("Focus session activity summary")) {
      inSummary = true;
    } else if (inSummary && /duration:/i.test(line)) {
      // The summary logs the session's duration in fractional seconds; we store whole seconds, so
      // round to the nearest second (sub-second precision isn't meaningful for focus sessions).
      const durationSeconds = parseFloat(line.replace(/.*duration:\s*/i, "")) || 0;
      const duration = Math.round(durationSeconds);
      events.push({ type: "summary", duration });
      inSummary = false;
    }
  }

  // Store current timestamp just before the command is run so we can keep track of when we want to
  // continue searching logs from the next time the command is run. This value is only set after the
  // events have been parsed to ensure that, if the parsing times out or fails, we continue
  // searching from the previous timestamp.
  const timestamp = new Date();
  cache.set("refreshedAt", formatDate(timestamp));

  return events;
}
