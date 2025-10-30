// Central place for app-wide constants
// `events` is used by EventCard and pages to display featured/upcoming items
// Shape matches EventCard props: { title, image, slug, location, date, time }

export type EventItem = {
  title: string;
  image: string; // public image path (served from /public)
  slug: string;
  location: string;
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // local time display (e.g., "09:00 AM")
};

// Note: Images live in /public/images. Use those paths directly for Next/Image.
// Dates are set to upcoming/popular tech events relative to 2025/2026.
export const events: EventItem[] = [
  {
    title: "AWS re:Invent 2025",
    image: "/images/event1.png",
    slug: "aws-reinvent-2025",
    location: "Las Vegas, NV, USA",
    date: "2025-12-01",
    time: "09:00 AM",
  },
  {
    title: "GitHub Universe 2025",
    image: "/images/event2.png",
    slug: "github-universe-2025",
    location: "San Francisco, CA, USA",
    date: "2025-11-05",
    time: "10:00 AM",
  },
  {
    title: "Google Cloud Next 2026",
    image: "/images/event3.png",
    slug: "google-cloud-next-2026",
    location: "San Jose, CA, USA",
    date: "2026-04-07",
    time: "09:30 AM",
  },
  {
    title: "Microsoft Build 2026",
    image: "/images/event4.png",
    slug: "microsoft-build-2026",
    location: "Seattle, WA, USA",
    date: "2026-05-19",
    time: "09:00 AM",
  },
  {
    title: "PyCon US 2026",
    image: "/images/event5.png",
    slug: "pycon-us-2026",
    location: "Pittsburgh, PA, USA",
    date: "2026-05-01",
    time: "08:30 AM",
  },
  {
    title: "JSConf EU 2026",
    image: "/images/event6.png",
    slug: "jsconf-eu-2026",
    location: "Berlin, Germany",
    date: "2026-06-12",
    time: "10:00 AM",
  },
  {
    title: "ETHGlobal Hackathon: Lisbon 2025",
    image: "/images/event-full.png",
    slug: "ethglobal-lisbon-2025",
    location: "Lisbon, Portugal",
    date: "2025-11-22",
    time: "09:00 AM",
  },
  {
    title: "React Summit 2026",
    image: "/images/event3.png",
    slug: "react-summit-2026",
    location: "Amsterdam, Netherlands",
    date: "2026-06-26",
    time: "09:30 AM",
  },
];
