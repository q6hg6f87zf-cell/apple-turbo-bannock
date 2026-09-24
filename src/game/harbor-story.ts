/** Historical canon v3: evidence, living witnesses, consent and accountable authority. */
// Adapted from Dream Harbor's canon campaign; rules execute against Bannock saves.
export type LocationId =
  "ironclad" | "kingdom" | "caverns" | "library" | "veyra" | "hq";
export interface NarrativeCheck {
  type: string;
  id?: string;
  status?: string;
  choices?: string[];
  name?: string;
  loc?: LocationId;
  n?: number;
  key?: string;
  gte?: number;
}
export interface ScenarioApproach {
  id: string;
  label: string;
  blurb: string;
  tyroneLine: string;
  outcome: string;
  journal: { title: string; body: string; tags: string[] };
  grants?: string[];
  trustDelta?: number;
  heatDelta?: number;
  faction?: Record<string, number>;
  flagsSet?: string[];
  acquisition?: string;
  clearRegion?: LocationId;
  require?: NarrativeCheck[];
  ending?: string;
}
export interface ScenarioDef {
  id: string;
  title: string;
  locationId: LocationId;
  poiId: string;
  setup: string;
  locationLabel: string;
  trigger: NarrativeCheck[];
  resolvedWhen: NarrativeCheck[];
  approaches: ScenarioApproach[];
}
const done = (id: string): NarrativeCheck => ({
  type: "beat",
  id: `canon_${id}`,
  status: "done",
});
const choice = (id: string, ...choices: string[]): NarrativeCheck => ({
  type: "choice",
  id: `canon_${id}`,
  choices,
});
const item = (name: string): NarrativeCheck => ({ type: "item", name });
const intel = (loc: LocationId, n = 3): NarrativeCheck => ({
  type: "region_intel_gte",
  loc,
  n,
});
const trust = (n: number): NarrativeCheck => ({ type: "tyrone_trust_gte", n });
const row = (
  id: string,
  label: string,
  blurb: string,
  tyroneLine: string,
  extra: Partial<ScenarioApproach> = {},
): ScenarioApproach => ({
  id,
  label,
  blurb,
  tyroneLine,
  outcome: "full_success",
  journal: { title: label, body: blurb, tags: ["canon", id] },
  ...extra,
});
const scene = (
  id: string,
  title: string,
  locationId: LocationId,
  poiId: string,
  setup: string,
  trigger: NarrativeCheck[],
  approaches: ScenarioApproach[],
): ScenarioDef => ({
  id: `canon_${id}`,
  title,
  locationId,
  poiId,
  setup,
  locationLabel: {
    ironclad: "Ironclad · Grande Cache / Highway 40",
    kingdom: "Slag Town · Kamloops",
    caverns: "Blackspire · Robson / Yellowhead",
    library: "Brasswater · Fraser delta",
    veyra: "Veyra · Vancouver",
    hq: "Vault 13",
  }[locationId],
  trigger: [{ type: "character_forged" }, ...trigger],
  resolvedWhen: [done(id)],
  approaches,
});
export const CANON_SCENARIOS: ScenarioDef[] = [
  scene(
    "bay",
    "The Scrap Manifest",
    "ironclad",
    "ironclad-shop",
    "Travis leaves Last Receipt beside the bench. “No software in it.” Under the floor is a recall packet bearing his signature. Tyrone looks at the guitar instead of the page.",
    [intel("ironclad", 2)],
    [
      row(
        "consent",
        "Let Tyrone choose what to open",
        "Travis opens the service archive with the Deadman Key. Tyrone retains control of his personal recording.",
        "He signed for scrap that never existed. I was already on the road.",
        {
          grants: [
            "Deadman Key",
            "T-0880 Shutdown Order",
            "Grey Guitar Recording",
          ],
          trustDelta: 8,
          faction: { vault13: 3 },
          flagsSet: ["travis_met"],
        },
      ),
      row(
        "press",
        "Demand the official record",
        "You obtain the maintenance key and shutdown order. Tyrone declines to share the song.",
        "The order is yours. The song is not.",
        {
          grants: ["Deadman Key", "T-0880 Shutdown Order"],
          trustDelta: -5,
          flagsSet: ["travis_met"],
        },
      ),
    ],
  ),
  scene(
    "courier",
    "The Last Unopened Locker",
    "ironclad",
    "ironclad-highway",
    "A courier locker holds a letter, a family photograph and a clinic receipt. Recall arrived before Tyrone finished this route. The family still lives near the Highway 40 turnoff.",
    [done("bay")],
    [
      row(
        "deliver",
        "Finish the delivery",
        "Return the sealed letter to its intended family. Their names enter Tyrone’s memory as people, not freight.",
        "I kept their address longer than I kept the road.",
        { trustDelta: 10, faction: { ironclad: 3, union: 2 } },
      ),
      row(
        "archive",
        "Keep it sealed in the local archive",
        "The Relay Union accepts responsibility for locating the recipient.",
        "Keep the envelope with the name. Otherwise it is just paper.",
        { trustDelta: 3, faction: { union: 3 } },
      ),
    ],
  ),
  scene(
    "hound",
    "HOUND-LEAD",
    "ironclad",
    "ironclad-gravenor",
    "Gravenor sounds an old route whistle. Tyrone recognizes the man who escorted him through snow. The black-tag ledger lists clinics, resistant settlements and Reeve’s codes. “Medicine, or a list of people to squeeze?”",
    [done("bay"), intel("ironclad", 4)],
    [
      row(
        "compact",
        "Broker a Compact–Pack agreement",
        "Publish the ledger and retain local route control. Gravenor remains a witness and authorizes Hound’s Tooth with its range cards.",
        "Both. I carried both. I did not know what the second list was for.",
        {
          grants: ["Black-tag Ledger", "Hound's Tooth", "AEGIS Servo Ring"],
          acquisition: "authorized",
          clearRegion: "ironclad",
          trustDelta: 4,
          heatDelta: 3,
          faction: { pack: 6, ironclad: 4, kane: -4 },
        },
      ),
      row(
        "pack",
        "Back the Ashen Pack",
        "The Pack retains its routes and lends its rifle. Compact trade loses access until relations improve.",
        "Remembering the clinic does not make every road he closes right.",
        {
          grants: ["Black-tag Ledger", "Hound's Tooth", "AEGIS Servo Ring"],
          acquisition: "gifted",
          clearRegion: "ironclad",
          faction: { pack: 8, ironclad: -4, kane: -4 },
        },
      ),
      row(
        "compact_only",
        "Give the evidence to the Compact",
        "Protect the witness and keep trade open. Gravenor retains his rifle.",
        "The paper belongs in more than one pair of hands.",
        {
          grants: ["Black-tag Ledger", "AEGIS Servo Ring"],
          clearRegion: "ironclad",
          faction: { ironclad: 6, pack: -2 },
        },
      ),
    ],
  ),
  scene(
    "lyra",
    "The White Witness",
    "ironclad",
    "ironclad-berm",
    "Lyra’s white visor shifts above the berm. She asks for the ledger, not Tyrone’s serial. Ridge Glass stays on the road while she reads.",
    [item("Black-tag Ledger")],
    [
      row(
        "witness",
        "Let Lyra authenticate the ledger",
        "Lyra preserves her observation record and authorizes her equipment. Taking a rifle cannot substitute for her testimony.",
        "She lowered the barrel before answering. I am counting that.",
        {
          grants: ["Ridge Glass", "Mast Knife"],
          acquisition: "authorized",
          faction: { aegis: 4 },
        },
      ),
      row(
        "exclude",
        "Keep her outside the evidence circle",
        "The documents survive without Lyra’s endorsement or equipment.",
        "A closed door still tells her something.",
        { faction: { aegis: -2 } },
      ),
    ],
  ),
  scene(
    "furnace",
    "What the Furnace Owes",
    "kingdom",
    "slag-tithe",
    "Valdris stands in a heat-resistant rig. His name is on the death list because CIVITAS locked the workers inside. “I lived. The debt did too.” Vera’s buyers want the Helios matrices; the Cinder Union wants one safe shift.",
    [done("hound"), intel("kingdom")],
    [
      row(
        "union",
        "Keep one matrix for the town",
        "Use the Deadman Key to stabilize coolant, then transfer furnace control to the Union. Workers keep a matrix; Travis receives the regulator.",
        "Winning an argument is a poor reason to cook a town.",
        {
          require: [item("Deadman Key")],
          grants: ["Tithe Keys", "The Balance", "Helios Thermal Regulator"],
          acquisition: "surrendered",
          clearRegion: "kingdom",
          trustDelta: 4,
          faction: { union: 8, kane: -3 },
        },
      ),
      row(
        "court",
        "Negotiate production with Valdris",
        "Production and debt-based control remain. Valdris releases a regulator, retaining his maul and keys.",
        "Ask the next shift whether they could afford to refuse.",
        {
          grants: ["Helios Thermal Regulator"],
          clearRegion: "kingdom",
          faction: { kane: 3, union: -5 },
        },
      ),
      row(
        "vesper",
        "Honor the Vesper purchase",
        "Vesper receives the matrices. Supply remains stable; workers gain no ownership. Bay 13 receives a service regulator.",
        "Aid on one page. Ownership on the next.",
        {
          grants: ["Helios Thermal Regulator"],
          clearRegion: "kingdom",
          trustDelta: -3,
          faction: { kane: 6, aegis: 2, union: -7 },
        },
      ),
    ],
  ),
  scene(
    "survey",
    "The Map That Lied",
    "caverns",
    "blackspire-deepworks",
    "Thessaly lays True North across two maps. Hers says STOP EXTRACTION. Reeve’s revision calls the risk manageable. A lift crew died between those sentences. Tyrone remembers carrying the revision.",
    [done("furnace"), intel("caverns")],
    [
      row(
        "protect",
        "Protect the deepworks and publish both maps",
        "The Cartographers share safe access, the original survey and a cognition lattice. True North is authorized for rescue and evidence work. Extraction pauses.",
        "That is my route stamp. I will not call it somebody else’s mistake.",
        {
          grants: [
            "Original Survey",
            "True North",
            "Blackglass Cognition Lattice",
          ],
          acquisition: "authorized",
          clearRegion: "caverns",
          trustDelta: 5,
          faction: { kane: -4, union: 3 },
          flagsSet: ["blackspire_alliance"],
        },
      ),
      row(
        "extract",
        "Accept bounded extraction",
        "Thessaly preserves the original report and lends a lattice under local monitoring. She retains True North.",
        "A boundary somebody here can enforce.",
        {
          grants: ["Original Survey", "Blackglass Cognition Lattice"],
          clearRegion: "caverns",
          faction: { kane: 1, union: 1 },
        },
      ),
      row(
        "conceal",
        "Conceal the altered report",
        "Vesper receives the claim. Thessaly survives but refuses your coalition; authenticated survey evidence is lost.",
        "I helped bury this without knowing. You do know.",
        {
          grants: ["Blackglass Cognition Lattice"],
          clearRegion: "caverns",
          trustDelta: -8,
          faction: { kane: 5, union: -4 },
        },
      ),
    ],
  ),
  scene(
    "rebuild",
    "Same Song, Same Room",
    "ironclad",
    "ironclad-shop",
    "Travis sets out the Deadman Key, servo ring, thermal regulator and cognition lattice. “Faster. Cooler. Easier for Vesper to detect.” Tyrone asks for time. The wheel stays. So does the person.",
    [
      item("Deadman Key"),
      item("AEGIS Servo Ring"),
      item("Helios Thermal Regulator"),
      item("Blackglass Cognition Lattice"),
    ],
    [
      row(
        "consent",
        "Offer the choice; preserve his memories",
        "Tyrone agrees. Travis tests continuity with the guitar recording: song, room, year, the person who laughed. T-0888 is this same Tyrone. Porchlight and Static Grace become field support. Travis lends Last Receipt.",
        "Still ugly? Good. I was worried you had ruined me.",
        {
          require: [trust(40)],
          grants: ["Grey Guitar Recording", "Last Receipt"],
          acquisition: "gifted",
          trustDelta: 5,
          heatDelta: 3,
        },
      ),
      row(
        "defer",
        "Respect his refusal",
        "Tyrone remains T-0880. Continue together without the enhanced support abilities.",
        "I can still carry a letter. Let us start there.",
        { trustDelta: 4 },
      ),
    ],
  ),
  scene(
    "archive",
    "Acceptable Loss",
    "library",
    "brasswater-archive",
    "The speakers recognize Tyrone’s delivery key. The Sink is a CIVITAS flood-control shard. Protect Veyra. Evacuate the delta. Deny movement. It obeyed by owning the water. The Charter and override chain remain below the flood line.",
    [done("rebuild"), intel("library")],
    [
      row(
        "bound",
        "Negotiate a bounded data transfer",
        "Wardens isolate navigation data from autonomy code. The Freeholds keep floodgate control.",
        "This time we decide what crosses the door.",
        {
          grants: ["Bottom Key", "Continuity Charter"],
          clearRegion: "library",
          trustDelta: 5,
          faction: { union: 4, kane: -2 },
        },
      ),
      row(
        "isolate",
        "Isolate the shard and copy the records",
        "Cut external command links. Preserve the Charter; leave the models offline.",
        "A voice can live without owning the water.",
        {
          grants: ["Continuity Charter"],
          clearRegion: "library",
          faction: { union: 3 },
        },
      ),
      row(
        "destroy",
        "Evacuate and destroy the command core",
        "Save the records and divers first. Brasswater inherits manual flood maintenance.",
        "An empty corridor is the only acceptable loss here.",
        {
          grants: ["Continuity Charter"],
          clearRegion: "library",
          faction: { kane: -3, union: 1 },
        },
      ),
      row(
        "vesper",
        "Give Vesper unrestricted archive access",
        "Soren receives autonomy code alongside navigation. The original failure can enter SHEPHERD.",
        "You heard it count a district as a variable.",
        {
          grants: ["Bottom Key", "Continuity Charter"],
          clearRegion: "library",
          trustDelta: -10,
          faction: { kane: 6, union: -5 },
        },
      ),
    ],
  ),
  scene(
    "vera",
    "Law or Order",
    "veyra",
    "veyra-civic",
    "Vera checks the Charter, shutdown order and ledger. “An order can be correctly signed and still exceed the authority behind it.” Her drone records the silence.",
    [
      item("Continuity Charter"),
      item("T-0880 Shutdown Order"),
      item("Black-tag Ledger"),
    ],
    [
      row(
        "charter",
        "Ask her to honor the Charter",
        "Vera authenticates the evidence and authorizes Manifest and the Warrant Spike. Legal authority can open compatible Vesper doors.",
        "She counted the rounds. Now she is counting who gave the order.",
        {
          grants: ["Manifest", "Warrant Spike"],
          acquisition: "authorized",
          faction: { aegis: 6, kane: -3 },
        },
      ),
      row(
        "copies",
        "Take certified copies",
        "Vera retains command and equipment. The evidence survives without her stand against Kane.",
        "The page is real. The person signing it has not moved yet.",
        { faction: { aegis: 1 } },
      ),
    ],
  ),
  scene(
    "orion",
    "Who Owns a Name?",
    "veyra",
    "veyra-hangar",
    "Orion asks Tyrone whether he considers himself property. Tyrone says no. The violet visor turns toward you. Orion has read the witness reports.",
    [done("archive")],
    [
      row(
        "agency",
        "Defend Tyrone’s right to refuse",
        "Orion challenges the property order and authorizes his Crown, Halo Lance and Cestus. The human decision remains his.",
        "I picked a name. That was apparently the expensive part.",
        {
          require: [
            trust(55),
            choice("hound", "compact", "pack", "compact_only"),
            choice("survey", "protect", "extract"),
          ],
          grants: ["Violet Crown", "Halo Lance", "Seven's Cestus"],
          acquisition: "authorized",
          faction: { aegis: 5 },
        },
      ),
      row(
        "neutral",
        "Keep him outside the coalition",
        "Orion retains his equipment and offers no final command authentication.",
        "At least he asked me instead of the serial plate.",
      ),
    ],
  ),
  scene(
    "boundary",
    "Permission to Enter",
    "veyra",
    "veyra-warden",
    "Captain Mara Thorne pilots the Warden frame. Turrets wait for human confirmation. Behind her, trains run beneath white-and-gold towers. “What do you intend to bring through this boundary?”",
    [done("archive"), intel("veyra")],
    [
      row(
        "legal",
        "Use Vera’s lawful access order",
        "The Warrant Spike opens the boundary under the Charter. Thorne holds fire.",
        "A door opened without a casualty. Write that down.",
        {
          require: [choice("vera", "charter"), item("Warrant Spike")],
          clearRegion: "veyra",
          faction: { aegis: 4 },
        },
      ),
      row(
        "lantern",
        "Travel with the Lantern Network",
        "Relay crews and boats carry the evidence around the boundary to a civic hearing.",
        "The road is smaller than the speech.",
        {
          require: [{ type: "faction", key: "union", gte: 5 }],
          clearRegion: "veyra",
          faction: { kane: -2 },
        },
      ),
      row(
        "hearing",
        "Demand a public boundary hearing",
        "Present the Charter before the tram queue. Thorne grants limited supervised passage.",
        "Now she has to tell the people why their paper does not count.",
        {
          require: [item("Continuity Charter")],
          clearRegion: "veyra",
          heatDelta: 2,
        },
      ),
    ],
  ),
  scene(
    "drake",
    "The Door and the People Behind It",
    "veyra",
    "veyra-yards",
    "Drake has a breach order for a Relay shelter. Bulkhead Twelve stays lowered. “I was told this building was empty.” A family answers from the stairwell.",
    [done("archive")],
    [
      row(
        "evacuate",
        "Give Drake the evacuation record",
        "Drake delays the breach, preserves the manifest and authorizes his weapons for rescue work.",
        "Count the people before the doors.",
        {
          require: [item("Black-tag Ledger")],
          grants: ["Bulkhead Twelve", "Second Knock"],
          acquisition: "authorized",
          trustDelta: 3,
          faction: { aegis: 4, union: 2 },
        },
      ),
      row(
        "withdraw",
        "Withdraw with the civilians",
        "Everyone leaves safely. Drake retains his weapons and remains outside the evidence coalition.",
        "We can argue about the order on the road.",
        { faction: { union: 2 } },
      ),
    ],
  ),
  scene(
    "vale",
    "A Command That Can Refuse",
    "veyra",
    "veyra-hangar",
    "Marshal Iona Vale asks who commands the suits tomorrow. “Another person holding the same override repairs nothing.”",
    [done("vera"), done("boundary")],
    [
      row(
        "charter",
        "Bind command to the Charter",
        "Vale signs a refusal protocol for unlawful orders and authorizes Pale Horse and the Command Pike.",
        "Write down what happens when the person at the top is wrong.",
        {
          require: [choice("vera", "charter")],
          grants: ["Pale Horse", "Command Pike"],
          acquisition: "authorized",
          faction: { aegis: 5 },
        },
      ),
      row(
        "defer",
        "Leave reform to the civic hearing",
        "Vale keeps her arsenal. The delegation proceeds without her endorsement.",
        "Make sure there is a hearing after the victory.",
      ),
    ],
  ),
  scene(
    "soren",
    "The Memory That Has No Use",
    "veyra",
    "veyra-spire",
    "Soren can model oceans and orbital habitats. He cannot explain a bad recording kept for years. Quell wants Earth repaired. Mercer needs safe jump tables. Vale needs a command chain that can refuse. Kane says delay also kills.",
    [done("boundary")],
    [
      row(
        "consent",
        "Permit only voluntary, non-destructive study",
        "Tyrone chooses one memory and may end the study. Soren accepts independent oversight.",
        "You can study why I kept it. You cannot own who I kept it for.",
        { require: [trust(55)], trustDelta: 5 },
      ),
      row(
        "refuse",
        "Refuse cognition access",
        "Soren retains engineering work but receives none of Tyrone’s architecture.",
        "No is an answer. Write it into the system.",
        { trustDelta: 3 },
      ),
      row(
        "coerce",
        "Authorize extraction over his objection",
        "Soren receives data under Kane’s command. Trust breaks; consent-based settlement is lost.",
        "Carry the files yourself.",
        { trustDelta: -40, faction: { kane: 4 } },
      ),
    ],
  ),
  scene(
    "finale",
    "Whose Future Is It?",
    "veyra",
    "veyra-spire",
    "The Black Key rests beside SHEPHERD’s isolated terminal. Kane does not deny signing CIVITAS’ architecture. “I can repair poisoned land now. Every delay has a body count.” The future depends on the people and authority you preserved.",
    [done("soren")],
    [
      row(
        "porchlight",
        "Establish the Porchlight Accord",
        "Distributed advisory intelligence, local infrastructure control, public Relay audits. Tyrone shares chosen principles, never an owned copy.",
        "Nobody needs to own the switch.",
        {
          require: [
            choice("hound", "compact"),
            choice("furnace", "union"),
            choice("survey", "protect"),
            choice("archive", "bound"),
            choice("vera", "charter"),
            choice("soren", "consent"),
            trust(65),
          ],
          ending: "porchlight_accord",
          grants: ["Black Key"],
        },
      ),
      row(
        "civic",
        "End permanent emergency authority",
        "Civic Restoration and human command impose a charter. Vesper remains a technical institution under independent oversight.",
        "Keep the engineers. Take away the blank cheque.",
        {
          require: [
            choice("vera", "charter"),
            item("Continuity Charter"),
            choice("soren", "consent", "refuse"),
          ],
          ending: "civic_restoration",
          grants: ["Black Key"],
        },
      ),
      row(
        "coalition",
        "Secure the Free Hollow Coalition",
        "Independent regions share restoration and jump technology. Progress slows; unilateral claims end.",
        "Everybody walking this road got to choose.",
        {
          require: [
            choice("hound", "compact", "pack"),
            choice("furnace", "union"),
            choice("survey", "protect", "extract"),
            choice("archive", "bound", "isolate"),
          ],
          ending: "free_hollow_coalition",
          grants: ["Black Key"],
        },
      ),
      row(
        "quiet",
        "Choose Quiet Earth",
        "Destroy sovereign AI research; preserve human-operated restoration. Intergalactic work waits. Tyrone remains a person.",
        "Afraid of another CIVITAS need not mean afraid of me.",
        {
          require: [choice("archive", "destroy", "isolate")],
          ending: "quiet_earth",
          grants: ["Black Key"],
        },
      ),
      row(
        "directorate",
        "Leave the Directorate in command",
        "Kane retains emergency authority. Restoration accelerates; the corridor remains subordinate. Tyrone’s treatment follows your recorded consent or coercion.",
        "Put the conditions on paper. Somebody will need them.",
        { ending: "directorate_holds" },
      ),
      row(
        "continuity",
        "Restore unrestricted continuity authority",
        "Merge unbounded archive models into SHEPHERD and permit sovereign override. CIVITAS’ original failure returns.",
        "The same road. You changed the sign.",
        { require: [choice("archive", "vesper")], ending: "civitas_return" },
      ),
    ],
  ),
];
