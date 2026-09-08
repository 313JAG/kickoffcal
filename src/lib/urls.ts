export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:43123";
}

export function teamFeedPath(feedToken: string): string {
  return `/api/cal/${feedToken}.ics`;
}

export function teamFeedUrl(feedToken: string): string {
  return `${getAppUrl()}${teamFeedPath(feedToken)}`;
}

export function webcalUrl(feedToken: string): string {
  return teamFeedUrl(feedToken).replace(/^https?:\/\//, "webcal://");
}

export function googleCalendarSubscribeUrl(feedToken: string): string {
  const ics = encodeURIComponent(teamFeedUrl(feedToken));
  return `https://calendar.google.com/calendar/r?cid=${ics}`;
}

export function outlookSubscribeUrl(feedToken: string): string {
  const ics = encodeURIComponent(teamFeedUrl(feedToken));
  return `https://outlook.live.com/calendar/0/addfromweb?url=${ics}&name=KickoffCal`;
}
