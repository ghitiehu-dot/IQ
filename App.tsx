import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet, TextInput } from "react-native";

type Tab = "home" | "train" | "assess" | "progress";
type Result = { id: string; title: string; score: number; total: number; date: string; domain: string };
type GameId = "memory" | "sequence" | "focus" | "words";
const STORAGE_KEY = "brain-lab-results-v1";
const makePattern = () => { const values = Array.from({length:9}, (_, i) => i); for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; } return values.slice(0, 4); };
const C = { bg:"#080E1D", panel:"#111B30", panel2:"#17243D", line:"#273653", text:"#F4F7FF", muted:"#9AAAC5", blue:"#6D8CFF", cyan:"#55D6D1", violet:"#B49BFF", green:"#77E3A5", amber:"#FFD27A", red:"#FF8C9B" };

const games: {id:GameId; title:string; subtitle:string; domain:string; icon:string; minutes:string}[] = [
  {id:"memory",title:"Memory Matrix",subtitle:"Remember the number pattern",domain:"Visual memory",icon:"▦",minutes:"2 min"},
  {id:"sequence",title:"Number Detective",subtitle:"Find the rule in a sequence",domain:"Logical reasoning",icon:"∑",minutes:"2 min"},
  {id:"focus",title:"Focus Rush",subtitle:"Spot the target symbol",domain:"Attention",icon:"◎",minutes:"1 min"},
  {id:"words",title:"Idea Machine",subtitle:"Generate varied uses for an object",domain:"Creative thinking",icon:"✳",minutes:"3 min"}
];

function Button({title,onPress,secondary=false}: {title:string;onPress:()=>void;secondary?:boolean}) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.button,secondary&&styles.secondaryButton]}><Text style={[styles.buttonText,secondary&&styles.secondaryButtonText]}>{title}</Text></TouchableOpacity>;
}
function Card({children}: {children:React.ReactNode}) { return <View style={styles.card}>{children}</View>; }
function Heading({children}: {children:React.ReactNode}) { return <Text style={styles.heading}>{children}</Text>; }

export default function App() {
  const [tab,setTab] = useState<Tab>("home");
  const [results,setResults] = useState<Result[]>([]);
  const [activeGame,setActiveGame] = useState<GameId|null>(null);
  const [gameRound,setGameRound] = useState(0);
  const [gameScore,setGameScore] = useState(0);
  const [sequenceAnswer,setSequenceAnswer] = useState("");
  const [wordAnswer,setWordAnswer] = useState("");
  const [memoryPattern,setMemoryPattern] = useState<number[]>([]);
  const [memoryPick,setMemoryPick] = useState<number[]>([]);
  const [memoryShowing,setMemoryShowing] = useState(false);
  const [assessmentIndex,setAssessmentIndex] = useState(0);
  const [assessmentScore,setAssessmentScore] = useState(0);
  const [assessmentDone,setAssessmentDone] = useState(false);

  useEffect(()=>{ AsyncStorage.getItem(STORAGE_KEY).then(raw=>{if(raw){try{setResults(JSON.parse(raw) as Result[])}catch{}}}).catch(()=>{}); },[]);
  const saveResult = async (result:Result) => {
    const next=[result,...results].slice(0,100);
    setResults(next);
    try { await AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(next)); } catch {}
  };
  const finishGame = async (score:number,total:number,domain:string,title:string) => {
    await saveResult({id:Date.now().toString(),title,score,total,date:new Date().toISOString(),domain});
    setActiveGame(null); setTab("progress"); setGameRound(0); setGameScore(0); setSequenceAnswer(""); setWordAnswer("");
  };
  const startGame = (id:GameId) => {
    setActiveGame(id); setGameRound(0); setGameScore(0); setSequenceAnswer(""); setWordAnswer(""); setMemoryPick([]);
    if(id==="memory") { const p=makePattern(); setMemoryPattern(p); setMemoryShowing(true); setTimeout(()=>setMemoryShowing(false),1800); }
  };
  const assessment = [
    {q:"What comes next? 2, 4, 8, 16, …",choices:["18","24","32","20"],correct:2,domain:"Reasoning"},
    {q:"Which item is different?",choices:["Triangle","Square","Circle","Blue"],correct:3,domain:"Classification"},
    {q:"If all Nims are Lops and all Lops are Teks, are all Nims Teks?",choices:["Yes","No","Cannot tell","Only sometimes"],correct:0,domain:"Deductive logic"},
    {q:"A book costs ₱80 after a ₱20 discount. What was its original price?",choices:["₱60","₱90","₱100","₱120"],correct:2,domain:"Numerical reasoning"},
    {q:"Which pair has the closest relationship to Bird : Nest?",choices:["Bee : Hive","Fish : Road","Dog : Feather","Tree : Water"],correct:0,domain:"Verbal reasoning"},
    {q:"You face north, turn right, then turn right again. Which direction are you facing?",choices:["East","West","South","North"],correct:2,domain:"Spatial reasoning"},
    {q:"Which number is missing? 3, 6, 11, 18, 27, …",choices:["36","38","39","42"],correct:1,domain:"Pattern reasoning"},
    {q:"You have 3 red and 3 blue socks in a dark drawer. Minimum socks to guarantee a matching-color pair?",choices:["2","3","4","6"],correct:1,domain:"Problem solving"}
  ];
  const average = useMemo(()=>results.length ? Math.round(results.reduce((s,r)=>s+(r.score/Math.max(1,r.total))*100,0)/results.length):0,[results]);
  const currentGame = games.find(g=>g.id===activeGame);

  const finishAssessment = async (score:number) => {
    setAssessmentDone(true); setAssessmentScore(score);
    await saveResult({id:Date.now().toString(),title:"Brain Skills Check-in",score,total:assessment.length,date:new Date().toISOString(),domain:"Mixed reasoning"});
  };
  const chooseAssessment = async (idx:number) => {
    const next=assessmentScore+(idx===assessment[assessmentIndex].correct?1:0);
    if(assessmentIndex===assessment.length-1) await finishAssessment(next);
    else {setAssessmentScore(next);setAssessmentIndex(assessmentIndex+1);}
  };
  const resetAssessment = () => {setAssessmentIndex(0);setAssessmentScore(0);setAssessmentDone(false);setTab("assess");};

  const renderGame = () => {
    if(!currentGame) return null;
    if(activeGame==="memory") return <Card>
      <Text style={styles.eyebrow}>VISUAL MEMORY · ROUND {gameRound+1}/3</Text>
      <Heading>Remember the pattern</Heading>
      <Text style={styles.body}>{memoryShowing?"Memorize the highlighted tiles.":"Tap the tiles you remember."}</Text>
      <View style={styles.grid}>{Array.from({length:9},(_,i)=><TouchableOpacity key={i} onPress={()=>{if(memoryShowing)return;setMemoryPick(p=>p.includes(i)?p.filter(n=>n!==i):[...p,i]);}} style={[styles.tile,(memoryShowing&&memoryPattern.includes(i)||memoryPick.includes(i))&&styles.tileActive]}><Text style={styles.tileText}>{memoryShowing&&memoryPattern.includes(i)?"✦":memoryPick.includes(i)?"✓":""}</Text></TouchableOpacity>)}</View>
      {!memoryShowing&&<Button title="Check pattern" onPress={()=>{const ok=memoryPattern.every(n=>memoryPick.includes(n))&&memoryPick.length===memoryPattern.length;const score=gameScore+(ok?1:0);if(gameRound===2)finishGame(score,3,"Visual memory","Memory Matrix");else{setGameScore(score);setGameRound(r=>r+1);setMemoryPick([]);setMemoryPattern(makePattern());setMemoryShowing(true);setTimeout(()=>setMemoryShowing(false),1600);}}}/>}
      {memoryShowing&&<Text style={styles.muted}>Look carefully…</Text>}
    </Card>;
    if(activeGame==="sequence") {
      const qs=[{q:"2, 4, 8, 16, ?",a:"32"},{q:"1, 4, 9, 16, ?",a:"25"},{q:"5, 10, 20, 40, ?",a:"80"}];
      return <Card><Text style={styles.eyebrow}>LOGIC · ROUND {gameRound+1}/3</Text><Heading>What comes next?</Heading><Text style={styles.sequence}>{qs[gameRound].q}</Text><TextInput value={sequenceAnswer} onChangeText={setSequenceAnswer} keyboardType="number-pad" placeholder="Your answer" placeholderTextColor={C.muted} style={styles.input}/><Button title="Submit answer" onPress={()=>{const score=gameScore+(sequenceAnswer.trim()===qs[gameRound].a?1:0);if(gameRound===2)finishGame(score,3,"Logical reasoning","Number Detective");else{setGameScore(score);setGameRound(r=>r+1);setSequenceAnswer("");}}}/></Card>;
    }
    if(activeGame==="focus") {
      const targets=["◆","●","◆","▲","◆","■","●","◆","▲","■","◆","●"];
      return <Card><Text style={styles.eyebrow}>ATTENTION · ROUND {gameRound+1}/3</Text><Heading>Tap every diamond</Heading><Text style={styles.body}>Tap the diamond symbols below. Avoid other shapes.</Text><View style={styles.symbolGrid}>{targets.map((s,i)=><TouchableOpacity key={i} onPress={()=>{if(s==="◆")setGameScore(v=>v+1);}} style={styles.symbol}><Text style={{fontSize:27,color:s==="◆"?C.cyan:C.violet}}>{s}</Text></TouchableOpacity>)}</View><Button title="Finish round" onPress={()=>{if(gameRound===2)finishGame(Math.min(gameScore,18),18,"Attention","Focus Rush");else setGameRound(r=>r+1);}}/><Text style={styles.muted}>Score records target taps; this is a practice activity, not a clinical attention test.</Text></Card>;
    }
    return <Card><Text style={styles.eyebrow}>CREATIVITY · ROUND {gameRound+1}/1</Text><Heading>Idea Machine</Heading><Text style={styles.body}>Write different, sensible uses for a paper clip. Separate ideas with commas.</Text><TextInput value={wordAnswer} onChangeText={setWordAnswer} multiline placeholder="e.g. bookmark, reset button…" placeholderTextColor={C.muted} style={[styles.input,{height:100,textAlignVertical:"top"}]}/><Button title="Save ideas" onPress={()=>{const ideas=[...new Set(wordAnswer.toLowerCase().split(/[,\n;]/).map(s=>s.trim()).filter(Boolean))];finishGame(Math.min(ideas.length,10),10,"Creative fluency","Idea Machine");}}/><Text style={styles.muted}>Idea count is a simple activity metric; originality is not automatically measured.</Text></Card>;
  };

  return <SafeAreaView style={styles.safe}><StatusBar style="light"/><View style={styles.topbar}><View><Text style={styles.brand}>BRAIN<Text style={{color:C.cyan}}> LAB</Text></Text><Text style={styles.tagline}>TEST · TRAIN · GROW</Text></View><View style={styles.avatar}><Text style={{color:C.cyan,fontWeight:"800"}}>BL</Text></View></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {activeGame ? <><TouchableOpacity onPress={()=>setActiveGame(null)}><Text style={styles.back}>‹  All activities</Text></TouchableOpacity>{renderGame()}</> :
      tab==="home" ? <>
        <View style={styles.hero}><Text style={styles.eyebrow}>YOUR PERSONAL BRAIN GYM</Text><Text style={styles.heroTitle}>A sharper mind starts with a small challenge.</Text><Text style={styles.body}>Explore your skills, practice a little each day, and track your own progress.</Text><Button title="Start a brain workout  →" onPress={()=>setTab("train")}/><View style={styles.heroOrb}><Text style={{fontSize:38}}>✧</Text></View></View>
        <View style={styles.statRow}><View style={styles.stat}><Text style={styles.statValue}>{results.length}</Text><Text style={styles.statLabel}>Activities</Text></View><View style={styles.stat}><Text style={styles.statValue}>{average}%</Text><Text style={styles.statLabel}>Avg. score</Text></View><View style={styles.stat}><Text style={styles.statValue}>{new Set(results.map(r=>r.domain)).size}</Text><Text style={styles.statLabel}>Skills tried</Text></View></View>
        <Heading>Choose your next step</Heading><View style={styles.actionRow}><TouchableOpacity style={styles.actionCard} onPress={()=>setTab("assess")}><Text style={styles.actionIcon}>⌁</Text><Text style={styles.actionTitle}>Skills check-in</Text><Text style={styles.muted}>8 mixed questions</Text></TouchableOpacity><TouchableOpacity style={styles.actionCard} onPress={()=>setTab("train")}><Text style={styles.actionIcon}>✦</Text><Text style={styles.actionTitle}>Mini-games</Text><Text style={styles.muted}>Train a skill</Text></TouchableOpacity></View>
        <Text style={styles.note}>Brain Lab measures performance on its own activities. It does not diagnose conditions or provide an official IQ score.</Text>
      </> : tab==="train" ? <>
        <Text style={styles.eyebrow}>DAILY PRACTICE</Text><Heading>Pick a mini-game</Heading><Text style={styles.body}>Short activities for specific skills. Practice scores may improve with familiarity.</Text>
        {games.map(g=><TouchableOpacity key={g.id} onPress={()=>startGame(g.id)} style={styles.gameRow}><View style={styles.gameIcon}><Text style={{fontSize:25,color:C.cyan}}>{g.icon}</Text></View><View style={{flex:1}}><Text style={styles.gameTitle}>{g.title}</Text><Text style={styles.muted}>{g.subtitle}</Text><Text style={styles.domain}>{g.domain} · {g.minutes}</Text></View><Text style={styles.chevron}>›</Text></TouchableOpacity>)}
      </> : tab==="assess" ? <>
        <Text style={styles.eyebrow}>MIXED SKILLS CHECK-IN</Text>{assessmentDone?<Card><Text style={styles.eyebrow}>CHECK-IN COMPLETE</Text><Heading>{assessmentScore}/{assessment.length} correct</Heading><Text style={styles.body}>That's your score on this set of practice questions. Try other activities to explore more skills.</Text><Button title="Try again" onPress={resetAssessment}/><Button title="View progress" secondary onPress={()=>setTab("progress")}/></Card>:<Card><View style={styles.progressTrack}><View style={[styles.progressFill,{width:(assessmentIndex/assessment.length*100)+"%"}]}/></View><Text style={styles.eyebrow}>QUESTION {assessmentIndex+1} OF {assessment.length}</Text><Heading>{assessment[assessmentIndex].q}</Heading>{assessment[assessmentIndex].choices.map((choice,i)=><TouchableOpacity key={choice} onPress={()=>chooseAssessment(i)} style={styles.choice}><Text style={styles.choiceLetter}>{String.fromCharCode(65+i)}</Text><Text style={styles.choiceText}>{choice}</Text></TouchableOpacity>)}<Text style={styles.muted}>Practice check-in only · no official IQ estimate</Text></Card>}
      </> : <>
        <Text style={styles.eyebrow}>YOUR ACTIVITY HISTORY</Text><Heading>Progress, not perfection.</Heading><View style={styles.statRow}><View style={styles.stat}><Text style={styles.statValue}>{results.length}</Text><Text style={styles.statLabel}>Sessions</Text></View><View style={styles.stat}><Text style={styles.statValue}>{average}%</Text><Text style={styles.statLabel}>Average</Text></View></View>
        {results.length===0?<Card><Heading>Your journey starts here</Heading><Text style={styles.body}>Complete a check-in or mini-game. Your results will be saved on this device.</Text><Button title="Start first activity" onPress={()=>setTab("train")}/></Card>:results.map(r=><View key={r.id} style={styles.resultRow}><View style={{flex:1}}><Text style={styles.gameTitle}>{r.title}</Text><Text style={styles.muted}>{r.domain} · {new Date(r.date).toLocaleDateString()}</Text></View><Text style={styles.resultScore}>{r.score}/{r.total}</Text></View>)}
        {results.length>0&&<Button title="Clear all local history" secondary onPress={()=>{setResults([]);AsyncStorage.removeItem(STORAGE_KEY).catch(()=>{});}}/>}
        <Text style={styles.note}>Results stay on this device. Clearing app data or uninstalling may remove them. Scores are practice metrics, not a diagnosis or standardized IQ score.</Text>
      </>}
    </ScrollView>
    {!activeGame&&<View style={styles.nav}>{([{id:"home",label:"Home",icon:"⌂"},{id:"train",label:"Train",icon:"✦"},{id:"assess",label:"Assess",icon:"◈"},{id:"progress",label:"Progress",icon:"↗"}] as {id:Tab;label:string;icon:string}[]).map(n=><TouchableOpacity key={n.id} onPress={()=>setTab(n.id)} style={styles.navItem}><Text style={[styles.navIcon,tab===n.id&&styles.navSelected]}>{n.icon}</Text><Text style={[styles.navLabel,tab===n.id&&styles.navSelected]}>{n.label}</Text></TouchableOpacity>)}</View>}
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},topbar:{paddingHorizontal:22,paddingTop:12,paddingBottom:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:"#17233A"},brand:{color:C.text,fontSize:20,fontWeight:"900",letterSpacing:2},tagline:{color:C.muted,fontSize:9,letterSpacing:2,marginTop:3},avatar:{width:40,height:40,borderRadius:14,backgroundColor:C.panel2,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},content:{padding:20,paddingBottom:34,gap:16},hero:{backgroundColor:"#121F39",borderRadius:26,padding:22,borderWidth:1,borderColor:"#283D63",overflow:"hidden",gap:13},eyebrow:{color:C.cyan,fontSize:10,fontWeight:"800",letterSpacing:1.8},heroTitle:{color:C.text,fontSize:29,fontWeight:"800",lineHeight:35,maxWidth:310},body:{color:C.muted,fontSize:14,lineHeight:21},heroOrb:{position:"absolute",right:18,top:22,width:58,height:58,borderRadius:29,backgroundColor:"#24345A",alignItems:"center",justifyContent:"center",opacity:.75},button:{backgroundColor:C.blue,paddingVertical:14,paddingHorizontal:16,borderRadius:14,alignItems:"center",justifyContent:"center",marginTop:4},buttonText:{color:"#FFFFFF",fontSize:14,fontWeight:"800"},secondaryButton:{backgroundColor:C.panel2,borderWidth:1,borderColor:C.line},secondaryButtonText:{color:C.text},statRow:{flexDirection:"row",gap:10},stat:{flex:1,backgroundColor:C.panel,borderRadius:17,padding:14,borderWidth:1,borderColor:"#1D2B45"},statValue:{color:C.text,fontSize:23,fontWeight:"800"},statLabel:{color:C.muted,fontSize:11,marginTop:4},heading:{color:C.text,fontSize:21,fontWeight:"800",lineHeight:28,marginBottom:8},actionRow:{flexDirection:"row",gap:12},actionCard:{flex:1,backgroundColor:C.panel,borderRadius:18,padding:15,borderWidth:1,borderColor:C.line,gap:7},actionIcon:{fontSize:25,color:C.cyan},actionTitle:{color:C.text,fontWeight:"800",fontSize:14},muted:{color:C.muted,fontSize:12,lineHeight:18,marginTop:6},note:{color:"#8291AA",fontSize:11,lineHeight:17,marginTop:8},gameRow:{flexDirection:"row",alignItems:"center",gap:13,padding:14,backgroundColor:C.panel,borderRadius:18,borderWidth:1,borderColor:C.line},gameIcon:{width:52,height:52,borderRadius:16,backgroundColor:C.panel2,alignItems:"center",justifyContent:"center"},gameTitle:{color:C.text,fontSize:15,fontWeight:"800"},domain:{color:C.cyan,fontSize:11,marginTop:6},chevron:{fontSize:28,color:C.muted,paddingHorizontal:4},card:{backgroundColor:C.panel,borderRadius:22,borderWidth:1,borderColor:C.line,padding:19,gap:12},choice:{backgroundColor:C.panel2,borderRadius:13,padding:13,flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,borderColor:C.line},choiceLetter:{color:C.cyan,fontWeight:"900",width:25},choiceText:{color:C.text,fontSize:14,flex:1},progressTrack:{height:5,backgroundColor:C.line,borderRadius:5,overflow:"hidden"},progressFill:{height:5,backgroundColor:C.cyan,borderRadius:5},nav:{flexDirection:"row",backgroundColor:"#0D1527",borderTopWidth:1,borderTopColor:C.line,paddingTop:10,paddingBottom:8,paddingHorizontal:8},navItem:{flex:1,alignItems:"center",gap:4,paddingVertical:3},navIcon:{fontSize:20,color:C.muted},navLabel:{fontSize:10,color:C.muted},navSelected:{color:C.cyan,fontWeight:"800"},back:{color:C.cyan,fontSize:14,fontWeight:"700",marginBottom:2},grid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:9,marginVertical:8},tile:{width:"29%",aspectRatio:1,backgroundColor:C.panel2,borderRadius:14,borderWidth:1,borderColor:C.line,alignItems:"center",justifyContent:"center"},tileActive:{backgroundColor:"#2C4773",borderColor:C.cyan},tileText:{fontSize:22,color:C.cyan,fontWeight:"900"},sequence:{fontSize:28,color:C.cyan,fontWeight:"900",textAlign:"center",paddingVertical:14},input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.line,borderRadius:12,color:C.text,padding:13,fontSize:16},symbolGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:8,marginVertical:8},symbol:{width:"22%",aspectRatio:1,backgroundColor:C.panel2,borderRadius:12,alignItems:"center",justifyContent:"center"},resultRow:{flexDirection:"row",alignItems:"center",backgroundColor:C.panel,padding:15,borderRadius:15,borderWidth:1,borderColor:C.line},resultScore:{color:C.cyan,fontSize:17,fontWeight:"900"},sequenceAnswer:{color:C.text}
});
