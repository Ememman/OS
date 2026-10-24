export const updates = [
  {
    id: "u5",
    date: "2026-07-01",
    tag: "fix",
    title: "Fixed Deployed Devices CRUD routing in Straive IMS",
    body:
      "The custom router only handled two-segment controller/method paths, but the Deployed Devices forms posted to nested three-segment routes. Added flat-named controller methods and updated form action URLs to resolve it."
  },
  {
    id: "u4",
    date: "2026-06-20",
    tag: "feature",
    title: "Leaderboard gamification for staff",
    body:
      "Points for quiz completions, bookings, and attendance now feed a live leaderboard on the staff app home screen."
  },
  {
    id: "u3",
    date: "2026-06-08",
    tag: "fix",
    title: "Rating system overhaul",
    body:
      "Fixed route ordering and aggregation queries that referenced the wrong fields, corrected an entity-type mismatch (ratings belong to bookings, not services), and fixed a logout-on-submit bug."
  },
  {
    id: "u2",
    date: "2026-05-22",
    tag: "feature",
    title: "Admin dashboard: real-time updates",
    body:
      "Wired Socket.IO into the admin dashboard so appointment and payment changes reflect instantly without a refresh."
  },
  {
    id: "u1",
    date: "2026-05-02",
    tag: "launch",
    title: "Portfolio OS — this site",
    body:
      "Rebuilt the portfolio as a desktop-style experience: windows, a dock, widgets, and a live guest chat."
  }
];
