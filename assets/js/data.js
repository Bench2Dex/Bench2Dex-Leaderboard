/* BENCH2DEX homepage dataset.
 * Counts, means, and efficiencies follow the paper and recorded evaluations.
 * Channel LSCR is derived from evaluation exports.
 * Task and embodiment details follow the paper supplement.
 */

const ROLLOUTS_PER_CELL = 50;
const TASK_EMB_SETTINGS = 26;
// Published baselines: kept fixed for the paper tables and historical charts.
const POLICIES = ["ACT", "DPC", "PI05", "GR00T"];
const POLICY_LABEL = { ACT: "ACT", "DPC": "DP", PI05: "π₀.₅", GR00T: "GR00T N1.5" };
const CHANNELS = ["none", "equi", "inv", "full"];
const CHANNEL_LABEL = { none: "None", equi: "Equi.", inv: "Inv.", full: "Full" };
const CHANNEL_COLOR = { none: "#9AA3A0", equi: "#C77E1A", inv: "#1E94A6", full: "#6B4FB0" };

/* Embodiments: render / contact / tactile asset stems + paper description. */
const EMBODIMENTS = [
  { id: "kuka_sharpa",      name: "IIWA7 + Sharpa",       arm: "IIWA7",        hand: "Sharpa",        tasks: ["32","26","73"],     render: "kuka_sharpa",      contact: "kuka_sharpa",      tactile: "iiwa7_sharpa_26_000032",      desc: "A white KUKA-style arm with bright orange accent panels, paired with a smooth anthropomorphic hand. The clean enclosed hand silhouette contrasts with the strong white-orange arm styling.", morphology: "5-finger anthropomorphic" },
  { id: "jaka_dexhand021",  name: "JAKA ZU7 + DexHand021",arm: "JAKA ZU7",     hand: "DexHand021",    tasks: ["80"],               render: "jaka_zu7_dexhand021", contact: "jaka_zu7_dexhand021", tactile: "jaka_zu7_dexhand021_flange_80_000007", desc: "A metallic-gray collaborative arm with blue circular joint caps, paired with a silver dexterous hand with dense exposed mechanisms, a ribbed palm surface, and slender articulated fingers.", morphology: "5-finger actuated" },
  { id: "panda_orca",       name: "Panda + Orca",         arm: "Panda",        hand: "Orca",          tasks: ["61","22"],          render: "panda_orca",       contact: "panda_orca",       tactile: "panda_orca_22_000007",       desc: "A light Panda-style arm attached to a dark hand with a narrow palm and strongly spread fingers. Long separated digits with bright caps create an open fan-like silhouette.", morphology: "5-finger spread" },
  { id: "panda_allegro",    name: "Panda + Allegro",       arm: "Panda",        hand: "Allegro",       tasks: ["64"],               render: "panda_allegro",    contact: "panda_allegro",    tactile: "panda_allegro_64_000002",    desc: "A light Panda-style arm paired with a compact dark modular hand. The boxy palm, rectangular segmented fingers, and bright fingertip caps create a sharp contrast with the soft industrial arm.", morphology: "4-finger modular" },
  { id: "rm65_revo2",       name: "RM65 + Revo2",         arm: "RM65",         hand: "Revo2",         tasks: ["67","24"],          render: "rm_65_BrainCo",    contact: "rm_65_BrainCo",    tactile: "rm_65_revo2_24_000003",      desc: "A smooth white arm paired with a compact anthropomorphic hand with a rounded palm shell, slim fingers, and a clean enclosed structure. The embodiment appears polished and tightly integrated.", morphology: "5-finger anthropomorphic" },
  { id: "xarm_ability",     name: "xArm7 + Ability",       arm: "xArm7",        hand: "Ability",      tasks: ["79","03"],          render: "xarm_ability",     contact: "xarm_ability",     tactile: "xarm7_ability_03_000001",    desc: "A white arm with smooth enclosed links, paired with a compact white hand with a rounded palm shell, dark finger coverings, and a thick side thumb. The embodiment is soft-contoured and highly enclosed.", morphology: "5-finger enclosed" },
  { id: "xarm_leap",        name: "xArm7 + LEAP",          arm: "xArm7",        hand: "LEAP",         tasks: ["09","62","51"],     render: "xarm_leap",        contact: "xarm_leap",        tactile: "xarm7_leap_51_000007",        desc: "A white arm with smooth rounded links, attached to a compact low-profile robotic hand with a blocky palm and modular fingers. Stacked box-like segments and bright caps give it a clean geometric appearance.", morphology: "4-finger modular" },
  { id: "ur5_rh5dg2",       name: "UR5 + RH5DG2",          arm: "UR5",          hand: "RH5DG2",       tasks: ["60","07","34"],     render: "ur5_RH5DG2",       contact: "ur5_RH5DG2",       tactile: "ur5_rh5dg2_flange_07_000003",desc: "A metallic-gray UR5-style arm with blue circular joint caps, attached to a white-and-gray hand with a rounded palm shell, dark cylindrical finger coverings, and a thick side thumb close to the palm plane.", morphology: "5-finger rounded" },
  { id: "ur5_rh56dfx",      name: "UR5 + RH56DFX",         arm: "UR5", hand: "RH56DFX", tasks: ["06","12","42"],  render: "ur5_RH56DFX",      contact: "ur5_RH56DFX",      tactile: "ur5_rh56dfx_flange_06_000003",desc: "A metallic-gray industrial arm with rounded cylindrical links and blue joint caps, ending in a white-and-silver dexterous hand with a sculpted palm shell, dark finger pads, and a large side thumb.", morphology: "5-finger sculpted" },
  { id: "ur5_shadow",       name: "UR5 + Shadow",          arm: "UR5",          hand: "Shadow",       tasks: ["43","76"],          render: "ur5_shadow_hand",  contact: "ur5_shadow_hand",  tactile: "ur5_shadow_hand_flange_43_000002", desc: "A metallic-gray arm with blue circular joints, attached to a dark anthropomorphic hand with slim multi-joint fingers and bright fingertip caps. The hand is lightweight and human-like relative to the heavier arm.", morphology: "5-finger human-like" },
  { id: "ur5_schunk",       name: "UR5 + Schunk",          arm: "UR5",          hand: "Schunk",       tasks: ["08","44"],          render: "ur5_schunk_hand",  contact: "ur5_schunk_hand",  tactile: "ur5_schunk_hand_flange_08_000006", desc: "A metallic-gray arm with blue round joint covers, paired with a robust white industrial hand. A broad palm, thick segmented fingers, gray fingertip pads, and heavy thumb create a sturdy precision-oriented look.", morphology: "5-finger industrial" },
  { id: "ur5_wuji",         name: "UR5 + Wuji",            arm: "UR5",          hand: "Wuji",         tasks: ["27","21"],          render: "ur5_wuji",         contact: "ur5_wuji",         tactile: "ur5_wuji_flange_21_000001",  desc: "A metallic-gray arm with blue circular joint caps, ending in a slim dexterous hand with long narrow fingers and a thin side thumb. The hand appears lighter and more elongated than other UR5-based embodiments.", morphology: "5-finger elongated" }
];

/* Task catalog: description, success condition, stage sequence, capability tags, default embodiment. */
const TASKS = [
  { id:"03", name:"Wine Glass Plate Balance", emb:"xarm_ability", stages:["Place First Glass","Place Second Glass","Place Third Glass"], tags:["bimanual","carry","placement"], desc:"Carry three filled wine glasses to the plates of three diners without spilling or knocking over any objects.", success:"All three wine glasses are kept upright (within 30° of vertical), each placed within 0.10 m of a target position, and fully at rest." },
  { id:"06", name:"Fruit Bowl Loading", emb:"ur5_rh56dfx", stages:["Move Bowl","Place Apple 1","Place Apple 2","Place Banana"], tags:["bimanual","loading","placement"], desc:"Move the bowl to the center of the table and place two apples and a banana into it.", success:"The bowl is moved into the central zone and kept upright; two apples and one banana are placed inside it, all at rest." },
  { id:"07", name:"Citrus Plate Loading", emb:"ur5_rh5dg2", stages:["Place Lemon 1","Place Lemon 2","Place Orange 1","Place Orange 2"], tags:["bimanual","loading"], desc:"Place two lemons and two oranges onto the plate.", success:"Two lemons and two oranges are on the plate, each center within 0.15 m of the plate interior." },
  { id:"08", name:"Frypan Stand & Pour", emb:"ur5_schunk", stages:["Pour Soy Sauce","Pour Olive Oil"], tags:["tool-use","pouring","articulated"], desc:"Place the frypan onto the display stand, then pour the soy sauce and olive oil into the frypan one by one.", success:"The frypan is on the stand; soy sauce and olive oil are each tilted ≥50° over the frypan to pour, then returned upright and at rest while the bread stays in the pan." },
  { id:"09", name:"Cleaner Box Loading", emb:"xarm_leap", stages:["Place Cleaner","Place Soap"], tags:["bimanual","loading","stabilize"], desc:"Use both hands to lift the cleaner upright into the wooden box, then place the soap into the box.", success:"The wooden box is upright, the cleaner is inside and upright (not tilted), and the soap is inside the box." },
  { id:"12", name:"Screwdriver Box & Hammer", emb:"ur5_rh56dfx", stages:["Place Flat Right","Place Phillips Left","Strike Wood Block","Place Hammer"], tags:["tool-use","striking","sequential"], desc:"Place the right screwdriver into the box and move the box left, place the left screwdriver, then strike the block once with the hammer and place the hammer into the box.", success:"Both screwdrivers are inside the upright box; the hammer strikes the wooden block once, then is placed inside the box." },
  { id:"21", name:"Condiment Box Loading", emb:"ur5_wuji", stages:["Place Soy Sauce","Place Vinegar","Place MSG"], tags:["loading","upright-constraint"], desc:"Place the monosodium glutamate, soy sauce, and vinegar into the wooden box.", success:"The box is upright; MSG, soy sauce, and vinegar are all inside it, with soy and vinegar kept upright, all at rest." },
  { id:"22", name:"Tool Box Loading", emb:"panda_orca", stages:["Place Phillips","Place Flat","Place Wrench","Place Drill"], tags:["bimanual","tool-use","loading"], desc:"Right hand places the drill and flat screwdriver and left hand places the wrench and Phillips screwdriver into the wooden box.", success:"All four tools are placed inside the upright wooden box." },
  { id:"24", name:"Stationery Category Sorting", emb:"rm65_revo2", stages:["Put Pen in Cup","Put Marker in Cup","Put Glue in Box","Put Battery in Box"], tags:["bimanual","sorting","upright-constraint"], desc:"Right hand sorts marker and battery into the pen cup and plastic box; left hand sorts the pen and glue into the respective containers.", success:"Pen and marker are upright in the pen cup; glue and battery are in the plastic box; both containers upright, all at rest." },
  { id:"26", name:"Canned Food Tray Arrangement", emb:"kuka_sharpa", stages:["Place Master Chef Can","Place MSG","Place Milk Box","Place Potted Meat Can"], tags:["bimanual","loading","tray"], desc:"Left hand places the master chef can and MSG and right hand places the milk box and potted meat can onto the tray.", success:"All four items are placed on the tray and kept upright, with the tray upright and all at rest." },
  { id:"27", name:"Ball Box Loading", emb:"ur5_wuji", stages:["Place Soccer Ball","Place Tennis Ball","Place Golf Ball","Place Pingpong Ball"], tags:["loading","spherical"], desc:"Place the mini soccer ball, tennis ball, golf ball, and ping-pong ball into the box.", success:"The box is upright and all four balls are inside it, each within 0.22 m of the box interior." },
  { id:"32", name:"Baking Tray Prep", emb:"kuka_sharpa", stages:["Place Pudding","Place Gelatin","Place Spatula","Place Brush"], tags:["bimanual","loading","tray"], desc:"Left hand places the brush and spatula and right hand places the small pudding box and large gelatin box onto the tray.", success:"All four items are on the tray, with the tray kept upright and all at rest." },
  { id:"34", name:"Fridge Wine Interhand Pour", emb:"ur5_rh5dg2", stages:["Open Fridge","Take Bottle","Pour Wine","Return Bottle","Close Fridge"], tags:["articulated","handover","pouring","long-horizon"], desc:"Open the fridge, take out the wine bottle, hand it to the right hand in the air to pour a glass, return it to the left hand to put back, and close the door.", success:"The fridge door is opened, the bottle is lifted out, tilted ≥50° toward the glass to pour, returned upright inside the fridge, and the door is closed." },
  { id:"42", name:"Trash Disposal", emb:"ur5_rh56dfx", stages:["Place Paper","Place Bottle","Place Banana Peel"], tags:["articulated","disposal","bimanual"], desc:"Open the trash can lid, throw the crumpled paper in, use the left hand to throw the bottle and banana peel in, then close the lid.", success:"The trash can is upright and the paper, bottle, and banana peel are all inside it, at rest." },
  { id:"43", name:"Fridge Fruit Shelf Sorting", emb:"ur5_shadow", stages:["Open Fridge","Place Lemon","Place Banana","Close Fridge"], tags:["articulated","sorting","long-horizon"], desc:"Move the banana to the left side, open both fridge doors, place the lemon on the upper shelf and the banana on the lower shelf, then close the door.", success:"Banana and lemon are inside the fridge, both doors are closed, and both objects are at rest." },
  { id:"44", name:"Microwave Bowl Loading", emb:"ur5_schunk", stages:["Open Microwave Door","Put Baguette in Bowl","Put Bowl in Microwave","Close Microwave Door"], tags:["articulated","nested","long-horizon"], desc:"Open the microwave door, bring the bowl to the microwave, place the baguette into the bowl, place the bowl into the microwave, and close the door.", success:"The bowl is inside the microwave cavity and upright, the baguette is in the bowl, and the door is closed." },
  { id:"51", name:"Toilet Lid Cleaner Pour", emb:"xarm_leap", stages:["Open Toilet Lid","Pour Cleaner","Close Toilet Lid"], tags:["articulated","pouring"], desc:"Open the toilet lid, pour the cleaner into the toilet, and close the toilet lid.", success:"The lid is opened, the cleaner is lifted and tilted ≥50° toward the bowl to pour while the lid stays open, then the lid is closed." },
  { id:"60", name:"Breadbasket Fast-Food Loading", emb:"ur5_rh5dg2", stages:["Place Baguette","Place Bread","Place Hamburg","Place French Fries"], tags:["loading","bimanual"], desc:"Place the baguette and bread into the bread basket, move the basket to the center, then place the hamburger and french fries into the basket.", success:"The basket is upright and the fries, hamburger, bread, and baguette are all inside it." },
  { id:"61", name:"Medicine Shoebox Pack", emb:"panda_orca", stages:["Place Pillbottle","Place Tooth Paste","Place Hydrating Oil"], tags:["loading","upright-constraint"], desc:"Move the shoe box to the center of the table, then place the pill bottle, toothpaste, and hydrating oil into the box.", success:"The shoe box is upright and the pill bottle, toothpaste, and hydrating oil are all inside it." },
  { id:"62", name:"Shoebox Accessory Pack", emb:"xarm_leap", stages:["Place Seal","Place Shoe","Place Pet Collar"], tags:["loading","bimanual"], desc:"Place the seal into the shoe box and move the box to center, then place the shoe and pet collar into the box.", success:"The shoe box is upright and the seal, shoe, and pet collar are inside it, at rest." },
  { id:"64", name:"Sports Ball Cup Sort", emb:"panda_allegro", stages:["Place Tennis Ball","Place Baseball","Place Racquetball","Place Golf Ball"], tags:["sorting","spherical"], desc:"Place the tennis ball and baseball into the large cup and the racquetball and golf ball into the small cup.", success:"Both cups are upright; tennis+baseball in the large cup and racquet+golf in the small cup, all at rest." },
  { id:"67", name:"Faucet Cup Water Fill", emb:"rm65_revo2", stages:["Put Spoon in Mug","Put Mug Under Faucet","Open and Close Faucet","Put Mug on Tray"], tags:["articulated","pouring","long-horizon"], desc:"Place the spoon into the mug, place the mug under the faucet, open the faucet to fill the mug then close it, and place the mug onto the tray.", success:"Spoon in the upright mug; while the mug is under the faucet, the faucet is opened then closed; the mug is placed at rest on the tray." },
  { id:"73", name:"Jigsaw Puzzle Assembly", emb:"kuka_sharpa", stages:["Assemble Green Piece","Assemble Red Piece","Assemble Blue Piece","Assemble Yellow Piece"], tags:["precise-assembly","long-horizon"], desc:"Use the right and left hands in turn to assemble the green, red, blue, and yellow pieces around the fixed white center piece, forming a rectangle.", success:"All four colored pieces are at their target positions around the white piece (within 0.02 m in xy and 0.01 m in height), all at rest." },
  { id:"76", name:"Soup Serving", emb:"ur5_shadow", stages:["Scoop First Portion","Scoop Second Portion","Place Bowl","Return Ladle"], tags:["bimanual","scooping","tool-use"], desc:"Hold the bowl beside the pot with the left hand, ladle two scoops of soup into the bowl with the right hand, carry the bowl to the front-right zone, and return the ladle.", success:"The pot is on the stove, the bowl is held near the pot, the ladle dips into the pot and is brought over the bowl twice, the bowl is delivered to the serving zone, and the ladle is returned." },
  { id:"79", name:"Bimanual Piano Melody", emb:"xarm_ability", stages:["Play Left Melody","Play Right Melody"], tags:["temporal-sequence","fine-bimanual","contact-rich"], desc:"Both hands play the piano key sequence C-C-G-G-A-A-G together, the left hand playing bass and the right hand treble.", success:"The left hand plays the bass melody and the right hand plays the treble melody C-C-G-G-A-A-G, each note key pressed in sequence." },
  { id:"80", name:"Gaming Desk Setup", emb:"jaka_dexhand021", stages:["Straighten Monitor","Press Escape Key","Click Left Mouse Button"], tags:["heterogeneous","tool-use","interface"], desc:"Straighten the monitor screen forward with both hands, press the ESC key, move the mouse back to the left of the keyboard, and click the left mouse button.", success:"The monitor is straightened, the ESC key is pressed once, the mouse is returned to the left of the keyboard, and the left mouse button is clicked." }
];

/* Main-table values from the paper, tab:policy_generalization_results.
 * Each channel count is stable successes out of 50 rollouts. */
const RESULTS = {
  "12": {"ACT":[16,5,18,10],"DPC":[8,1,3,6],"PI05":[18,18,14,16],"GR00T":[16,10,19,10]},
  "21": {"ACT":[12,3,3,3],"DPC":[3,0,0,0],"PI05":[15,7,4,4],"GR00T":[4,4,0,1]},
  "22": {"ACT":[17,10,8,5],"DPC":[16,10,8,10],"PI05":[41,34,35,34],"GR00T":[32,20,31,33]},
  "24": {"ACT":[3,0,1,0],"DPC":[0,0,0,0],"PI05":[0,0,0,0],"GR00T":[0,0,0,0]},
  "26": {"ACT":[17,2,0,0],"DPC":[0,0,0,0],"PI05":[15,4,2,3],"GR00T":[10,3,0,2]},
  "27": {"ACT":[10,5,1,2],"DPC":[0,0,0,0],"PI05":[7,5,9,8],"GR00T":[21,4,6,7]},
  "32": {"ACT":[9,2,1,0],"DPC":[3,0,0,0],"PI05":[25,8,14,10],"GR00T":[19,7,3,1]},
  "34": {"ACT":[8,6,14,6],"DPC":[0,0,0,0],"PI05":[6,2,4,5],"GR00T":[3,2,1,5]},
  "42": {"ACT":[15,6,9,7],"DPC":[4,3,2,1],"PI05":[19,18,23,24],"GR00T":[15,6,13,7]},
  "43": {"ACT":[1,0,0,0],"DPC":[1,0,0,0],"PI05":[7,3,0,2],"GR00T":[2,1,1,0]},
  "44": {"ACT":[38,29,29,29],"DPC":[16,7,7,3],"PI05":[45,32,32,31],"GR00T":[44,27,39,32]},
  "51": {"ACT":[16,19,20,13],"DPC":[6,1,2,4],"PI05":[21,22,25,23],"GR00T":[32,20,24,25]},
  "60": {"ACT":[11,6,3,1],"DPC":[0,0,1,0],"PI05":[13,3,6,3],"GR00T":[5,2,0,0]},
  "61": {"ACT":[5,1,5,4],"DPC":[0,0,0,1],"PI05":[15,2,14,12],"GR00T":[26,3,11,5]},
  "62": {"ACT":[19,18,11,12],"DPC":[6,1,1,3],"PI05":[29,21,28,24],"GR00T":[22,14,15,16]},
  "64": {"ACT":[4,0,0,0],"DPC":[0,1,0,0],"PI05":[21,9,2,11],"GR00T":[13,1,0,2]},
  "67": {"ACT":[6,5,2,2],"DPC":[0,0,0,0],"PI05":[7,6,9,9],"GR00T":[10,6,11,6]},
  "73": {"ACT":[0,0,0,0],"DPC":[0,0,0,0],"PI05":[0,0,0,0],"GR00T":[10,0,0,0]},
  "76": {"ACT":[2,0,0,0],"DPC":[0,0,0,0],"PI05":[0,0,0,0],"GR00T":[1,0,0,0]},
  "79": {"ACT":[1,0,0,0],"DPC":[2,0,1,0],"PI05":[6,5,2,2],"GR00T":[21,6,5,8]},
  "80": {"ACT":[25,10,17,10],"DPC":[5,3,2,2],"PI05":[16,11,23,20],"GR00T":[32,8,29,18]},
  "03": {"ACT":[15,11,13,13],"DPC":[2,1,2,1],"PI05":[16,14,21,19],"GR00T":[20,9,18,18]},
  "06": {"ACT":[34,15,13,12],"DPC":[24,3,6,9],"PI05":[36,10,12,19],"GR00T":[37,8,12,6]},
  "07": {"ACT":[43,20,14,26],"DPC":[17,3,4,3],"PI05":[35,12,34,32],"GR00T":[45,17,23,16]},
  "08": {"ACT":[20,8,3,7],"DPC":[0,1,0,0],"PI05":[8,9,7,6],"GR00T":[32,14,33,26]},
  "09": {"ACT":[34,20,7,5],"DPC":[3,4,2,1],"PI05":[36,21,29,24],"GR00T":[22,20,22,27]}
};

/* Paper-reported four-channel mean LSCR (%) for each task and policy. */
const LSCR = {
  "12": {"ACT":56.3,"DPC":33.9,"PI05":57.5,"GR00T":57.8},
  "21": {"ACT":31.8,"DPC":3.7,"PI05":33.2,"GR00T":27.7},
  "22": {"ACT":37.5,"DPC":42.4,"PI05":86,"GR00T":70.8},
  "24": {"ACT":23.1,"DPC":0.1,"PI05":2.3,"GR00T":1.4},
  "26": {"ACT":34.6,"DPC":13.3,"PI05":38.8,"GR00T":33.8},
  "27": {"ACT":13.1,"DPC":0.4,"PI05":19.3,"GR00T":27.9},
  "32": {"ACT":11.6,"DPC":7,"PI05":37.8,"GR00T":36.9},
  "34": {"ACT":26.4,"DPC":27.5,"PI05":36.1,"GR00T":47.5},
  "42": {"ACT":64.5,"DPC":28.3,"PI05":66.5,"GR00T":54.8},
  "43": {"ACT":2.6,"DPC":7.4,"PI05":29.6,"GR00T":17.5},
  "44": {"ACT":37.4,"DPC":43.1,"PI05":78.4,"GR00T":80.5},
  "51": {"ACT":35.3,"DPC":23,"PI05":53.3,"GR00T":68},
  "60": {"ACT":15.8,"DPC":2.1,"PI05":15.6,"GR00T":6.4},
  "61": {"ACT":21.5,"DPC":10,"PI05":39.8,"GR00T":35.3},
  "62": {"ACT":56.3,"DPC":25.8,"PI05":68.3,"GR00T":54.3},
  "64": {"ACT":2.5,"DPC":3,"PI05":33.6,"GR00T":19.5},
  "67": {"ACT":35.4,"DPC":3.8,"PI05":40.5,"GR00T":41.9},
  "73": {"ACT":12.5,"DPC":6.3,"PI05":8.4,"GR00T":30.3},
  "76": {"ACT":11.5,"DPC":0.8,"PI05":14,"GR00T":13.9},
  "79": {"ACT":1.0,"DPC":2.3,"PI05":16,"GR00T":31.3},
  "80": {"ACT":46,"DPC":22.2,"PI05":50.3,"GR00T":59.3},
  "03": {"ACT":72,"DPC":35.7,"PI05":76.2,"GR00T":73.2},
  "06": {"ACT":62,"DPC":49.1,"PI05":71.6,"GR00T":66.6},
  "07": {"ACT":69.9,"DPC":37.8,"PI05":67.3,"GR00T":68.8},
  "08": {"ACT":51.3,"DPC":14.3,"PI05":33.3,"GR00T":68.8},
  "09": {"ACT":76.3,"DPC":34,"PI05":88.5,"GR00T":80.8}
};

/* Expert-normalized efficiency: null means no successful rollout. */
const EFFICIENCY = {
  "12": {"ACT":1.033,"DPC":0.826,"PI05":0.935,"GR00T":0.904},
  "21": {"ACT":0.929,"DPC":0.853,"PI05":0.917,"GR00T":0.886},
  "22": {"ACT":0.983,"DPC":0.902,"PI05":0.97,"GR00T":0.955},
  "24": {"ACT":0.916,"DPC":null,"PI05":null,"GR00T":null},
  "26": {"ACT":0.966,"DPC":null,"PI05":0.927,"GR00T":0.92},
  "27": {"ACT":0.988,"DPC":null,"PI05":1.006,"GR00T":0.952},
  "32": {"ACT":0.924,"DPC":0.898,"PI05":1.022,"GR00T":0.986},
  "34": {"ACT":1.053,"DPC":null,"PI05":1.095,"GR00T":0.97},
  "42": {"ACT":0.946,"DPC":0.84,"PI05":0.924,"GR00T":0.89},
  "43": {"ACT":1.069,"DPC":0.673,"PI05":0.898,"GR00T":0.843},
  "44": {"ACT":1.016,"DPC":0.947,"PI05":1.026,"GR00T":1.001},
  "51": {"ACT":0.99,"DPC":0.974,"PI05":1.058,"GR00T":0.967},
  "60": {"ACT":0.951,"DPC":0.916,"PI05":0.959,"GR00T":0.944},
  "61": {"ACT":1.004,"DPC":0.83,"PI05":0.994,"GR00T":0.968},
  "62": {"ACT":1.025,"DPC":0.889,"PI05":1.005,"GR00T":0.979},
  "64": {"ACT":0.728,"DPC":0.74,"PI05":0.769,"GR00T":0.741},
  "67": {"ACT":0.899,"DPC":null,"PI05":0.891,"GR00T":0.938},
  "73": {"ACT":null,"DPC":null,"PI05":null,"GR00T":0.957},
  "76": {"ACT":0.883,"DPC":null,"PI05":null,"GR00T":0.793},
  "79": {"ACT":0.799,"DPC":0.771,"PI05":0.882,"GR00T":0.882},
  "80": {"ACT":1.013,"DPC":0.866,"PI05":1.016,"GR00T":1.004},
  "03": {"ACT":1.089,"DPC":0.995,"PI05":1.059,"GR00T":0.984},
  "06": {"ACT":0.96,"DPC":0.916,"PI05":0.941,"GR00T":0.928},
  "07": {"ACT":0.838,"DPC":0.82,"PI05":0.84,"GR00T":0.834},
  "08": {"ACT":1.214,"DPC":1.001,"PI05":1.063,"GR00T":1.217},
  "09": {"ACT":0.951,"DPC":0.774,"PI05":0.885,"GR00T":0.808}
};

/* Channel LSCR from ACT, DP, pi0.5, and GR00T evaluation exports.
 * All four baselines cover all 26 tasks.
 * Null never means zero.
 * Channel order: None, Equi., Inv., Full. */
const LSCR_CHANNELS = {
  "12": {"ACT":[0.69,0.455,0.58,0.525],"DPC":[0.47,0.225,0.325,0.335],"PI05":[0.625,0.525,0.55,0.6],"GR00T":[0.67,0.475,0.67,0.495]},
  "21": {"ACT":[0.4867,0.2267,0.24,0.32],"DPC":[0.12,0.013300000000000001,0,0.013300000000000001],"PI05":[0.593333333333,0.306666666667,0.166666666667,0.26],"GR00T":[0.5533,0.26,0.1267,0.16670000000000001]},
  "22": {"ACT":[0.575,0.35,0.3,0.275],"DPC":[0.55,0.415,0.325,0.405],"PI05":[0.905,0.81,0.885,0.84],"GR00T":[0.775,0.555,0.72,0.78]},
  "24": {"ACT":[0.325,0.175,0.2,0.225],"DPC":[0,0.005,0,0],"PI05":[0.02,0.015,0.02,0.035],"GR00T":[0.03,0.02,0,0.005]},
  "26": {"ACT":[0.685,0.3,0.195,0.205],"DPC":[0.175,0.105,0.14,0.11],"PI05":[0.54,0.265,0.395,0.35],"GR00T":[0.535,0.285,0.275,0.255]},
  "27": {"ACT":[0.26,0.125,0.075,0.065],"DPC":[0,0,0,0.015],"PI05":[0.16,0.125,0.29,0.195],"GR00T":[0.53,0.14,0.225,0.22]},
  "32": {"ACT":[0.24,0.055,0.105,0.065],"DPC":[0.12,0.045,0.055,0.06],"PI05":[0.51,0.24,0.465,0.295],"GR00T":[0.58,0.225,0.335,0.335]},
  "34": {"ACT":[0,0.472,0.584,0],"DPC":[0.264,0.3,0.292,0.244],"PI05":[0.456,0.34,0.316,0.332],"GR00T":[0.49200000000000005,0.4,0.512,0.496]},
  "42": {"ACT":[0.66,0.6,0.6733,0.6467],"DPC":[0.3333,0.34,0.2,0.26],"PI05":[0.64,0.5866666666670001,0.68,0.753333333333],"GR00T":[0.6133,0.43329999999999996,0.58,0.5667]},
  "43": {"ACT":[0,0,0.105,0],"DPC":[0.105,0.055,0.07,0.065],"PI05":[0.36,0.29,0.24,0.295],"GR00T":[0.27,0.175,0.12,0.135]},
  "44": {"ACT":[0,0.72,0.75,0.025],"DPC":[0.59,0.415,0.375,0.345],"PI05":[0.935,0.725,0.75,0.725],"GR00T":[0.935,0.675,0.85,0.76]},
  "51": {"ACT":[0,0.5267,0.6267,0.26],"DPC":[0.34,0.18,0.17329999999999998,0.2267],"PI05":[0.526666666667,0.54,0.54,0.526666666667],"GR00T":[0.7667,0.5867,0.6667000000000001,0.7]},
  "60": {"ACT":[0.26,0.185,0.13,0.055],"DPC":[0.025,0.01,0.02,0.03],"PI05":[0.305,0.08,0.14,0.1],"GR00T":[0.17,0.05,0.02,0.015]},
  "61": {"ACT":[0.32,0.1267,0.2667,0.1467],"DPC":[0.1333,0.0867,0.1067,0.0733],"PI05":[0.56,0.16,0.48666666666700004,0.386666666667],"GR00T":[0.6667000000000001,0.24,0.3267,0.18]},
  "62": {"ACT":[0.66,0.66,0.4867,0.4467],"DPC":[0.31329999999999997,0.24670000000000003,0.2133,0.26],"PI05":[0.733333333333,0.653333333333,0.68,0.6666666666669999],"GR00T":[0.6733,0.5067,0.48,0.5133]},
  "64": {"ACT":[0.1,0,0,0],"DPC":[0.02,0.04,0.045,0.015],"PI05":[0.515,0.345,0.165,0.32],"GR00T":[0.415,0.1,0.15,0.115]},
  "67": {"ACT":[0.305,0.41,0.35,0.35],"DPC":[0.025,0.05,0.02,0.055],"PI05":[0.38,0.275,0.49,0.475],"GR00T":[0.46,0.365,0.46,0.39]},
  "73": {"ACT":[0.25,0.065,0.14,0.045],"DPC":[0.145,0.035,0.045,0.025],"PI05":[0.135,0.06,0.1,0.04],"GR00T":[0.715,0.135,0.215,0.145]},
  "76": {"ACT":[0.32,0.07,0.04,0.03],"DPC":[0.015,0.01,0,0.005],"PI05":[0.15,0.09,0.215,0.105],"GR00T":[0.31,0.105,0.095,0.045]},
  "79": {"ACT":[0.02,0,0.01,0.01],"DPC":[0.04,0,0.03,0.02],"PI05":[0.25,0.15,0.1,0.14],"GR00T":[0.52,0.17,0.22,0.34]},
  "80": {"ACT":[0.2467,0.4533,0.6467,0.4933],"DPC":[0.28,0.22,0.16670000000000001,0.22],"PI05":[0.44666666666700006,0.326666666667,0.64,0.6],"GR00T":[0.7467,0.3467,0.7132999999999999,0.5667]},
  "03": {"ACT":[0.7067,0.6267,0.78,0.7667],"DPC":[0.4067,0.38,0.3467,0.2933],"PI05":[0.753333333333,0.68,0.793333333333,0.82],"GR00T":[0.7867000000000001,0.6,0.7867000000000001,0.7533]},
  "06": {"ACT":[0.825,0.58,0.55,0.525],"DPC":[0.7,0.43,0.44,0.395],"PI05":[0.915,0.58,0.67,0.7],"GR00T":[0.92,0.525,0.66,0.56]},
  "07": {"ACT":[0.945,0.635,0.535,0.68],"DPC":[0.575,0.29,0.345,0.3],"PI05":[0.76,0.375,0.79,0.765],"GR00T":[0.975,0.595,0.64,0.54]},
  "08": {"ACT":[0.62,0.49,0.44,0.5],"DPC":[0.2,0.17,0.09,0.11],"PI05":[0.34,0.38,0.33,0.28],"GR00T":[0.78,0.42,0.78,0.77]},
  "09": {"ACT":[0.91,0.85,0.62,0.67],"DPC":[0.32,0.34,0.37,0.33],"PI05":[0.92,0.79,0.96,0.87],"GR00T":[0.76,0.83,0.81,0.83]}
};

/* Task-macro summaries: paper values and ACT evaluation results. */
const LSCR_MEAN = {"ACT": 34.9, "DPC": 18.3, "PI05": 44.7, "GR00T": 45.2};
const EFFICIENCY_MEAN = {"ACT": 0.967, "DPC": 0.865, "PI05": 0.96, "GR00T": 0.93};
const PAPER_SR_SUMMARY = {
  "ACT": [29.3,15.5,14.8,12.8,18.1],
  "DPC": [8.9,3,3.2,3.4,4.6],
  "PI05": [35.2,21.2,26.8,26.2,27.4],
  "GR00T": [38,16.3,24.3,20.8,24.9]
};


const LSCR_CHANNEL_MEAN = {"ACT": [40.03884615384615, 35.21961538461539, 36.26576923076923, 28.192692307692308], "DPC": [24.09846153846154, 16.948846153846155, 16.129615384615384, 16.194615384615386], "PI05": [51.6705128205, 37.358974359, 45.6064102564, 44.1358974359], "GR00T": [60.18730769230769, 35.45538461538462, 43.988846153846154, 41.06807692307692]};

// Historical tactile SR comparison; complete evaluation details are registered below.
const TACTILE_COMPARISON = {
  "policyId": "GR00T_TACTILE",
  "baselineId": "GR00T",
  "without": 24.9,
  "withTactile": 25.5,
  "delta": 0.6,
  tasks: [
    {"taskId":"03","without":32.5,"withTactile":31.5,"delta":-1.0},
    {"taskId":"06","without":31.5,"withTactile":33.0,"delta":1.5},
    {"taskId":"07","without":50.5,"withTactile":50.0,"delta":-0.5},
    {"taskId":"08","without":52.5,"withTactile":46.0,"delta":-6.5},
    {"taskId":"09","without":45.5,"withTactile":54.0,"delta":8.5},
    {"taskId":"12","without":27.5,"withTactile":31.5,"delta":4.0},
    {"taskId":"21","without":4.5,"withTactile":8.5,"delta":4.0},
    {"taskId":"22","without":58.0,"withTactile":68.0,"delta":10.0},
    {"taskId":"24","without":0.0,"withTactile":0.0,"delta":0.0},
    {"taskId":"26","without":7.5,"withTactile":9.5,"delta":2.0},
    {"taskId":"27","without":19.0,"withTactile":21.0,"delta":2.0},
    {"taskId":"32","without":15.0,"withTactile":17.5,"delta":2.5},
    {"taskId":"34","without":5.5,"withTactile":3.0,"delta":-2.5},
    {"taskId":"42","without":20.5,"withTactile":23.0,"delta":2.5},
    {"taskId":"43","without":2.0,"withTactile":2.0,"delta":0.0},
    {"taskId":"44","without":71.0,"withTactile":68.0,"delta":-3.0},
    {"taskId":"51","without":50.5,"withTactile":37.5,"delta":-13.0},
    {"taskId":"60","without":3.5,"withTactile":5.0,"delta":1.5},
    {"taskId":"61","without":22.5,"withTactile":24.0,"delta":1.5},
    {"taskId":"62","without":33.5,"withTactile":32.5,"delta":-1.0},
    {"taskId":"64","without":8.0,"withTactile":7.0,"delta":-1.0},
    {"taskId":"67","without":16.5,"withTactile":21.5,"delta":5.0},
    {"taskId":"73","without":5.0,"withTactile":2.0,"delta":-3.0},
    {"taskId":"76","without":0.5,"withTactile":1.5,"delta":1.0},
    {"taskId":"79","without":20.0,"withTactile":16.5,"delta":-3.5},
    {"taskId":"80","without":43.5,"withTactile":48.0,"delta":4.5}
  ]
};

/* Aggregate the raw matrix; nothing here is hand-typed from prose. */
function aggregate(policy, channel) {
  let sum = 0, n = 0;
  const ci = CHANNELS.indexOf(channel);
  for (const t of TASKS) {
    const r = RESULTS[t.id][policy];
    if (r && ci >= 0) { sum += r[ci]; n++; }
  }
  const total = n * ROLLOUTS_PER_CELL;      // 26 * 50 = 1300
  return { sum, total, sr: total ? sum / total : 0, mean: n ? sum / n : 0 };
}

const PROOF_STATS = [
  { n: "26",   label: "Long-Horizon Tasks",       sub: "task–embodiment settings",  tip: "26 task–embodiment settings spanning the 12 evaluated embodiments." },
  { n: "12",   label: "Bimanual Embodiments",      sub: "arm–hand morphologies",     tip: "12 arm–hand embodiments evaluated, spanning 5-finger and 4-finger morphologies." },
  { n: "1.3K", label: "Teleoperated Trajectories", sub: "human demonstrations",      tip: "≈1,300 human teleoperated demonstrations recorded through the Manus + ARKit pipeline." },
  { n: "8",    label: "Synchronized Modalities",   sub: "per frame, aligned",        tip: "RGB, depth, joint state, object state, shared visuo-tactile representation, 2D boxes, 3D boxes, occupancy grids." },
  { n: "7",    label: "Controlled Variation Factors", sub: "5 invariance + 2 equivariance", tip: "5 invariance factors (scene background, tabletop texture, lighting conditions, distractor objects, camera pose) + 2 equivariance factors (object pose, table height)." },
  { n: "20.8K",label:"Published Baseline Rollouts",  sub: "26 × 4 × 4 × 50",           tip: "26 task–embodiment settings × 4 published baseline policies × 4 channels × 50 rollouts = 20,800 rollouts." }
];

const MODALITIES = [
  { key:"rgb",       name:"RGB",            desc:"Multi-view RGB image streams." },
  { key:"depth",     name:"Depth",          desc:"Per-frame metric depth maps." },
  { key:"joint",     name:"Joint States",   desc:"Arm + hand proprioceptive qpos/qvel." },
  { key:"object",    name:"Object States",   desc:"Per-object 6-DoF pose and velocity." },
  { key:"tactile",   name:"Visuo-Tactile Representation", desc:"Unified surface-aligned tactile images defined on hand contact surfaces." },
  { key:"box2d",     name:"2D Boxes",       desc:"Projected object bounding boxes." },
  { key:"box3d",     name:"3D Boxes",       desc:"3D bounding boxes (center, size, orientation)." },
  { key:"occ",       name:"Occupancy Grid", desc:"Occupancy grid state and associated metadata." }
];

const GENERALIZATION_AXES = [
  { name:"Scene Background", group:"invariance", note:"Background context used for visual rendering only." },
  { name:"Tabletop Texture", group:"invariance", note:"Visual material of the support surface." },
  { name:"Lighting Conditions", group:"invariance", note:"Lighting embedded in the sampled scene." },
  { name:"Distractor Objects", group:"invariance", note:"Distractor objects on the tabletop." },
  { name:"Camera Pose",   group:"invariance", note:"World-mounted and wrist-mounted camera perturbations." },
  { name:"Object Pose",   group:"equivariance", note:"Task-relevant initial object poses within valid bounds." },
  { name:"Table Height",  group:"equivariance", note:"Vertical support-surface offset." }
];

const RESOURCE_CARDS = [
  { title:"Policy Usage",     body:"Environment setup, policy training, and evaluation guides.", href:"https://bench2dex.github.io/doc/#policy", meta:"Documentation", kind:"docs" },
  { title:"Task Description", body:"Descriptions of all 26 tasks, grouped by embodiment.", href:"https://bench2dex.github.io/doc/#tasks", meta:"Documentation", kind:"docs" }
];

// Register additional evaluations here. Percent metrics use 0–100; efficiency
// is a ratio. Keep reported macro summaries separate from rounded task values.
const EVALUATION_PROTOCOLS = [{
  id: "standard", label: "Reported Evaluations", taskIds: EMBODIMENTS.flatMap(e=>e.tasks),
  taskSetVersion: "paper-task-set", episodesPerChannel: 50,
  terminationVersion: "paper-stable-success", expertReferenceVersion: "paper-expert-reference",
  description: "26 task–embodiment settings · Reported evaluations · Episode counts and execution budgets vary by method"
}];
const EVALUATION_POLICIES = POLICIES.map((id,displayOrder)=>({
  id, label: POLICY_LABEL[id]+(id==="GR00T" ? " · w/o Tactile" : ""),
  variantLabel: id==="GR00T" ? "w/o Tactile" : "", family: id,
  inputs: ["PI05","GR00T"].includes(id) ? "Vision + Proprioception + Language" : "Vision + Proprioception",
  protocolId: "standard", displayOrder,
  modelVersion: POLICY_LABEL[id], resultVersion: "Paper Baselines",
  trainingSetting: ["ACT","DPC"].includes(id) ? "Trained from scratch" : "Fine-tuned from a pretrained checkpoint",
  sourceLabel: "Bench2Dex Paper", sourceUrl: "https://arxiv.org/abs/2609.15726"
})).concat({
  id: "GR00T_TACTILE", label: "GR00T N1.5 · w/ Tactile", variantLabel: "w/ Tactile",
  family: "GR00T", inputs: "Vision + Proprioception + Language + Tactile",
  protocolId: "standard", displayOrder: 4, comparisonPolicyId: "GR00T",
  modelVersion: "GR00T N1.5", resultVersion: "Paper Tactile Comparison",
  trainingSetting: "Fine-tuned from a pretrained checkpoint",
  sourceLabel: "Bench2Dex Paper", sourceUrl: "https://arxiv.org/abs/2609.15726"
});
const EVALUATION_CHANNELS = POLICIES.flatMap(policyId=>TASKS.flatMap(task=>
  CHANNELS.map((channelId,ci)=>({
    policyId, taskId: task.id, channelId, status: "reported",
    successes: RESULTS[task.id][policyId][ci], episodes: ROLLOUTS_PER_CELL,
    lscr: LSCR_CHANNELS[task.id][policyId][ci]===null ? null : LSCR_CHANNELS[task.id][policyId][ci]*100
  }))
)).concat(TASKS.flatMap(task=>CHANNELS.map(channelId=>({
  policyId: "GR00T_TACTILE", taskId: task.id, channelId, status: "reported",
  episodes: ROLLOUTS_PER_CELL, successes: null, lscr: null
}))));
const EVALUATION_TASKS = POLICIES.flatMap(policyId=>TASKS.map(task=>({
  policyId, taskId: task.id, status: "reported",
  sr: RESULTS[task.id][policyId].reduce((sum,v)=>sum+v,0)*100/(CHANNELS.length*ROLLOUTS_PER_CELL),
  lscr: LSCR[task.id][policyId], lscrScope: "four-channel-mean", lscrEpisodes: 200, efficiency: EFFICIENCY[task.id][policyId],
  efficiencyStatus: EFFICIENCY[task.id][policyId]===null ? "no-success" : "reported"
}))).concat(TACTILE_COMPARISON.tasks.map(task=>({
  policyId: "GR00T_TACTILE", taskId: task.taskId, status: "reported",
  sr: task.withTactile, srScope: "four-channel-mean", srEpisodes: 200,
  lscr: null, efficiency: null
})));
const EVALUATION_SUMMARIES = POLICIES.map(policyId=>({
  policyId, taskCount: TASKS.length, scope: "task-macro", status: "reported",
  sr: PAPER_SR_SUMMARY[policyId][4], lscr: LSCR_MEAN[policyId], efficiency: EFFICIENCY_MEAN[policyId],
  efficiencyTaskCount: TASKS.filter(t=>EFFICIENCY[t.id][policyId]!==null).length,
  channelSr: PAPER_SR_SUMMARY[policyId].slice(0,4),
  channelLscr: LSCR_CHANNEL_MEAN[policyId]
})).concat({
  policyId: "GR00T_TACTILE", taskCount: TASKS.length, scope: "task-macro", status: "reported",
  sr: TACTILE_COMPARISON.withTactile, lscr: null, efficiency: null,
  channelSr: CHANNELS.map(()=>null), channelLscr: CHANNELS.map(()=>null)
});

/* External publications: retain their own summaries and sample sizes.
 * Unknown channel breakdowns, episode counts and efficiency remain NR.
 * GPT-6-Astra reports Full SR only; never populate a four-channel mean.
 */
const EXTERNAL_TASK_RESULTS = [
  // taskId, Phoenix mean SR, Phoenix mean LSCR, GPT 1x successes, GPT 10x successes
  ["32",30.0,61.8,0,3], ["26",13.5,52.6,0,1], ["73",0.0,27.6,0,0],
  ["80",52.0,73.0,0,0], ["61",49.5,65.5,2,3], ["22",68.5,84.2,2,3],
  ["64",23.0,43.1,2,3], ["67",35.5,66.5,1,3], ["24",24.5,55.5,0,2],
  ["79",4.0,6.2,2,3], ["03",40.0,81.8,0,0], ["09",72.5,95.8,0,3],
  ["62",64.5,79.8,0,0], ["51",74.5,84.2,1,2], ["60",65.5,71.9,0,2],
  ["07",92.5,96.1,0,1], ["34",64.5,82.1,0,2], ["06",60.0,82.4,0,1],
  ["12",64.0,85.9,2,3], ["42",44.5,64.8,2,3], ["43",30.0,49.8,1,2],
  ["76",3.0,18.8,0,0], ["08",60.0,85.8,0,0], ["44",90.5,94.1,1,3],
  ["27",9.5,19.9,3,3], ["21",49.5,76.7,1,2]
];
EVALUATION_POLICIES.push({
  id: "PHOENIX_MWA", label: "Phoenix-MWA", variantLabel: "",
  family: "Phoenix", modelVersion: "Phoenix-MWA", protocolId: "standard", displayOrder: 5,
  inputs: "Vision + Proprioception + Language", externalReport: true,
  trainingSetting: "Pretrained model with task-specific post-training", resultVersion: "Phoenix project page, V.5",
  evaluationSetting: "26 tasks; four-channel means; episode counts and step budget not specified on the project page",
  sourceLabel: "Phoenix V.5", sourceUrl: "https://openphoenix-team.github.io/Phoenix-pages/", updatedAt: "2026-10-22"
}, ...[1,10].map((budget,i)=>({
  id: `GPT6_ASTRA_${budget}X`, label: `GPT-6-Astra · ${budget}× + ICL`, variantLabel: `${budget}× + ICL`,
  family: "GPT-6-Astra", modelVersion: "GPT-6-Astra", protocolId: "standard", displayOrder: 6+i,
  inputs: "Vision + Proprioception + Language + Kinematics + Camera Calibration", externalReport: true,
  trainingSetting: "Frozen model; ICL from released seen-split demonstrations", resultVersion: "arXiv:2610.22471v1, Table 7",
  episodesPerChannel: 3, stepBudgetMultiplier: budget,
  evaluationSetting: `Full randomization (inv_cov, unseen split); 3 episodes per task (78 total); ${budget}× official step limit; ICL`,
  sourceLabel: "SenseNova Table 7", sourceUrl: "https://arxiv.org/html/2610.22471v1#S9.SS5", updatedAt: "2026-10-22"
})));
for(const [taskId,sr,lscr,one,ten] of EXTERNAL_TASK_RESULTS){
  EVALUATION_TASKS.push({policyId:"PHOENIX_MWA",taskId,status:"reported",sr,lscr,
    srScope:"four-channel-mean",lscrScope:"four-channel-mean",efficiency:null});
  for(const [policyId,successes] of [["GPT6_ASTRA_1X",one],["GPT6_ASTRA_10X",ten]]){
    EVALUATION_TASKS.push({policyId,taskId,status:"not-reported",sr:null,lscr:null,efficiency:null});
    EVALUATION_CHANNELS.push(...CHANNELS.map(channelId=>({policyId,taskId,channelId,
      status:channelId==="full" ? "reported" : "not-reported",
      episodes:channelId==="full" ? 3 : null,successes:channelId==="full" ? successes : null,lscr:null})));
  }
  EVALUATION_CHANNELS.push(...CHANNELS.map(channelId=>({policyId:"PHOENIX_MWA",taskId,channelId,status:"not-reported",episodes:null,successes:null,lscr:null})));
}
EVALUATION_SUMMARIES.push({
  policyId:"PHOENIX_MWA",taskCount:26,scope:"task-macro",status:"reported",
  sr:45.6,srScope:"four-channel-mean",lscr:65.6,lscrScope:"four-channel-mean",efficiency:null,
  channelSr:[54.2,38.5,44.1,45.6],channelTaskCounts:[26,26,26,26]
}, ...[["GPT6_ASTRA_1X",25.6],["GPT6_ASTRA_10X",61.5]].map(([policyId,full])=>({
  policyId,taskCount:26,scope:"task-macro",status:"reported",sr:null,lscr:null,efficiency:null,
  channelSr:[null,null,null,full],channelTaskCounts:[0,0,0,26]
})));

/* GR00T evaluation records; no-success efficiency is not zero. */
const GR00T_EVALUATION_UPDATES = [{"policyId":"GR00T_N17","episodesPerChannel":50,"summaryNote":"LSCR and efficiency aggregates use reported rounded values. Efficiency excludes tasks without successful episodes.","summary":{"channelSr":[39.38461538461539,13.153846153846155,28.46153846153846,27.923076923076923],"channelLscr":[58.54615384615385,31.07423076923077,47.08,45.286153846153844],"sr":27.23076923076923,"lscr":45.496634615384615,"efficiency":0.940364},"tasks":[{"taskId":"03","channels":[{"id":"none","successes":12,"lscr":72.0,"efficiency":0.9966},{"id":"cov_only","successes":5,"lscr":50.67,"efficiency":1.0231},{"id":"inv_only","successes":21,"lscr":78.67,"efficiency":1.0223},{"id":"inv_cov","successes":24,"lscr":76.0,"efficiency":1.0062}],"sr":31.0,"lscr":69.3,"efficiency":1.0112},{"taskId":"06","channels":[{"id":"none","successes":40,"lscr":92.0,"efficiency":0.9197},{"id":"cov_only","successes":8,"lscr":51.5,"efficiency":0.9346},{"id":"inv_only","successes":21,"lscr":75.5,"efficiency":0.9265},{"id":"inv_cov","successes":20,"lscr":71.0,"efficiency":0.9247}],"sr":44.5,"lscr":72.5,"efficiency":0.9238},{"taskId":"07","channels":[{"id":"none","successes":44,"lscr":93.0,"efficiency":0.8518},{"id":"cov_only","successes":14,"lscr":55.50000000000001,"efficiency":0.837},{"id":"inv_only","successes":33,"lscr":80.5,"efficiency":0.8159},{"id":"inv_cov","successes":32,"lscr":75.0,"efficiency":0.8391}],"sr":61.5,"lscr":76.0,"efficiency":0.8372},{"taskId":"08","channels":[{"id":"none","successes":27,"lscr":69.0,"efficiency":1.1837},{"id":"cov_only","successes":8,"lscr":39.0,"efficiency":1.2006},{"id":"inv_only","successes":25,"lscr":66.0,"efficiency":1.1715},{"id":"inv_cov","successes":26,"lscr":70.0,"efficiency":1.1664}],"sr":43.0,"lscr":61.0,"efficiency":1.1765},{"taskId":"09","channels":[{"id":"none","successes":36,"lscr":90.0,"efficiency":0.8862},{"id":"cov_only","successes":14,"lscr":71.0,"efficiency":0.8804},{"id":"inv_only","successes":28,"lscr":88.0,"efficiency":0.887},{"id":"inv_cov","successes":20,"lscr":83.0,"efficiency":0.8752}],"sr":49.0,"lscr":83.0,"efficiency":0.8834},{"taskId":"12","channels":[{"id":"none","successes":22,"lscr":79.33,"efficiency":0.9535},{"id":"cov_only","successes":10,"lscr":42.0,"efficiency":0.9095},{"id":"inv_only","successes":22,"lscr":75.5,"efficiency":0.9092},{"id":"inv_cov","successes":21,"lscr":71.33,"efficiency":0.9243}],"sr":37.5,"lscr":67.0,"efficiency":0.9265},{"taskId":"21","channels":[{"id":"none","successes":19,"lscr":68.0,"efficiency":0.8977},{"id":"cov_only","successes":3,"lscr":24.0,"efficiency":0.9119},{"id":"inv_only","successes":9,"lscr":38.67,"efficiency":0.9022},{"id":"inv_cov","successes":11,"lscr":40.0,"efficiency":0.8707}],"sr":21.0,"lscr":42.7,"efficiency":0.8926},{"taskId":"22","channels":[{"id":"none","successes":41,"lscr":89.0,"efficiency":0.9295},{"id":"cov_only","successes":20,"lscr":56.00000000000001,"efficiency":0.9656},{"id":"inv_only","successes":31,"lscr":75.0,"efficiency":0.9504},{"id":"inv_cov","successes":36,"lscr":79.5,"efficiency":0.9679}],"sr":64.0,"lscr":74.9,"efficiency":0.951},{"taskId":"24","channels":[{"id":"none","successes":0,"lscr":3.5000000000000004,"efficiency":null},{"id":"cov_only","successes":0,"lscr":1.0,"efficiency":null},{"id":"inv_only","successes":0,"lscr":1.0,"efficiency":null},{"id":"inv_cov","successes":0,"lscr":1.5,"efficiency":null}],"sr":0.0,"lscr":1.8,"efficiency":null},{"taskId":"26","channels":[{"id":"none","successes":9,"lscr":48.0,"efficiency":0.9106},{"id":"cov_only","successes":1,"lscr":25.5,"efficiency":0.8315},{"id":"inv_only","successes":2,"lscr":26.5,"efficiency":0.9288},{"id":"inv_cov","successes":4,"lscr":22.5,"efficiency":0.9186}],"sr":8.0,"lscr":30.6,"efficiency":0.9099},{"taskId":"27","channels":[{"id":"none","successes":24,"lscr":62.5,"efficiency":0.9316},{"id":"cov_only","successes":5,"lscr":15.5,"efficiency":1.0478},{"id":"inv_only","successes":8,"lscr":37.5,"efficiency":0.9978},{"id":"inv_cov","successes":8,"lscr":32.0,"efficiency":0.9436}],"sr":22.5,"lscr":36.9,"efficiency":0.9584},{"taskId":"32","channels":[{"id":"none","successes":15,"lscr":39.5,"efficiency":0.9891},{"id":"cov_only","successes":9,"lscr":19.0,"efficiency":0.8768},{"id":"inv_only","successes":15,"lscr":33.5,"efficiency":0.9466},{"id":"inv_cov","successes":17,"lscr":36.5,"efficiency":0.9564}],"sr":28.0,"lscr":32.1,"efficiency":0.9498},{"taskId":"34","channels":[{"id":"none","successes":3,"lscr":45.2,"efficiency":0.9834},{"id":"cov_only","successes":1,"lscr":35.6,"efficiency":1.0661},{"id":"inv_only","successes":4,"lscr":48.4,"efficiency":0.9963},{"id":"inv_cov","successes":3,"lscr":45.6,"efficiency":1.0237}],"sr":5.5,"lscr":43.7,"efficiency":1.0066},{"taskId":"42","channels":[{"id":"none","successes":20,"lscr":67.33,"efficiency":0.9027},{"id":"cov_only","successes":6,"lscr":42.0,"efficiency":0.8678},{"id":"inv_only","successes":19,"lscr":70.67,"efficiency":0.9424},{"id":"inv_cov","successes":22,"lscr":74.67,"efficiency":0.8903}],"sr":33.5,"lscr":63.7,"efficiency":0.9068},{"taskId":"43","channels":[{"id":"none","successes":3,"lscr":25.0,"efficiency":0.8272},{"id":"cov_only","successes":0,"lscr":15.0,"efficiency":null},{"id":"inv_only","successes":0,"lscr":19.0,"efficiency":null},{"id":"inv_cov","successes":2,"lscr":25.0,"efficiency":0.9023}],"sr":2.5,"lscr":21.0,"efficiency":0.8572},{"taskId":"44","channels":[{"id":"none","successes":38,"lscr":84.0,"efficiency":0.9513},{"id":"cov_only","successes":15,"lscr":50.5,"efficiency":0.9614},{"id":"inv_only","successes":23,"lscr":65.0,"efficiency":0.9582},{"id":"inv_cov","successes":23,"lscr":63.5,"efficiency":0.9343}],"sr":49.5,"lscr":65.8,"efficiency":0.9505},{"taskId":"51","channels":[{"id":"none","successes":28,"lscr":71.33,"efficiency":0.9469},{"id":"cov_only","successes":13,"lscr":46.0,"efficiency":1.0439},{"id":"inv_only","successes":24,"lscr":62.67,"efficiency":1.0718},{"id":"inv_cov","successes":19,"lscr":57.99999999999999,"efficiency":1.0605}],"sr":42.0,"lscr":59.5,"efficiency":1.0233},{"taskId":"60","channels":[{"id":"none","successes":10,"lscr":27.0,"efficiency":0.9473},{"id":"cov_only","successes":2,"lscr":4.0,"efficiency":0.9228},{"id":"inv_only","successes":5,"lscr":13.0,"efficiency":0.9216},{"id":"inv_cov","successes":4,"lscr":9.0,"efficiency":0.9115}],"sr":10.5,"lscr":13.2,"efficiency":0.932},{"taskId":"61","channels":[{"id":"none","successes":22,"lscr":60.67,"efficiency":0.9671},{"id":"cov_only","successes":1,"lscr":20.0,"efficiency":0.7926},{"id":"inv_only","successes":11,"lscr":42.0,"efficiency":0.9557},{"id":"inv_cov","successes":12,"lscr":38.67,"efficiency":0.9831}],"sr":23.0,"lscr":40.3,"efficiency":0.9648},{"taskId":"62","channels":[{"id":"none","successes":27,"lscr":68.67,"efficiency":1.0005},{"id":"cov_only","successes":8,"lscr":39.33,"efficiency":0.9305},{"id":"inv_only","successes":26,"lscr":78.0,"efficiency":0.9541},{"id":"inv_cov","successes":19,"lscr":54.0,"efficiency":0.9418}],"sr":40.0,"lscr":60.0,"efficiency":0.9645},{"taskId":"64","channels":[{"id":"none","successes":12,"lscr":37.0,"efficiency":0.7616},{"id":"cov_only","successes":4,"lscr":11.0,"efficiency":0.8199},{"id":"inv_only","successes":6,"lscr":19.5,"efficiency":0.7511},{"id":"inv_cov","successes":4,"lscr":12.0,"efficiency":0.7494}],"sr":13.0,"lscr":19.9,"efficiency":0.7663},{"taskId":"67","channels":[{"id":"none","successes":13,"lscr":56.00000000000001,"efficiency":0.8993},{"id":"cov_only","successes":8,"lscr":31.0,"efficiency":0.9176},{"id":"inv_only","successes":15,"lscr":49.5,"efficiency":0.9308},{"id":"inv_cov","successes":9,"lscr":44.5,"efficiency":0.9123}],"sr":22.5,"lscr":45.3,"efficiency":0.9156},{"taskId":"73","channels":[{"id":"none","successes":0,"lscr":22.0,"efficiency":null},{"id":"cov_only","successes":0,"lscr":6.5,"efficiency":null},{"id":"inv_only","successes":1,"lscr":12.0,"efficiency":0.9002},{"id":"inv_cov","successes":0,"lscr":11.5,"efficiency":null}],"sr":0.5,"lscr":13.0,"efficiency":0.9002},{"taskId":"76","channels":[{"id":"none","successes":5,"lscr":39.5,"efficiency":0.9545},{"id":"cov_only","successes":2,"lscr":15.0,"efficiency":0.976},{"id":"inv_only","successes":0,"lscr":14.000000000000002,"efficiency":null},{"id":"inv_cov","successes":1,"lscr":15.0,"efficiency":1.0614}],"sr":4.0,"lscr":20.9,"efficiency":0.9732},{"taskId":"79","channels":[{"id":"none","successes":19,"lscr":54.0,"efficiency":0.8987},{"id":"cov_only","successes":3,"lscr":12.0,"efficiency":1.0549},{"id":"inv_only","successes":4,"lscr":14.000000000000002,"efficiency":0.8227},{"id":"inv_cov","successes":7,"lscr":21.0,"efficiency":0.8852}],"sr":16.5,"lscr":25.2,"efficiency":0.9008},{"taskId":"80","channels":[{"id":"none","successes":23,"lscr":58.67,"efficiency":1.0069},{"id":"cov_only","successes":11,"lscr":29.330000000000002,"efficiency":0.9812},{"id":"inv_only","successes":17,"lscr":40.0,"efficiency":1.0272},{"id":"inv_cov","successes":19,"lscr":46.67,"efficiency":1.0776}],"sr":35.0,"lscr":43.7,"efficiency":1.027}]},{"policyId":"GR00T_TACTILE","episodesPerChannel":50,"summaryNote":"Task efficiency pools successful episodes across channels. Tasks without success are excluded from mean efficiency.","summary":{"sr":25.5,"lscr":46.5,"efficiency":0.946104228109,"efficiencyTaskCount":25,"channelSr":[38.5,17.2,23.3,22.8],"channelLscr":[60.0,36.6,44.6,44.8]},"tasks":[{"taskId":"32","channels":[{"id":"none","successes":18,"lscr":54.5},{"id":"cov_only","successes":11,"lscr":30.0},{"id":"inv_only","successes":3,"lscr":36.0},{"id":"inv_cov","successes":3,"lscr":32.0}],"sr":17.5,"lscr":38.1,"efficiency":0.95244563},{"taskId":"26","channels":[{"id":"none","successes":14,"lscr":62.5},{"id":"cov_only","successes":4,"lscr":27.0},{"id":"inv_only","successes":1,"lscr":30.5},{"id":"inv_cov","successes":0,"lscr":30.5}],"sr":9.5,"lscr":37.6,"efficiency":0.910311065},{"taskId":"73","channels":[{"id":"none","successes":4,"lscr":67.0},{"id":"cov_only","successes":0,"lscr":17.5},{"id":"inv_only","successes":0,"lscr":18.5},{"id":"inv_cov","successes":0,"lscr":17.5}],"sr":2.0,"lscr":30.1,"efficiency":0.898851426},{"taskId":"80","channels":[{"id":"none","successes":31,"lscr":71.3},{"id":"cov_only","successes":11,"lscr":40.7},{"id":"inv_only","successes":28,"lscr":67.3},{"id":"inv_cov","successes":26,"lscr":70.7}],"sr":48.0,"lscr":62.5,"efficiency":1.009629465},{"taskId":"61","channels":[{"id":"none","successes":25,"lscr":66.0},{"id":"cov_only","successes":5,"lscr":27.3},{"id":"inv_only","successes":6,"lscr":28.7},{"id":"inv_cov","successes":12,"lscr":34.0}],"sr":24.0,"lscr":39.0,"efficiency":0.967932646},{"taskId":"22","channels":[{"id":"none","successes":38,"lscr":88.5},{"id":"cov_only","successes":26,"lscr":66.5},{"id":"inv_only","successes":34,"lscr":79.5},{"id":"inv_cov","successes":38,"lscr":84.5}],"sr":68.0,"lscr":79.8,"efficiency":0.97078152},{"taskId":"64","channels":[{"id":"none","successes":6,"lscr":42.0},{"id":"cov_only","successes":2,"lscr":13.5},{"id":"inv_only","successes":3,"lscr":18.0},{"id":"inv_cov","successes":3,"lscr":17.5}],"sr":7.0,"lscr":22.8,"efficiency":0.772899099},{"taskId":"67","channels":[{"id":"none","successes":11,"lscr":38.5},{"id":"cov_only","successes":5,"lscr":32.5},{"id":"inv_only","successes":13,"lscr":54.5},{"id":"inv_cov","successes":14,"lscr":52.5}],"sr":21.5,"lscr":44.5,"efficiency":0.938369421},{"taskId":"24","channels":[{"id":"none","successes":0,"lscr":2.5},{"id":"cov_only","successes":0,"lscr":1.0},{"id":"inv_only","successes":0,"lscr":1.5},{"id":"inv_cov","successes":0,"lscr":0.5}],"sr":0.0,"lscr":1.4,"efficiency":null},{"taskId":"79","channels":[{"id":"none","successes":20,"lscr":55.0},{"id":"cov_only","successes":3,"lscr":14.0},{"id":"inv_only","successes":4,"lscr":17.0},{"id":"inv_cov","successes":6,"lscr":26.0}],"sr":16.5,"lscr":28.0,"efficiency":0.890513552},{"taskId":"03","channels":[{"id":"none","successes":18,"lscr":78.7},{"id":"cov_only","successes":13,"lscr":61.3},{"id":"inv_only","successes":16,"lscr":68.0},{"id":"inv_cov","successes":16,"lscr":70.0}],"sr":31.5,"lscr":69.5,"efficiency":0.990871297},{"taskId":"09","channels":[{"id":"none","successes":35,"lscr":90.0},{"id":"cov_only","successes":26,"lscr":90.0},{"id":"inv_only","successes":28,"lscr":84.0},{"id":"inv_cov","successes":19,"lscr":84.0}],"sr":54.0,"lscr":87.0,"efficiency":0.905546443},{"taskId":"62","channels":[{"id":"none","successes":28,"lscr":74.0},{"id":"cov_only","successes":16,"lscr":57.3},{"id":"inv_only","successes":9,"lscr":52.7},{"id":"inv_cov","successes":12,"lscr":59.3}],"sr":32.5,"lscr":60.8,"efficiency":0.95810637},{"taskId":"51","channels":[{"id":"none","successes":22,"lscr":60.0},{"id":"cov_only","successes":18,"lscr":58.0},{"id":"inv_only","successes":13,"lscr":56.0},{"id":"inv_cov","successes":22,"lscr":68.7}],"sr":37.5,"lscr":60.7,"efficiency":1.002875629},{"taskId":"60","channels":[{"id":"none","successes":7,"lscr":17.0},{"id":"cov_only","successes":0,"lscr":1.5},{"id":"inv_only","successes":2,"lscr":4.5},{"id":"inv_cov","successes":1,"lscr":2.5}],"sr":5.0,"lscr":6.4,"efficiency":0.961194607},{"taskId":"07","channels":[{"id":"none","successes":40,"lscr":96.0},{"id":"cov_only","successes":18,"lscr":65.5},{"id":"inv_only","successes":20,"lscr":72.0},{"id":"inv_cov","successes":22,"lscr":65.5}],"sr":50.0,"lscr":74.8,"efficiency":0.841782648},{"taskId":"34","channels":[{"id":"none","successes":1,"lscr":46.4},{"id":"cov_only","successes":1,"lscr":39.2},{"id":"inv_only","successes":3,"lscr":47.2},{"id":"inv_cov","successes":1,"lscr":47.6}],"sr":3.0,"lscr":45.1,"efficiency":1.020070838},{"taskId":"06","channels":[{"id":"none","successes":38,"lscr":92.0},{"id":"cov_only","successes":4,"lscr":51.0},{"id":"inv_only","successes":15,"lscr":73.0},{"id":"inv_cov","successes":9,"lscr":61.0}],"sr":33.0,"lscr":69.3,"efficiency":0.927139236},{"taskId":"12","channels":[{"id":"none","successes":23,"lscr":79.5},{"id":"cov_only","successes":7,"lscr":36.0},{"id":"inv_only","successes":16,"lscr":64.0},{"id":"inv_cov","successes":17,"lscr":63.5}],"sr":31.5,"lscr":60.8,"efficiency":0.909485711},{"taskId":"42","channels":[{"id":"none","successes":15,"lscr":60.0},{"id":"cov_only","successes":8,"lscr":43.3},{"id":"inv_only","successes":13,"lscr":66.0},{"id":"inv_cov","successes":10,"lscr":62.7}],"sr":23.0,"lscr":58.0,"efficiency":0.870037941},{"taskId":"43","channels":[{"id":"none","successes":2,"lscr":30.5},{"id":"cov_only","successes":2,"lscr":25.0},{"id":"inv_only","successes":0,"lscr":13.0},{"id":"inv_cov","successes":0,"lscr":15.0}],"sr":2.0,"lscr":20.9,"efficiency":0.886239123},{"taskId":"76","channels":[{"id":"none","successes":3,"lscr":25.0},{"id":"cov_only","successes":0,"lscr":5.0},{"id":"inv_only","successes":0,"lscr":5.5},{"id":"inv_cov","successes":0,"lscr":3.0}],"sr":1.5,"lscr":9.6,"efficiency":1.018244406},{"taskId":"08","channels":[{"id":"none","successes":23,"lscr":65.0},{"id":"cov_only","successes":10,"lscr":43.0},{"id":"inv_only","successes":29,"lscr":77.0},{"id":"inv_cov","successes":30,"lscr":81.0}],"sr":46.0,"lscr":66.5,"efficiency":1.237243803},{"taskId":"44","channels":[{"id":"none","successes":44,"lscr":92.0},{"id":"cov_only","successes":27,"lscr":67.5},{"id":"inv_only","successes":35,"lscr":78.0},{"id":"inv_cov","successes":30,"lscr":75.5}],"sr":68.0,"lscr":78.3,"efficiency":0.994393889},{"taskId":"27","channels":[{"id":"none","successes":23,"lscr":57.0},{"id":"cov_only","successes":4,"lscr":21.5},{"id":"inv_only","successes":10,"lscr":34.5},{"id":"inv_cov","successes":5,"lscr":33.5}],"sr":21.0,"lscr":36.6,"efficiency":0.921162973},{"taskId":"21","channels":[{"id":"none","successes":12,"lscr":48.7},{"id":"cov_only","successes":3,"lscr":16.0},{"id":"inv_only","successes":2,"lscr":13.3},{"id":"inv_cov","successes":0,"lscr":5.3}],"sr":8.5,"lscr":20.8,"efficiency":0.896476965}]}];
GR00T_EVALUATION_UPDATES.push({"policyId":"GR00T_N17_TACTILE","updatedAt":"2026-10-27","episodesPerChannel":50,"summaryNote":"LSCR aggregates use reported rounded channel values. Task efficiency pools successful episodes across channels; overall efficiency averages tasks with success.","summary":{"channelSr":[44.23076923076923,14.538461538461538,30.692307692307693,29.153846153846153],"channelLscr":[64.21846153846154,32.268076923076926,49.91538461538462,47.05923076923077],"sr":29.653846153846153,"lscr":48.36528846153846,"efficiency":0.9496384615384615,"efficiencyTaskCount":26},"tasks":[{"taskId":"03","channels":[{"id":"none","successes":11,"lscr":68.0,"efficiency":0.9503},{"id":"cov_only","successes":3,"lscr":47.33,"efficiency":1.0118},{"id":"inv_only","successes":25,"lscr":84.67,"efficiency":1.0388},{"id":"inv_cov","successes":20,"lscr":77.33,"efficiency":1.024}],"sr":29.5,"lscr":69.3,"efficiency":1.0159},{"taskId":"06","channels":[{"id":"none","successes":42,"lscr":94.5,"efficiency":0.9135},{"id":"cov_only","successes":5,"lscr":48.5,"efficiency":0.8771},{"id":"inv_only","successes":26,"lscr":79.5,"efficiency":0.9119},{"id":"inv_cov","successes":23,"lscr":72.0,"efficiency":0.8984}],"sr":48.0,"lscr":73.6,"efficiency":0.9076},{"taskId":"07","channels":[{"id":"none","successes":40,"lscr":92.0,"efficiency":0.8421},{"id":"cov_only","successes":18,"lscr":53.0,"efficiency":0.8108},{"id":"inv_only","successes":30,"lscr":82.0,"efficiency":0.8261},{"id":"inv_cov","successes":35,"lscr":81.5,"efficiency":0.8324}],"sr":61.5,"lscr":77.1,"efficiency":0.8309},{"taskId":"08","channels":[{"id":"none","successes":41,"lscr":93.0,"efficiency":1.2205},{"id":"cov_only","successes":14,"lscr":52.0,"efficiency":1.2816},{"id":"inv_only","successes":29,"lscr":75.0,"efficiency":1.222},{"id":"inv_cov","successes":34,"lscr":77.0,"efficiency":1.2099}],"sr":59.0,"lscr":74.2,"efficiency":1.2251},{"taskId":"09","channels":[{"id":"none","successes":37,"lscr":87.0,"efficiency":0.8887},{"id":"cov_only","successes":14,"lscr":66.0,"efficiency":0.9299},{"id":"inv_only","successes":31,"lscr":90.0,"efficiency":0.8798},{"id":"inv_cov","successes":23,"lscr":83.0,"efficiency":0.8678}],"sr":52.5,"lscr":81.5,"efficiency":0.887},{"taskId":"12","channels":[{"id":"none","successes":24,"lscr":67.0,"efficiency":0.9899},{"id":"cov_only","successes":8,"lscr":36.5,"efficiency":0.89},{"id":"inv_only","successes":32,"lscr":82.5,"efficiency":0.9621},{"id":"inv_cov","successes":24,"lscr":70.5,"efficiency":0.9679}],"sr":44.0,"lscr":64.1,"efficiency":0.9647},{"taskId":"21","channels":[{"id":"none","successes":21,"lscr":75.33,"efficiency":0.9001},{"id":"cov_only","successes":7,"lscr":28.67,"efficiency":0.8981},{"id":"inv_only","successes":8,"lscr":41.33,"efficiency":0.9134},{"id":"inv_cov","successes":14,"lscr":42.67,"efficiency":0.8819}],"sr":25.0,"lscr":47.0,"efficiency":0.8968},{"taskId":"22","channels":[{"id":"none","successes":34,"lscr":74.0,"efficiency":0.9586},{"id":"cov_only","successes":10,"lscr":33.5,"efficiency":0.9147},{"id":"inv_only","successes":22,"lscr":58.0,"efficiency":0.9545},{"id":"inv_cov","successes":31,"lscr":69.5,"efficiency":0.9504}],"sr":48.5,"lscr":58.7,"efficiency":0.9505},{"taskId":"24","channels":[{"id":"none","successes":9,"lscr":39.5,"efficiency":0.9782},{"id":"cov_only","successes":1,"lscr":13.5,"efficiency":1.0757},{"id":"inv_only","successes":5,"lscr":23.5,"efficiency":0.9529},{"id":"inv_cov","successes":2,"lscr":22.0,"efficiency":0.9865}],"sr":8.5,"lscr":24.6,"efficiency":0.9775},{"taskId":"26","channels":[{"id":"none","successes":12,"lscr":58.0,"efficiency":0.9016},{"id":"cov_only","successes":1,"lscr":28.0,"efficiency":0.8375},{"id":"inv_only","successes":4,"lscr":26.0,"efficiency":0.9462},{"id":"inv_cov","successes":7,"lscr":27.5,"efficiency":0.9138}],"sr":12.0,"lscr":34.9,"efficiency":0.9099},{"taskId":"27","channels":[{"id":"none","successes":29,"lscr":69.0,"efficiency":0.9654},{"id":"cov_only","successes":5,"lscr":15.5,"efficiency":1.0074},{"id":"inv_only","successes":12,"lscr":38.0,"efficiency":1.0201},{"id":"inv_cov","successes":12,"lscr":44.5,"efficiency":0.9801}],"sr":29.0,"lscr":41.8,"efficiency":0.9834},{"taskId":"32","channels":[{"id":"none","successes":11,"lscr":30.0,"efficiency":0.9899},{"id":"cov_only","successes":5,"lscr":13.5,"efficiency":0.9113},{"id":"inv_only","successes":16,"lscr":38.5,"efficiency":0.963},{"id":"inv_cov","successes":8,"lscr":25.5,"efficiency":0.9388}],"sr":20.0,"lscr":26.9,"efficiency":0.9591},{"taskId":"34","channels":[{"id":"none","successes":8,"lscr":59.2,"efficiency":0.9806},{"id":"cov_only","successes":8,"lscr":48.8,"efficiency":1.0152},{"id":"inv_only","successes":11,"lscr":58.8,"efficiency":1.0305},{"id":"inv_cov","successes":6,"lscr":53.2,"efficiency":1.0141}],"sr":16.5,"lscr":55.0,"efficiency":1.0117},{"taskId":"42","channels":[{"id":"none","successes":28,"lscr":81.33,"efficiency":0.9249},{"id":"cov_only","successes":12,"lscr":48.0,"efficiency":0.9118},{"id":"inv_only","successes":14,"lscr":80.67,"efficiency":0.9087},{"id":"inv_cov","successes":22,"lscr":81.33,"efficiency":0.8726}],"sr":38.0,"lscr":72.8,"efficiency":0.9047},{"taskId":"43","channels":[{"id":"none","successes":3,"lscr":28.5,"efficiency":0.9454},{"id":"cov_only","successes":0,"lscr":17.0,"efficiency":null},{"id":"inv_only","successes":1,"lscr":23.0,"efficiency":0.9389},{"id":"inv_cov","successes":0,"lscr":18.5,"efficiency":null}],"sr":2.0,"lscr":21.7,"efficiency":0.9438},{"taskId":"44","channels":[{"id":"none","successes":35,"lscr":82.5,"efficiency":0.9996},{"id":"cov_only","successes":17,"lscr":52.5,"efficiency":0.9853},{"id":"inv_only","successes":27,"lscr":68.0,"efficiency":0.9958},{"id":"inv_cov","successes":24,"lscr":64.0,"efficiency":1.0041}],"sr":51.5,"lscr":66.8,"efficiency":0.9973},{"taskId":"51","channels":[{"id":"none","successes":30,"lscr":73.33,"efficiency":0.9096},{"id":"cov_only","successes":14,"lscr":50.0,"efficiency":1.0322},{"id":"inv_only","successes":24,"lscr":62.67,"efficiency":1.0799},{"id":"inv_cov","successes":27,"lscr":60.0,"efficiency":1.0687}],"sr":47.5,"lscr":61.5,"efficiency":1.0159},{"taskId":"60","channels":[{"id":"none","successes":24,"lscr":59.0,"efficiency":0.9455},{"id":"cov_only","successes":3,"lscr":8.0,"efficiency":0.9388},{"id":"inv_only","successes":5,"lscr":12.5,"efficiency":0.9421},{"id":"inv_cov","successes":9,"lscr":19.0,"efficiency":0.9345}],"sr":20.5,"lscr":24.6,"efficiency":0.9422},{"taskId":"61","channels":[{"id":"none","successes":16,"lscr":51.33,"efficiency":0.9565},{"id":"cov_only","successes":1,"lscr":13.33,"efficiency":0.9981},{"id":"inv_only","successes":13,"lscr":42.0,"efficiency":0.9763},{"id":"inv_cov","successes":11,"lscr":42.67,"efficiency":0.9631}],"sr":20.5,"lscr":37.3,"efficiency":0.9656},{"taskId":"62","channels":[{"id":"none","successes":29,"lscr":73.33,"efficiency":0.9547},{"id":"cov_only","successes":10,"lscr":40.67,"efficiency":0.9419},{"id":"inv_only","successes":22,"lscr":63.33,"efficiency":0.9593},{"id":"inv_cov","successes":20,"lscr":60.67,"efficiency":0.9302}],"sr":40.5,"lscr":59.5,"efficiency":0.9483},{"taskId":"64","channels":[{"id":"none","successes":19,"lscr":57.0,"efficiency":0.7507},{"id":"cov_only","successes":0,"lscr":11.5,"efficiency":null},{"id":"inv_only","successes":3,"lscr":12.0,"efficiency":0.7281},{"id":"inv_cov","successes":1,"lscr":9.0,"efficiency":0.7223}],"sr":11.5,"lscr":22.4,"efficiency":0.7465},{"taskId":"67","channels":[{"id":"none","successes":9,"lscr":37.0,"efficiency":0.9145},{"id":"cov_only","successes":10,"lscr":29.0,"efficiency":0.9469},{"id":"inv_only","successes":13,"lscr":47.0,"efficiency":0.9815},{"id":"inv_cov","successes":8,"lscr":38.5,"efficiency":0.9836}],"sr":20.0,"lscr":37.9,"efficiency":0.9582},{"taskId":"73","channels":[{"id":"none","successes":3,"lscr":59.0,"efficiency":0.8712},{"id":"cov_only","successes":1,"lscr":15.0,"efficiency":0.9186},{"id":"inv_only","successes":0,"lscr":23.5,"efficiency":null},{"id":"inv_cov","successes":0,"lscr":10.5,"efficiency":null}],"sr":2.0,"lscr":27.0,"efficiency":0.883},{"taskId":"76","channels":[{"id":"none","successes":3,"lscr":26.5,"efficiency":0.8793},{"id":"cov_only","successes":0,"lscr":9.5,"efficiency":null},{"id":"inv_only","successes":0,"lscr":21.0,"efficiency":null},{"id":"inv_cov","successes":0,"lscr":19.5,"efficiency":null}],"sr":1.5,"lscr":19.1,"efficiency":0.8793},{"taskId":"79","channels":[{"id":"none","successes":34,"lscr":79.0,"efficiency":0.968},{"id":"cov_only","successes":5,"lscr":19.0,"efficiency":0.949},{"id":"inv_only","successes":6,"lscr":17.0,"efficiency":0.9134},{"id":"inv_cov","successes":1,"lscr":9.0,"efficiency":1.0241}],"sr":23.0,"lscr":31.0,"efficiency":0.9601},{"taskId":"80","channels":[{"id":"none","successes":23,"lscr":55.33,"efficiency":1.0218},{"id":"cov_only","successes":17,"lscr":40.67,"efficiency":0.9967},{"id":"inv_only","successes":20,"lscr":47.33,"efficiency":1.0264},{"id":"inv_cov","successes":17,"lscr":44.67,"efficiency":1.0587}],"sr":38.5,"lscr":47.0,"efficiency":1.0256}]});
EVALUATION_POLICIES.push({
  id:"GR00T_N17",label:"GR00T N1.7 · w/o Tactile",variantLabel:"w/o Tactile",family:"GR00T",modelVersion:"GR00T N1.7",
  inputs:"Vision + Proprioception + Language",protocolId:"standard",displayOrder:8,
  trainingSetting:"Not reported",resultVersion:"GR00T N1.7 evaluation"
},{
  id:"GR00T_N17_TACTILE",label:"GR00T N1.7 · w/ Tactile",variantLabel:"w/ Tactile",family:"GR00T",modelVersion:"GR00T N1.7",
  inputs:"Vision + Proprioception + Language + Tactile",protocolId:"standard",displayOrder:9,comparisonPolicyId:"GR00T_N17",
  trainingSetting:"Not reported",resultVersion:"GR00T N1.7 tactile evaluation"
});
for(const update of GR00T_EVALUATION_UPDATES){
  const policy=EVALUATION_POLICIES.find(p=>p.id===update.policyId);
  Object.assign(policy,{sourceLabel:"Evaluation details",sourceUrl:"https://bench2dex.github.io/Bench2Dex-Leaderboard/assets/data/gr00t-evaluations.json",
    resultDetailsUrl:"https://bench2dex.github.io/Bench2Dex-Leaderboard/assets/data/gr00t-evaluations.json",updatedAt:update.updatedAt||"2026-10-22",
    evaluationSetting:"26 tasks; 50 episodes per channel; four channels; pooled successful-episode task efficiency"});
  if(update.policyId==="GR00T_TACTILE") policy.resultVersion="GR00T N1.5 tactile step16 evaluation";
  for(const t of update.tasks){
    for(const c of t.channels){
      const channelId={none:"none",cov_only:"equi",inv_only:"inv",inv_cov:"full"}[c.id];
      const r={policyId:policy.id,taskId:t.taskId,channelId,status:"reported",episodes:50,successes:c.successes,lscr:c.lscr};
      const existing=EVALUATION_CHANNELS.find(x=>x.policyId===policy.id && x.taskId===t.taskId && x.channelId===channelId);
      if(existing) Object.assign(existing,r);else EVALUATION_CHANNELS.push(r);
    }
    const r={policyId:policy.id,taskId:t.taskId,status:"reported",sr:t.sr,srScope:"four-channel-mean",srEpisodes:200,
      lscr:t.lscr,lscrScope:"four-channel-mean",lscrEpisodes:200,efficiency:t.efficiency,
      efficiencyStatus:t.efficiency===null ? "no-success" : "reported"};
    const existing=EVALUATION_TASKS.find(x=>x.policyId===policy.id && x.taskId===t.taskId);
    if(existing) Object.assign(existing,r);else EVALUATION_TASKS.push(r);
  }
  const r={policyId:policy.id,taskCount:26,scope:"task-macro",status:"reported",...update.summary,
    efficiencyTaskCount:update.tasks.filter(t=>t.efficiency!==null).length};
  const existing=EVALUATION_SUMMARIES.find(x=>x.policyId===policy.id);
  if(existing) Object.assign(existing,r);else EVALUATION_SUMMARIES.push(r);
}
const POLICY_METADATA = {
  ACT:{type:"IL",modelUrl:"https://tonyzhaozh.github.io/aloha/",logoPath:"assets/img/models/act.png",logoAlt:"Stanford (ACT project)"},
  DPC:{type:"IL",modelUrl:"https://diffusion-policy.cs.columbia.edu/",logoPath:"assets/img/models/diffusion-policy.svg",logoAlt:"Columbia Engineering (Diffusion Policy project)"},
  PI05:{type:"VLA",modelUrl:"https://www.pi.website/blog/pi05",logoPath:"assets/img/models/pi.png",logoAlt:"Physical Intelligence"},
  GR00T:{type:"VLA",modelUrl:"https://research.nvidia.com/labs/gear/gr00t-n1_5/",logoPath:"assets/img/models/nvidia.png",logoAlt:"NVIDIA"},
  GR00T_TACTILE:{type:"VLA",modelUrl:"https://research.nvidia.com/labs/gear/gr00t-n1_5/",logoPath:"assets/img/models/nvidia.png",logoAlt:"NVIDIA"},
  GR00T_N17:{type:"VLA",modelUrl:"https://huggingface.co/nvidia/GR00T-N1.7-3B",logoPath:"assets/img/models/nvidia.png",logoAlt:"NVIDIA"},
  GR00T_N17_TACTILE:{type:"VLA",modelUrl:"https://huggingface.co/nvidia/GR00T-N1.7-3B",logoPath:"assets/img/models/nvidia.png",logoAlt:"NVIDIA"},
  PHOENIX_MWA:{type:"WAM",modelUrl:"https://openphoenix-team.github.io/Phoenix-pages/",logoPath:"assets/img/models/phoenix.webp",logoAlt:"OpenPhoenix Team",contributor:"Anyverse",contributorUrl:"https://anyverse.com/"}
};
for(const p of EVALUATION_POLICIES){
  const metadata=p.family==="GPT-6-Astra" ? {type:"Agent",modelUrl:"https://openai.com/index/gpt-6-astra/",logoPath:"assets/img/models/openai.svg",logoAlt:"OpenAI",
    contributor:"SenseNova",contributorUrl:"https://www.sensenova.ai/has-gpt-6-astra-achieved-embodied-intelligence"} : POLICY_METADATA[p.id];
  Object.assign(p,{contributor:"Bench2Dex Team",contributorUrl:"https://bench2dex.github.io/"},metadata);
}

window.BENCH = {
  EVALUATION_PROTOCOLS, EVALUATION_POLICIES, EVALUATION_CHANNELS, EVALUATION_TASKS, EVALUATION_SUMMARIES,
  ROLLOUTS_PER_CELL, TASK_EMB_SETTINGS, POLICIES, POLICY_LABEL,
  CHANNELS, CHANNEL_LABEL, CHANNEL_COLOR, EMBODIMENTS, TASKS, RESULTS, LSCR, LSCR_CHANNELS, LSCR_CHANNEL_MEAN, LSCR_MEAN, EFFICIENCY, EFFICIENCY_MEAN, PAPER_SR_SUMMARY, aggregate,
  PROOF_STATS, MODALITIES, GENERALIZATION_AXES, RESOURCE_CARDS, TACTILE_COMPARISON
};
