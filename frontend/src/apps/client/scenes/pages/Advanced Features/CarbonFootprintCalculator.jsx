import { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  LinearProgress, Divider, Chip, Button, Slider, Tooltip, TextField,
  IconButton, Tab, Tabs, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemIcon, ListItemText,
} from "@mui/material";
import { tokens } from "../../../theme";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Co2Icon from "@mui/icons-material/Co2";
import ForestIcon from "@mui/icons-material/Forest";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import VerifiedIcon from "@mui/icons-material/Verified";
import NatureIcon from "@mui/icons-material/Nature";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FlagIcon from "@mui/icons-material/Flag";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import SpeedIcon from "@mui/icons-material/Speed";
import PeopleIcon from "@mui/icons-material/People";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import ParkIcon from "@mui/icons-material/Park";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
const CARBON_FACTOR = 0.298; // kg CO2 per m3 pumped water
const TREE_ABSORPTION = 21;  // kg CO2 per tree per year

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const authHeaders = () => {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// ── Mock offset projects ──────────────────────────────────────────────────────
const OFFSET_PROJECTS = [
  { id: 1, name: "Karura Forest Reforestation", location: "Nairobi, Kenya", standard: "Gold Standard",
    description: "Community-led tree planting restoring 500 hectares of indigenous forest near Nairobi.",
    price_per_tonne: 12, available_credits: 4800 },
  { id: 2, name: "Village Solar Pump Upgrade", location: "Rift Valley, Kenya", standard: "Verra VCS",
    description: "Replacing diesel pumps with solar-powered systems across 12 rural water schemes.",
    price_per_tonne: 9, available_credits: 2200 },
  { id: 3, name: "Mangrove Restoration Project", location: "Mombasa Coast, Kenya", standard: "Gold Standard",
    description: "Restoring coastal mangroves that sequester carbon and protect shorelines.",
    price_per_tonne: 15, available_credits: 1500 },
];

// ── Reduction tips ────────────────────────────────────────────────────────────
const REDUCTION_TIPS = [
  { title: "Fix Leaking Taps", description: "A dripping tap wastes up to 15 litres/day. Fixing it saves ~1.6 kg CO2/month.",
    saving: "1.6 kg CO2/mo", impact: "high", icon: <WaterDropIcon fontSize="small" /> },
  { title: "Collect Rainwater", description: "Use a 200L tank to harvest rainwater for garden use, reducing pump demand.",
    saving: "3.2 kg CO2/mo", impact: "high", icon: <NatureIcon fontSize="small" /> },
  { title: "Off-Peak Usage", description: "Run high-consumption activities at night when grid carbon intensity is lower.",
    saving: "0.8 kg CO2/mo", impact: "medium", icon: <ElectricBoltIcon fontSize="small" /> },
  { title: "Efficient Appliances", description: "Switch to water-efficient showerheads and taps to cut usage by 30%.",
    saving: "2.1 kg CO2/mo", impact: "high", icon: <SolarPowerIcon fontSize="small" /> },
  { title: "Reuse Greywater", description: "Reuse kitchen and laundry water for flushing toilets or watering plants.",
    saving: "1.4 kg CO2/mo", impact: "medium", icon: <LocalFloristIcon fontSize="small" /> },
  { title: "Monitor Monthly Usage", description: "Households that track usage reduce consumption by an average of 12%.",
    saving: "1.0 kg CO2/mo", impact: "medium", icon: <AssessmentIcon fontSize="small" /> },
];

// ── Peer benchmark data ───────────────────────────────────────────────────────
const BENCHMARK_DATA = [
  { category: "Top 10%", value: 3.2, color: "#4cceac" },
  { category: "Top 25%", value: 6.8, color: "#70d8bd" },
  { category: "Average", value: 12.4, color: "#f0c040" },
  { category: "You", value: 0, color: "#868dfb" },
  { category: "Bottom 25%", value: 22.1, color: "#e2726e" },
];

// ── Speedometer gauge ─────────────────────────────────────────────────────────
const Speedometer = ({ value, max, label, color }) => {
  const pct = Math.min((value / max) * 100, 100);
  const angle = -135 + (pct / 100) * 270;
  const r = 70, cx = 90, cy = 90;
  const toRad = (d) => (d * Math.PI) / 180;
  const nx = cx + r * Math.cos(toRad(angle));
  const ny = cy + r * Math.sin(toRad(angle));
  return (
    <Box textAlign="center">
      <svg width="180" height="130" viewBox="0 0 180 130">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`}
          fill="none" stroke="#1a2a1a" strokeWidth="14" strokeLinecap="round" />
        {[["#4cceac", 0, 33], ["#f0c040", 33, 33], ["#e05c5c", 66, 34]].map(([c, s, l]) => (
          <path key={c} d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`}
            fill="none" stroke={c} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${(l / 100) * 220} 220`}
            strokeDashoffset={`${-(s / 100) * 220}`} opacity="0.5" />
        ))}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 220} 220`} />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill={color} />
        <text x={cx} y={cy + 28} textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">
          {value.toFixed(1)}
        </text>
        <text x={cx} y={cy + 44} textAnchor="middle" fill="#aaa" fontSize="9">{label}</text>
      </svg>
    </Box>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, unit, color, sub, colors }) => (
  <Card sx={{ backgroundColor: colors.primary[400], height: "100%", border: `1px solid ${color}33`,
    transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
    <CardContent sx={{ textAlign: "center", py: 2.5 }}>
      <Box sx={{ color, mb: 1 }}>{icon}</Box>
      <Typography variant="h3" color={color} fontWeight="bold">{value ?? "—"}</Typography>
      <Typography variant="caption" color={colors.grey[400]}>{unit}</Typography>
      <Typography variant="body2" color={colors.grey[300]} mt={0.5}>{label}</Typography>
      {sub && <Typography variant="caption" color={colors.grey[500]} display="block" mt={0.3}>{sub}</Typography>}
    </CardContent>
  </Card>
);

// ── Tip card ──────────────────────────────────────────────────────────────────
const TipCard = ({ tip, colors }) => {
  const borderColor = tip.impact === "high" ? colors.greenAccent[500]
    : tip.impact === "medium" ? "#f0c040" : colors.blueAccent[400];
  return (
    <Card sx={{ backgroundColor: colors.primary[400], mb: 1.5, borderLeft: `4px solid ${borderColor}` }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={1.5} alignItems="flex-start" flex={1}>
            <Box sx={{ color: colors.greenAccent[400], mt: 0.3 }}>{tip.icon}</Box>
            <Box>
              <Typography variant="body2" color={colors.grey[100]} fontWeight="bold">{tip.title}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{tip.description}</Typography>
            </Box>
          </Box>
          <Box textAlign="right" ml={1}>
            <Chip label={`Save ${tip.saving}`} size="small"
              sx={{ backgroundColor: colors.greenAccent[800], color: colors.greenAccent[100], fontSize: "0.7rem" }} />
            <Typography variant="caption" color={colors.grey[500]} display="block" mt={0.3}>{tip.impact} impact</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ── Offset project card ───────────────────────────────────────────────────────
const OffsetCard = ({ project, colors, onPurchase }) => (
  <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.greenAccent[700]}`,
    transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
          <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{project.name}</Typography>
          <Typography variant="caption" color={colors.grey[400]}>{project.location}</Typography>
        </Box>
        <Chip label={project.standard} size="small"
          sx={{ backgroundColor: colors.greenAccent[800], color: colors.greenAccent[300], fontSize: "0.65rem" }} />
      </Box>
      <Typography variant="body2" color={colors.grey[300]} mb={1.5}>{project.description}</Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" color={colors.grey[500]}>Price per tonne CO₂</Typography>
          <Typography variant="h5" color={colors.greenAccent[400]} fontWeight="bold">${project.price_per_tonne}</Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color={colors.grey[500]}>Available credits</Typography>
          <Typography variant="body2" color={colors.grey[200]}>{project.available_credits.toLocaleString()} t</Typography>
        </Box>
      </Box>
      <Button fullWidth variant="contained" size="small" startIcon={<ShoppingCartIcon />}
        onClick={() => onPurchase(project)}
        sx={{ mt: 1.5, backgroundColor: colors.greenAccent[700], color: "#fff",
          "&:hover": { backgroundColor: colors.greenAccent[600] } }}>
        Purchase Credits
      </Button>
    </CardContent>
  </Card>
);

// ── Species lookup by tree_type + category ────────────────────────────────────
// Keys: "indigenous|exotic" + "|" + "fruit|timber|shade|heritage|medicinal|agroforestry"
const SPECIES_MAP = {
  "indigenous|fruit": [
    "African Cherry (Prunus africana)", "African Plum (Vitex doniana)", "African Star Apple (Chrysophyllum albidum)",
    "Baobab (Adansonia digitata)", "Bird Plum (Berchemia discolor)", "Black Plum (Vitex mombassae)",
    "Bush Mango (Irvingia gabonensis)", "Cape Fig (Ficus sur)", "Desert Date (Balanites aegyptiaca)",
    "Forest Fig (Ficus thonningii)", "Jackalberry (Diospyros mespiliformis)", "Kei Apple (Dovyalis caffra)",
    "Marula (Sclerocarya birrea)", "Mkoche (Lannea schimperi)", "Mkuyu (Ficus sycomorus)",
    "Mobola Plum (Parinari curatellifolia)", "Monkey Orange (Strychnos cocculoides)", "Muratina (Kigelia africana)",
    "Mutoo (Combretum zeyheri)", "Mwembe Mwitu (Mangifera sylvatica)", "Neem wild fruit (Azadirachta indica wild)",
    "Sausage Tree (Kigelia africana)", "Shea Butter (Vitellaria paradoxa)", "Tamarind (Tamarindus indica)",
    "Wild Custard Apple (Annona senegalensis)", "Wild Loquat (Uapaca kirkiana)", "Wild Medlar (Vangueria infausta)",
    "Ximenia (Ximenia caffra)", "Yellow Plum (Ximenia americana)", "Ziziphus (Ziziphus mauritiana wild)",
  ].sort(),
  "exotic|fruit": [
    "Apple (Malus domestica)", "Apricot (Prunus armeniaca)", "Avocado (Persea americana)",
    "Banana (Musa spp.)", "Breadfruit (Artocarpus altilis)", "Carambola / Star Fruit (Averrhoa carambola)",
    "Cherry (Prunus avium)", "Citrus – Grapefruit (Citrus paradisi)", "Citrus – Lemon (Citrus limon)",
    "Citrus – Lime (Citrus aurantifolia)", "Citrus – Orange (Citrus sinensis)", "Citrus – Tangerine (Citrus reticulata)",
    "Coconut (Cocos nucifera)", "Dragon Fruit (Hylocereus undatus)", "Durian (Durio zibethinus)",
    "Guava (Psidium guajava)", "Jack Fruit (Artocarpus heterophyllus)", "Loquat (Eriobotrya japonica)",
    "Lychee (Litchi chinensis)", "Mango (Mangifera indica)", "Mulberry (Morus alba)",
    "Papaya / Pawpaw (Carica papaya)", "Passion Fruit (Passiflora edulis)", "Peach (Prunus persica)",
    "Pear (Pyrus communis)", "Persimmon (Diospyros kaki)", "Pineapple Guava (Feijoa sellowiana)",
    "Plum (Prunus domestica)", "Pomegranate (Punica granatum)", "Soursop (Annona muricata)",
  ].sort(),
  "indigenous|timber": [
    "African Blackwood (Dalbergia melanoxylon)", "African Mahogany (Khaya senegalensis)",
    "African Olive (Olea africana)", "African Rosewood (Hagenia abyssinica)", "African Teak (Milicia excelsa)",
    "Bamboo (Yushania alpina)", "Camphorwood (Ocotea usambarensis)", "Cedar – African (Juniperus procera)",
    "East African Ebony (Diospyros abyssinica)", "Elgon Teak (Podocarpus latifolia)",
    "Grevillea (Grevillea robusta)", "Ironwood (Olea capensis)", "Meru Oak (Vitex keniensis)",
    "Minyaa (Cordia africana)", "Mkangazi (Afzelia quanzensis)", "Mukinduri (Croton megalocarpus)",
    "Mukuyu (Cordia holstii)", "Mumo (Melia volkensii)", "Muuti (Albizia gummifera)",
    "Muvuti (Brachylaena huillensis)", "Mvule (Milicia excelsa)", "Mwangati (Calodendrum capense)",
    "Nandi Flame (Spathodea campanulata)", "Podo (Podocarpus gracilior)", "Red Stinkwood (Prunus africana)",
    "River Acacia (Acacia xanthophloea)", "Sandalwood (Osyris lanceolata)", "Umbrella Thorn (Acacia tortilis)",
    "Warburgia (Warburgia ugandensis)", "Yellow Bamboo (Oxytenanthera abyssinica)",
  ].sort(),
  "exotic|timber": [
    "Australian Blackwood (Acacia melanoxylon)", "Black Wattle (Acacia mearnsii)",
    "Blue Gum (Eucalyptus globulus)", "Casuarina / Whistling Pine (Casuarina equisetifolia)",
    "Cedar – Japanese (Cryptomeria japonica)", "Cluster Pine (Pinus pinaster)",
    "Cyprus – Italian (Cupressus sempervirens)", "Eucalyptus grandis", "Eucalyptus saligna",
    "Giant Bamboo (Dendrocalamus giganteus)", "Gravilia (Grevillea robusta exotic var.)",
    "Honduras Pine (Pinus caribaea)", "Jacaranda (Jacaranda mimosifolia)",
    "Maesopsis (Maesopsis eminii)", "Maritime Pine (Pinus pinaster)",
    "Monterey Cypress (Cupressus macrocarpa)", "Monterey Pine (Pinus radiata)",
    "Paper Mulberry (Broussonetia papyrifera)", "Patula Pine (Pinus patula)",
    "Rubber Tree (Hevea brasiliensis)", "Teak (Tectona grandis)",
    "White Poplar (Populus alba)", "Yellow Cypress (Chamaecyparis nootkatensis)",
  ].sort(),
  "indigenous|shade": [
    "African Tulip (Spathodea campanulata)", "Acacia – Flat-top (Acacia abyssinica)",
    "Cape Chestnut (Calodendrum capense)", "Cape Lilac (Melia azedarach wild)",
    "Fig – Common Wild (Ficus capensis)", "Fig – Sycamore (Ficus sycomorus)",
    "Flame Tree (Brachystegia spiciformis)", "Forest Bushwillow (Combretum caffrum)",
    "Greatleaf Fig (Ficus lutea)", "Ivory Coast Almond (Terminalia ivorensis)",
    "Mkuyu (Ficus sur)", "Msanduku (Terminalia brownii)", "Mubiru (Macaranga kilimandscharica)",
    "Mugumo / Sacred Fig (Ficus thonningii)", "Muhuti (Albizia coriaria)",
    "Musharagi (Nuxia congesta)", "Musizi (Maesopsis eminii)", "Mvule (Milicia excelsa)",
    "Rain Tree (Albizia saman)", "Umbrella Acacia (Acacia tortilis)",
    "Yellow Fever Tree (Acacia xanthophloea)",
  ].sort(),
  "exotic|shade": [
    "Bottlebrush (Callistemon citrinus)", "Bougainvillea (Bougainvillea spectabilis)",
    "Chinese Banyan (Ficus microcarpa)", "Flamboyant (Delonix regia)",
    "Flowering Cherry (Prunus serrulata)", "Golden Shower (Cassia fistula)",
    "Jacaranda (Jacaranda mimosifolia)", "Magnolia (Magnolia grandiflora)",
    "Oleander (Nerium oleander)", "Poinciana (Delonix regia)",
    "Pride of India (Lagerstroemia speciosa)", "Queen of the Night (Cestrum nocturnum)",
    "Red Bottlebrush (Callistemon viminalis)", "Royal Palm (Roystonea regia)",
    "Traveller's Palm (Ravenala madagascariensis)", "Tulip Tree (Liriodendron tulipifera)",
    "Weeping Willow (Salix babylonica)",
  ].sort(),
  "indigenous|heritage": [
    "African Blackwood / Mpingo (Dalbergia melanoxylon)", "African Wild Date (Phoenix reclinata)",
    "Baobab (Adansonia digitata)", "Cedar – African / Mutarakwa (Juniperus procera)",
    "Croton (Croton megalocarpus)", "East African Ebony (Diospyros abyssinica)",
    "Elgon Olive (Olea capensis)", "Giant Podocarpus (Podocarpus milanjianus)",
    "Hagenia / Rosewood (Hagenia abyssinica)", "Leleshwa (Tarchonanthus camphoratus)",
    "Mugumo / Sacred Fig (Ficus thonningii)", "Muiri (Prunus africana)",
    "Mukinduri (Croton megalocarpus)", "Muratina (Kigelia africana)",
    "Muthiga (Warburgia ugandensis)", "Mutoo / Muthithi (Combretum zeyheri)",
    "Mvungunya (Commiphora africana)", "Nandi Flame (Spathodea campanulata)",
    "Ol-Orien (Acacia drepanolobium)", "Osyris (Osyris lanceolata)",
    "Olea europaea ssp. africana", "Wild Olive (Olea africana)",
  ].sort(),
  "exotic|heritage": [
    "Araucaria / Monkey Puzzle (Araucaria araucana)", "Atlas Cedar (Cedrus atlantica)",
    "Blue Atlas Cedar (Cedrus atlantica 'Glauca')", "California Redwood (Sequoia sempervirens)",
    "Canary Island Date Palm (Phoenix canariensis)", "Chilean Wine Palm (Jubaea chilensis)",
    "Deodar Cedar (Cedrus deodara)", "Dragon Blood Tree (Dracaena cinnabari)",
    "European Larch (Larix decidua)", "Giant Sequoia (Sequoiadendron giganteum)",
    "Himalayan Cedar (Cedrus deodara)", "Horse Chestnut (Aesculus hippocastanum)",
    "Lebanon Cedar (Cedrus libani)", "Lombardy Poplar (Populus nigra 'Italica')",
    "Monkey Puzzle (Araucaria araucana)", "Norfolk Island Pine (Araucaria heterophylla)",
    "Queen Palm (Syagrus romanzoffiana)", "Royal Poinciana (Delonix regia)",
    "Scots Pine (Pinus sylvestris)", "Wollemi Pine (Wollemia nobilis)",
  ].sort(),
  "indigenous|medicinal": [
    "African Basil (Ocimum gratissimum)", "African Ginger (Mondia whitei)",
    "African Potato (Hypoxis hemerocallidea)", "African Wormwood (Artemisia afra)",
    "Aloe (Aloe vera / Aloe barbadensis)", "Black-eyed Susan (Thunbergia alata)",
    "Camphorwood (Ocotea usambarensis)", "Cape Aloe (Aloe ferox)",
    "Devil's Claw (Harpagophytum procumbens)", "Fever Tree Bark (Acacia xanthophloea)",
    "Foxglove (Digitalis lanata wild)", "Hagenia / Rosewood (Hagenia abyssinica)",
    "Mkaa Pwani (Catunaregam spinosa)", "Mkuyu (Ficus sur – bark)",
    "Moringa (Moringa oleifera)", "Muarobaini / Neem (Azadirachta indica)",
    "Mubiru (Macaranga kilimandscharica)", "Muiri / African Cherry (Prunus africana)",
    "Muthiga (Warburgia ugandensis)", "Myrrh (Commiphora myrrha)",
    "Nandi Flame (Spathodea campanulata)", "Osyris (Osyris lanceolata)",
    "Red Stinkwood (Prunus africana)", "River Bushwillow (Combretum erythrophyllum)",
    "Senna (Senna didymobotrya)", "Stinging Nettle (Urtica massaica)",
    "Tamarind (Tamarindus indica)", "Wild Turmeric (Curcuma longa wild)",
    "Wormwood (Artemisia annua wild)", "Zanthoxylum (Zanthoxylum chalybeum)",
  ].sort(),
  "exotic|medicinal": [
    "Ashwagandha (Withania somnifera)", "Basil (Ocimum basilicum)",
    "Black Seed / Nigella (Nigella sativa)", "Calendula (Calendula officinalis)",
    "Chamomile (Matricaria chamomilla)", "Chinese Herbal Willow (Salix alba)",
    "Cinnamon (Cinnamomum verum)", "Clove (Syzygium aromaticum)",
    "Echinacea (Echinacea purpurea)", "Elder (Sambucus nigra)",
    "Eucalyptus (Eucalyptus globulus)", "Feverfew (Tanacetum parthenium)",
    "Ginkgo (Ginkgo biloba)", "Ginseng (Panax ginseng)",
    "Lavender (Lavandula angustifolia)", "Lemon Balm (Melissa officinalis)",
    "Milk Thistle (Silybum marianum)", "Moringa (Moringa oleifera exotic var.)",
    "Neem (Azadirachta indica)", "Passionflower (Passiflora incarnata)",
    "Peppermint (Mentha × piperita)", "Rosemary (Salvia rosmarinus)",
    "St. John's Wort (Hypericum perforatum)", "Tea Tree (Melaleuca alternifolia)",
    "Turmeric (Curcuma longa)", "Valerian (Valeriana officinalis)",
    "Willow Bark (Salix alba)", "Witch Hazel (Hamamelis virginiana)",
    "Yarrow (Achillea millefolium)", "Yerba Mate (Ilex paraguariensis)",
  ].sort(),
  "indigenous|agroforestry": [
    "African Acacia (Acacia abyssinica)", "African Grevillea (Grevillea robusta native var.)",
    "Calliandra (Calliandra calothyrsus)", "Cape Fig (Ficus sur)",
    "Croton (Croton megalocarpus)", "Desert Date (Balanites aegyptiaca)",
    "Erythrina (Erythrina abyssinica)", "Faidherbia / Winter Thorn (Faidherbia albida)",
    "Forest Acacia (Acacia lahai)", "Gliricidia (Gliricidia sepium)",
    "Leucaena (Leucaena leucocephala)", "Melia (Melia volkensii)",
    "Mkuyu (Ficus sycomorus)", "Moringa (Moringa stenopetala)",
    "Muhimu (Bridelia micrantha)", "Mukau / Melia (Melia volkensii)",
    "Mumo (Melia volkensii)", "Musizi (Maesopsis eminii)",
    "Sesbania (Sesbania sesban)", "Tithonia (Tithonia diversifolia)",
    "Umbrella Thorn (Acacia tortilis)", "Wild Senna (Senna siamea)",
    "Yellow Cassia (Senna spectabilis)", "Yellow Thorn (Acacia xanthophloea)",
  ].sort(),
  "exotic|agroforestry": [
    "Alnus / Alder (Alnus acuminata)", "Australian Wattle (Acacia mearnsii)",
    "Bamboo – Moso (Phyllostachys edulis)", "Black Wattle (Acacia mearnsii)",
    "Casuarina (Casuarina cunninghamiana)", "Calliandra (Calliandra calothyrsus exotic)",
    "Coffee Shade Tree (Erythrina variegata)", "Eucalyptus (Eucalyptus camaldulensis)",
    "Gliricidia (Gliricidia sepium)", "Grevillea (Grevillea robusta)",
    "Guava (Psidium guajava – agroforestry)", "Jackfruit (Artocarpus heterophyllus)",
    "Leucaena (Leucaena leucocephala)", "Macadamia (Macadamia integrifolia)",
    "Mango (Mangifera indica – agroforestry)", "Moringa (Moringa oleifera)",
    "Neem (Azadirachta indica)", "Paulownia (Paulownia tomentosa)",
    "Pigeon Pea (Cajanus cajan – tree form)", "Sesbania (Sesbania grandiflora)",
    "Silver Oak (Grevillea robusta)", "Teak (Tectona grandis)",
    "Vetiver (Vetiveria zizanioides)", "White Mulberry (Morus alba)",
  ].sort(),
};

// ── Main component ────────────────────────────────────────────────────────────
const CarbonFootprintCalculator = () => {
  const colors = tokens("dark");
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  // What-if simulator
  const [simWater, setSimWater] = useState(10);
  const [simRainwater, setSimRainwater] = useState(0);
  const [simLED, setSimLED] = useState(0);
  const [simTrees, setSimTrees] = useState(0);

  // Goal planner
  const [goalTarget, setGoalTarget] = useState(10);
  const [goalMonths, setGoalMonths] = useState(6);

  // Offset purchase dialog
  const [purchaseDialog, setPurchaseDialog] = useState({ open: false, project: null });
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Tree planting submission
  const [treePlatformFee] = useState(0.10); // 10%
  const [treeDialog, setTreeDialog] = useState(false);
  const [treeForm, setTreeForm] = useState({
    tree_type: "indigenous", species: "", qty: 1, category: "fruit",
    water_need: "medium", location: "", notes: "", image: null,
  });
  const [treeSubmitted, setTreeSubmitted] = useState(false);
  const [treeSubmitting, setTreeSubmitting] = useState(false);
  const [treeError, setTreeError] = useState(null);
  const [myTreeRecords, setMyTreeRecords] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const MATURITY_FACTORS = { sapling: 0.7, mature: 1.0, old_growth: 1.6 };
  const BASE_REMOVAL_CO2 = 21; // kg CO₂ sequestration per mature tree per year

  const [removalForm, setRemovalForm] = useState({
    tree_type: "indigenous", category: "fruit", species: "", maturity: "mature",
    quantity: 1, purpose: "Construction", location: "", notes: "",
    commitment: "self", replacement_required: true,
  });
  const [removalPhotos, setRemovalPhotos] = useState([]);
  const [removalPreviewUrls, setRemovalPreviewUrls] = useState([]);
  const [replacementPhotos, setReplacementPhotos] = useState([]);
  const [replacementPreviewUrls, setReplacementPreviewUrls] = useState([]);
  const [removalError, setRemovalError] = useState(null);
  const [removalSubmitted, setRemovalSubmitted] = useState(false);
  const [removalSubmitting, setRemovalSubmitting] = useState(false);
  const [partnerCheckoutStarted, setPartnerCheckoutStarted] = useState(false);
  const removalFileRef = useRef(null);
  const replacementFileRef = useRef(null);

  // Growth update dialog
  const [growthDialog, setGrowthDialog] = useState(null);
  const [growthForm, setGrowthForm] = useState({
    update_date: new Date().toISOString().split("T")[0],
    height_cm: "", health_status: "healthy", trees_alive: "", notes: "",
  });
  const [growthPhotos, setGrowthPhotos] = useState([]);
  const growthFileRef = useRef(null);
  const [growthSubmitting, setGrowthSubmitting] = useState(false);
  const [growthSuccess, setGrowthSuccess] = useState(null);
  const [offsetRequestSent, setOffsetRequestSent] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${BASE_URL}/client/carbon_footprint`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${BASE_URL}/client/consumption_trends`, { headers: authHeaders() }).then(r => r.json()),
    ])
      .then(([cfRes, trendRes]) => {
        setData(cfRes?.data || cfRes);
        const raw = trendRes?.data?.trends || trendRes?.trends || [];
        setTrends(raw);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load client's tree planting records
  const loadTreeRecords = () => {
    fetch(`${BASE_URL}/tree_plantings`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => setMyTreeRecords(res?.data?.tree_plantings || []))
      .catch(() => {});
  };
  useEffect(() => { loadTreeRecords(); }, []); // eslint-disable-line

  // Handle photo file selection
  const handlePhotoSelect = (e, setter, previewSetter) => {
    const files = Array.from(e.target.files || []);
    setter(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    previewSetter(prev => [...prev, ...urls]);
    e.target.value = ""; // allow re-selecting same file
  };

  const removePhoto = (idx, setter, previewSetter) => {
    setter(prev => prev.filter((_, i) => i !== idx));
    previewSetter(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removalPurposeFactor = ["Safety Hazard", "Diseased Tree"].includes(removalForm.purpose) ? 0.7 : 1.0;
  const removalMaturityFactor = MATURITY_FACTORS[removalForm.maturity] || 1.0;
  const removalCarbonLossPerYear = removalForm.quantity * BASE_REMOVAL_CO2 * removalMaturityFactor * removalPurposeFactor;
  const removalLifetimeLoss = {
    years10: removalCarbonLossPerYear * 10,
    years20: removalCarbonLossPerYear * 20,
    years50: removalCarbonLossPerYear * 50,
  };
  const removalDebt = removalForm.quantity * 3;
  const removalCanopyDelta = -(removalForm.quantity * (removalForm.maturity === "old_growth" ? 5 : removalForm.maturity === "mature" ? 3 : 1));
  const removalCanopyScore = Math.max(0, 72 + removalCanopyDelta);
  const removalSpeciesSuggestions = (SPECIES_MAP[`${removalForm.tree_type}|${removalForm.category}`] || [])
    .filter(s => !removalForm.species || s.toLowerCase().includes(removalForm.species.toLowerCase()))
    .slice(0, 6);
  const removalEcologicalAlert = removalForm.quantity > 0
    ? `Removing ${removalForm.quantity} ${removalForm.maturity.replace("_", " ")} ${removalForm.category} tree${removalForm.quantity > 1 ? "s" : ""}` +
      ` loses habitat value, reduces soil stability, and weakens local biodiversity support.`
    : "Enter a removal quantity to see the ecological impact.";

  const handleRemovalSubmit = () => {
    if (!removalForm.species) {
      setRemovalError("Please enter or select a tree species.");
      return;
    }
    if (removalPhotos.length === 0) {
      setRemovalError("Please upload at least one photo as proof of removal.");
      return;
    }
    setRemovalSubmitting(true);
    setRemovalError(null);
    setTimeout(() => {
      setRemovalSubmitting(false);
      setRemovalSubmitted(true);
    }, 600);
  };

  const handleReplacementPhotoSelect = (e) => handlePhotoSelect(e, setReplacementPhotos, setReplacementPreviewUrls);
  const handleRemovalPhotoSelect = (e) => handlePhotoSelect(e, setRemovalPhotos, setRemovalPreviewUrls);
  const handlePartnerFulfilment = () => {
    setPartnerCheckoutStarted(true);
    setRemovalSubmitted(true);
  };

  // Submit new tree planting record
  const handleTreeSubmit = async () => {
    if (!treeForm.species) { setTreeError("Please select a species."); return; }
    setTreeSubmitting(true);
    setTreeError(null);
    try {
      const fd = new FormData();
      fd.append("tree_type",  treeForm.tree_type);
      fd.append("category",   treeForm.category);
      fd.append("species",    treeForm.species);
      fd.append("quantity",   treeForm.qty);
      fd.append("water_need", treeForm.water_need);
      fd.append("location",   treeForm.location || "");
      fd.append("notes",      treeForm.notes || "");
      selectedPhotos.forEach(f => fd.append("photos[]", f));

      const res = await fetch(`${BASE_URL}/tree_plantings`, {
        method: "POST",
        headers: { Authorization: authHeaders().Authorization },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      setTreeSubmitted(true);
      setTreeForm({ tree_type: "indigenous", species: "", qty: 1, category: "fruit", water_need: "medium", location: "", notes: "", image: null });
      setSelectedPhotos([]);
      setPhotoPreviewUrls([]);
      loadTreeRecords();
    } catch (err) {
      setTreeError(err.message);
    } finally {
      setTreeSubmitting(false);
    }
  };

  // Submit monthly growth update
  const handleGrowthSubmit = async () => {
    if (!growthDialog) return;
    setGrowthSubmitting(true);
    setGrowthSuccess(null);
    try {
      const fd = new FormData();
      fd.append("update_date",   growthForm.update_date);
      fd.append("health_status", growthForm.health_status);
      if (growthForm.height_cm)  fd.append("height_cm",   growthForm.height_cm);
      if (growthForm.trees_alive) fd.append("trees_alive", growthForm.trees_alive);
      if (growthForm.notes)      fd.append("notes",        growthForm.notes);
      growthPhotos.forEach(f => fd.append("photos[]", f));

      const res = await fetch(`${BASE_URL}/tree_plantings/${growthDialog.id}/growth_update`, {
        method: "POST",
        headers: { Authorization: authHeaders().Authorization },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Update failed");

      setGrowthSuccess("Growth update recorded successfully!");
      setGrowthForm({ update_date: new Date().toISOString().split("T")[0], height_cm: "", health_status: "healthy", trees_alive: "", notes: "" });
      setGrowthPhotos([]);
      loadTreeRecords();
      setTimeout(() => { setGrowthDialog(null); setGrowthSuccess(null); }, 2000);
    } catch (err) {
      setGrowthSuccess("Error: " + err.message);
    } finally {
      setGrowthSubmitting(false);
    }
  };

  const carbonKg = data?.carbon_kg_co2 || data?.carbon_kg || 0;
  const consumptionM3 = data?.consumption_m3 || 0;

  // Use a demo baseline when API returns no data so the simulator is always interactive
  const DEMO_BASELINE = 18.5; // realistic average household kg CO₂e/month
  const baseCarbon = carbonKg > 0 ? carbonKg : DEMO_BASELINE;
  const isDemo = carbonKg === 0;

  // Trees already planted (admin-set or from API) — monthly offset contribution
  const existingTrees = data?.trees_planted || 0;
  const existingTreeOffset = (existingTrees * TREE_ABSORPTION) / 12; // kg CO₂e offset per month

  // Simulator calculations — all relative to baseCarbon
  const waterSaving = simWater * CARBON_FACTOR;
  const rainSaving = simRainwater * CARBON_FACTOR * 0.3;
  const ledSaving = simLED * 0.05;
  const simTreeOffset = (simTrees * TREE_ABSORPTION) / 12;
  const totalSaving = waterSaving + rainSaving + ledSaving + simTreeOffset;
  const simResult = Math.max(0, baseCarbon - existingTreeOffset - totalSaving);
  const simPct = baseCarbon > 0 ? Math.min(100, ((existingTreeOffset + totalSaving) / baseCarbon) * 100).toFixed(1) : 0;

  // Scope breakdown
  const scopeData = [
    { id: "Scope 1 – Direct", label: "Scope 1 – Direct", value: Math.round(carbonKg * 0.15), color: "#e05c5c" },
    { id: "Scope 2 – Electricity", label: "Scope 2 – Electricity", value: Math.round(carbonKg * 0.55), color: "#f0c040" },
    { id: "Scope 3 – Supply Chain", label: "Scope 3 – Supply Chain", value: Math.round(carbonKg * 0.30), color: "#4db6e4" },
  ];

  // Trend line chart
  const lineData = trends.length > 0 ? [{
    id: "CO₂ (kg)",
    color: "#4cceac",
    data: trends.map(t => ({
      x: t.label || t.month,
      y: parseFloat(((t.consumption_m3 || 0) * CARBON_FACTOR).toFixed(2)),
    })),
  }] : [{ id: "CO₂ (kg)", color: "#4cceac", data: [{ x: "No data", y: 0 }] }];

  // Benchmark bar data
  const benchmarkData = BENCHMARK_DATA.map(b => ({
    ...b, value: b.category === "You" ? parseFloat(carbonKg.toFixed(1)) : b.value,
  }));

  // Gamification badges
  const badges = [];
  if (carbonKg < 5) badges.push({ label: "Low Emitter 🌱", color: colors.greenAccent[500] });
  if ((data?.efficiency_rating || 0) >= 80) badges.push({ label: "Efficiency Star ⭐", color: "#f0c040" });
  if ((data?.vs_community_avg || 0) < 0) badges.push({ label: "Community Champion 🏆", color: colors.blueAccent[400] });
  if (carbonKg < 3) badges.push({ label: "Carbon Hero 🌍", color: "#4db6e4" });

  // Goal progress
  const goalProgress = goalTarget > 0 ? Math.min(100, ((carbonKg - goalTarget) / carbonKg) * 100) : 0;
  const monthlyReduction = carbonKg > goalTarget ? ((carbonKg - goalTarget) / goalMonths).toFixed(2) : 0;

  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Carbon Emitted (kg CO2e)", carbonKg.toFixed(2)],
      ["Water Consumed (m3)", consumptionM3.toFixed(1)],
      ["Trees Needed to Offset", (data?.equivalent_trees || 0).toFixed(1)],
      ["Efficiency Rating", data?.efficiency_rating || 0],
      ["vs Community Average (%)", data?.vs_community_avg || 0],
      ["Scope 1 – Direct (kg)", Math.round(carbonKg * 0.15)],
      ["Scope 2 – Electricity (kg)", Math.round(carbonKg * 0.55)],
      ["Scope 3 – Supply Chain (kg)", Math.round(carbonKg * 0.30)],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "carbon_footprint_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.greenAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb="20px" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Carbon Footprint</Typography>
          <Typography variant="h6" color={colors.grey[400]}>
            Your water usage environmental impact — track, reduce, and offset
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.grey[400] }} title="Refresh"><RefreshIcon /></IconButton>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}
            sx={{ borderColor: colors.greenAccent[600], color: colors.greenAccent[400] }}>
            Export CSV
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
        Could not load live data — showing demo values. {error}
      </Alert>}

      {/* Badges */}
      {badges.length > 0 && (
        <Box display="flex" gap={1} mb={2} flexWrap="wrap" alignItems="center">
          <EmojiEventsIcon sx={{ color: "#f0c040" }} />
          {badges.map(b => (
            <Chip key={b.label} label={b.label} size="small"
              sx={{ backgroundColor: b.color + "22", color: b.color, border: `1px solid ${b.color}55`, fontWeight: 600 }} />
          ))}
        </Box>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{
        mb: 3, borderBottom: `2px solid ${colors.grey[700]}`,
        "& .MuiTab-root": {
          color: colors.grey[300],
          textTransform: "none",
          minWidth: 140,
          fontSize: "1.3rem",
          fontWeight: 500,
          py: 1.5,
        },
        "& .Mui-selected": {
          color: "#ffffff !important",
          fontWeight: 700,
          backgroundColor: colors.greenAccent[800] + "66",
          borderRadius: "8px 8px 0 0",
        },
        "& .MuiTabs-indicator": {
          backgroundColor: colors.greenAccent[400],
          height: 3,
          borderRadius: 2,
        },
        "& .MuiTab-root:hover": { color: colors.grey[100], backgroundColor: colors.primary[300] + "33" },
      }}>
        <Tab label="Overview" icon={<SpeedIcon />} iconPosition="start" />
        <Tab label="Trends & Scope" icon={<AssessmentIcon />} iconPosition="start" />
        <Tab label="What-If Simulator" icon={<TrackChangesIcon />} iconPosition="start" />
        <Tab label="Reduction Tips" icon={<LightbulbIcon />} iconPosition="start" />
        <Tab label="Offset Marketplace" icon={<LocalFloristIcon />} iconPosition="start" />
        <Tab label="Tree Planting" icon={<ParkIcon />} iconPosition="start" />
        <Tab label="Tree Removal & Replacement" icon={<ForestIcon />} iconPosition="start" />
        <Tab label="Goals & Leaderboard" icon={<LeaderboardIcon />} iconPosition="start" />
      </Tabs>

      {/* ── Tab 0: Overview ── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.greenAccent[700]}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" color={colors.grey[300]} mb={1}>Monthly CO₂ Emissions</Typography>
                <Speedometer value={carbonKg} max={50} label="kg CO₂e" color={colors.greenAccent[400]} />
                <Typography variant="caption" color={colors.grey[500]}>Target: &lt;10 kg CO₂e / month</Typography>
                <Box mt={1} display="flex" justifyContent="center" gap={1}>
                  {[["Low", "#4cceac"], ["Medium", "#f0c040"], ["High", "#e05c5c"]].map(([l, c]) => (
                    <Box key={l} display="flex" alignItems="center" gap={0.3}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c }} />
                      <Typography variant="caption" color={colors.grey[500]}>{l}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <StatCard icon={<WaterDropIcon sx={{ fontSize: 36 }} />}
                  label="Water Used" value={consumptionM3.toFixed(1)} unit="m³ this month"
                  color={colors.blueAccent[400]} colors={colors} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard icon={<Co2Icon sx={{ fontSize: 36 }} />}
                  label="Carbon Emitted" value={carbonKg.toFixed(2)} unit="kg CO₂e"
                  color="#e05c5c" colors={colors} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard icon={<ParkIcon sx={{ fontSize: 36 }} />}
                  label="Trees to Offset" value={(data?.equivalent_trees || (carbonKg / TREE_ABSORPTION * 12)).toFixed(1)}
                  unit="trees needed" color={colors.greenAccent[400]} colors={colors}
                  sub="1 tree absorbs ~21 kg CO₂/yr" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <StatCard
                  icon={(data?.vs_community_avg || 0) < 0
                    ? <TrendingDownIcon sx={{ fontSize: 36 }} />
                    : <TrendingUpIcon sx={{ fontSize: 36 }} />}
                  label="vs Community" value={`${(data?.vs_community_avg || 0) > 0 ? "+" : ""}${data?.vs_community_avg || 0}%`}
                  unit="vs avg"
                  color={(data?.vs_community_avg || 0) < 0 ? colors.greenAccent[400] : "#e05c5c"}
                  colors={colors}
                  sub={(data?.vs_community_avg || 0) < 0 ? "Below average — great!" : "Above average"} />
              </Grid>
            </Grid>
          </Grid>

          {/* Efficiency rating */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h5" color={colors.grey[100]}>Efficiency Rating</Typography>
                  <Typography variant="h4" color={colors.greenAccent[400]} fontWeight="bold">
                    {data?.efficiency_rating ?? 0} / 100
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={data?.efficiency_rating ?? 0}
                  sx={{ height: 14, borderRadius: 7, backgroundColor: colors.grey[700],
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: (data?.efficiency_rating || 0) >= 70 ? colors.greenAccent[500] : "#f0c040",
                      borderRadius: 7 } }} />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" color={colors.grey[600]}>Poor</Typography>
                  <Typography variant="caption" color={colors.grey[600]}>Excellent</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Drop-to-Tree calculator */}
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.blueAccent[700]}` }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <WaterDropIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]}>Drop-to-Tree Calculator</Typography>
                  <Tooltip title="Saving water reduces pumping energy, which reduces carbon emissions">
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: colors.grey[500] }} />
                  </Tooltip>
                </Box>
                <Typography variant="body2" color={colors.grey[300]} mb={1}>
                  Every <strong style={{ color: colors.blueAccent[300] }}>100 litres</strong> saved =&nbsp;
                  <strong style={{ color: colors.greenAccent[400] }}>
                    {(0.1 * CARBON_FACTOR * 1000 / TREE_ABSORPTION).toFixed(4)} trees
                  </strong> worth of carbon offset.
                </Typography>
                <Divider sx={{ borderColor: colors.grey[700], my: 1 }} />
                <Typography variant="body2" color={colors.grey[300]}>
                  Reduce usage by 10% this month and you could offset the equivalent of&nbsp;
                  <strong style={{ color: colors.greenAccent[400] }}>
                    {(consumptionM3 * 0.1 * CARBON_FACTOR / TREE_ABSORPTION).toFixed(3)} trees
                  </strong> planted.
                </Typography>
                <Box mt={1.5} p={1} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                  <Typography variant="caption" color={colors.greenAccent[400]}>
                    🌍 SDG 6 (Clean Water) · SDG 13 (Climate Action) · SDG 15 (Life on Land)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 1: Trends & Scope ── */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Scope Breakdown (GHG Protocol)</Typography>
                <Box height={260}>
                  <ResponsivePie
                    data={scopeData}
                    margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
                    innerRadius={0.55}
                    padAngle={2}
                    cornerRadius={3}
                    colors={d => d.data.color}
                    borderWidth={1}
                    borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor={colors.grey[300]}
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor="#fff"
                    theme={{ tooltip: { container: { background: colors.primary[500], color: colors.grey[100] } } }}
                  />
                </Box>
                <Box mt={1}>
                  {scopeData.map(s => (
                    <Box key={s.id} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: s.color }} />
                        <Typography variant="caption" color={colors.grey[300]}>{s.id}</Typography>
                      </Box>
                      <Typography variant="caption" color={colors.grey[200]} fontWeight="bold">{s.value} kg</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>CO₂ Emissions Trend (12 months)</Typography>
                <Box height={280}>
                  <ResponsiveLine
                    data={lineData}
                    margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                    xScale={{ type: "point" }}
                    yScale={{ type: "linear", min: 0, max: "auto" }}
                    curve="monotoneX"
                    axisBottom={{ tickRotation: -30, tickSize: 5,
                      legend: "Month", legendOffset: 40, legendPosition: "middle",
                      tickColor: colors.grey[500] }}
                    axisLeft={{ tickSize: 5, legend: "kg CO₂e", legendOffset: -50, legendPosition: "middle",
                      tickColor: colors.grey[500] }}
                    colors={["#4cceac"]}
                    pointSize={8}
                    pointColor="#141b2d"
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "serieColor" }}
                    enableArea
                    areaOpacity={0.15}
                    useMesh
                    theme={{
                      axis: { ticks: { text: { fill: colors.grey[400] } }, legend: { text: { fill: colors.grey[300] } } },
                      grid: { line: { stroke: colors.grey[700] } },
                      tooltip: { container: { background: colors.primary[500], color: colors.grey[100] } },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Peer benchmark */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PeopleIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]}>Peer Benchmarking</Typography>
                  <Chip label="Anonymous" size="small"
                    sx={{ backgroundColor: colors.grey[700], color: colors.grey[300], fontSize: "0.65rem" }} />
                </Box>
                <Box height={200}>
                  <ResponsiveBar
                    data={benchmarkData}
                    keys={["value"]}
                    indexBy="category"
                    margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
                    padding={0.3}
                    colors={d => d.data.color}
                    axisBottom={{ tickSize: 5, tickColor: colors.grey[500] }}
                    axisLeft={{ tickSize: 5, legend: "kg CO₂e/month", legendOffset: -50, legendPosition: "middle",
                      tickColor: colors.grey[500] }}
                    labelSkipWidth={12}
                    labelTextColor="#fff"
                    theme={{
                      axis: { ticks: { text: { fill: colors.grey[400] } }, legend: { text: { fill: colors.grey[300] } } },
                      grid: { line: { stroke: colors.grey[700] } },
                      tooltip: { container: { background: colors.primary[500], color: colors.grey[100] } },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 2: What-If Simulator ── */}
      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrackChangesIcon sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]}>What-If Scenario Simulator</Typography>
                </Box>
                {isDemo && (
                  <Alert severity="info" sx={{ mb: 2, fontSize: "0.85rem" }}>
                    No live data yet — simulator is running on a demo baseline of {DEMO_BASELINE} kg CO₂e/month.
                    Connect your meter to see real figures.
                  </Alert>
                )}
                {existingTrees > 0 && (
                  <Box mb={2} p={1.5} sx={{ backgroundColor: colors.greenAccent[800] + "33", borderRadius: 1,
                    border: `1px solid ${colors.greenAccent[700]}` }}>
                    <Typography variant="body2" color={colors.greenAccent[300]}>
                      🌳 You have <strong>{existingTrees} verified trees</strong> already offsetting{" "}
                      <strong>{existingTreeOffset.toFixed(2)} kg CO₂e/month</strong> — already applied to your baseline.
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" color={colors.grey[400]} mb={3}>
                  Adjust the sliders to model how behaviour changes affect your monthly carbon footprint.
                </Typography>

                {/* Slider: Reduce water usage */}
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <WaterDropIcon sx={{ color: colors.blueAccent[400], fontSize: 18 }} />
                      <Typography variant="body2" color={colors.grey[200]}>Reduce water usage by</Typography>
                    </Box>
                    <Typography variant="body2" color={colors.blueAccent[300]} fontWeight="bold">{simWater} m³</Typography>
                  </Box>
                  <Slider value={simWater} onChange={(_, v) => setSimWater(v)} min={0} max={50} step={1}
                    sx={{ color: colors.blueAccent[400] }} />
                  <Typography variant="caption" color={colors.grey[500]}>
                    Saves ~{(simWater * CARBON_FACTOR).toFixed(2)} kg CO₂e/month
                  </Typography>
                </Box>

                {/* Slider: Harvest rainwater */}
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <NatureIcon sx={{ color: colors.greenAccent[400], fontSize: 18 }} />
                      <Typography variant="body2" color={colors.grey[200]}>Harvest rainwater</Typography>
                    </Box>
                    <Typography variant="body2" color={colors.greenAccent[300]} fontWeight="bold">{simRainwater} m³</Typography>
                  </Box>
                  <Slider value={simRainwater} onChange={(_, v) => setSimRainwater(v)} min={0} max={20} step={0.5}
                    sx={{ color: colors.greenAccent[400] }} />
                  <Typography variant="caption" color={colors.grey[500]}>
                    Saves ~{(simRainwater * CARBON_FACTOR * 0.3).toFixed(2)} kg CO₂e/month
                  </Typography>
                </Box>

                {/* Slider: LED bulbs */}
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ElectricBoltIcon sx={{ color: "#f0c040", fontSize: 18 }} />
                      <Typography variant="body2" color={colors.grey[200]}>Switch to LED lighting (bulbs)</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: "#f0c040" }} fontWeight="bold">{simLED} bulbs</Typography>
                  </Box>
                  <Slider value={simLED} onChange={(_, v) => setSimLED(v)} min={0} max={20} step={1}
                    sx={{ color: "#f0c040" }} />
                  <Typography variant="caption" color={colors.grey[500]}>
                    Saves ~{(simLED * 0.05).toFixed(2)} kg CO₂e/month
                  </Typography>
                </Box>

                {/* Slider: Plant additional trees */}
                <Box mb={1}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ParkIcon sx={{ color: colors.greenAccent[400], fontSize: 18 }} />
                      <Typography variant="body2" color={colors.grey[200]}>Plant additional trees</Typography>
                    </Box>
                    <Typography variant="body2" color={colors.greenAccent[300]} fontWeight="bold">{simTrees} trees</Typography>
                  </Box>
                  <Slider value={simTrees} onChange={(_, v) => setSimTrees(v)} min={0} max={50} step={1}
                    sx={{ color: colors.greenAccent[500] }} />
                  <Typography variant="caption" color={colors.grey[500]}>
                    Offsets ~{simTreeOffset.toFixed(2)} kg CO₂e/month ({(simTrees * TREE_ABSORPTION).toFixed(0)} kg/yr)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.greenAccent[700]}` }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Simulation Result</Typography>
                <Speedometer value={simResult} max={Math.max(baseCarbon, 30)} label="kg CO₂e (projected)"
                  color={simResult < baseCarbon * 0.5 ? colors.greenAccent[400] : simResult < baseCarbon * 0.8 ? "#f0c040" : "#e05c5c"} />
                <Divider sx={{ borderColor: colors.grey[700], my: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color={colors.grey[500]}>Baseline</Typography>
                    <Typography variant="h5" color="#e05c5c" fontWeight="bold">{baseCarbon.toFixed(1)} kg</Typography>
                    {isDemo && <Typography variant="caption" color={colors.grey[600]}>(demo)</Typography>}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color={colors.grey[500]}>Projected</Typography>
                    <Typography variant="h5" color={colors.greenAccent[400]} fontWeight="bold">{simResult.toFixed(1)} kg</Typography>
                  </Grid>
                </Grid>

                {/* Savings breakdown */}
                <Box mt={2} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1, textAlign: "left" }}>
                  {[
                    ["Water reduction", (simWater * CARBON_FACTOR).toFixed(2), colors.blueAccent[300]],
                    ["Rainwater harvest", (simRainwater * CARBON_FACTOR * 0.3).toFixed(2), colors.greenAccent[400]],
                    ["LED lighting", (simLED * 0.05).toFixed(2), "#f0c040"],
                    ["New trees", simTreeOffset.toFixed(2), colors.greenAccent[300]],
                    ...(existingTrees > 0 ? [["Existing trees", existingTreeOffset.toFixed(2), colors.greenAccent[500]]] : []),
                  ].map(([label, val, color]) => (
                    <Box key={label} display="flex" justifyContent="space-between" mb={0.4}>
                      <Typography variant="caption" color={colors.grey[400]}>{label}</Typography>
                      <Typography variant="caption" color={color} fontWeight="bold">-{val} kg</Typography>
                    </Box>
                  ))}
                </Box>

                <Box mt={1.5} p={1.5} sx={{ backgroundColor: colors.greenAccent[800] + "44", borderRadius: 1 }}>
                  <Typography variant="h4" color={colors.greenAccent[400]} fontWeight="bold">
                    -{simPct}%
                  </Typography>
                  <Typography variant="caption" color={colors.greenAccent[300]}>
                    Total reduction = {(existingTreeOffset + totalSaving).toFixed(2)} kg CO₂e/month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 3: Reduction Tips ── */}
      {tab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <LightbulbIcon sx={{ color: "#f0c040" }} />
              <Typography variant="h5" color={colors.grey[100]}>AI-Powered Reduction Recommendations</Typography>
            </Box>
            <Typography variant="body2" color={colors.grey[400]} mb={2}>
              Personalised actions based on your usage patterns. Sorted by carbon impact.
            </Typography>
            {REDUCTION_TIPS.map((tip, i) => <TipCard key={i} tip={tip} colors={colors} />)}
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.greenAccent[700]}` }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <FlagIcon sx={{ color: colors.greenAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]}>Reduction Goal Planner</Typography>
                </Box>
                <Typography variant="caption" color={colors.grey[400]}>Target monthly emissions (kg CO₂e)</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5} mb={2}>
                  <Slider value={goalTarget} onChange={(_, v) => setGoalTarget(v)} min={1} max={Math.max(30, carbonKg)}
                    step={0.5} sx={{ color: colors.greenAccent[400], flex: 1 }} />
                  <Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold" sx={{ minWidth: 40 }}>
                    {goalTarget} kg
                  </Typography>
                </Box>
                <Typography variant="caption" color={colors.grey[400]}>Achieve goal in (months)</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5} mb={2}>
                  <Slider value={goalMonths} onChange={(_, v) => setGoalMonths(v)} min={1} max={24} step={1}
                    sx={{ color: colors.blueAccent[400], flex: 1 }} />
                  <Typography variant="body2" color={colors.blueAccent[400]} fontWeight="bold" sx={{ minWidth: 40 }}>
                    {goalMonths} mo
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: colors.grey[700], my: 1.5 }} />
                <Box p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                  <Typography variant="caption" color={colors.grey[400]}>Required monthly reduction</Typography>
                  <Typography variant="h4" color={colors.greenAccent[400]} fontWeight="bold">
                    {monthlyReduction} kg/mo
                  </Typography>
                  <Typography variant="caption" color={colors.grey[500]}>
                    From {carbonKg.toFixed(1)} → {goalTarget} kg CO₂e
                  </Typography>
                </Box>
                <Box mt={1.5}>
                  <Typography variant="caption" color={colors.grey[400]}>Goal progress</Typography>
                  <LinearProgress variant="determinate" value={Math.max(0, 100 - goalProgress)}
                    sx={{ height: 10, borderRadius: 5, mt: 0.5, backgroundColor: colors.grey[700],
                      "& .MuiLinearProgress-bar": { backgroundColor: colors.greenAccent[500], borderRadius: 5 } }} />
                  <Typography variant="caption" color={colors.grey[500]}>
                    Aligned with Science Based Targets (SBTi)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 4: Offset Marketplace ── */}
      {tab === 4 && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LocalFloristIcon sx={{ color: colors.greenAccent[400] }} />
            <Typography variant="h5" color={colors.grey[100]}>Certified Carbon Offset Marketplace</Typography>
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={1}>
            Browse verified carbon offset projects. Purchases are reviewed and approved by the system administrator
            before payment is processed — protecting you from fraud and ensuring full transparency.
          </Typography>
          <Box mb={2} p={1.5} sx={{ backgroundColor: colors.blueAccent[800] + "44", borderRadius: 1,
            border: `1px solid ${colors.blueAccent[700]}` }}>
            <Typography variant="body2" color={colors.blueAccent[200]}>
              🔒 Safe Offset Process: Your request is sent to the admin for verification. A 10% platform fee
              is added to cover registry costs and system maintenance. You will be notified once approved.
            </Typography>
          </Box>
          {offsetRequestSent && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOffsetRequestSent(false)}>
              Your offset request has been submitted for admin review. You will be notified once approved.
            </Alert>
          )}
          <Grid container spacing={3}>
            {OFFSET_PROJECTS.map(p => (
              <Grid item xs={12} md={4} key={p.id}>
                <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.greenAccent[700]}`,
                  transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="h6" color={colors.grey[100]} fontWeight="bold">{p.name}</Typography>
                        <Typography variant="caption" color={colors.grey[400]}>{p.location}</Typography>
                      </Box>
                      <Chip label={p.standard} size="small"
                        sx={{ backgroundColor: colors.greenAccent[800], color: colors.greenAccent[300], fontSize: "0.7rem" }} />
                    </Box>
                    <Typography variant="body2" color={colors.grey[300]} mb={1.5}>{p.description}</Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box>
                        <Typography variant="caption" color={colors.grey[500]}>Price per tonne CO₂</Typography>
                        <Typography variant="h5" color={colors.greenAccent[400]} fontWeight="bold">${p.price_per_tonne}</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color={colors.grey[500]}>+ 10% platform fee</Typography>
                        <Typography variant="body2" color="#f0c040" fontWeight="bold">
                          = ${(p.price_per_tonne * 1.1).toFixed(2)}/t total
                        </Typography>
                      </Box>
                    </Box>
                    <Button fullWidth variant="contained" startIcon={<ShoppingCartIcon />}
                      onClick={() => { setPurchaseDialog({ open: true, project: p }); setPurchaseQty(1); }}
                      sx={{ backgroundColor: colors.greenAccent[700], color: "#fff",
                        "&:hover": { backgroundColor: colors.greenAccent[600] }, fontSize: "0.9rem" }}>
                      Request Purchase
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box mt={3} p={2} sx={{ backgroundColor: colors.primary[400], borderRadius: 2,
            border: `1px solid ${colors.grey[700]}` }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <VerifiedIcon sx={{ color: colors.greenAccent[400], fontSize: 18 }} />
              <Typography variant="body2" color={colors.grey[200]} fontWeight="bold">Registry Transparency</Typography>
            </Box>
            <Typography variant="caption" color={colors.grey[400]}>
              All offset projects are verified through Gold Standard or Verra VCS registries.
              GPS-tracked tree planting data is available via OpenForests integration.
              The 10% platform fee covers registry verification, system maintenance, and fraud protection.
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Tab 5: Tree Planting ── */}
      {tab === 5 && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <ParkIcon sx={{ color: colors.greenAccent[400] }} />
            <Typography variant="h5" color={colors.grey[100]}>Tree Planting Carbon Submissions</Typography>
          </Box>
          <Typography variant="body2" color={colors.grey[400]} mb={2}>
            Planted trees? Submit your data here. The admin will verify your submission and update your carbon offset
            balance. Supporting images or GPS photos are required for approval.
          </Typography>
          {treeSubmitted && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setTreeSubmitted(false)}>
              Your tree planting submission has been sent for admin review. You will be notified once verified.
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.greenAccent[700]}` }}>
                <CardContent>
                  <Typography variant="h6" color={colors.grey[100]} mb={2}>Submit New Tree Planting Record</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Tree Type</InputLabel>
                        <Select value={treeForm.tree_type}
                          onChange={e => setTreeForm(p => ({ ...p, tree_type: e.target.value, species: "" }))}
                          label="Tree Type"
                          sx={{ color: colors.grey[100], fontSize: "0.95rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
                          <MenuItem value="indigenous" sx={{ fontSize: "0.95rem" }}>Indigenous / Heritage / Native</MenuItem>
                          <MenuItem value="exotic" sx={{ fontSize: "0.95rem" }}>Exotic / Modern / Introduced</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Category</InputLabel>
                        <Select value={treeForm.category}
                          onChange={e => setTreeForm(p => ({ ...p, category: e.target.value, species: "" }))}
                          label="Category"
                          sx={{ color: colors.grey[100], fontSize: "0.95rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
                          <MenuItem value="fruit" sx={{ fontSize: "1.1rem" }}>Fruit Tree</MenuItem>
                          <MenuItem value="timber" sx={{ fontSize: "1.1rem" }}>Timber Tree</MenuItem>
                          <MenuItem value="shade" sx={{ fontSize: "1.1rem" }}>Shade / Ornamental</MenuItem>
                          <MenuItem value="heritage" sx={{ fontSize: "1.1rem" }}>Heritage / Sacred</MenuItem>
                          <MenuItem value="medicinal" sx={{ fontSize: "1.1rem" }}>Medicinal</MenuItem>
                          <MenuItem value="agroforestry" sx={{ fontSize: "1.1rem" }}>Agroforestry</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: colors.grey[300], fontSize: "1.1rem" }}>Species Name</InputLabel>
                        <Select
                          value={treeForm.species}
                          onChange={e => setTreeForm(p => ({ ...p, species: e.target.value }))}
                          label="Species Name"
                          sx={{ color: colors.grey[100], fontSize: "1.1rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}
                          MenuProps={{ PaperProps: { sx: { maxHeight: 320, backgroundColor: "#1f2a40" } } }}
                        >
                          <MenuItem value="" sx={{ fontSize: "1.1rem", color: "#aaa" }}>
                            <em>— Select species —</em>
                          </MenuItem>
                          {(SPECIES_MAP[`${treeForm.tree_type}|${treeForm.category}`] || []).map(s => (
                            <MenuItem key={s} value={s} sx={{ fontSize: "1.1rem" }}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Number of Trees" type="number" value={treeForm.qty}
                        onChange={e => setTreeForm(p => ({ ...p, qty: parseInt(e.target.value) || 1 }))}
                        inputProps={{ min: 1 }}
                        sx={{ "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1.1rem" },
                          "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1.1rem" },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: colors.grey[300], fontSize: "1.1rem" }}>Water Requirement</InputLabel>
                        <Select value={treeForm.water_need}
                          onChange={e => setTreeForm(p => ({ ...p, water_need: e.target.value }))}
                          label="Water Requirement"
                          sx={{ color: colors.grey[100], fontSize: "1.1rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
                          <MenuItem value="low" sx={{ fontSize: "1.1rem" }}>Low (drought-resistant)</MenuItem>
                          <MenuItem value="medium" sx={{ fontSize: "1.1rem" }}>Medium</MenuItem>
                          <MenuItem value="high" sx={{ fontSize: "1.1rem" }}>High (needs irrigation)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Planting Location" value={treeForm.location}
                        onChange={e => setTreeForm(p => ({ ...p, location: e.target.value }))}
                        placeholder="e.g. Plot 12, Kijiji A"
                        sx={{ "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1.1rem" },
                          "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1.1rem" },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={2} label="Additional Notes" value={treeForm.notes}
                        onChange={e => setTreeForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Any additional details about the planting..."
                        sx={{ "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1.1rem" },
                          "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1.1rem" },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
                    </Grid>
                    <Grid item xs={12}>
                      {/* Hidden file input — accepts images + common cloud export formats */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        multiple
                        style={{ display: "none" }}
                        onChange={e => handlePhotoSelect(e, setSelectedPhotos, setPhotoPreviewUrls)}
                      />
                      <Box
                        p={2}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          backgroundColor: colors.primary[500], borderRadius: 1,
                          border: `2px dashed ${selectedPhotos.length > 0 ? colors.greenAccent[500] : colors.grey[600]}`,
                          textAlign: "center", cursor: "pointer",
                          "&:hover": { borderColor: colors.greenAccent[500] },
                        }}
                      >
                        <Typography variant="body2" color={colors.grey[300]} sx={{ fontSize: "0.95rem" }}>
                          📷 Upload supporting photo(s) — required for approval
                        </Typography>
                        <Typography variant="caption" color={colors.grey[500]}>
                          GPS photo, planting site image, or official certificate
                        </Typography>
                        <Box display="flex" justifyContent="center" mt={1.5}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300], fontSize: "0.85rem" }}
                          >
                            Choose File(s)
                          </Button>
                        </Box>
                        <Typography variant="caption" color={colors.grey[600]} display="block" mt={0.5}>
                          JPEG, PNG, WebP · max 15 MB each · multiple allowed
                        </Typography>
                      </Box>

                      {/* Photo preview thumbnails */}
                      {photoPreviewUrls.length > 0 && (
                        <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
                          {photoPreviewUrls.map((url, idx) => (
                            <Box key={idx} sx={{ position: "relative", width: 80, height: 80 }}>
                              <img src={url} alt={`preview-${idx}`}
                                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6,
                                  border: `1px solid ${colors.grey[600]}` }} />
                              <Button
                                size="small"
                                onClick={() => removePhoto(idx, setSelectedPhotos, setPhotoPreviewUrls)}
                                sx={{
                                  position: "absolute", top: -6, right: -6,
                                  minWidth: 20, width: 20, height: 20, p: 0,
                                  backgroundColor: colors.redAccent[500], color: "#fff",
                                  fontSize: "0.65rem", borderRadius: "50%",
                                  "&:hover": { backgroundColor: colors.redAccent[400] },
                                }}
                              >✕</Button>
                            </Box>
                          ))}
                          <Typography variant="caption" color={colors.grey[400]} alignSelf="center">
                            {selectedPhotos.length} photo{selectedPhotos.length > 1 ? "s" : ""} selected
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>

                  {treeError && <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setTreeError(null)}>{treeError}</Alert>}

                  <Button
                    fullWidth variant="contained"
                    disabled={treeSubmitting || !treeForm.species}
                    sx={{ mt: 2, py: 1.5, fontSize: "1rem", backgroundColor: colors.greenAccent[700],
                      "&:hover": { backgroundColor: colors.greenAccent[600] } }}
                    onClick={handleTreeSubmit}
                  >
                    {treeSubmitting ? "Submitting…" : "Submit for Admin Verification"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.blueAccent[700]}` }}>
                <CardContent>
                  <Typography variant="h6" color={colors.grey[100]} mb={2}>Carbon Offset Estimates</Typography>
                  {[
                    { type: "Indigenous Tree", offset: "21 kg CO₂/yr", note: "e.g. Mugumo, Meru Oak" },
                    { type: "Fruit Tree", offset: "15 kg CO₂/yr", note: "e.g. Mango, Avocado" },
                    { type: "Exotic Timber", offset: "18 kg CO₂/yr", note: "e.g. Eucalyptus, Cypress" },
                    { type: "Agroforestry", offset: "12 kg CO₂/yr", note: "e.g. Grevillea, Calliandra" },
                  ].map(item => (
                    <Box key={item.type} display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}
                      p={1} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                      <Box>
                        <Typography variant="body2" color={colors.grey[100]} fontWeight="bold" sx={{ fontSize: "0.9rem" }}>{item.type}</Typography>
                        <Typography variant="caption" color={colors.grey[500]}>{item.note}</Typography>
                      </Box>
                      <Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold" sx={{ fontSize: "0.9rem" }}>{item.offset}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ borderColor: colors.grey[700], my: 1.5 }} />
                  <Box p={1.5} sx={{ backgroundColor: colors.greenAccent[800] + "33", borderRadius: 1 }}>
                    <Typography variant="body2" color={colors.greenAccent[300]} sx={{ fontSize: "0.9rem" }}>
                      Your {treeForm.qty} {treeForm.tree_type} tree{treeForm.qty > 1 ? "s" : ""} could offset approximately{" "}
                      <strong>{(treeForm.qty * 21).toFixed(0)} kg CO₂/yr</strong>
                    </Typography>
                  </Box>
                  <Box mt={2} p={1.5} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                    <Typography variant="caption" color={colors.grey[400]}>
                      🌍 Aligned with SDG 15 (Life on Land) and Gold Standard microscale framework.
                      Indigenous trees receive higher carbon credit ratings due to biodiversity value.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ── My Tree Records ── */}
          <Box mt={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="h6" color={colors.grey[100]}>
                🌳 My Tree Records ({myTreeRecords.length})
              </Typography>
              <Typography variant="caption" color={colors.grey[500]}>
                Update growth monthly to keep your record active
              </Typography>
            </Box>

            {myTreeRecords.length === 0 ? (
              <Alert severity="info" sx={{ backgroundColor: colors.primary[500] }}>
                No tree planting records yet. Submit your first record above.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {myTreeRecords.map(tr => {
                  const statusColor = tr.status === "verified" ? colors.greenAccent[500]
                    : tr.status === "rejected" ? colors.redAccent[400] : "#f0c040";
                  const latestGrowth = (tr.growth_updates || [])[0];
                  const thisMonthUpdate = (tr.growth_updates || []).find(g =>
                    new Date(g.update_date).getMonth() === new Date().getMonth() &&
                    new Date(g.update_date).getFullYear() === new Date().getFullYear()
                  );
                  return (
                    <Grid item xs={12} sm={6} md={4} key={tr.id}>
                      <Card sx={{ backgroundColor: colors.primary[500],
                        borderLeft: `4px solid ${statusColor}` }}>
                        <CardContent sx={{ pb: "12px !important" }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                            <Typography variant="body2" color={colors.grey[100]} fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                              {tr.species}
                            </Typography>
                            <Chip label={tr.status.toUpperCase()} size="small"
                              sx={{ backgroundColor: statusColor, color: "#fff", fontSize: "0.62rem", height: 18 }} />
                          </Box>
                          <Typography variant="caption" color={colors.grey[400]}>
                            {tr.tree_type} · {tr.category} · {tr.quantity} tree{tr.quantity > 1 ? "s" : ""}
                          </Typography>
                          {tr.location && (
                            <Typography variant="caption" color={colors.grey[500]} display="block">
                              📍 {tr.location}
                            </Typography>
                          )}
                          {tr.status === "verified" && (
                            <Typography variant="caption" color={colors.greenAccent[400]} display="block" mt={0.3}>
                              🌿 {tr.carbon_credit_kg} kg CO₂ credit earned
                            </Typography>
                          )}
                          {tr.status === "rejected" && tr.rejection_reason && (
                            <Typography variant="caption" color={colors.redAccent[300]} display="block" mt={0.3}>
                              ⚠ {tr.rejection_reason}
                            </Typography>
                          )}

                          {/* Photos strip */}
                          {tr.photos?.length > 0 && (
                            <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                              {tr.photos.slice(0, 3).map(p => (
                                <img key={p.id}
                                  src={`${BACKEND_URL}${p.url}`}
                                  alt={p.caption || "tree"}
                                  style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4,
                                    border: `1px solid ${colors.grey[600]}` }}
                                  onError={e => { e.target.style.display = "none"; }}
                                />
                              ))}
                              {tr.photos.length > 3 && (
                                <Box sx={{ width: 48, height: 48, borderRadius: 4,
                                  backgroundColor: colors.grey[700], display: "flex",
                                  alignItems: "center", justifyContent: "center" }}>
                                  <Typography variant="caption" color={colors.grey[300]}>+{tr.photos.length - 3}</Typography>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Growth status */}
                          <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color={thisMonthUpdate ? colors.greenAccent[400] : colors.grey[500]}>
                              {thisMonthUpdate
                                ? `✅ Updated ${new Date(thisMonthUpdate.update_date).toLocaleDateString()}`
                                : "⏰ Monthly update due"}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={!!thisMonthUpdate}
                              onClick={() => {
                                setGrowthDialog(tr);
                                setGrowthForm(f => ({ ...f, trees_alive: tr.trees_alive || tr.quantity }));
                              }}
                              sx={{
                                fontSize: "0.65rem", py: 0.2, px: 1,
                                borderColor: thisMonthUpdate ? colors.grey[700] : colors.greenAccent[600],
                                color: thisMonthUpdate ? colors.grey[600] : colors.greenAccent[400],
                              }}
                            >
                              {thisMonthUpdate ? "Done" : "Add Update"}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {/* ── Growth Update Dialog ── */}
          <Dialog open={!!growthDialog} onClose={() => setGrowthDialog(null)} maxWidth="sm" fullWidth
            PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
            <DialogTitle sx={{ color: colors.grey[100] }}>
              Monthly Growth Update — {growthDialog?.species}
            </DialogTitle>
            <DialogContent>
              <Typography variant="caption" color={colors.grey[400]} display="block" mb={2}>
                {growthDialog?.quantity} tree{growthDialog?.quantity > 1 ? "s" : ""} · {growthDialog?.location || "No location set"}
              </Typography>

              {growthSuccess && (
                <Alert severity={growthSuccess.startsWith("Error") ? "error" : "success"} sx={{ mb: 2 }}>
                  {growthSuccess}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Update Date" type="date"
                    InputLabelProps={{ shrink: true }}
                    value={growthForm.update_date}
                    onChange={e => setGrowthForm(f => ({ ...f, update_date: e.target.value }))}
                    sx={{ "& .MuiInputBase-input": { color: colors.grey[100] },
                      "& .MuiInputLabel-root": { color: colors.grey[300] },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Trees Still Alive" type="number"
                    value={growthForm.trees_alive}
                    onChange={e => setGrowthForm(f => ({ ...f, trees_alive: e.target.value }))}
                    inputProps={{ min: 0, max: growthDialog?.quantity }}
                    sx={{ "& .MuiInputBase-input": { color: colors.grey[100] },
                      "& .MuiInputLabel-root": { color: colors.grey[300] },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: colors.grey[300] }}>Health Status</InputLabel>
                    <Select value={growthForm.health_status}
                      onChange={e => setGrowthForm(f => ({ ...f, health_status: e.target.value }))}
                      label="Health Status"
                      sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}>
                      <MenuItem value="healthy">🟢 Healthy</MenuItem>
                      <MenuItem value="stressed">🟡 Stressed</MenuItem>
                      <MenuItem value="dead">🔴 Dead / Removed</MenuItem>
                      <MenuItem value="unknown">⚪ Unknown</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Avg Height (cm, optional)" type="number"
                    value={growthForm.height_cm}
                    onChange={e => setGrowthForm(f => ({ ...f, height_cm: e.target.value }))}
                    inputProps={{ min: 0 }}
                    sx={{ "& .MuiInputBase-input": { color: colors.grey[100] },
                      "& .MuiInputLabel-root": { color: colors.grey[300] },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" multiline rows={2} label="Notes (optional)"
                    value={growthForm.notes}
                    onChange={e => setGrowthForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any observations about growth, watering, threats..."
                    sx={{ "& .MuiInputBase-input": { color: colors.grey[100] },
                      "& .MuiInputLabel-root": { color: colors.grey[300] },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }} />
                </Grid>
                <Grid item xs={12}>
                  <input ref={growthFileRef} type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple style={{ display: "none" }}
                    onChange={e => handlePhotoSelect(e, setGrowthPhotos, setPhotoPreviewUrls)} />
                  <Button size="small" variant="outlined" fullWidth
                    onClick={() => growthFileRef.current?.click()}
                    sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300] }}>
                    📷 Attach Photo(s) — {growthPhotos.length} selected
                  </Button>
                  {growthPhotos.length > 0 && (
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                      {growthPhotos.map((f, i) => (
                        <Typography key={i} variant="caption" color={colors.grey[400]}
                          sx={{ backgroundColor: colors.grey[800], px: 1, borderRadius: 1 }}>
                          {f.name}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setGrowthDialog(null); setGrowthPhotos([]); }}
                sx={{ color: colors.grey[400] }}>Cancel</Button>
              <Button variant="contained" disabled={growthSubmitting} onClick={handleGrowthSubmit}
                sx={{ backgroundColor: colors.greenAccent[600] }}>
                {growthSubmitting ? "Saving…" : "Save Update"}
              </Button>
            </DialogActions>
          </Dialog>

        </Box>
      )}

      {/* ── Tab 5: Tree Removal & Replacement ── */}
      {tab === 6 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.greenAccent[700]}` }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ForestIcon sx={{ color: colors.greenAccent[400] }} />
                  <Typography variant="h5" color={colors.grey[100]}>Tree Removal & Replacement</Typography>
                </Box>
                <Typography variant="body2" color={colors.grey[400]} mb={3}>
                  Capture removal events, estimate lost carbon, and commit to a mandatory 3:1 replacement workflow.
                </Typography>
                {removalSubmitted && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRemovalSubmitted(false)}>
                    Removal report saved locally. Replacement commitment is now active.
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Tree Type</InputLabel>
                      <Select value={removalForm.tree_type}
                        onChange={e => setRemovalForm(p => ({ ...p, tree_type: e.target.value, species: "" }))}
                        label="Tree Type"
                        sx={{ color: colors.grey[100], fontSize: "0.95rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
                        <MenuItem value="indigenous">Indigenous / Native</MenuItem>
                        <MenuItem value="exotic">Exotic / Introduced</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Category</InputLabel>
                      <Select value={removalForm.category}
                        onChange={e => setRemovalForm(p => ({ ...p, category: e.target.value, species: "" }))}
                        label="Category"
                        sx={{ color: colors.grey[100], fontSize: "0.95rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
                        <MenuItem value="fruit">Fruit</MenuItem>
                        <MenuItem value="timber">Timber</MenuItem>
                        <MenuItem value="shade">Shade</MenuItem>
                        <MenuItem value="heritage">Heritage</MenuItem>
                        <MenuItem value="medicinal">Medicinal</MenuItem>
                        <MenuItem value="agroforestry">Agroforestry</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Species Search" value={removalForm.species}
                      onChange={e => setRemovalForm(p => ({ ...p, species: e.target.value }))}
                      placeholder="e.g. Mahogany, Oak, Avocado"
                      sx={{ "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1.1rem" },
                        "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1.1rem" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                      {removalSpeciesSuggestions.map(s => (
                        <Chip key={s} label={s} size="small" clickable
                          onClick={() => setRemovalForm(p => ({ ...p, species: s }))}
                          sx={{ color: colors.grey[100], backgroundColor: colors.primary[500], fontSize: "0.75rem" }} />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Maturity / Size</InputLabel>
                      <Select value={removalForm.maturity}
                        onChange={e => setRemovalForm(p => ({ ...p, maturity: e.target.value }))}
                        label="Maturity / Size"
                        sx={{ color: colors.grey[100], fontSize: "0.95rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
                        <MenuItem value="sapling">Sapling</MenuItem>
                        <MenuItem value="mature">Mature</MenuItem>
                        <MenuItem value="old_growth">Old Growth</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Quantity Cut" type="number" value={removalForm.quantity}
                      onChange={e => setRemovalForm(p => ({ ...p, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                      inputProps={{ min: 1 }}
                      sx={{ "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1.1rem" },
                        "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1.1rem" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Purpose of Removal</InputLabel>
                      <Select value={removalForm.purpose}
                        onChange={e => setRemovalForm(p => ({ ...p, purpose: e.target.value }))}
                        label="Purpose of Removal"
                        sx={{ color: colors.grey[100], fontSize: "0.95rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
                        <MenuItem value="Construction">Construction</MenuItem>
                        <MenuItem value="Agriculture">Agriculture</MenuItem>
                        <MenuItem value="Safety Hazard">Safety Hazard</MenuItem>
                        <MenuItem value="Timber">Timber</MenuItem>
                        <MenuItem value="Diseased Tree">Diseased Tree</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Removal Location" value={removalForm.location}
                      onChange={e => setRemovalForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="e.g. Village edge, Plot 7"
                      sx={{ "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1.1rem" },
                        "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1.1rem" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} label="Notes"
                      value={removalForm.notes}
                      onChange={e => setRemovalForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Explain the context, permits, or supporting details."
                      sx={{ "& .MuiInputBase-input": { color: colors.grey[100], fontSize: "1.1rem" },
                        "& .MuiInputLabel-root": { color: colors.grey[300], fontSize: "1.1rem" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <input ref={removalFileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: "none" }}
                      onChange={handleRemovalPhotoSelect} />
                    <Box p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1,
                      border: `2px dashed ${removalPhotos.length > 0 ? colors.greenAccent[500] : colors.grey[600]}` }}>
                      <Typography variant="body2" color={colors.grey[300]}>
                        Proof of Removal: upload a photo showing the cut tree and surrounding area.
                      </Typography>
                      <Typography variant="caption" color={colors.grey[500]} display="block" mt={0.5}>
                        JPEG, PNG, WebP · max 15 MB each · choose one or more files.
                      </Typography>
                      <Box display="flex" justifyContent="flex-start" mt={1}>
                        <Button variant="outlined" onClick={() => removalFileRef.current?.click()} size="small"
                          sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300], fontSize: "0.85rem" }}>
                          Choose File(s)
                        </Button>
                      </Box>
                      {removalPreviewUrls.length > 0 && (
                        <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
                          {removalPreviewUrls.map((url, idx) => (
                            <Box key={idx} sx={{ position: "relative", width: 80, height: 80 }}>
                              <img src={url} alt={`removal-preview-${idx}`}
                                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6,
                                  border: `1px solid ${colors.grey[600]}` }} />
                              <Button
                                size="small"
                                onClick={() => removePhoto(idx, setRemovalPhotos, setRemovalPreviewUrls)}
                                sx={{
                                  position: "absolute", top: -6, right: -6,
                                  minWidth: 20, width: 20, height: 20, p: 0,
                                  backgroundColor: colors.redAccent?.[500] || "#e05c5c", color: "#fff",
                                  fontSize: "0.65rem", borderRadius: "50%",
                                  "&:hover": { backgroundColor: colors.redAccent?.[400] || "#f16e6e" },
                                }}
                              >✕</Button>
                            </Box>
                          ))}
                        </Box>
                      )}
                      {removalPhotos.length > 0 && (
                        <Typography variant="caption" color={colors.grey[400]} display="block" mt={1}>
                          {removalPhotos.length} photo{removalPhotos.length > 1 ? "s" : ""} selected
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  {removalError && (
                    <Grid item xs={12}>
                      <Alert severity="error" onClose={() => setRemovalError(null)}>{removalError}</Alert>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button fullWidth variant="contained" onClick={handleRemovalSubmit}
                      disabled={removalSubmitting}
                      sx={{ backgroundColor: colors.greenAccent[700], color: "#fff", py: 1.5,
                        "&:hover": { backgroundColor: colors.greenAccent[600] } }}>
                      {removalSubmitting ? "Logging Removal…" : "Submit Removal Report"}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.blueAccent[700]}` }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <InfoOutlinedIcon sx={{ color: colors.blueAccent[400] }} />
                      <Typography variant="h6" color={colors.grey[100]}>Live Impact Dashboard</Typography>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <StatCard icon={<Co2Icon sx={{ fontSize: 32 }} />}
                          label="Carbon Credit Loss" value={`${removalCarbonLossPerYear.toFixed(0)}`} unit="kg CO₂ / yr"
                          color={colors.redAccent?.[400] || "#e05c5c"} colors={colors} sub="Estimated sequestration lost" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StatCard icon={<ParkIcon sx={{ fontSize: 32 }} />}
                          label="Tree Debt" value={`${removalForm.quantity} → ${removalDebt}`} unit="cut → owed"
                          color={colors.greenAccent[400]} colors={colors} sub="3 replacements per tree" />
                      </Grid>
                    </Grid>
                    <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                      <Typography variant="body2" color={colors.grey[300]} mb={1}>Projected lifetime impact</Typography>
                      <Typography variant="caption" color={colors.grey[400]}>10 years:</Typography>
                      <Typography variant="h6" color={colors.grey[100]}>{removalLifetimeLoss.years10.toFixed(0)} kg</Typography>
                      <Typography variant="caption" color={colors.grey[400]}>20 years:</Typography>
                      <Typography variant="h6" color={colors.grey[100]}>{removalLifetimeLoss.years20.toFixed(0)} kg</Typography>
                      <Typography variant="caption" color={colors.grey[400]}>50 years:</Typography>
                      <Typography variant="h6" color={colors.grey[100]}>{removalLifetimeLoss.years50.toFixed(0)} kg</Typography>
                    </Box>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      {removalEcologicalAlert}
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: colors.primary[400], border: `1px dashed ${colors.greenAccent[700]}` }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <FlagIcon sx={{ color: colors.greenAccent[400] }} />
                      <Typography variant="h6" color={colors.grey[100]}>Replacement Commitment</Typography>
                    </Box>
                    <Typography variant="body2" color={colors.grey[400]} mb={2}>
                      You must replace every removed tree with three new trees before your removal report is complete.
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Fulfillment Option</InputLabel>
                      <Select value={removalForm.commitment}
                        onChange={e => setRemovalForm(p => ({ ...p, commitment: e.target.value }))}
                        label="Fulfillment Option"
                        sx={{ color: colors.grey[100], fontSize: "0.95rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
                        <MenuItem value="self">I will plant them myself</MenuItem>
                        <MenuItem value="partner">Plant them for me</MenuItem>
                      </Select>
                    </FormControl>
                    {removalForm.commitment === "self" ? (
                      <Box>
                        <Typography variant="body2" color={colors.grey[300]} mb={1}>
                          Upload photos of 3 new saplings within 30 days to clear your status.
                        </Typography>
                        <input ref={replacementFileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: "none" }}
                          onChange={handleReplacementPhotoSelect} />
                        <Button sx={{ mb: 1, backgroundColor: colors.greenAccent[600]}} variant="outlined" onClick={() => replacementFileRef.current?.click()} size="small">
                          Upload Replacement Photos
                        </Button>
                        {replacementPhotos.length > 0 && (
                          <Typography variant="caption" color={colors.grey[400]} display="block">
                            {replacementPhotos.length} photo{replacementPhotos.length > 1 ? "s" : ""} selected
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color={colors.grey[300]} mb={1}>
                          One-click checkout with local reforestation partners to fund planting of {removalDebt} replacement saplings.
                        </Typography>
                        <Button variant="contained" startIcon={<ShoppingCartIcon />} onClick={handlePartnerFulfilment}
                          sx={{ backgroundColor: colors.greenAccent[700], color: "#fff", "&:hover": { backgroundColor: colors.greenAccent[600] } }}>
                          Request Partner Planting
                        </Button>
                        {partnerCheckoutStarted && (
                          <Typography variant="caption" color={colors.greenAccent[300]} display="block" mt={1}>
                            Partner checkout initiated. You will receive confirmation and tracking information.
                          </Typography>
                        )}
                      </Box>
                    )}
                    <Box mt={2} p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
                      <Typography variant="caption" color={colors.grey[400]}>Penalty path</Typography>
                      <Typography variant="body2" color={colors.grey[300]}>Failure to fulfil replacement within 30 days may result in water service review and potential disconnection.</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${colors.grey[700]}` }}>
                  <CardContent>
                    <Typography variant="h6" color={colors.grey[100]} mb={1}>Smart Compliance & Gamification</Typography>
                    <Typography variant="body2" color={colors.grey[300]}>Canopy Score: <strong>{removalCanopyScore}</strong> — cutting trees reduces it, while replacement activity can restore it.</Typography>
                    <Typography variant="caption" color={colors.grey[400]} display="block" mt={1}>Eco-exemption flags soften penalties for Safety Hazard or Diseased Tree removal.</Typography>
                    <Typography variant="caption" color={colors.grey[400]} display="block" mt={1}>Use location data to choose native species for self-planting and avoid invasive exotics.</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 6: Goals & Leaderboard ── */}
      {tab === 7 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LeaderboardIcon sx={{ color: "#f0c040" }} />
                  <Typography variant="h5" color={colors.grey[100]}>Community Leaderboard</Typography>
                  <Chip label="Anonymous" size="small"
                    sx={{ backgroundColor: colors.grey[700], color: colors.grey[300], fontSize: "0.65rem" }} />
                </Box>
                <Typography variant="body2" color={colors.grey[400]} mb={2}>
                  Top households by carbon reduction this month.
                </Typography>
                {[
                  { rank: 1, name: "Household #A12", reduction: "68%", kg: 3.2, badge: "🥇" },
                  { rank: 2, name: "Household #B07", reduction: "61%", kg: 4.8, badge: "🥈" },
                  { rank: 3, name: "Household #C19", reduction: "54%", kg: 5.7, badge: "🥉" },
                  { rank: 4, name: "You", reduction: `${Math.abs(data?.vs_community_avg || 0)}%`, kg: carbonKg, badge: "🏠" },
                  { rank: 5, name: "Household #D03", reduction: "38%", kg: 7.7, badge: "" },
                ].map(row => (
                  <Box key={row.rank} display="flex" alignItems="center" gap={2} mb={1.5}
                    sx={{ p: 1, borderRadius: 1,
                      backgroundColor: row.name === "You" ? colors.blueAccent[800] + "55" : "transparent",
                      border: row.name === "You" ? `1px solid ${colors.blueAccent[600]}` : "none" }}>
                    <Typography variant="h5" sx={{ minWidth: 28, color: row.rank <= 3 ? "#f0c040" : colors.grey[400] }}>
                      {row.badge || `#${row.rank}`}
                    </Typography>
                    <Box flex={1}>
                      <Typography variant="body2" color={row.name === "You" ? colors.blueAccent[300] : colors.grey[200]}
                        fontWeight={row.name === "You" ? "bold" : "normal"}>
                        {row.name}
                      </Typography>
                      <LinearProgress variant="determinate" value={parseFloat(row.reduction)}
                        sx={{ height: 6, borderRadius: 3, mt: 0.3, backgroundColor: colors.grey[700],
                          "& .MuiLinearProgress-bar": { backgroundColor: colors.greenAccent[500], borderRadius: 3 } }} />
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold">{row.reduction}</Typography>
                      <Typography variant="caption" color={colors.grey[500]}>{row.kg} kg</Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <EmojiEventsIcon sx={{ color: "#f0c040" }} />
                  <Typography variant="h5" color={colors.grey[100]}>Your Achievements</Typography>
                </Box>
                <List dense>
                  {[
                    { icon: <CheckCircleIcon sx={{ color: colors.greenAccent[400] }} />, label: "First Carbon Report", earned: true },
                    { icon: <CheckCircleIcon sx={{ color: colors.greenAccent[400] }} />, label: "10% Reduction Milestone", earned: carbonKg < 11 },
                    { icon: <CheckCircleIcon sx={{ color: carbonKg < 5 ? colors.greenAccent[400] : colors.grey[600] }} />,
                      label: "Low Emitter (< 5 kg/mo)", earned: carbonKg < 5 },
                    { icon: <CheckCircleIcon sx={{ color: (data?.efficiency_rating || 0) >= 80 ? colors.greenAccent[400] : colors.grey[600] }} />,
                      label: "Efficiency Star (80+ rating)", earned: (data?.efficiency_rating || 0) >= 80 },
                    { icon: <CheckCircleIcon sx={{ color: colors.grey[600] }} />, label: "Offset 1 Tonne CO₂", earned: false },
                    { icon: <CheckCircleIcon sx={{ color: colors.grey[600] }} />, label: "6-Month Streak", earned: false },
                  ].map((item, i) => (
                    <ListItem key={i} sx={{ px: 0, opacity: item.earned ? 1 : 0.4 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" color={item.earned ? colors.grey[100] : colors.grey[500]}>
                          {item.label}
                        </Typography>}
                        secondary={<Typography variant="caption" color={item.earned ? colors.greenAccent[500] : colors.grey[600]}>
                          {item.earned ? "Earned" : "Not yet earned"}
                        </Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Offset Request Dialog ── */}
      <Dialog open={purchaseDialog.open} onClose={() => setPurchaseDialog({ open: false, project: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100], fontSize: "1.3rem", fontWeight: "bold",
          borderBottom: `1px solid ${colors.grey[700]}`, pb: 2 }}>
          Request Carbon Offset — {purchaseDialog.project?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box mb={2} p={1.5} sx={{ backgroundColor: colors.blueAccent[800] + "44", borderRadius: 1,
            border: `1px solid ${colors.blueAccent[700]}` }}>
            <Typography variant="body2" color={colors.blueAccent[200]} sx={{ fontSize: "0.95rem" }}>
              🔒 Your request will be reviewed by the administrator before payment is processed.
              A 10% platform fee is added to cover registry costs and system maintenance.
            </Typography>
          </Box>
          <Typography variant="body2" color={colors.grey[300]} mb={2} sx={{ fontSize: "0.95rem" }}>
            {purchaseDialog.project?.description}
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: colors.grey[300], fontSize: "1rem" }}>Tonnes of CO₂ to offset</InputLabel>
            <Select value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)}
              label="Tonnes of CO₂ to offset"
              sx={{ color: colors.grey[100], fontSize: "1rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[500] } }}>
              {[1, 2, 5, 10, 25, 50].map(q => (
                <MenuItem key={q} value={q} sx={{ fontSize: "1rem" }}>
                  {q} tonne{q > 1 ? "s" : ""} — ${(q * (purchaseDialog.project?.price_per_tonne || 0)).toFixed(2)} base
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box p={2} sx={{ backgroundColor: colors.primary[500], borderRadius: 1 }}>
            {[
              ["Base cost", `$${(purchaseQty * (purchaseDialog.project?.price_per_tonne || 0)).toFixed(2)}`],
              ["Platform fee (10%)", `$${(purchaseQty * (purchaseDialog.project?.price_per_tonne || 0) * 0.1).toFixed(2)}`],
              ["Total you pay", `$${(purchaseQty * (purchaseDialog.project?.price_per_tonne || 0) * 1.1).toFixed(2)}`],
            ].map(([label, value], i) => (
              <Box key={label} display="flex" justifyContent="space-between" mb={i < 2 ? 0.5 : 0}>
                <Typography variant="body2" color={colors.grey[400]} sx={{ fontSize: "0.95rem" }}>{label}</Typography>
                <Typography variant="body2" color={i === 2 ? colors.greenAccent[400] : colors.grey[200]}
                  fontWeight={i === 2 ? "bold" : "normal"} sx={{ fontSize: i === 2 ? "1.05rem" : "0.95rem" }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, pt: 2 }}>
          <Button onClick={() => setPurchaseDialog({ open: false, project: null })}
            sx={{ color: colors.grey[300], fontSize: "0.95rem" }}>Cancel</Button>
          <Button variant="contained" startIcon={<VerifiedIcon />}
            onClick={() => { setPurchaseDialog({ open: false, project: null }); setOffsetRequestSent(true); setTab(4); }}
            sx={{ backgroundColor: colors.greenAccent[700], fontSize: "0.95rem",
              "&:hover": { backgroundColor: colors.greenAccent[600] } }}>
            Submit Request to Admin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CarbonFootprintCalculator;
