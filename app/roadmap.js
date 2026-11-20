// The roadmap to the platinum, in four stages. Every stage is built from the
// official trophy descriptions: which story chapters and missions, which
// collectibles and counts, in what order. Trophy ids refer to app/data/trophies.json.
export const ROADMAP = [
  {
    stage: 1,
    title: "Play the story",
    time: "Chapters 1–5 · ~60–80 hours",
    summary:
      "Finish all five chapters and every named story mission. Twelve trophies pop here on their own, and the one missable trophy lives in this stage.",
    steps: [
      "Play the main missions (pink icons) chapter by chapter — Gone Fishing through the final mission.",
      "In Chapter 1, do the balcony meditation with Lucia right after Down to Earth (see Positive Mental Attitude).",
      "Meet Cal, Kenton and the other side characters as they appear; scan new vehicles and study animals as you go.",
      "Keep a manual save at the start of each chapter — there is no mission replay.",
    ],
    trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 28],
  },
  {
    stage: 2,
    title: "Partner & stranger questlines",
    time: "After Chapter 2 · ~15 hours",
    summary:
      "Finish the optional questlines for Andy, Kenton, Billy, Randy, Tyrone and Bret, plus eight qualifying Strangers & Freaks strands. All of them stay open after the story.",
    steps: [
      "Andy (Lucia only, Chapter 3) · Kenton (treasure diving, 7 shipwrecks) · Billy (Thrillbilly Mud Club).",
      "Randy (deliver 16 sports cars) · Tyrone (Jason only, destroy the Synthetic Labs) · Bret (hunt his Target Decks).",
      "Strangers & Freaks: Kirk, Kyle, Yago and Pilot Pete are confirmed to count — other lines do not.",
      "Beat Cal at fishing west of Key Lento when he texts you.",
    ],
    trophies: [20, 22, 23, 24, 25, 26, 27, 29],
  },
  {
    stage: 3,
    title: "Activities, robberies & collectibles",
    time: "Free-roam · ~80 hours",
    summary:
      "The big middle: shooting ranges, drone races, races, stunts, challenges, cards, WAiNK scans, meditations, bank vaults, gang operations and the one-off feats.",
    steps: [
      "Gold all 42 Shooting Range challenges; win drone races at all 14 Top Fun spots; win 20 different races.",
      "Land 250 stunts (300 for 100%); finish 50 challenges; scan 100 WAiNK spots and 100 vehicles.",
      "Rob 5 bank vaults, an armored truck, 3 shops with your partner, and one illegal operation per gang.",
      "Buy the 8 garages, register 10 vehicles, launder $250,000, spend $100,000 — and meditate at all 18 spots.",
    ],
    trophies: [15, 16, 17, 18, 19, 21, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
  },
  {
    stage: 4,
    title: "100% completion & platinum",
    time: "Cleanup · ~40 hours",
    summary:
      "Open the 100% Completion checklist (Progress > Stats > 100% Completion) and clear it. It is closer to 60% true completion — most of it is already done by stage 3.",
    steps: [
      "Scan 200 of 277 vehicles and study 100 of 255 animals; finish any 70 of 80 challenges.",
      "Complete any 100 optional missions; meditate at 15 of 18 spots; finish all 8 bank vaults and all 39 gang operations.",
      "When the checklist reads 100%, A Long Road pops — and Vice Got a Price! follows at once.",
    ],
    trophies: [14, 1],
  },
];

// Human-readable kind labels for the filter chips and card tags.
export const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  side: "Side quest",
  meta: "Platinum road",
};
