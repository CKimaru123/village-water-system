import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,
  Chip, Button, IconButton, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Divider, Tabs, Tab, Tooltip, Table, TableBody,
  TableCell, TableHead, TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import EngineeringIcon from "@mui/icons-material/Engineering";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TimelineIcon from "@mui/icons-material/Timeline";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../utils/api";

const STATUSES = ["planning", "ongoing", "on_hold", "completed", "cancelled"];
const TYPES = ["Water Supply", "Sanitation", "Distribution", "Treatment", "Storage", "Borehole", "Solar Pump", "Other"];
const EMPTY = { title: "", description: "", status: "planning", project_type: "Water Supply",
  start_date: "", expected_end_date: "", budget: "", location: "", contractor: "",
  completion_percentage: 0, priority: "medium", beneficiaries: "" };

const MOCK_PROJECTS = [
  { id: 1, title: "Kijiji A Borehole Drilling", description: "Drilling a 120m borehole to serve 450 households in Kijiji A.",
    status: "ongoing", project_type: "Borehole", start_date: "2024-02-01", expected_end_date: "2024-07-31",
    budget: 2800000, location: "Kijiji A", contractor: "AquaDrill Ltd", completion_percentage: 65,
    priority: "high", beneficiaries: 450 },
  { id: 2, title: "Solar Pump Installation — Zone B", description: "Replace diesel pump with 5kW solar system.",
    status: "planning", project_type: "Solar Pump", start_date: "2024-06-01", expected_end_date: "2024-09-30",
    budget: 1500000, location: "Zone B", contractor: "SolarTech Kenya", completion_percentage: 0,
    priority: "high", beneficiaries: 320 },
  { id: 3, title: "Distribution Pipeline Extension", description: "Extend 3.2km pipeline to reach underserved areas.",
    status: "on_hold", project_type: "Distribution", start_date: "2024-01-15", expected_end_date: "2024-05-30",
    budget: 980000, location: "Kijiji C–D corridor", contractor: "PipeWorks Co.", completion_percentage: 30,
    priority: "medium", beneficiaries: 180 },
  { id: 4, title: "Water Treatment Plant Upgrade", description: "Upgrade chlorination and filtration systems.",
    status: "completed", project_type: "Treatment", start_date: "2023-09-01", expected_end_date: "2024-01-31",
    budget: 3200000, location: "Central Treatment Plant", contractor: "WaterPure Ltd", completion_percentage: 100,
    priority: "high", beneficiaries: 1200 },
  { id: 5, title: "Community Storage Tank — Kijiji E", description: "50,000L elevated storage tank construction.",
    status: "ongoing", project_type: "Storage", start_date: "2024-03-10", expected_end_date: "2024-08-15",
    budget: 1750000, location: "Kijiji E", contractor: "BuildRight Ltd", completion_percentage: 45,
    priority: "medium", beneficiaries: 280 },
];

const statusMeta = (s, colors) => ({
  planning:   { color: colors.grey[400],        icon: <ScheduleIcon sx={{ fontSize: 16 }} />,     label: "Planning" },
  ongoing:    { color: colors.blueAccent[400],   icon: <EngineeringIcon sx={{ fontSize: 16 }} />,  label: "Ongoing" },
  on_hold:    { color: "#f0c040",                icon: <PauseCircleIcon sx={{ fontSize: 16 }} />,  label: "On Hold" },
  completed:  { color: colors.greenAccent[400],  icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,  label: "Completed" },
  cancelled:  { color: colors.redAccent[400],    icon: <WarningAmberIcon sx={{ fontSize: 16 }} />, label: "Cancelled" },
}[s] || { color: colors.grey[500], icon: null, label: s });

const priorityColor = (p) => p === "high" ? "#e05c5c" : p === "medium" ? "#f0c040" : "#4cceac";

const StatCard = ({ icon, label, value, color, colors }) => (
  <Card sx={{ backgroundColor: colors.primary[400], border: `1px solid ${color}33`,
    transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
    <CardContent sx={{ textAlign: "center", py: 2 }}>
      <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
      <Typography variant="h3" color={color} fontWeight="bold">{value}</Typography>
      <Typography variant="body2" color={colors.grey[400]} mt={0.3}>{label}</Typography>
    </CardContent>
  </Card>
);

const ProjectTracker = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [detailProject, setDetailProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    adminApi.get("/projects")
      .tr;
jectTrackelt Proxport defau

e
  );
};    </Box>ialog>
      </Ds>
alogAction      </Dion>
  Butt       </
   ect"}reate Proj" : "Cve Changes ? "Saediting : "Saving…"? ving  {sa
           nt" }}>rem !importa "0.95fontSize:ent[600], ueAcclors.blColor: coroundsx={{ backg           Save}
 {handlenClick= ong}vi{saled=ed" disabntaincon variant="to     <But  n>
   cel</Buttot" }}>Canm !importan0.95reSize: "0], font[30eyolors.gr: color={{ csx} e)setOpen(falsck={() => Clion on      <Butt}}>
    }`, pt: 2 700]rs.grey[id ${colo sol`1pxrderTop: ={{ boActions sxog      <Dialt>
  ContenDialog
        </Sx} />} sx={field")tiondescript("nChange={seon} optiorm.descri" value={fioncriptlabel="Desrows={3} iline h multullWidt ftField   <Tex   
    /Grid> <      
   </Grid>            ieldSx} />
)} sx={fend_date"ected_{set("expnChange=end_date} oected_expm.{for  value=           }
   ue }{ shrink: trps={ProInputLabele="date" yp" tDateEnd ected label="Expth  fullWidield     <TextF    
     tem xs={6}>rid i       <G  
      </Grid>         />
 Sx}eld} sx={fitart_date")nge={set("s} onCham.start_datefor    value={       }}
      ink: trueps={{ shrnputLabelPro" Ie="dateate" typrt Dta"Sabel=idth lullWld f    <TextFie          }>
d item xs={6Gri     <       g={2}>
iner spacin<Grid conta           </Grid>
 d>
          </Gri
          />Sx} ={field)} sxciaries"("benefi{sethange=iaries} onCorm.benefic" value={fype="numberes" tBeneficiariel="abWidth ltField full  <Tex       {6}>
     id item xs= <Gr
           >/Grid         <x} />
   } sx={fieldSet")set("budgange={onChorm.budget} value={fnumber" pe="(KES)" tydget abel="Budth llWiField ful     <Text     ={6}>
    d item xs <Gri         }>
  ={2r spacinginerid conta <G     } />
    {fieldSxsx=")} oractntr("coe={set} onChangm.contractor={forvalueactor" bel="ContrlafullWidth TextField     <} />
      dSx} sx={fiel"location")hange={set(ation} onC{form.loclue=vaocation" bel="LlaWidth eld fullTextFi
          <id>      </Grd>
    ri</G        />
    } x={fieldSx0 }} smax: 10{ min: 0, nputProps={age")} ipercentcompletion_nge={set("      onCha    e}
      ercentag_pcompletionm.ue={foral"number" v%" type=n io="Completth labeleld fullWid <TextFi           
  tem xs={6}>    <Grid i>
        id      </Gr
      Control>rm       </Fo      Select>
      </  
         uItem>)}en}>{p}</Mtalize" }"capinsform:  textTra{p} sx={{y={p} value=ke<MenuItem  => igh"].map(p", "hum"medi"low",        {[   
        500] } }}>grey[s.: colorlorerCo": { bordOutlineut-notchedOutlinedInp0], "& .Muis.grey[10olor: color c  sx={{     
           ity""Priorl=")} labe"priorityset(e={ng} onCha.prioritylue={formect va       <Sel     
    utLabel>y</Inp>Priorit[300] }}lors.grey: co{ color={abel sxInputL    <         
   2 }}>mb: ={{ llWidth sxntrol fu     <FormCo         xs={6}>
  item  <Grid       g={2}>
   iner spacinontaid c    <Gr>
            </Gridrid>
    /G          <ntrol>
  ormCo   </F          Select>
   </         m>)}
     {t}</MenuIte{t}>y={t} value=keItem => <MenuS.map(t    {TYPE            ] } }}>
   y[500lors.grecolor: Coder bor {":Outlineednput-notchinedItlOu.Mui"& ], s.grey[100lorlor: cox={{ co          s"
        pe="Tyel)} lab"ct_type{set("proje onChange=t_type}ecojprorm.ue={f<Select val          el>
      Lab/Input0] }}>Type<s.grey[30: colorolorx={{ cutLabel s      <Inp         b: 2 }}>
 sx={{ mdth ullWiontrol frmC      <Fo>
        {6}tem xs=<Grid i        
      </Grid>    rol>
      ontFormC     </       /Select>
          <     
   MenuItem>)}" ")}</"_", eplace(s.ralize" }}>{pit"ca: extTransform{{ tlue={s} sx= key={s} vaItem <Menu(s =>ATUSES.map   {ST            }}>
   ] } ors.grey[500rColor: col { bordee":hedOutlinedInput-notctliniOu"& .Murey[100], olors.gr: cx={{ colo      s         s"
   ="Statu")} labelustat{set("sge= onChans}atu={form.stct value   <Sele      el>
       </InputLab}>Statusrey[300] }colors.gr:  coloel sx={{ <InputLab               
}>{ mb: 2 }sx={ullWidth ntrol f    <FormCo        s={6}>
   item x    <Grid   ={2}>
     er spacingtain conGrid         <>
 2 }} /eldSx, mb: sx={{ ...fitle")} ={set("tingehanC} orm.title{fo value=Title"oject h label="Preld fullWidt  <TextFi        : 3 }}>
 sx={{ ptContent    <Dialogitle>
    </DialogT
        ect"}: "New Proj" ojectEdit Prting ? "  {edi
        pb: 2 }}>rey[700]}`, {colors.gd $: `1px soliom borderBott         
t: "bold",ighontWeortant", fm !imp1.3re": 0], fontSizegrey[10lor: colors.co{{ itle sx=  <DialogT>
      0] } }}rimary[40olors.polor: cgroundCckx: { barProps={{ s      Pape
  thlWidful" ="smWidthlse)} maxtOpen(fa{() => seClose=n={open} ong ope <Dialo */}
     Edit Dialogreate/
      {/* C    )}
ialog>
   </D    ns>
   alogActio   </Di    ton>
   ject</Butit Pro}}>Ednt" ta1rem !imporze: " fontSi00],t[3.blueAccenorsol], color: c500lueAccent[r: colors.b borderColo       sx={{        }}
(true);tOpen; selProject })etaim({ ...d); setForProjectdetailetEditing(; st(null)ectDetailProj { seClick={() =>tlined" onariant="ou  <Button v          tton>
Close</Bunt" }}>em !importa"1rontSize: 00], fy[3s.greor: colorol={{ ct(null)} sxetailProjec => setD onClick={() <Button
           : 2 }}>}`, ptrs.grey[700]{colo $px solidorderTop: `1ions sx={{ b  <DialogAct    >
    ogContental    </Diid>
           </Grid>
             </Gr   
     pography>/Ty  <            }
  d." provideon descripti"Noption || ct.descriroje{detailP               
   .7 }}>ineHeight: 1ey[300], lr: colors.gr coloimportant",0.95rem !ntSize: "hy sx={{ fo  <Typograp            hy>
  n</Typograpriptio}}>Desc, mb: 1.5 .grey[200]olors00, color: c: 7ghtontWeiportant", fm !ime: "1.1rentSizforaphy sx={{  <Typog          >
      /0], my: 2 }}70ey[r: colors.grolorC={{ bordeivider sx<D           
     Box>       </     
     6 } }} />ius:orderRad, b).colortus, colorsject.statailProta(detusMestalor: kgroundCobacbar": { gress-arPro .MuiLine "&            ,
         grey[700]r: colors.ndColoackgrou bus: 6,erRadit: 12, bordeigh={{ h    sx                 0}
ge ||on_percentaletimpcotailProject.alue={deate" vdetermin="ress variantnearProg   <Li              x>
    </Bo    
           phy>pogra  </Ty              
    ercentage}%letion_pt.compilProjec{deta                   >
   }}ight: 700 300], fontWeent[ccolors.blueAr: c", coloportantrem !im: "0.95{ fontSizesx={ypography   <T                  pography>
tion</Typle400] }}>Comgrey[ors., color: col"antport5rem !ime: "0.9{ fontSizphy sx={  <Typogra           
        mb={0.5}>n"etwee-bspace="fyContentex" justifl display="      <Box            2}>
={ <Box mb            phy>
   ss</TypograogrePr], mb: 2 }}>ey[200colors.gr00, color: ht: 7Weigntt", foem !importan: "1.1r={{ fontSizeypography sx   <T             sm={6}>
 s={12} xrid item     <G   
      /Grid>      <     }
   ))              Box>
      </            ography>
  value}</Typize" }}>{"capitalsform: textTran0, ht: 70tWeig[100], fon colors.greyor:", colntm !importaize: "1re={{ fontSypography sx<T                    y>
pographel}</Tyab500 }}>{ltWeight: ], fongrey[400lors., color: cortant"em !impoize: "1r, fontSh: 140idtsx={{ minW<Typography                  
   }}>0]}`, pb: 1 rey[70rs.golo solid ${c1pxtom: ` borderBot5} sx={{} mb={1.={2ex" gapplay="fldisbel} key={la     <Box              (
 => , value])p(([label       ].ma     "],
    "—tring() : DateS.toLocale_end_date)xpected.eilProjectte(deta Da_date ? new_endedpectoject.exdetailPrd", ed En ["Expect         
        ) : "—"],eString(caleDatte).toLotart_daroject.setailPew Date(date ? nject.start_d detailProDate",Start       ["    
         "—"],s} people` :eficiarieject.bendetailPro`${ ? eficiariesect.ben, detailProjes"ciari"Benefi           [    ],
   ` : "—"String()}calet).toLo.budgeProjectdetail{Number( ? `KES $getlProject.bud, detaiget"Bud["                 actor],
 roject.contretailP", d"Contractor  [             ],
   .locationailProjectdetLocation",    ["            y],
   ject.prioritro, detailPrity""Prio      [            ,
" ")]", replace("_tus?.ject.sta detailPro["Status",           e],
       ject_typject.proroetailPpe", d   ["Ty         {[
                      m={6}>
12} sm xs={ <Grid ite             ng={3}>
ainer spaciGrid cont         <}>
   : 3 }x={{ pttent sogCon       <DialgTitle>
     </Dialoe}
        ect.titlilProj      {deta}}>
      ]}`, pb: 2 ey[700lors.gr${co solid 1pxerBottom: ` bord           ",
ldbotWeight: "rtant", fon4rem !impoze: "1.100], fontSirey[ors.g col{ color:gTitle sx={      <Dialo>
    [400] } }}rs.primaryor: colooundColkgr: { bacrProps={{ sx  Pape        llWidth
" fuxWidth="mdll)} malProject(nu => setDetaie={()nClosilProject} o={!!detaopenog     <Dial& (
    oject &ailPr   {det
    Dialog */}etail* D

      {/      )}/Grid>
        <>
     </Grid     </Card>
            ent>
nt   </CardCo   d>
        /Gri    <           
      })}                );
                Grid>
       </               >
   </Box                     y>
 }</Typographabel>{meta.lgrey[400]}or={colors.colaption" ant="cphy vari   <Typogra                      raphy>
 Typog">{count}</ht="boldWeigontr} f={meta.coloor colt="h4"rianraphy vapog      <Ty          
          enter" }}>lign: "c textAor}33`,cola.${met1px solid er: `   bord                    ,
   rRadius: 1rde, bory[500]ors.primalor: colkgroundCo} sx={{ bac   <Box p={2                  
   key={s}>d={2} sm={4} ms={6} <Grid item x                    (
     return         
         colors);ta(s,  statusMeeta = m  const                 length;
  === s).> p.status.filter(p =projectsount = nst c     co       
        > {ap(s =ATUSES.m  {ST             >
   ng={2}iner spacita<Grid con           aphy>
     ry</Typogr Summa{2}>Statusb=00]} m[1colors.grey" color={iant="h5y varypograph   <T           tent>
     <CardCon          }}>
 imary[400] rs.prcoloor: groundColx={{ back     <Card s       
2}>={1d item xsGri      <
    Grid>       </
   ard>    </C  >
      Contentard  </C            Box>
       </    />
                  }
     ] } } }rs.grey[100 color: coloy[500],olors.primarckground: c { baer:p: { contain    toolti                  },
grey[700] }  colors.roke:ine: { st lrid: {0] } } }, gy[40relors.g fill: coext: { ticks: { tis: {axe={{       them         
     or="#fff"ColbelTextla{20} Width=abelSkip           l     
    }}}M` ed(1)6).toFix `${(v / 1eormat: v =>          f          iddle",
  "mtion: si5, legendPo -6dOffset:, legenend: "KES"ft={{ leg axisLe                 -30 }}
   ickRotation:{{ tttom=   axisBo               t[400]]}
  ccenlueAs={[colors.bolor cadding={0.3}   p       
          0 }}eft: 8ottom: 60, l: 20, b0, right{ top: 1rgin={  ma           
       oject"ndexBy="pr} iet"]{["budg    keys=              )}
  t) || 0 })er(p.budgeumbet: N", budg"… 14) + bstring(0,p.title?.su{ project: .map(p => (ojectsata={pr d              Bar
     <Responsive           
       ={260}>eightox h       <B         graphy>
/TypoKES)<on ( Allocati={2}>Budget0]} mbrs.grey[10={colo" colorriant="h5y varaph     <Typog        ntent>
   rdCo <Ca           }}>
   [400]aryolors.primolor: ckgroundCsx={{ bacCard   <          >
d={6}s={12} mGrid item x     <Grid>
      </
         /Card>     <>
       ardContent    </C
             </Box>       
           />   
          }}[100] } } s.greyr: color500], colors.primary[cologround: { backntainer: : { co tooltip                 ,
    [700] } }lors.greytroke: co: { s { linerid:} } }, g0] rs.grey[40olol: c fil: { text: {icks axis: { t   theme={{                 ff"
tColor="#fbelTex  la               e" }}
   ion: "middllegendPosit -50, egendOffset:", l"% Completed: ={{ legen   axisLeft           
      0 }}-3on: otati={{ tickRBottom       axis            r}
  d.data.colos={d =>={0.3} colording        pad            }
0 }: 6eft60, l, bottom: 0, right: 20p: 1={{ to      margin      "
        "projectdexBy=ress"]} in["prog   keys={                 or }))}
rs).colatus, colo.stsMeta(plor: statu        co            || 0,
   ntagercempletion_pep.co, progress: ""…+ 0, 14) bstring(.sutle?ct: p.ti({ proje(p => ap.mtsta={projecda                    ar
eBsponsiv  <Re              }>
   height={260  <Box           raphy>
   w</Typogtion Overvieplet Com2}>Projec mb={rey[100]}r={colors.g"h5" colont=aphy varia<Typogr         nt>
       <CardConte              }}>
[400] rimarys.pColor: colorgroundack{ bard sx={    <C        ={6}>
xs={12} mdtem <Grid i      
    ing={3}>ntainer spac  <Grid co
       2 && (   {tab ===}
   tics */2: Analy{/* Tab 
      )}
     </Card>
      able>
           </TleBody>
      </Tab)}
         }          ;
         )      Row>
    able</T            ll>
         </TableCe             ton>
    conBut /></Ill"ize="sman fontSco<EditI[400] }}>ntAccelue.blors cox={{ color:           s          e); }}
   ru setOpen(tm({ ...p });g(p); setFor { setEditinck={() =>li" onCsize="smallconButton  <I                   ell>
  eC       <Tabl          ll>
   ableCe     </T             }
  : "—") eString(eDatte).toLocaled_end_daectw Date(p.exp? ned_end_date expecte        {p.     >
         }}[400] s.greyr: color sx={{ colo<TableCell                    ell>
ableC   </T                
 : "—"}g() eStrincaldget).toLor(p.buget ? Numbe   {p.bud                  }}>
 ] t[400eenAccengrs.: colorlor={{ coCell sxable  <T           >
       ll </TableCe                 ox>
          </B           >
   /Typography}%<e || 0rcentagompletion_peor}>{p.c={meta.colion" colorriant="captpography va   <Ty                     }} />
 lor } meta.coundColor:{ backgro-bar": arProgress"& .MuiLine                         [700],
   eyr: colors.grologroundC: 3, backrRadiusborde: 6, ight 1, heex:{{ fl  sx=                      e || 0}
  centagetion_per.compl value={pminate"t="deter variangressPro<Linear                    ={1}>
    er" gapItems="centgnx" ali="fleaysplx di    <Bo             }}>
      dth: 120sx={{ minWil CelTable   <          >
        </TableCell                  " }} />
 : "0.7remSizety), fontriColor(p.priotypriori", color: 33" + iority)or(p.prColtyrior: priockgroundCol  sx={{ ba                     
 all"y} size="smitl={p.priorip labe         <Ch          eCell>
       <Tabl                Cell>
able       </T             />
 75rem" }}ze: "0.lor, fontSir: meta.co3", cololor + "3or: meta.coundColckgroba    sx={{                  "
   ="smalll} size={meta.labeel labeta.icon}Chip icon={m          <         eCell>
         <Tabl   
           Cell>type}</Tableect_{p.projrey[300] }}>ors.gr: colsx={{ cololl    <TableCe              
   ell>eCitle}</Tablp.t>{ }}ht: "bold"eig], fontWey[100lors.gr{{ color: coableCell sx=      <T      
        }>"33" } }] + rimary[300: colors.pundColorckgro baer": {={{ "&:hovid} sxeRow key={p.    <Tabl            
  eturn (         r;
       , colors)statuseta(p.a = statusMnst met  co   
           > {d.map(p =iltere       {f   dy>
    <TableBo           bleHead>
   </Ta          /TableRow>
     <
         ))}          l>
      elTableC` }}>{h}</.grey[600]}lorsolid ${copx s: `1tomorderBotbold", b "ontWeight:200], f.grey[or: colorsx={{ col key={h} sleCell      <Tab    
         (ap(h =>"].mActionse", " "Due Datet (KES)","Budg", ogress "Prrity",Prioatus", "e", "St, "Typoject"  {["Pr    
          }>+ "55" }ccent[700] eArs.bluColor: colo{ backgroundeRow sx={bl   <Ta           d>
 <TableHea            <Table>
 
        y[400] }}>ors.primarColor: colround{ backg sx={    <Card   
  && (tab === 1}
      {ble *//* Tab 1: Ta

      {     )}  </Grid>
 
      </Grid>}ter.</Alert>lected filch the seects matojo">No prerity="inf<Alert sev12}>m xs={<Grid ite0 && == th =tered.lengfil {      
    })}      );
              d>
        </Grird>
         </Ca            ent>
    </CardCont           /Box>
               <         
 ton>/Buting<}}>Fund0.8rem"  "ontSize:ent[400], freenAcclors.g: coor sx={{ col                     d } })}
  p.iid: oject_pr { state: { grants",./".e(=> navigatonClick={() l" smalze=" sion<Butt                      
tton>tors</Bu" }}>Contracm0.8rentSize: ", fors.grey[400]colocolor:      sx={{            
        } })}ct_id: p.id : { projeateors", { sttractate("../con => navignClick={()ll" omaize="s s     <Button           
      n>utto   </B                
   etailsw D       Vie                 >
"0.8rem" }}ze: Si font00],ueAccent[3r: colors.bllo, coent[500]lors.blueAccerColor: co{ bord        sx={          
      ct(p)}DetailProje{() => set onClick=lined"t="outarian"small" vze=Button si           <           1.5}>
gap={1} mt={"flex"  display=     <Box      
           </Grid>
                  ))}
                   >
     </Grid                 ox>
           </B               phy>
     ogra{val}</Typgrey[400]}>rs.olor={colo c"tionriant="capypography va       <T                   
  ox></B{icon}00] }}>grey[5rs.olor: colosx={{ c <Box                        .5}>
     gap={0er"cents="lignItem" aflex="Box display       <              ={i}>
     ={6} keyem xs   <Grid it                     => (
n, val], i) ).map(([ico[, v]) => v ].filter((                  ,
   ull])}` : neDateString(.toLocaled_end_date)te(p.expectnew Da ? `Due ${ed_end_date>, p.expect} /Size: 14 }x={{ fontduleIcon s    [<Sche                    null],
 String()}` :).toLocaleer(p.budget{Numbt ? `KES $ />, p.budgeze: 14 }}{ fontSiyIcon sx={<AttachMone          [            r],
  ntracto}} />, p.coze: 14 ntSin sx={{ foersonIco      [<P             ],
     ocation p.l />,Size: 14 }}={{ fontn sxationOnIcooc [<L                 
            {[              0.5}>
  {1} mt={ner spacing=d contai<Gri                         )}

             x>
        </Bo             
   }} />4 } rderRadius:  bo meta.color,r:ckgroundColobar": { barProgress-ea"& .MuiLin                          ],
  grey[700ors.lor: coloundCos: 4, backgrrderRadiueight: 8, bo sx={{ h                      
   age}ercentmpletion_pe={p.conate" valu"determivariant=ress LinearProg          <           ox>
       </B                   pography>
 e}%</Tyentagpletion_perccomd">{p.ol"bontWeight=olor} f.cmetacolor={ion" captvariant="graphy      <Typo                  
   pography></TyProgress}>400]lors.grey[={colorption" coiant="caarhy vograpTyp   <                   }>
    mb={0.5e-between" spacfyContent="justiflex" x display="     <Bo                 1.5}>
     <Box mb={              && (
      != null tagetion_percenomple     {p.c        

             )}       hy>
       grappoption}</Ty>{p.descri={1.5}400]} mbcolors.grey[ color={body2"nt="variaphy pogra<Ty                    n && (
  iptio  {p.descr         
         x>
Bo        </              </Box>
                   >
 oltip      </To              ton>
    But/></Icone="small" izIcon fontSeletet[400] }}><Drs.redAccenlor: colo  sx={{ co                          p.id)}
lete(=> handleDeClick={() small" onon size="   <IconButt                   e">
    "Delete= titl    <Tooltip               tip>
        </Tool                    Button>
 con</I/>l" altSize="smon fonEditIc><t[400] }}.blueAccenor: colorsx={{ col       s               
      en(true); }}Op set...p });Form({ ting(p); set { setEdi{() =>" onClick=size="smalln Butto     <Icon             >
        "Edit" title= <Tooltip                       .5}>
ap={0lex" g="fplay  <Box dis             >
           </Box                 ox>
    </B                  }} />
     "0.7rem"ze:, fontSiy)iorittyColor(p.prorir: pri"33", colo + y)oritprilor(p.rityCo priondColor:kgrou sx={{ bac                       
    all"ze="sm()} siaseerCtoUppy?.itl={p.priorbe la  <Chip                       " }} />
 : "0.75remze], fontSi200t[rs.blueAccen colo0], color:Accent[80blues.Color: color background    sx={{                        mall"
ize="sject_type} s.prop label={p   <Chi               
        m" }} />ze: "0.75reontSicolor, fa.olor: met, c33"r + "r: meta.colockgroundColo{ ba sx={                          "small"
 e=abel} sizabel={meta.l leta.icon}{m <Chip icon=                        ">
 rap="wrap5} flexWp={1} mt={0." gax"flelay=Box disp  <                    raphy>
  }</Typogtitle{p.ht="bold">fontWeiggrey[100]} {colors.olor="h5" cant=ography variTyp         <              flex={1}>
    <Box                   " mb={1}>
 ttars="flex-snItem" alig-betweenpacent="sfyConteflex" justiy="ox displa        <B            nt>
ardConte         <C        " } }}>
 Y(-2px) "translateform:ans: { trver"", "&:ho2s0.nsform ration: "t     transi       
      ta.color}`,id ${mesolt: `4px  borderLef              [400],
   rimary.p colorsndColor:rousx={{ backg  <Card             >
   key={p.id}={6}2} mds={1d item x      <Gri (
           return    
     rs);atus, colosMeta(p.ststatuonst meta =         c  
  p => {ap(ed.m   {filter       
spacing={3}>ner <Grid contai    && (
      === 0     {tab
 ds */} Tab 0: Car
      {/*
   </Box>    ))}
   
    } />rey[600]}` } : colors.gent[500]Accbluelors.= s ? coatus ==lterStsolid ${fipx border: `1     
         rey[300],: colors.g"#fff"  === s ? rStatusiltecolor: f        
      [400],ors.primary0] : colnt[60blueAcce colors. === s ?Statusr: filterndColo    backgrou     ze",
     capitali: "xtTransform, teer"or: "point={{ curs  sx       s)}
   s(tFilterStatuseick={() => Cl         on"
   "small} size= ") "place("_",l" : s.re? "Al"all" = label={s ==ey={s}     <Chip k
      ap(s => (USES].m", ...STAT["all  {">
      rap="wrap={2} flexW={1} mbaplex" g display="f
      <Box*/}* Filter      {/</Tabs>

  />
      "start"osition= iconP>}on /tIcsessmenAss" icon={<"Analyticab label=     <T" />
   tartosition="sonP>} icneIcon /imeli" icon={<Tgress Tablebel="Prob la<Ta   " />
     tart"stion=>} iconPosiIcon /ntessme={<Assds" iconCar"Project abel=     <Tab l  }}>
   
    ght: 3 },t[400], heilueAccenolors.b coundColor:": { backgrtorabs-indica "& .MuiT    " },
    8px 0 0s: "8px borderRadiu55", + "ccent[700]eA colors.bluolor: backgroundC700,Weight: , font"f !important#ffor: "col { d":cte& .Mui-sele
        "},00 : 5ight", fontWeem: "0.95r, fontSizee"orm: "nonnsfextTraey[300], tlors.gr{ color: cob-root": iTa "& .Mu`,
       700]}colors.grey[solid ${m: `2px erBottomb: 3, bord       {{
 " sx=ns="autorollButto scable"scroll} variant="tTab(v)v) => sehange={(_, tab} onCvalue={    <Tabs abs */}
      {/* T
  Grid>
 </
     /Grid>        <olors} />
lors={cnt[300]} coccers.blueAoloolor={cng()} cStries.toLocaleficiarilBenetats.totaue={s    val  es"
      "Beneficiari />} label= 28 }} fontSize:onIcon sx={{n={<Pers icord <StatCa          md={2}>
={6} sm={4}m xsid ite <Gr     id>
     </Gr     lors} />
={co400]} colorsenAccent[grers.r={colo(1)}M`} coloixed6).toFlBudget / 1e.totaKES ${(stats    value={`       "
 etotal Budg} label="Tze: 28 }} />x={{ fontSiIcon sMoneyttachrd icon={<A<StatCa
          } md={2}>6} sm={4 xs={d item  <Gri     
  </Grid>      />
 lors} co={ colors0""#f0c04ld} color=stats.onHo  value={    "
      ="On Holdlabel28 }} />} ntSize: ={{ forcleIcon sxPauseCiard icon={<  <StatC       
 }>sm={4} md={2} item xs={6d  <Grid>
        </Gri     
  olors} />{ccolors=[400]} Accentors.green{colcolor=} completeds.={stat      value  ted"
    le"Compl=} labe} />: 28 } fontSize{{n sx=leIcockCircd icon={<ChetatCar  <S>
        ={4} md={2}sm} em xs={6  <Grid it    /Grid>
   </>
       rs={colors} [300]} coloeAccentcolors.blung} color={stats.ongoi     value={    "
   ngoingbel="O>} la 28 }} /fontSize:{{ ngIcon sx=ngineerin={<EStatCard ico  <       }>
 ={4} md={26} smxs={em id it <Gr
       id>   </Gr     >
s={colors} /400]} colorAccent[blueolors.lor={c} cos.total{statvalue=        ts"
    otal Projecel="T lab28 }} />}ontSize: {{ fon sx=tIcsmenon={<AssesatCard icSt        <>
  m={4} md={2} xs={6} s <Grid item
       ={3}>g={2} mb spacintainerid con  <Grp */}
     stri* KPI

      {/Alert>}r}</}>{erronull)rror(setE() => e={}} onClosb: 2 " sx={{ my="errorlert severitr && <A      {erro </Box>


         </Box>on>
    Buttct</New Projet[600] }}>eAccenrs.blu colondColor:ackgrou   sx={{ b     }}
     n(true);etOpeMPTY); s setForm(Eng(null);etEditik={() => { sliconC        
    on />}on={<AddIcrtIcstaained" ="conton variant     <Butt   tton>
  /IconBu/><efreshIcon 0] }}><Rgrey[40s.: colorlor={{ cod} sxoanClick={ltton o<IconBu          {1}>
lex" gap="flay=x dispBo <     /Box>
  >
        </Typographycts<ojent prd developmeture an infrastrucllnage a>Magrey[400]}rs.olor={c"h6" coloariant=Typography v        <  >
aphygrpo</TyTrackerct Projet="bold">tWeigh0]} fongrey[10={colors." colorriant="h2graphy vaypo  <T   ox>
             <B>
{1}wrap" gap=p="" flexWra"20pxrt" mb=lex-stams="fn" alignIteace-betweet="spifyContenlex" justay="f displ  <Box
    eader */} H
      {/*"20px">    <Box m=  return (

x>
  );
 </Bo
   0] }} />[50entrs.blueAcclocolor: co={{ ress sxProgularirc     <Cx">
 "400pHeight=min"center" ms=" alignIte"centertent=fyConlex" justi display="f="20px" <Box meturn (
   ding) roa
  if (l
  };ey[500] },
lors.grr: coborderColoe": { dOutlinchenotdInput-MuiOutline"& .   [300] },
 greys. color { color:":ottLabel-ro& .MuiInpu    "] },
[100greycolors.r: t": { colose-inpuuiInputBa  "& .M 2,
  Sx = { mb:st fieldon
  c
  }];

    })),rcentage,ion_pemplet p.co     y:
 ",+ "…ing(0, 12) le?.substr.tit x: p
     .map(p => ({ull)!= nentage tion_perc.completer(p => pilprojects.f
    data: 00],Accent[4olors.bluer: c   coloon %",
 eti "Compl   id:[{
 ta = nst trendDa  co

  };
, 0),s) || 0)iarieer(p.benefics + (Numb(s, p) => duce(s.re projectiaries:icBenef total
   || 0), 0),et) p.budg (Number(s, p) => s +educe((ts.r project:Budge   totalength,
 hold").l === "on_atusp => p.sts.filter(jectonHold: prongth,
    ted").le== "completatus =er(p => p.srojects.filtompleted: pth,
    cng").lengngoi== "ous =p.stat(p => ilterects.frojgoing: p    ongth,
cts.lenl: proje{
    tota stats = nsts);

  corStatu filtetatus ====> p.s.filter(p  : projectsects" ? proj= "alltus === filterStailtered 

  const f));t.value }.targe.v, [f]: em(v => ({ ..e) => setFor ( = (f) =>set const 
 ;
"); }
  }elete.ed to dor("Failch { setErrcat   
 d(); }`); loa{id}jects/$prodelete(`/nApi.admiit  awa  try {
  turn;)) re project?"Delete thisfirm("conif (!window.
     (id) => {= asyncndleDelete nst ha  };

  co}
); ving(false{ setSa finally }
   t."); rojeco save pailed t("FsetErrortch { cad();
    }    loase);
   falsetOpen(      m });
 foroject:cts", { prst("/projeApi.powait admin    else a
  form });roject: ng.id}`, { peditiojects/${i.patch(`/prinApg) await admditin if (e{
        try e);
 Saving(tru
    set => {sync ()leSave = at hand  cons
ad]);
; }, [lo { load()(() =>ct useEffe}, []);

 );
  se)tLoading(fal> sefinally(() =   .TS))
   OJECOCK_PRcts(MtProje=> sech(()   .cat         })
 CTS);
OJEOCK_PR: M raw gth > 0 ?raw.len&& raw) sArray(s(Array.iProject      setdata;
  | res.jects |?.pros.data?.data|| rects ?.proje= res.datanst raw   co
      hen(res => {