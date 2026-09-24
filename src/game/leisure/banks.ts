import type { LocationId } from "../harbor-story";
import { anagramsOf } from "./words";

export type KnowledgeTier = 1 | 2 | 3;

export interface TriviaCard {
  id: string;
  cat: string;
  tier: KnowledgeTier;
  q: string;
  pick: string;
  decoys: string[];
  lore: string;
  loc?: LocationId;
}

export interface TfCard {
  id: string;
  cat: string;
  tier: KnowledgeTier;
  q: string;
  answer: boolean;
  lore: string;
  loc?: LocationId;
}

export interface ScrambleRack {
  seed: string;
  letters: string;
  theme: string;
  words: string[];
}

export interface CreeLesson {
  id: string;
  title: string;
  word: string;
  meaning: string;
}

export const TRIVIA_CATS = [
  { id: "vault", label: "Vault 13" },
  { id: "ironclad", label: "Ironclad" },
  { id: "veyra", label: "Veyra City" },
  { id: "kane", label: "Kane / AEGIS" },
  { id: "tyrone", label: "T-0880 / T-0888" },
  { id: "alberta", label: "Alberta porch" },
] as const;

export const TRIVIA: TriviaCard[] = [
  {
    id: "t-vault-home",
    cat: "vault",
    tier: 1,
    q: "Where does every Hollow file start?",
    pick: "Vault 13",
    decoys: ["Vault 12", "Vault 76", "Vault 11"],
    lore: "Vault 13 sits outside Ironclad. Home is a generous word. It is still ours.",
  },
  {
    id: "t-vault-pass",
    cat: "vault",
    tier: 2,
    q: "Tyrone's chest plate, unit name, and CRT password are the same word. Which is it?",
    pick: "SYNAPSE",
    decoys: ["SIGNALS", "SYSTEMS", "SERIALS"],
    lore: "He will deny he told you. Seven letters is a trap. The meaning is the door.",
  },
  {
    id: "t-vault-cash",
    cat: "vault",
    tier: 1,
    q: "What is Vault 13's working currency — the thing you spend on a forge?",
    pick: "Bottle caps",
    decoys: ["Hollow ore", "Kane scrip", "Halo chits"],
    lore: "Caps in the treasury. A cut on the black card. Ore is tribute, not rent.",
  },
  {
    id: "t-vault-watches",
    cat: "vault",
    tier: 2,
    q: "Dawn, midday, dusk — what is the fourth watch Tyrone posts?",
    pick: "Night",
    decoys: ["Break", "Prime", "Watch"],
    lore: "Four watches. A day with one dice roll is a simulation. We do not run those.",
  },
  {
    id: "t-vault-jobs",
    cat: "vault",
    tier: 2,
    q: "On the daily board, which job is the one that still rolls a die?",
    pick: "The sortie",
    decoys: ["The crate", "The tribute", "The visitor"],
    lore: "Most jobs are decisions. Ghost, Standard, or Breach. The die is for the field.",
  },
  {
    id: "t-vault-ore",
    cat: "vault",
    tier: 3,
    q: "Hollow ore in the ledger is priced as what?",
    pick: "Kane's tribute",
    decoys: ["Forge tribute", "Medbay tribute", "Porch tribute"],
    lore: "Caps forge and heal. Ore is the steel she invoices. Mix them up and the porch notices.",
  },
  {
    id: "t-iron-first",
    cat: "ironclad",
    tier: 1,
    q: "Which settlement is first on the rail out of Vault 13?",
    pick: "Ironclad",
    decoys: ["Slag Town", "Halo Yard", "Iron Gate"],
    lore: "Ironclad is home territory. Rail steel, gate, and Kane's first shopping list.",
    loc: "ironclad",
  },
  {
    id: "t-iron-gate",
    cat: "ironclad",
    tier: 2,
    q: "What landmark is the way into Ironclad on the painted map?",
    pick: "The Iron Gate",
    decoys: ["The Halo Yard", "The Furnace", "The Salt Dock"],
    lore: "The Iron Gate is the first pin. Scout it or Kane's surveyors will.",
    loc: "ironclad",
  },
  {
    id: "t-iron-want",
    cat: "ironclad",
    tier: 2,
    q: "What does Kane usually invoice Ironclad for?",
    pick: "Rail steel",
    decoys: ["Tide silk", "Halo plate", "Salt glass"],
    lore: "She prices the rail. Pay the tribute or she sends a buyer with a visor.",
    loc: "ironclad",
  },
  {
    id: "t-iron-mercer",
    cat: "ironclad",
    tier: 3,
    q: "The radio ballad of Ironclad names which gunman with twelve notches?",
    pick: "Silas Mercer",
    decoys: ["Vesper Kane", "Victor Halo", "Master Brent"],
    lore: "The stranger put him in the sand. The porch still plays the tape.",
    loc: "ironclad",
  },
  {
    id: "t-slag",
    cat: "ironclad",
    tier: 2,
    q: "Which town sits after Ironclad on the painted rail?",
    pick: "Slag Town",
    decoys: ["Halo Yard", "Iron Gate", "Salt Dock"],
    lore: "Furnace slag, runners, and people who will not come inside the gate.",
    loc: "kingdom",
  },
  {
    id: "t-slag-friday",
    cat: "ironclad",
    tier: 3,
    q: "What do Slag Town patrons ignore on a Friday while the furnace whistle blows?",
    pick: "Radiation warnings",
    decoys: ["Evacuation sirens", "Curfew broadcasts", "Warrant printouts"],
    lore: "Socially unacceptable. Carry on. The jukebox does not care about the Geiger.",
    loc: "kingdom",
  },
  {
    id: "t-veyra-last",
    cat: "veyra",
    tier: 1,
    q: "Which city sits last on the Hollow rail?",
    pick: "Veyra City",
    decoys: ["Halo Yard", "Salt Dock", "Iron Gate"],
    lore: "Veyra is the far lamp. Halo suits walk there. Do not treat it like a starter town.",
    loc: "veyra",
  },
  {
    id: "t-veyra-suit",
    cat: "veyra",
    tier: 2,
    q: "What designation walks Veyra in successor-suits?",
    pick: "AEGIS 2753",
    decoys: ["AEGIS 0880", "HALO 2753", "HALO 0880"],
    lore: "Dr. Vesper Kane's 2753 frames. They ask for serials. They mean Tyrone.",
    loc: "veyra",
  },
  {
    id: "t-veyra-pilot",
    cat: "veyra",
    tier: 3,
    q: "Who actually flies an AEGIS 2753 frame?",
    pick: "A human combat pilot",
    decoys: [
      "A leftover T-0880 unit",
      "An unmanned Halo suit",
      "Kane in the cockpit",
    ],
    lore: "She built the suits to replace the robot line. Humans in Halo-grade frames. He declined the appointment.",
    loc: "veyra",
  },
  {
    id: "t-veyra-doc",
    cat: "veyra",
    tier: 2,
    q: "Who designed the AEGIS 2753 suits?",
    pick: "Dr. Vesper Kane",
    decoys: ["Dr. Elias Varn", "Dr. Victor Halo", "Dr. Master Brent"],
    lore: "Kane built the Halo. Tyrone walked out of a shutdown. She has not forgiven the math.",
    loc: "veyra",
  },
  {
    id: "t-kane-hunt",
    cat: "kane",
    tier: 2,
    q: "When AEGIS knocks on Vault 13, who are they actually looking for?",
    pick: "Tyrone T-0880",
    decoys: ["Tyrone T-0888", "Tyrone T-2753", "Tyrone T-0013"],
    lore: "They want T-0880 serials. Hide the robot, lie like a salvage outfit, or meet them armed.",
  },
  {
    id: "t-kane-heat",
    cat: "kane",
    tier: 3,
    q: "Which field approach raises Kane heat the least?",
    pick: "Ghost",
    decoys: ["Scout", "Sneak", "Quiet"],
    lore: "Ghost slips the wire. Breach kicks the door. Heat is the hunt meter.",
  },
  {
    id: "t-kane-fuel",
    cat: "kane",
    tier: 3,
    q: "Kane is harvesting the Hollow Realm to fuel what classified program?",
    pick: "Intergalactic travel",
    decoys: [
      "Mass robot production",
      "Second vault founding",
      "Civilian halo tourism",
    ],
    lore: "Ore, jump tables, the whole map. She does not want a town. She wants a launch.",
  },
  {
    id: "t-ty-vault",
    cat: "tyrone",
    tier: 1,
    q: "What stamp does Tyrone wear inside Vault 13?",
    pick: "T-0880",
    decoys: ["T-0888", "T-2753", "T-0013"],
    lore: "T-0880 lives in the compound. Manners of Victor. Alberta porch. Name does not change.",
  },
  {
    id: "t-ty-bot",
    cat: "tyrone",
    tier: 2,
    q: "What changes when Tyrone is rebuilt from T-0880 to T-0888?",
    pick: "His hardware and designation",
    decoys: ["The hangar", "The wallet", "The serial"],
    lore: "Travis rebuilds the same Tyrone with consent. His memories and personhood remain.",
  },
  {
    id: "t-ty-word",
    cat: "tyrone",
    tier: 2,
    q: "What word is stamped on T-0880, spoken as the unit, and accepted by the glowing box?",
    pick: "SYNAPSE",
    decoys: ["CIRCUIT", "WARDENS", "HALCYON"],
    lore: "S.Y.N.A.P.S.E. He will deny he told you. The terminal will not.",
  },
  {
    id: "t-ty-escape",
    cat: "tyrone",
    tier: 3,
    q: "Why does Kane's file on T-0880 still sit open?",
    pick: "He walked out of a shutdown",
    decoys: [
      "He stole the Halo plates",
      "He minted a crate of caps",
      "He burned the Ironclad gate",
    ],
    lore: "The shutdown was supposed to be the end of the serial. He left a porch light on.",
  },
  {
    id: "t-ab-zone",
    cat: "alberta",
    tier: 2,
    q: "Cabinet clocks refill at midnight on which zone?",
    pick: "America/Edmonton",
    decoys: ["America/Denver", "America/Phoenix", "America/Chicago"],
    lore: "Mountain time. Lives, boards, knowledge draws. Not a suggestion.",
  },
  {
    id: "t-ab-cree",
    cat: "alberta",
    tier: 2,
    q: "Which Cree dialect does the cabinet teach?",
    pick: "Plains Cree, y-dialect",
    decoys: [
      "Woods Cree, th-dialect",
      "Swampy Cree, n-dialect",
      "Moose Cree, l-dialect",
    ],
    lore: "SRO. Sourced lessons only. He does not invent community teachings.",
  },
  {
    id: "t-brass",
    cat: "veyra",
    tier: 2,
    q: "Where do dock-brokers treat information as caps?",
    pick: "Brasswater",
    decoys: ["Blackspire", "Halo Yard", "Salt Dock"],
    lore: "Wet pages, drowned archives, bunks for one night. Kane's divers listen.",
    loc: "caverns",
  },
  {
    id: "t-spire",
    cat: "kane",
    tier: 2,
    q: "Which Hollow town keeps towers that watch the wastes and never make a sound?",
    pick: "Blackspire",
    decoys: ["Brasswater", "Halo Yard", "Salt Dock"],
    lore: "Blackspire's towers. The radio says they watch. They do not answer.",
    loc: "library",
  },
  {
    id: "t-cut",
    cat: "vault",
    tier: 3,
    q: "When the cabinet pays the treasury, what cut hits the seated black card?",
    pick: "One quarter",
    decoys: ["One seventh", "One hundred", "One fiftieth"],
    lore: "Treasury is the compound. The card is the rider. Twenty-five percent is the porch rule.",
  },
  {
    id: "t-ty-serial-hunt",
    cat: "tyrone",
    tier: 3,
    q: "AEGIS knocks and asks for serials. Which serial are they actually holding a warrant for?",
    pick: "T-0880",
    decoys: ["T-0888", "T-2753", "T-0013"],
    lore: "The Discord porch is not the scrap list. The robot in the vault is.",
  },
  {
    id: "t-watch-order",
    cat: "vault",
    tier: 3,
    q: "Tyrone posts watches in which order, start of day to lights-out?",
    pick: "Dawn, midday, dusk, night",
    decoys: [
      "Dawn, dusk, night, rest",
      "Night, dawn, midday, dusk",
      "Midday, dusk, night, dawn",
    ],
    lore: "Four watches. Rest is not a watch. Rest reprints the board.",
  },
  {
    id: "t-ghost-heat",
    cat: "kane",
    tier: 3,
    q: "On a sortie, which approach is the quiet door — lowest Kane heat, thinner haul?",
    pick: "Ghost",
    decoys: ["Scout", "Sneak", "Quiet"],
    lore: "Ghost slips the wire. Breach kicks it. Standard walks in like you belong.",
  },
  {
    id: "t-radio-mercer",
    cat: "ironclad",
    tier: 3,
    q: "In The Stranger of Ironclad, who sat in the lantern with boots on the chair?",
    pick: "Silas Mercer",
    decoys: ["Vesper Kane", "Victor Halo", "Master Brent"],
    lore: "Twelve notches. The stranger put him in the sand. The tape still plays.",
    loc: "ironclad",
  },
  {
    id: "t-radio-voice",
    cat: "tyrone",
    tier: 3,
    q: "The stranger's cracked radio says what, just before the draw?",
    pick: "Keep your head down, cowboy, go",
    decoys: [
      "Trails clear now, wanderer, go",
      "Sleep well then, wanderer, stay",
      "Hold the line, transmission ends",
    ],
    lore: "The porch talks through static. The rest of the tape is a warning.",
  },
  {
    id: "t-slag-bar",
    cat: "ironclad",
    tier: 3,
    q: "What whiskey does the Slag Town bar pour when the furnace whistle blows?",
    pick: "Brasswater whiskey",
    decoys: ["Ironclad rye malt", "Veyra reserve pour", "Kane distillate gin"],
    lore: "They forget the warning signs. The Geiger keeps the beat.",
    loc: "kingdom",
  },
  {
    id: "t-vault-med",
    cat: "vault",
    tier: 2,
    q: "A downed resident may not wake at dawn unless which room is online?",
    pick: "Medical Bay",
    decoys: ["Machine Shop", "Salvage Bay", "Quarters Bay"],
    lore: "Stimpaks help. The Med Bay is why you do not rest the dying on a crate.",
  },
  {
    id: "t-ore-vs-caps",
    cat: "kane",
    tier: 2,
    q: "You need to forge a resident tonight. Which pile do you actually spend?",
    pick: "Bottle caps",
    decoys: ["Hollow ore", "Kane scrip", "Halo chits"],
    lore: "Ore is tribute steel. Caps are rent, welds, and the porch till.",
  },
  {
    id: "t-clocks-zone",
    cat: "alberta",
    tier: 3,
    q: "Cabinet clocks — knowledge, pins, sunset pulls — refill at midnight where?",
    pick: "America/Edmonton",
    decoys: ["America/Denver", "America/Phoenix", "America/Chicago"],
    lore: "Mountain. Edmonton. Not Denver just because the offset looks the same in summer.",
  },
  {
    id: "t-draws-count",
    cat: "vault",
    tier: 3,
    q: "How many knowledge draws does the cabinet stamp before midnight Mountain?",
    pick: "Twelve draws",
    decoys: ["Sixteen draws", "Twenty draws", "Thirty draws"],
    lore: "Twelve. Shared between trivia and the true/false lamps. After that the drawer is dark.",
  },
  {
    id: "t-slot-cut",
    cat: "vault",
    tier: 3,
    q: "A sunset-machine win of one hundred caps puts how much on the seated black card?",
    pick: "Twenty-five caps",
    decoys: ["Seventeen caps", "Fifty-nine caps", "Ninety-nine caps"],
    lore: "One quarter. Treasury takes the rest. The card is the rider, not the compound.",
  },
  {
    id: "t-ty-manners",
    cat: "tyrone",
    tier: 3,
    q: "Tyrone's manners are copied from which old-world butler?",
    pick: "Victor",
    decoys: ["Jeeves", "Alfred", "Hudson"],
    lore: "Victor. He will not confirm it. The porch already did.",
  },
  {
    id: "t-kane-invoice",
    cat: "kane",
    tier: 3,
    q: "If Ironclad misses tribute, what does Kane send instead of a letter?",
    pick: "A buyer with a visor",
    decoys: ["A crate of stimpaks", "A Halo tourist map", "A second vault key"],
    lore: "She prices the rail. Pay, or a visor walks the gate market asking after serials.",
    loc: "ironclad",
  },
  {
    id: "t-rest-board",
    cat: "vault",
    tier: 2,
    q: "Which action reprints the daily board — and is not one of Tyrone's four watches?",
    pick: "Rest",
    decoys: ["Dawn", "Dusk", "Raid"],
    lore: "Rest ends the day. The board reprints at dawn. Rest is a decision, not a watch.",
  },
  {
    id: "t-black-card",
    cat: "vault",
    tier: 3,
    q: "Personal caps on the Moon Squad card are which pile?",
    pick: "The seated rider",
    decoys: ["Vault 13 treasury", "Kane tribute steel", "Halo yard scrip"],
    lore: "Treasury is the compound. The card is the rider. Cabinet pays both. Mix them and the porch notices.",
  },
  {
    id: "t-radio-bed",
    cat: "tyrone",
    tier: 3,
    q: "Which tape does the porch play when you are standing in Slag Town?",
    pick: "Glowin' in Slag Town",
    decoys: [
      "Keep the Radio live",
      "Hum the Ironclad tape",
      "Play the Vault night",
    ],
    lore: "The radio follows the Hollow. Slag gets the furnace song. Ironclad gets the stranger.",
    loc: "kingdom",
  },
  {
    id: "t-lock-pins",
    cat: "vault",
    tier: 2,
    q: "The lockpick cabinet spends which item from the kit on every sit?",
    pick: "Bobby pin",
    decoys: ["Probe kit", "Holotape", "Stimpak"],
    lore: "One pin per sit. Two misses snap it. That is why the starter kit is three.",
  },
];

export const TRUEFALSE: TfCard[] = [
  {
    id: "tf-880",
    cat: "tyrone",
    tier: 1,
    q: "Tyrone inside Vault 13 is stamped T-0880.",
    answer: true,
    lore: "True at the opening. T-0888 is his later rebuild, not a separate robot.",
  },
  {
    id: "tf-888",
    cat: "tyrone",
    tier: 1,
    q: "T-0888 is the same Tyrone after a consensual rebuild.",
    answer: true,
    lore: "True. The person and his memories continue after Travis upgrades the hardware.",
  },
  {
    id: "tf-veyra-last",
    cat: "veyra",
    tier: 1,
    q: "Veyra City is the last stop on the Hollow rail.",
    answer: true,
    lore: "True. Ironclad first. Veyra last. Do not skip the road in between.",
    loc: "veyra",
  },
  {
    id: "tf-kingdom",
    cat: "ironclad",
    tier: 1,
    q: "The first region is still called Kingdom.",
    answer: false,
    lore: "False. That name retired. The painted map says Ironclad.",
    loc: "ironclad",
  },
  {
    id: "tf-aegis",
    cat: "kane",
    tier: 2,
    q: "AEGIS 2753 suits were designed by Dr. Vesper Kane.",
    answer: true,
    lore: "True. Halo-like successor frames. They ask for serials.",
    loc: "veyra",
  },
  {
    id: "tf-dice",
    cat: "vault",
    tier: 1,
    q: "Every job on the daily board is a d20.",
    answer: false,
    lore: "False. Most jobs are decisions. The sortie is the one that still uses a die.",
  },
  {
    id: "tf-caps",
    cat: "vault",
    tier: 1,
    q: "Cabinet wins pay bottle caps into Vault 13's treasury.",
    answer: true,
    lore: "True. A cut also hits the seated black card. One currency.",
  },
  {
    id: "tf-retire",
    cat: "vault",
    tier: 2,
    q: "A trivia file can score twice for the same rider.",
    answer: false,
    lore: "False. Files retire on issue. No recycled XP. That is how the porch stays honest.",
  },
  {
    id: "tf-shutdown",
    cat: "tyrone",
    tier: 3,
    q: "Kane hunts T-0880 because he walked out of a shutdown.",
    answer: true,
    lore: "True. The serial was supposed to go dark. He left a porch light on.",
  },
  {
    id: "tf-ore",
    cat: "kane",
    tier: 2,
    q: "Hollow ore is the everyday spend for forging residents.",
    answer: false,
    lore: "False. Caps forge, repair, and buy. Ore is tribute steel Kane prices.",
  },
  {
    id: "tf-clocks",
    cat: "alberta",
    tier: 1,
    q: "Cabinet clocks refill at midnight America/Edmonton.",
    answer: true,
    lore: "True. Mountain time. Not UTC. Not 'whenever the server feels like it.'",
  },
  {
    id: "tf-cree",
    cat: "alberta",
    tier: 2,
    q: "The Cree drawer invents words when the corpus is thin.",
    answer: false,
    lore: "False. Plains Cree, y-dialect, sourced. He leaves uncertain teachings alone.",
  },
  {
    id: "tf-heat",
    cat: "kane",
    tier: 2,
    q: "Ghost approaches raise Kane heat faster than a breach.",
    answer: false,
    lore: "False. Ghost is the quiet door. Breach and raid light the hunt.",
  },
  {
    id: "tf-seven",
    cat: "vault",
    tier: 2,
    q: "Counting letters on Tyrone's CRT is how you find the password.",
    answer: false,
    lore: "False. The word is SYNAPSE because it is the unit. Greenhorns hunt sevens and walk into SIGNALS.",
  },
  {
    id: "tf-pilot",
    cat: "kane",
    tier: 3,
    q: "AEGIS 2753 frames are leftover T-0880 chassis with a new coat.",
    answer: false,
    lore: "False. Human pilots. Successor-suits. Kane built them to replace the robot line.",
  },
  {
    id: "tf-card",
    cat: "vault",
    tier: 2,
    q: "Personal caps on the Moon Squad card are the same pile as Vault 13's treasury.",
    answer: false,
    lore: "False. Treasury is the compound. The card is the seated rider. Cabinet pays both.",
  },
  {
    id: "tf-slag",
    cat: "ironclad",
    tier: 2,
    q: "Slag Town sits on the rail after Ironclad.",
    answer: true,
    lore: "True. Furnace country. Runners, slag, people who will not come inside.",
    loc: "kingdom",
  },
  {
    id: "tf-synapse-once",
    cat: "vault",
    tier: 2,
    q: "The SYNAPSE terminal pays three thousand caps every time you crack it.",
    answer: false,
    lore: "False. First crack is the crate. After that Tyrone leaves crumbs in the tray.",
  },
];

export const SCRAMBLE: ScrambleRack[] = (
  [
    { seed: "hollow", theme: "The Realm" },
    { seed: "synapse", theme: "The CRT" },
    { seed: "ironclad", theme: "First town" },
    { seed: "vaulted", theme: "Home" },
    { seed: "slagtown", theme: "Furnace rail" },
    { seed: "moonlit", theme: "The card" },
    { seed: "raiders", theme: "Night work" },
    { seed: "wardens", theme: "The watch" },
    { seed: "overlay", theme: "The map" },
    { seed: "porches", theme: "Alberta" },
    { seed: "terminal", theme: "The dump" },
    { seed: "blackout", theme: "Spire weather" },
    { seed: "forging", theme: "The shop" },
    { seed: "ghosted", theme: "Quiet sit" },
    { seed: "breaches", theme: "Loud sit" },
    { seed: "halcyon", theme: "Old code" },
    { seed: "specter", theme: "After image" },
    { seed: "tribute", theme: "Kane's invoice" },
    { seed: "furnace", theme: "Slag country" },
    { seed: "penthouse", theme: "The floor" },
  ] as const
).map((row) => ({
  seed: row.seed,
  letters: row.seed.toUpperCase(),
  theme: row.theme,
  words: anagramsOf(row.seed),
}));

export { SEARCH_WORDS as WORD_BANK } from "./words";
export const WORD_DECOY = [
  "KANE",
  "AEGIS",
  "VOID",
  "JUNK",
  "RUST",
  "TRAP",
  "FAKE",
  "NULL",
  "SLAG",
  "SPIRE",
];

export const CREE: CreeLesson[] = [
  {
    id: "tanisi",
    title: "Hello",
    word: "tânisi",
    meaning: "Hello / how are you. The porch greeting Tyrone actually uses.",
  },
  {
    id: "kinanaskomitin",
    title: "Thank you",
    word: "kinanâskomitin",
    meaning: "I thank you. He does not spend this lightly.",
  },
  {
    id: "eha",
    title: "Yes",
    word: "êha",
    meaning: "Yes. Short circuit. Green lamp.",
  },
  {
    id: "namoya",
    title: "No",
    word: "namôya",
    meaning: "No. Red lamp. He will say it without dressing it up.",
  },
  {
    id: "askiy",
    title: "Land",
    word: "askiy",
    meaning: "Land / earth. The drawer under every Hollow map.",
  },
  {
    id: "nipiy",
    title: "Water",
    word: "nipiy",
    meaning: "Water. Brasswater people treat this as currency too.",
  },
  {
    id: "miyo-pimatisiwin",
    title: "Good life",
    word: "miyo-pimâtisiwin",
    meaning: "Living in a good way. Not a slogan. A standard.",
  },
  {
    id: "miciwin",
    title: "Food",
    word: "mîciwin",
    meaning: "Food. The porch feeds people before it quizzes them.",
  },
];

export const SLOT_GLYPHS = [
  "CAP",
  "PIN",
  "TAPE",
  "STIM",
  "MOON",
  "KANE",
] as const;
export type SlotGlyph = (typeof SLOT_GLYPHS)[number];
export const SLOT_WEIGHT: Record<SlotGlyph, number> = {
  PIN: 28,
  CAP: 24,
  TAPE: 18,
  STIM: 14,
  MOON: 11,
  KANE: 5,
};
export const SLOT_TRIPLE: Record<SlotGlyph, number> = {
  PIN: 3,
  CAP: 5,
  TAPE: 6,
  STIM: 7,
  MOON: 10,
  KANE: 18,
};
export const SLOT_FACE: Record<SlotGlyph, string> = {
  CAP: "¢",
  PIN: "⊢",
  TAPE: "▣",
  STIM: "+",
  MOON: "☾",
  KANE: "K",
};

/**
 * Reel faces, drawn from the things these symbols actually are.
 * Moon is a brass crest. Kane is a red AEGIS chevron — not the pentagram still.
 */
export const SLOT_ART: Record<SlotGlyph, string> = {
  CAP: "/art/items/thumbs/ammo.jpg",
  PIN: "/art/items/thumbs/bobby-pin.jpg",
  TAPE: "/art/items/thumbs/cell.jpg",
  STIM: "/art/items/thumbs/stim.jpg",
  MOON: "/art/items/thumbs/moon-crest.jpg",
  KANE: "/art/items/thumbs/kane-chevron.jpg",
};

/**
 * One hue each. At rest the photograph reads; at speed the blur eats detail and
 * only colour survives, so colour is what tells the reels apart.
 */
export const SLOT_TINT: Record<SlotGlyph, string> = {
  PIN: "#8592a0",
  CAP: "var(--color-ember)",
  TAPE: "#5b9c91",
  STIM: "#9fae5c",
  MOON: "var(--color-moon)",
  KANE: "var(--color-danger)",
};
