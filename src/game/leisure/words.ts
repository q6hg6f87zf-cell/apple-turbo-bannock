/** Dictionaries and board builders for Unscramble and Word search. Presentation of odds lives elsewhere. */

export function canForm(word: string, letters: string) {
  const bag = letters
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .split("");
  for (const ch of word.toLowerCase()) {
    if (ch < "a" || ch > "z") return false;
    const i = bag.indexOf(ch);
    if (i < 0) return false;
    bag.splice(i, 1);
  }
  return true;
}

export function anagramsOf(letters: string) {
  const bag = letters.toLowerCase().replace(/[^a-z]/g, "");
  const max = bag.length;
  const hits = ANAGRAM_DICT.filter(
    (w) => w.length >= 3 && w.length <= max && canForm(w, bag),
  );
  const seed = bag;
  if (seed.length >= 3 && !hits.includes(seed) && ANAGRAM_DICT.includes(seed))
    hits.push(seed);
  if (seed.length >= 3 && !hits.includes(seed)) hits.push(seed);
  return [...new Set(hits)].sort(
    (a, b) => b.length - a.length || a.localeCompare(b),
  );
}

export function shuffleLetters(input: string) {
  const src = input.toUpperCase().replace(/[^A-Z]/g, "");
  if (src.length < 2) return src;
  const a = src.split("");
  for (let n = 0; n < 20; n++) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]!;
      a[i] = a[j]!;
      a[j] = t;
    }
    const out = a.join("");
    if (out !== src) return out;
  }
  const i = a.findIndex((ch, idx) => idx > 0 && ch !== a[0]);
  if (i > 0) {
    const t = a[0]!;
    a[0] = a[i]!;
    a[i] = t;
  }
  return a.join("");
}

export function parseCell(id: string): [number, number] | null {
  if (!/^\d{1,2}:\d{1,2}$/.test(id)) return null;
  const [rs, cs] = id.split(":");
  const r = Number(rs);
  const c = Number(cs);
  if (
    !Number.isInteger(r) ||
    !Number.isInteger(c) ||
    r < 0 ||
    c < 0 ||
    r > 11 ||
    c > 11
  )
    return null;
  return [r, c];
}

export function cellId(r: number, c: number) {
  return `${r}:${c}`;
}

/** Inclusive 8-direction line. Null if the two cells are not aligned. */
export function lineCells(from: string, to: string): string[] | null {
  const a = parseCell(from);
  const b = parseCell(to);
  if (!a || !b) return null;
  const dr = b[0] - a[0];
  const dc = b[1] - a[1];
  if (dr === 0 && dc === 0) return [from];
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);
  if (dr !== 0 && dc !== 0 && absR !== absC) return null;
  const steps = Math.max(absR, absC);
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const out: string[] = [];
  for (let i = 0; i <= steps; i++)
    out.push(cellId(a[0] + sr * i, a[1] + sc * i));
  return out;
}

export function samePath(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  if (a.every((id, i) => id === b[i])) return true;
  const rev = [...b].reverse();
  return a.every((id, i) => id === rev[i]);
}

export type SearchWord = { word: string; cells: string[] };

export type SearchBoard = {
  size: number;
  grid: string[][];
  words: SearchWord[];
};

const DIAG_DIRS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

const ORTH_DIRS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
] as const;

function shuffleDirs<T extends readonly (readonly [number, number])[]>(
  dirs: T,
) {
  return [...dirs].sort(() => Math.random() - 0.5);
}

export function isDiagonalPath(cells: string[]) {
  if (cells.length < 2) return false;
  const a = parseCell(cells[0]!);
  const b = parseCell(cells[cells.length - 1]!);
  if (!a || !b) return false;
  return a[0] !== b[0] && a[1] !== b[1];
}

function emptyGrid(n: number) {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => ""));
}

function canPlace(
  grid: string[][],
  word: string,
  r: number,
  c: number,
  dr: number,
  dc: number,
) {
  const n = grid.length;
  for (let i = 0; i < word.length; i++) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    if (rr < 0 || cc < 0 || rr >= n || cc >= n) return false;
    const ch = grid[rr]![cc];
    if (ch && ch !== word[i]) return false;
  }
  return true;
}

function trySearch(size: number, count: number): SearchBoard {
  const pool = [...SEARCH_WORDS]
    .filter((w) => w.length >= 4 && w.length <= size)
    .sort((a, b) => b.length - a.length || Math.random() - 0.5);
  const grid = emptyGrid(size);
  const words: SearchWord[] = [];
  const used = new Set<string>();
  for (const raw of pool) {
    if (words.length >= count) break;
    if (used.has(raw)) continue;
    const word = raw.toUpperCase();
    const preferDiag = words.length < Math.ceil(count * 0.65);
    const dirs = preferDiag
      ? shuffleDirs(DIAG_DIRS)
      : [...shuffleDirs(ORTH_DIRS), ...shuffleDirs(DIAG_DIRS)];
    let planted = false;
    for (let t = 0; t < 180 && !planted; t++) {
      const [dr, dc] = dirs[t % dirs.length]!;
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (!canPlace(grid, word, r, c, dr, dc)) continue;
      const cells: string[] = [];
      for (let i = 0; i < word.length; i++) {
        grid[r + dr * i]![c + dc * i] = word[i]!;
        cells.push(cellId(r + dr * i, c + dc * i));
      }
      words.push({ word, cells });
      used.add(raw);
      planted = true;
    }
  }
  const fill =
    "AAAAAAAAAAAAEEEEEEEEEEEEIIIIIIIINNNNNNNNOOOOOOOORRRRRRSSSSTTTTLLLLDDMMCCUUUGYHWBFKPVJX";
  for (const row of grid) {
    for (let i = 0; i < row.length; i++) {
      if (!row[i]) row[i] = fill[Math.floor(Math.random() * fill.length)]!;
    }
  }
  words.sort((a, b) => a.word.localeCompare(b.word));
  return { size, grid, words };
}

export function makeWordSearch(size = 10, count = 8): SearchBoard {
  const needDiag = Math.max(3, Math.ceil(count * 0.5));
  let best: SearchBoard | null = null;
  for (let i = 0; i < 24; i++) {
    const board = trySearch(size, count);
    const diags = board.words.filter((w) => isDiagonalPath(w.cells)).length;
    const score = board.words.length * 10 + diags * 4;
    if (
      !best ||
      score >
        best.words.length * 10 +
          best.words.filter((w) => isDiagonalPath(w.cells)).length * 4
    ) {
      best = board;
    }
    if (board.words.length >= count && diags >= needDiag) return board;
  }
  return best ?? trySearch(size, Math.max(5, count - 2));
}

export const SEARCH_WORDS = [
  "AEGIS",
  "BLACK",
  "BRASS",
  "BREACH",
  "CAPS",
  "CARD",
  "CRATE",
  "DOCK",
  "EMBER",
  "FORGE",
  "FURNACE",
  "GATE",
  "GHOST",
  "HALCYON",
  "HALO",
  "HOLLOW",
  "IRON",
  "IRONCLAD",
  "KANE",
  "LEDGER",
  "LOCK",
  "MOON",
  "MOONLIT",
  "NIGHT",
  "ORE",
  "OVERLAY",
  "PENTHOUSE",
  "PICK",
  "PIN",
  "PLATE",
  "PORCH",
  "QUIET",
  "RADIO",
  "RAID",
  "RAIDERS",
  "RAIL",
  "REELS",
  "SALT",
  "SCOUT",
  "SILK",
  "SLAG",
  "SNEAK",
  "SPIRE",
  "SQUAD",
  "STEEL",
  "STIM",
  "STOOL",
  "SYNAPSE",
  "TAPE",
  "TERMINAL",
  "TRIBUTE",
  "TRIVIA",
  "TYRONE",
  "VAULT",
  "VAULTED",
  "VEYRA",
  "VISOR",
  "WARDEN",
  "WATCH",
  "WATER",
] as const;

const RAW = `
ace act add age ago aid ail aim air ale all alp and ant any ape arc are ark arm art ash ask asp ate
bad bag ban bar bat bay bed bee beg bet bid big bin bit boa bog boo bop bow box boy bud bug bun bus but buy
cab cad cam can cap car cat caw cop cob cod cog con coo cop cot cow coy cry cub cud cup cut
dab dam den dew did die dig dim din dip doc doe dog don dot dry dub due dug dun duo dye
ear eat eel egg ego elf elk elm emu end eon era eve ewe eye
fad fan far fat fax fed fee fen few fib fig fin fir fit fix flu fly fob foe fog for fox fun fur
gag gap gas gay gel gem get gig gin gnu gob god got gum gun gut guy
had hag ham has hat hay hem hen her hex hey hid him hip his hit hob hod hoe hog hop hot how hub hue hug hum hut
ice icy ill ink inn ion ire irk ivy
jab jag jam jar jaw jay jet jig job jog jot joy jug jut
keg ken key kid kin kit
lab lad lag lap law lay led leg let lid lie lip lit lob log lop lot low lox lug
mad man map mar mat maw may men met mid mix moo mop mow mud mug
nab nag nap net new nil nip nit nix nor not now nun nut
oak oar oat odd ode oil old one orb ore our out ova owe owl own
pad pal pan par pat paw pay pea peg pen pep per pet pew pie pig pin pit ply pod poi pop pot pow pox pro pry pun pup pus put
rad rag ram ran rap rat raw ray red rep rev rib rid rim rip rob rod roe rot row rub rug rum run rut rye
sad sag sap sat saw say sea see set sew she shy sip sir sit six ski sky sly sob sod son sop sot sow soy spa spy sub sun sup
tab tad tag tan tap tar taw tea ten the thy tic tie tin tip toe tog ton too top tot tow toy try tub tug
urn use
van vat vex via vie vim vow
wad wag wan war was wax way web wed wee wet who why wig win wit woe won woo wow wry
yak yam yap yaw yea yen yep yes yet yew yon you yow
acid acorn acre acts aged ages aids ails aims airs ajar ales aloe alto amid anew ante anti ants apes apex arch arcs area ares arid arms army arts asps atom aunt auto away awes awls awol axon
babe baby back bade bags bait bake bald bale balk ball balm band bane bang bank bard bare bark barn bars base bash bask bass bath bats baud bawl beads beak beam bean bear beat beds beef been beep beer bees beet bells belt bend bent best beta bets bias bide bike bile bill bind bins bird bite bits blew blob bloc blot blow blue blur boar boat bogs boil bold bolt bond bone bong book boom boon boot bore born boss both bout bowl boys brag bran brat braw bray bred brew brim brow buck buds bugs bulk bull bump bung bunk buns buoy burn burr bury bush bust busy buts butts bays
cafe cage cake calf call calm came camp cane capes caps card care cart case cash cask cast cats cave cede cell cent chap char chat chef chew chin chip chop chow chug chum cite city clad clam clan clap claw clay clip clod clog clop clot club clue coal coat coda code coil coin cola cold cole cols colt coma comb come cone cons cook cool coop coos copes cops cord core cork corn cost cots coup cove cows crab crag cram crew crib crop crow cubs cuda cued cues cull cult cups curb curd cure curl cusp cute cuts
dace dada dado dads daft dale dame damn damp dams dare dark darn dart dash data date dawn days daze dead deaf deal dean dear debt deck deed deem deep deer deft defy deli dell demo dens dent deny desk dews dial dice died dies diet digs dike dill dime dims dine dint dips dirt disc dish disk dits dive dock dodo does dole doll dolt dome done dong dons doom door dope dork dorm dose dote doth dots dour dove down doze drab drag dram drat draw drew drip drop drug drum dual duck duct dude duds duel dues duet duke dull duly dumb dump dune dung dunk duos dupe dusk dust duty
each earl earn ears ease east easy eats eave ebbs echo eddy edge edict eels eerie eggs egot eids eight eire eject ekes elan else emit ends eons epee epic eras ergo ergs erne eros errs erst espy etas etch euro even ever eves evil ewer ewes exam exes exit
face fact fade fads fail fain fair fake fall fame fang fans fare farm fast fate fats faun fawn faze fear feat feds feed feel fees feet fell felt fend fern fess fest feta feud feus fiat fibs fief fife figs file fill film find fine fink fins fire firm firs fish fist fits five flab flag flak flam flan flap flat flaw flax flay flea fled flee flew flex flip flit floc floe flog flop flow flub flue flux foal foam fobs foci foes fogs foil fold folk fond font food fool foot ford fore fork form fort foss foul four fowl foxy foys fray free fret frog from fuel full fume fund funk furl furs fuse fuss
gaff gage gags gain gait gala gale gall game gang gaps garb gash gasp gate gave gawk gaze gear gees geld gems gene gent germ gets ghat ghee gibe gift gild gill gilt gins gips gird girl girt gist give glad glee glen glia glib glim glob glow glue glug glum glut gnar gnat gnaw goad goal goat gobo gobs gods goer goes gold golf gone gong good goof gore gory gosh gout gown grab grad gram gray grew grey grid grim grin grip grit grow grub guan guanos
hack hads haft hags hail hair hale half hall halt ham hams hand hang haps hard hare hark harm harp hash hasp haste hate hats haul have hawk haze head heal heap hear heat heds heed heel heir held hell helm help hens herb herd here hero hers hest hewn hews hick hide hied high hike hill hilt hind hint hips hire hiss hits hive hoar hoax hobo hobs hock hoed hoes hogs hold hole holm hols holy home hone honk hood hoof hook hoop hoot hope hops horn hose host hour howl hubs hued hues huff huge hugs hula hulks hull hump hums hung hunk hunt hurl hurt hush husk huts hymn hype hypo
iced ices icon idea idem idle idol iffy imam inch info inks inns into ions iota iris irks iron isle itch item
jack jade jags jail jars java jaws jays jazz jean jeer jell jerk jest jets jibe jiff jigs jill jilt jink jinn jinx jobs jock joes joey jogs join joke jolt josh jots jowl joys judo jugs jump june junk jury just jute
kale keen keep kegs kelp kept keys kick kids kill kiln kilo kilt kind king kink kips kirk kiss kite kits kiwi knee knew knit knob knot know kohl kola kook
lace lack lacy lads lady lags laid lain lair lake lama lamb lame lamp land lane lank laps lard lark lase lash lass last late lath laud lava lawn laws lays laze lead leaf leak lean leap leas leek leer left legs lend lens lent less lest lets levy lewd liar lice lick lids lied lien lies lieu life lift like lilt lily limb lime limp line link lint lion lips lira lisp list lite live load loaf loan lobe lobs loci lock lode loft loge logo logs loin loll lone long look loom loon loop loot lope lord lore lorn lose loss lost lots loud lout love lows lube luck luge lugs lull lump lune lung lure lush lust lute luxe lying
mace made mage magi maid mail maim main make male mall malt mama mane manes mans many map maps mare mark mars mart mash mask mass mast mate math mats maul maxi mayo maze mead meal mean meat meds meek meet meld melt memo mend mens menu meow mere mesa mesh mess mice mics mid mild mile milk mill milo mime mind mine mini mink mint mire miss mist mite mitt moan moat mobs mock mode mods mold mole molt moms monk mood moon moor moot mope more morn moss most moth moue move mown mows much muck muff mugs mule mull mums muon murk muse mush musk must mute mutt myth
nabs nag nags nail name nape naps nard nary navy nays near neat neck need neon nerd nest nets news newt next nibs nice nick nigh nile nill nims nine nips nits nobs nock node nods noel noes none nook noon nope norm nose nosy note noun nova nows nubs nude nuke null nums nun nuns nuts
oafs oak oars oast oats oboe odds odor offs ogle ogre ohed oils oily oink okra olds oleo olio omen omit once ones only onto onus onyx ooze opal open opts opus oral orbs orca ores orgy orle orlo orra orzo otic ours oust outs oval oven over owed owes owls owns oxen
pace pack pact pads page paid pail pain pair pale pall palm pals pane pang pans pant papa pare park pars part pass past pate path pats pave pawn paws pays peak peal pear peas peat peck peel peen peep peer pees pegs pelt pelt pens pent peon peri perk perm perp pest pets pews pfft phew pick pied pier pies pigs pike pile pill pimp pine ping pink pins pint pipe pits pity plan play plea pled plod plop plot plow ploy plug plum plus pock pods poem poet pogo poke pole poll polo pomp pond pong pons pony pooh pool poop poor pope pops pore pork porn port pose posh post pots pour pout poxy pram pray prep prey prim prod prof prog prom prop prow pubs puff pugs puke pull pulp pulse puma pump puns punt puny pupa pups pure purr push puts pyre
race rack racy raft rags raid rail rain rake rams rang rank rant raps rapt rare rash rasp rate rats rave raws rays raze read real ream reap rear reds reed reef reek reel refs rely rend rent rest ribs rice rich rick rid ride rids rife riff rifle rift rigs rile rill rime rim rims rind ring rink rinse riot ripe rips rise risk rite road roam roan roar robe robs rock rode rods roes role roll rome romp rood roof rook room root rope rose rosy rote rot rots roue rout rove rows rube rubs ruck rued rues ruff rugs ruin rule rums rune rungs runs runt ruse rush rusk rust ruts
sack sad safe sag sags said sail sake sale salt same sand sane sang sank sans saps sari sash sate save saws says scab scad scam scan scar scat scot scud scum seal seam sear seas seat sect seed seek seem seen seep seer sees self sell send sent serf set sets sewn sews sham shed shes shim shin ship shiv shod shoe shoo shop shot show shun shut sick side sift sigh sign silk sill silo silt sine sing sink sins sips sire sirs site sits size skew skid skim skin skip skis skit slab slag slam slap slat slaw slay sled slew slid slim slip slit slob sloe slog slop slot slow slub slue slug slum slur smug smut snag snap snip snit snob snot snow snub snug soak soap soar sobs sock soda sods sofa soft soil sold sole solo sols soma some sons soon soot sops sore sort sots soul soup sour sows soya spam span spar spas spat spin spit spot sprung spud spun spur stab stag star stay stem step stew stir stop stow stub stud stun such suck suds sued sues suet suit sulk sum sums sung sunk suns sure surf swab swag swam swan swap swat sway swim swum
tabs tack taco tact tags tail take talc tale talk tall tame tams tang tank tans tape taps tare tarn taro tars tart task taut teak teal team tear teas teat teed teem teen tees tell temp tend tens tent term tern test text than that thaw thee them then they thin this thud thug thus tick tide tidy tied tier ties tiff tike tile till tilt time tine ting tins tint tiny tips tire toad toed toes toga toil told toll tomb tome toms ton tongs tons took tool toot tops tore torn tort toss tote tots tour tout town tory tows toys tram trap tray tree trek trim trio trip trod troll troop trop trow troy true tsar tuba tube tucks tugs tuna tune tuns turf turn tusk tute tuts tuxes twas twee twig twin twit twos tyke type typo
ugly undo unit unto upon urea urge urns used user uses
vain vale van vans vary vase vast vats veal veer vees veil vein vend vent verb very vest veto vets vials vibe vice vide vied vies view vile vine vino vins vinyl viol visa vise vita viva void vole volt vote vows
wade wadi wads wafer waft wage wags waif wail wait wake wale walk wall wand wane want ward ware warm warn warp wars wart wary wash wasp watt wave wavy wawl waxy ways weak weal wean wear webs weds weed week ween weep wees weft weld well welt went wept were west wets whale wham whap what whee when whet whew whey whig whim whip whir whit whiz whoa whom whop whys wick wide wife wigs wild wile will wilt wily wimp wind wine wing wink wins wipe wire wiry wise wish wisp wist wits wive woad woes woke wold wolf womb wons wont wood woof wool woos word wore work worm worn wort wove wows wrap wren writ
yang yank yaps yard yare yarn yawl yawn yaws yeah year yeas yegg yell yelp yens yeps yes yeti yews yins yipe yips yods yoga yogi yoke yolk yond yoni yore your yowl yuca yuck yule
able ably abut acer aces ache acid acme acne acre acts acyl adze aeon aero aery afar ager ages agin agio agog ague ahem ahoy aide ails aims airs airy ajar akin alae alan alas alba alec alee ales alga alit ally alms aloe alow alps also alto alum amas amen amid amie amin amir ammo amok amps anal anas anew anil anis ankh anon ansa anta ante anti ants anus apex apse aqua arab arch arco arcs area ares arfs aria arid aril arts arty arum aryl asci asea ashy asks asps ates atom atop aunt aura auto aver avid avow away awed awes awls awn axed axel axes axis axle axon ayes
bale bane bard bare barn bate bead beef been beer belt bend bent best beta bias bike bile bill bind bird bite blew blob blot blow blue blur boar boat boil bold bolt bond bone book boom boon boot bore born boss both bout bowl brag bran brat bred brew brim brow buck bulk bull bump bung bunk buoy burn bury bush bust busy
came camp cane cape card care cart case cash cast cave cell cent chap char chat chef chew chin chip chop chow cite city clad clam clan clap claw clay clip clod clog clot club clue coal coat code coil coin cola cold colt coma comb come cone cook cool coop cord core cork corn cost coup cove crab crag cram crew crib crop crow cull cult curb curd cure curl cusp cute
dale dame damp dare dark darn dart dash data date dawn daze dead deaf deal dean dear debt deck deed deem deep deer deft defy deli dent deny desk dial dice diet dime dine dirt disc dish disk dive dock does dole doll dome done doom door dope dose dove down doze drab drag dram draw drew drip drop drug drum dual duck duct duel duet duke dull duly dumb dump dune dunk dupe dusk dust duty
each earl earn ease east easy eaves echo eddy edge eels eight eject else emit ends epee epic eras ergo even ever evil exam exit
face fact fade fail fain fair fake fall fame fang fare farm fast fate fawn fear feat feed feel feet fell felt fend fern fest feud fiat file fill film find fine fire firm fish fist five flag flak flap flat flaw flea fled flee flew flex flip flit flop flow foal foam foil fold folk fond font food fool foot ford fore fork form fort foul four fowl fray free fret frog from fuel full fume fund funk fuse fuss
gain gait gala gale gall game gang garb gash gasp gate gave gawk gaze gear geld gene gent germ gift gild gill gilt gird girl gist give glad glee glen glob glow glue glut gnat gnaw goad goal goat goes gold golf gone gong good gore gosh gown grab grad gram gray grew grey grid grim grin grip grit grow grub
hack hail hair hale half hall halt hand hang hard hare hark harm harp hash haste hate haul have hawk haze head heal heap hear heat heed heel heir held hell helm help herb herd here hero hewn hick hide high hike hill hilt hind hint hire hiss hive hoax hock hold hole holy home hone honk hood hoof hook hoop hoot hope horn hose host hour howl huff huge hula hull hump hung hunk hunt hurl hurt hush husk hymn hype
icon idea idle idol inch info into iota iris iron isle itch item
jade jail java jazz jean jeer jell jerk jest jibe jilt join joke jolt josh jowl judo jump junk jury just
kale keen keep kelp kept kick kill kiln kilo kilt kind king kink kiss kite kiwi knee knew knit knob knot know
lace lack lady laid lain lair lake lamb lame lamp land lane lank lard lark lash lass last late lath laud lava lawn laze lead leaf leak lean leap leek leer left lend lens lent less lest levy lewd liar lice lick lied lien lieu life lift like lilt lily limb lime limp line link lint lion lisp list live load loaf loan lobe lock lode loft logo loin loll lone long look loom loon loop loot lord lore lose loss lost loud lout love luck lull lump lune lung lure lush lust lute
mace made maid mail maim main make male mall malt mane many mare mark mart mash mask mass mast mate math maul maze mead meal mean meat meek meet meld melt memo mend menu mere mesh mess mice mild mile milk mill mime mind mine mini mink mint mire miss mist mite mitt moan moat mock mode mold mole molt monk mood moon moor moot more moss most moth move much muck mule mull muse mush musk must mute myth
nail name nape nard navy near neat neck need neon nerd nest news next nice nick nine node none nook noon norm nose nosy note noun nova nude nuke null
once ones only onto onus open oral orca orgy otic oust oval oven over owed owls owns oxen
pace pack pact page paid pail pain pair pale pall palm pane pang pant papa pare park part pass past pate path pave pawn peak peal pear peat peck peel peep peer pelt peon perk perm pest phew pick pied pier pike pile pill pine ping pink pint pipe pity plan play plea plod plot plow ploy plug plum plus poem poet poke pole poll polo pond pony pool poor pope pore pork port pose posh post pour pout pray prep prey prim prod prof prom prop prow puff pull pulp puma pump punt puny pure purr push pyre
race rack raft raid rail rain rake rang rank rant rare rash rasp rate rave raze read real ream reap rear reed reef reek reel rely rend rent rest rice rich ride rife riff rift rile rime rind ring rink riot ripe rise risk rite road roam roan roar robe rock rode role roll romp rood roof rook room root rope rose rosy rote rout rove ruby rude rued ruff ruin rule rune rungs runt ruse rush rust
sack safe said sail sake sale salt same sand sane sang sank sari sash sate save scab scan scar seal seam sear seat sect seed seek seem seen seep seer self sell send sent serf sham shed shin ship shod shoe shop shot show shun shut sick side sift sigh sign silk sill silo silt sine sing sink sire site size skew skim skin skip skit slab slag slam slap slat slay sled slew slid slim slip slit slog slop slot slow slug slum slur smug snag snap snip snob snow snug soak soap soar sock soda sofa soft soil sold sole solo some sons soon soot sore sort soul soup sour spam span spar spat spin spit spot spun spur stab stag star stay stem step stew stir stop stub stud stun such suck sued suet suit sulk sung sunk sure surf swam swan swap sway swim
tack taco tact tail take talc tale talk tall tame tang tank tape tare tart task taut teak teal team tear teat teem teen tell tend tent term test text than that thaw thee them then they thin this thud thug thus tick tide tidy tied tier tile till tilt time tine tint tiny tire toad toes toil told toll tomb tome tong took tool toot tore torn toss tote tour tout town tram trap tray tree trek trim trio trip trod true tuba tube tuna tune turf turn tusk twin type
undo unit unto upon urge used user
vain vale vary vase vast veal veer veil vein vent verb very vest veto vibe vice view vile vine visa vise void volt vote
wade wage wail wait wake walk wall wand wane want ward ware warm warn warp wart wary wash wasp watt wave wavy weak wean wear weed week weep weld well welt went wept were west whale what when whet whey whip whir whit wick wide wife wild wile will wilt wily wind wine wing wink wipe wire wiry wise wish wisp woke wolf womb wood woof wool word wore work worm worn wrap writ
yard yarn yawn yeah year yell yelp yoga yoke yolk yore your
about above abuse acids acorn actor acute admit adopt adult after again agent aging agree ahead alarm album alert algae alien align alike alive allow aloes alone along alter amber amend amino among angel anger angle angry anime anise ankle anode antic anvil apart apple apply apron areas arena argue arise armed armor aroma array arrow arson artsy ashes aside asked aspen asset atlas atoms attic audio audit aunts auntie avoid await awake award aware awful axon
badge badly baked baker bales balls banal bands banks barbs barley barns baron basal based bases basic basil basin basis batch baths beach beads beans beard bears beast beats beds beefy began begin being bells belly below belts bench bends berries bested bikes bills binds birch birds birth bison bites black blade blame bland blank blast blaze bleak blend bless blind blink bliss blob block blond blood bloom blot blown blows blues bluff blunt blush board boast boats bodies boils bold bolts bonds bones bonus books boost booth boots booty bored born borne boson boss botch bound bounty bowel bowls boxed boxer boxes brace brags braid brain brake brand brash brass brat brave bravo brawl bread break breed bribe brick bride brief brine bring brink brisk broad broke brood brook broom broth brown brush brute buck buds build built bulbs bulge bulky bulls bully bumps bunch bunks bunny burly burns burnt burst buses
cabin cable cache cadet cages cakes calf call calls calms camel camp camps canal candy canes canoe canon caper caps carat cards cared cares cargo carol carry carts carve cased cases casks caste casts catch cater cause caves cease cedar cells cents chain chair chalk champ chant chaos chaps charm chart chase cheap cheat check cheek cheer chess chest chick chief child chili chill chime china chips chirp choir choke chord chore chose chuck chump chunk churn cider cigar cinch circa cited cites civic civil clack claim clamp clans claps clash clasp class claws clays clean clear cleat cleft clerk click cliff climb cling cloak clock clods clogs clone close cloth cloud clove clubs cluck clues clump coach coasts coated coats cobra cocoa codes coils coins colas colds colon color colts coma comb combs comes comet comic comma conch cones cook cooks cools coops coral cords cores corks corns corps costs couch cough could count coupe court cover covid cows crack craft crags cram cramp crane crank crash crate crave crawl craze crazy cream creed creek creep crept crest crews cried cries crime crisp croak crock crone crook cross crowd crown crude cruel crumb crush crust crypt cubs cumin cups curb curbs curd cure cured cures curls curry curse curve cusp cuter cuts cycle cynic cyst
daily dairy daisy damns dance dared dares dated dates dawns deals dealt deans death debts decade decks decor decoy deeds deems deeps defer deity delay dells delta delts delude deluxe demon denim dense dents depot depth derby desks deter deuce devil dials diary diced dices dicks didst diets digit dikes dimes dimly diner dines dingo dings diode dirge dirty discs dishes disks ditch dived diver dives dizzy docks dodge doers doges doing dolls dolly domes donor doors doped doper dopes dorks dorms doses doted dotes doubt dough douse doves dowel down downs dowry dozed dozen dozer dozes draft drain drake drama drank drape drawl drawn draws dread dream dress dried drier dries drift drill drink drips drive droid droll drone drool droop drops dross drove drown drugs drums drunk dryer duals ducal ducat duchy ducks ducts dudes duels duets dukes dulls dully dummy dumps dunce dunes dungs dunks duped dupes dusky dusty duties dwarf dwell dwelt dying dynam
eager eagle early earns earth eased easel eases eaten eater eaves ebony edged edger edges edict edify edits eerie egret eider eight eject eking eland elbow elder elect elegy elfin elite elope elude elute elver elves email embed ember emcee emend emery emirs emit emits emote empty enact ended ender endow enema enemy enjoy ennui enrol ensue enter entry envoy epoch epoxy equal equip erase erect ergot erode error erupt essay ester ether ethic ethyl etude evade evens event every evict evils evoke exact exalt exams excel exert exile exist exits expel extra
fable faced faces facet facts faded fades fails faint fairs fairy faith faked faker fakes fakir falls false famed fames fancy fangs farce fares farms fasts fatal fated fates fatty fault fauna fauns favor fawns fazed fazes fears feast feats fecal feces feeds feels feign feint fella fells felon felts fence fends feral ferns ferry fetal fetch feted fetes fetid fetus feud feuds fever fewer fiats fiber fibre fiche field fiend fiery fifth fifty fight filed filer files filet fills filly films filmy filth final finds fined finer fines fired firer fires firms first fishy fists fitly fiver fives fixed fixer fixes fizzy fjord flack flags flail flair flake flaky flame flank flaps flare flash flask flats flaws fleas fleck flees fleet flesh flews flick flier flies fling flint flips flirt flits float flock floes flogs flood floor flops flora floss flour flown flows flubs flues fluff fluid fluke flume flung flunk flush flute flux foals foams foamy focal focus foggy foils foist folds folio folks folly foods fools foots foray force fords fords fores forge forgo forks forms forte forth forts forty forum found fount fowl fowls foxed foxes foyer frail frame franc frank fraud frays freak freed freer frees fresh frets friar fried fries frill frisk frock frogs frond front frost froth frown froze fruit fudge fuels fully fumes funds fungi funky funny furls furor furry fused fuses fuss fussy fuzzy
gable gaffs gaily gains gait gaits gales galls gamed gamer games gamey gamma gamut gangs gaped gapes garage garbs gases gasps gassy gated gates gator gaudy gauge gaunt gauze gavel gawks gazed gazer gazes gears gecko geeks geese gelds gems genes genie genre gents germs getup ghost giant giddy gifts gilds gills gilts gimpy girds girls girly girth gismo given giver gives gizmo glade glads gland glare glass glaze gleam glean glees glens glide glint glitz gloat globe globs gloom glory gloss glove glows glued glues gluey gluon gluts glyph gnarl gnash gnats gnaws gnome goads goals goats godly goers going golds golfs gone goner gongs goods gooey goofy goose gorge gory goths gouge gourd gout gown gowns grabs grace grade grads graft grain grams grand grant grape graph grasp grass grate grave gravy grays graze great greed green greet greys grids grief grift grill grim grime grimy grind grins gripe grips grist grit grits groan groat grog groin groom grope gross group grout grove growl grown grows grubs gruel gruff grump grunt guano guard guess guest guide guild guile guilt guise gulag gulch gulfs gulls gully gulps gumbo gummy gunk gunny gurdy gurus gushy gusto gusts gusty gutsy guy
habit hacks hails hairs hairy hajji hakes haled hales halls halos halts hands handy hangs hanks happy hardy harem hares harks harms harps harpy harsh harts hasps haste hasty hatch hated hater hates hauls haunt haven haves havoc hawks hazed hazel hazes heads heady heals heaps heard hears heart heath heats heave heavy hedge heeds heels hefts hefty heirs helix hello helms helps hence herbs herds heres heron heros hertz hewed hexed hexes hicks hided hides highs hiked hiker hikes hills hilly hilts hinds hinge hints hippo hippy hired hires hiss hitched hives hoagy hoard hoary hobby hocks hogan hoist hoked hokes holds holed holes holly homed homer homes homey honed hones honey honks honor hoods hoofed hoofs hooked hooks hoops hoots hoped hopes horde horns horny horse hosed hoses hosts hotly hound hours house hovel hover howdy howls hubby huffs huffy huger hulas hulks hulls human humid humor humps humus hunch hunks hunts hurls hurry hurst hurts husks husky hussy hutch hydra hydro hyena hymen hymns hyper
icily icing icons ideal ideas idiom idiot idled idler idles idols idyll igloo ileum image imams imbue imply inane inapt incas incur index inept inert infer ingot inked inlet inner input inset inter intro ionic irate irked irons irony islands isles islet issue itchy items ivory
jaded jades jails jaked jakes jambu janes japed japes jaunt jawed jazzy jeans jeers jelly jerks jerky jests jetty jewel jibed jibes jiffy jilts jimmy jinks jinni jived jives johns joins joint joist joked joker jokes jolly jolts joule joust jowls jowly judge juice juicy jukes julep jumbo jumps jumpy junco junks junky junta juror justs jutes
kales kapok kaput karat kayak kazoo kebob keels keens keeps kelps ketch keyed kicks kids kif kif kill killed killer kills kilns kilos kilts kinds kings kinks kinky kiosk kirks kited kites kitty kiwis knack knave knead kneed knees knell knelt knife knits knobs knock knoll knots known knows knurl koala kooks kooky kraft kudos kudzu
label labor laced laces lack lacks laden ladle lager lairs lakes lamas lambs lamed lamer lames lamps lance lands lanes lanky lapel lapse larch lards large largo larks larva laser lasso lasts latch later latex lathe laths latte laud laugh laura laved laves lawed lawns laxer laxes layed layer layup lazed lazes leach lead leads leafs leafy leaks leaky leans leant leaps leapt learn lease leash least leave ledge leech leeks leers leery lefty legal leger legit lemma lemon lemur lends lense lento leper letup levee level lever levis lewis liar liars libel libra liche lichi licit licked licks liege liens liars lifer lifts light liked liken liker likes lilac lilts limbo limbs limed limes limit limos limps lined liner lines lingo links lints linty lions lipid lipped lisle lisps lists liter litre lived liven liver lives livid llama loads loafs loams loamy loans loath lobby lobes local locks locos lodes lodge loess lofts lofty logan logic login logos loins lolls lonely loner longs looks looms loons loony loops loopy loose loots loped lopes lords lorry loser loses loss losses lotto lotus louse lousy loved lover loves lowed lower lowly loyal lubed lubes lucid lucks lucky lucre luffs luger lugs lulls lumen lumps lumpy lunar lunch lunes lungs lupin lurch lured lures lurid lurks lusts lying lymph lynch lyric
macaw maces macho macro madam madly mafia mage magi magic magma magus maids mails maims mains maize major maker makes males malls malts mamas mamba mambo mamma manes mange mango mangy mania manic manly manna manor manse maple march mares marge maria mark marks marls marry marsh marts maser mash mask masks mason mass mast masts match dated mated mater mates maths matte mauls mauve maxim maybe mayor mazes meads meals mealy means meant meany meats meaty mecca medal media medic meets melon melts memos mends menus mercy merge merit merry mesas messy metal meted metes meter metre metro mewed mewls miaow micra midis midst might miked mikes milch miler miles milks milky mills milos mimes mimic mince minds mined miner mines minks minor mints minus mired mires mirth miser miss mist mists misty miter mites mitts mixed mixer mixes moans moats mocha mocks modal mode model modes modus mogul moist molar molds moldy moles molls mommy monad money monks month moods moody moons moors moose moped mopes moral more mores morns moron morph moss mossy motel motes moths motif motor motto mound mount mourn mouse mousy mouth moved mover moves movie mowed mower moxie mucks mucus muddy muffs muggy mulch mules mulls mumbo mummy mumps munch mural murky mused muser muses mushy music musks musky musts musty muted mutes mutts muzzy myelin myrrh myths
nabob nacho nacre nadir nails naive naked named namer names nanny napes nappy nasal nasty natal nates natty naval navel naves neaps nears neath neato necks needs needy negro neigh neons nerds nerdy nerve nervy nests never newel newer newly newts nexus nicer niche nicks niece nifty night nines ninny ninth nippy niter nites nixed nixes noble nobly nodal noddy nodes noels noggin noise noisy nomad nonce nones nooks noons noose norms north nosed noses nosey notch noted noter notes noun nouns novae novas novel noway nubby nudie nudges nuked nukes nulls numbs nurse nylon nymph
oaken oakum oared oasis oaten oaths obeah obese obeys oboes occur ocean ocher ochre ocker octal octet odder oddly odium odor odors odour offal offer often ogled ogler ogles ogres oiled oiler oinks okapi okay okays olden older oldie oleos olive omega omens omits onion onset oohed oozed oozes opals opens opera opine opium opted optic orals orang orate orbit orcas order organ oriel orles orlon other otter ought ounce ousts outdo outed outer outgo ovals ovary ovate ovens overs overt ovine ovoid owing owned owner oxbow oxide oxlip ozone
paced pacer paces packs pacts paddy padre paean pagan paged pager pages pails pains paint pairs paled paler pales palls palmy palps palsy panda pandy paned panel panes pangs panic pansy pants papaw papal papas paper pappy para parae paras parch pards pared parer pares paris parks parry parse parts party pasha passa passe pasta paste pasts pasty patch pated paten pater pates paths patio patsy patty pause paved paver paves pawed pawer pawky pawls pawns payed payee payer peace peach peaks peaky peals pearl pears peats pecan pecks pedal peeks peels peens peeps peers peeve pekes pekoe pelf pelts penal pence pends penna penny peons peony peppy perch perils perks perky perms perps perry pesky pesos pests petal peter petit petty pewee pewit phase phial phlox phone phony photo phyla piano picks picky piece piers piety piggy piked piker pikes pilaf piled piles pills pilot pimps pinch pined pines ping pings pinks pinky pinto pints pinup pions pious piped piper pipes pipit pique pitas pitch piths pithy piton pitta pivot pixel pixie pizza place plaid plain plait plane plank plans plant plate plays plaza plead pleas pleat plebe plebs plenty plews plied plier plies plod plods plonk plops plots plows ploys pluck plugs plumb plume plump plums plumy plunk plush poach pocks podgy poesy poems poets point poise poked poker pokes pokey polar poled poles polio polis polka polls polos polyp pomps pond ponds pones pongs pooch poohs pools poops popes poppy porch pored pores porks porky ports posed poser poses posit posse posts potsy potto pouch pound pours pouts power poxed poxes prams prank prate prats prawn prays preen preps press prest prexy preys price prick pride pried prier pries prigs prime primi primo primp prims prink print prior prise prism privy prize prods proem profs prole promo proms prone prong proof props prose proud prove prowl prows proxy prude prune psalm psst psych pubes pubic puck pucks pudgy puffs puffy puggy puked pukes puler pules pulls pulps pulpy pulse pumas pumps punch punks punky punny punts pupae pupal pupas pupil puppy puree purer purge purls purrs purse pushy pussy putts putty pwned pygmy pylon pyres pyro
quack quads quaff quail quake qualm quark quart quash quasi queen queer quell query quest queue quick quiet quill quilt quips quire quirk quirt quite quits quota quote quoth
raced racer races racks radar radii radio radix radon rafts raged rages raids rails rains rainy raise raked rakes rally ramie ramps ranch randy range rangy ranks rants rapes rapid rarer rares rasps raspy rated rater rates ratio ratty raved ravel raven raver raves rawer rayed razed razes razor reach react reads ready realm reals reams reaps rearm rears rebel rebus rebut recap recut redid redip redly redox redox reeds reedy reefs reeks reels reeve refer refit regal rehab reign reins relax relay relic relit remit renal rends renew rents reopen repay rebel repel reply reran rerun reset resin rest rests retch retry reuse revel revue rewed rheum rhino rhyme riata rials ribbed ricin ricks rider rides ridge riels rifer riffs rifle rifts right rigid rigor riled riles rille rills rimed rimes rinds rings rinks rinse riots ripen riper ripes risen riser rises risks risky rites ritzy rival rived riven river rives roast robes robin robot rocks rocky rodeo rodman roles rolls roman romps rondo roofs rooks rooms roomy roost roots roped roper ropes roses rosin rotor rouge rough round rouse roust route routs roved rover roves rowan rowdy rowed rower royal rubes ruble rucks ruddy ruder ruffs rugby ruing ruins ruled ruler rules rumba rumen rummy rumor rumps runes rungs runic runny runts rupee rural ruses rush rushed rusks rusty
saber sable sacks sadly safer safes sagas sager sages saggy sahib said sails saint sakes salad sales salic sally salon salsa salts salty salve salvo samba sands sandy saner sappy saran saris sassy sated sates satin satyr sauce saucy sauna saute saved saver saves savor savvy sawed saxes scabs scads scald scale scalp scaly scamp scams scans scant scare scarf scars scary scats scene scent schwa scion scoff scold scone scoop scoot scope scops score scorn scots scour scout scowl scrag scram scrap scree screw scrim scrip scrod scrub scrum scuba scudi scudo scuds scuff scull scums scurf seals seams seamy sears seats sects sedan sedge sedgy seeds seedy seeks seems seeps seers segue seize selfs sells send sends sense sepal sepia sepses septa serfs serge serif serum serve servo setae setups seven sever sewed sewer sexed sexes shack shade shady shaft shake shaky shale shall shalt shame shams shank shape shard share shark sharp shave shawl shaws sheaf shear sheds sheen sheep sheer sheet sheik shelf shell shend shied shier shies shift shill shine shins shiny ships shire shirk shirr shirt shivs shoal shoat shock shoes shone shook shoot shops shore shorn short shots shout shove shown shows showy shred shrew shrub shrug shuck shuns shunt shush shuts shyer sibyl sick sided sides sidle siege sieve sighs sight sigma signs sikhs silks silky sills silly silos silts silty since sinew singe sings sinks sinus siphon sired siren sires sisal sissy sitar sited sites situp situs sixes sixth sixty sized sizer sizes skate skeet skein skews skids skied skier skies skiff skill skimp skims skins skips skirl skirt skits skulk skull skunk slabs slack slain slang slant slaps slash slate slats slave slaws slays sleds sleek sleep sleet slept slews slice slick slide slier slime slims slimy sling slink slips slits sloop slope slops slosh sloth slots slows slued slues slugs slums slung slunk slurp slurs slush slyly smack small smash smear smell smelt smile smirk smite smith smock smoke smoky smote smugs snack snafu snags snail snake snaky snaps snare snarl sneak sneer snide sniff snipe snips snits snobs snood snoop snoot snore snort snots snout snows snowy snubs snuck snuff snugs soak soaks soap soaps soapy soars soars sober socks sodas sofas softs soggy soils solar soled soles solid solos solve somas sonar songs sonic sooth soots sooty soppy sorer sores sorry sorts sough souls sound soups soupy sours souse south sowed sower space spacy spade spake spall spam spams spank spans spare spark spars spasm spat spate spats spawn spays speak spear spec specs speed spell spend spent sperm spews spice spicy spied spiel spies spiff spike spiky spill spilt spine spins spiny spire spite spits splat splay split spoil spoke spoof spook spool spoon spoor spore sport spots spout sprang sprat spray spree sprig sprint spritz sprout spruce sprue spuds spume spumy spunk spurn spurs spurt squad squat squaw squib squid stabs stack staff stage stags staid stain stair stake stale stalk stall stamp stand stank staph stare stark stars start stash state stats stave stays stead steak steal steam steed steel steep steer stein stems steno steps stern stew stews stick stiff stile still stilt sting stink stint stirs stock stoic stoke stole stoma stomp stone stony stood stool stoop stops store stork storm story stoup stout stove stows strap straw stray strep strew stria strip strop strum strut stubs stuck studs study stuff stump stung stunk stunt styes style styli suave sucks sudsy suede sugar suing suite suits sulks sulky sully sumac sumps sunny sunup super supra surge surly sushi sutra swabs swage swags swain swale swami swamp swang swank swans swaps sward swarm swart swash swath swats swayed sways swear sweat swede sweep sweet swell swept swift swigs swill swims swine swing swipes swirl swish swiss swoon swoop sword swore sworn swung sylph synch syncs syrup
tabby table taboo tabor tacet tache tachs tacit tacks tacky tacos tacts taels taffy taiga tails taint taken taker takes talcs tales talks talky tally talon talus tamed tamer tames tamps tango tangs tangy tanks tansy tapas taped taper tapes tapir tarde tardy tared tares tarns taros tarot tarps tarry tarsi tarts tasty tater tatin tatter tattle tattoo taught taunt taupe tauts tavern tawny taxed taxer taxes taxis tazza teach teaks teals teams tears teary tease teats techs teddy teems teens teeny teeth telex tells telly tempo temps tempt tench tends tenet tenor tense tenth tents tepee tepid terms terns terra terry terse tesla tests tetra texts thane thank thaws theater thebe theft their theme there these theta thews thick thief thigh thill thine thing think thins third thong thorn those those thou three threw throb throe throw thrum thuds thugs thumb thump thunks thusly thuya thyme tiara tibia ticks tidal tided tides tiers tiffs tiger tight tikes tilde tiled tiler tiles tills tilth tilts timed timer times timid tines tinge tings tinny tints tipsy tired tires tithe title titty tizzy toads toady toast today toddy toe toed toes toga togas toils token tolds tolls tomah tomb tombs tomes tonal toned toner tones tongs tonic tonsil tools tooth toots topaz topic topos toque torch tores torii torns toros torque torrid torsi torso torus total toted totem totes touch tough tours touts toward towed towel tower towns toxic toxin toyed trace track tract trade trail train trait tramp trans traps trash trawl trays tread treat treed treen trees treks trend tress triad trial tribe trice trick tried trier tries trigs trill trims trios tripe trips trite troll troop trope trots trout trove truce truck trued truer trues truly trump trunk truss trust truth tryst tsars tubal tubas tubby tubed tuber tubes tucks tufas tufts tulip tulle tumid tummy tumors tuner tunes tunic tunny turbo turds turfs turkey turns tusks tutor tutti tutus tuxes twain twang tweak tweed tween tweet twerp twice twigs twill twins twine twink twins twirl twist twits twixt tying tymp tykes typer types typos tyros tzars
udder ulcer ultra umbel umber umbra umiak umiak umped unapt unarm unary unbar unbid unbox uncap uncle uncut under undid undue unfed unfit unfix ungag unhip unify union unite units unity unjam unlit unman unmet unpeg unpin unset unsex untie until unwed unzip upend upped upper upset urban ureas urged urger urges urine usage users usher using usual usurp usury utile utter
uvula
vague vales valet valid valor value valve vapid vapor vases vasts vault vaunt veals veeps veers vegan veils veins veiny veldt vends venom vents venue verbs verge verse verso vests vetch vetos vexed vexes vials vibes vicar vices video views vigil vigor viler villi vined vines vinyl viola viols viper viral vireo virge virtue visa vised vises visit visor vista vitae vital vitta vivid vixen vocal vodka vogue voice voids voile voles volts vomit voted voter votes vouch vowed vowel vower vroom vying
wacko wacky waded wader wades wadis wafer waffs wafts waged wager wages wagon wahoo waifs wails wains waist waits waked waken waker wakes waled wales walks walls waltz wands waned wanes wanly wanna wants wards wared wares warms warns warps warts wary washy wasps waste watch water watts waved waver waves waxed waxen waxes weary weave webby wedge weeds weedy weeks weens weeny weeps weepy weest wefts weigh weird weirs welds wells welsh welts wench wends west wets whale whams whaps wharf whats wheal wheat wheel whelm whelp where whets whews wheys which whiff while whims whine whiny whips whirl whirr whirrs whisk white whizz whole whomp whoop whops whore whorl whose whoso whump wicks widen wider wides widow width wield wifed wifes wight wiled wiles wills willy wilts wimps wimpy wince winch winds windy wined wines winey wings winged winks wiped wiper wipes wired wirer wires wiseg wishy wisps wispy wists witch witty wived wives wizen woads wodge woful woken wolds wolfs woman women wombs wonder wonks wonky wonts woods woody wooed wooer woofs wools wooly woops woozy words wordy works world worms wormy worry worse worst worth would wound woven wowed wrack wrap wrapped wraps wrath wreak wreck wrens wrest wrick wrier wring wrist write writs wrong wrote wroth wrung wryly wurst
xenon
yacht yahoo yanks yards yarn yarns yawed yawls yawns yawps yearn years yeast yecch yells yelps yeses yetis yield yodel yokel yokes yolks yonic yonis young yours youth yowls yucca
zesty zilch zing zippy zonal zoned zones zooms
aegis blackspire brasswater hollow synapse ironclad vaulted slagtown moonlit raiders wardens overlay porches terminal blackout forging ghosted breaches halcyon specter brasscap tribute penthouse furnace
`;

function normalizeDict(raw: string) {
  const out = new Set<string>();
  for (const token of raw.trim().split(/\s+/)) {
    const w = token.toLowerCase().replace(/[^a-z]/g, "");
    if (w.length >= 3 && w.length <= 10) out.add(w);
  }
  return [...out];
}

export const ANAGRAM_DICT = normalizeDict(RAW);
