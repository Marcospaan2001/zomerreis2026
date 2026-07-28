(function(){
"use strict";
/* ============ STATE ============ */
var LS="nzd_";
function lees(k,d){try{var v=localStorage.getItem(LS+k);return v===null?d:JSON.parse(v);}catch(e){return d;}}
function schrijf(k,v){try{localStorage.setItem(LS+k,JSON.stringify(v));}catch(e){}}
var staat={
  persona:lees("persona",null),
  tellers:lees("tellers",{gelato:0,pizza:0,espresso:0,pas:0}),
  quiz:lees("quiz",{}),            // "loc:q" -> {goed:true/false, wie:"roos"}
  bingo:lees("bingo",{}),          // "loc:i" -> true
  stempels:lees("stempels",{}),    // loc -> datumstring
  quest:lees("quest",{}),          // "dag:i" -> true
  checks:lees("checks",{}),        // i -> true
  arcade:lees("arcade",{roos:0,marco:0})
};
var PERSONAS={
  roos:{naam:"Rosanne",emoji:"🌹",rol:"navigator & smaakcommissie",kleur:"roos"},
  marco:{naam:"Marco",emoji:"🧭",rol:"chauffeur & espressoscout",kleur:"marco"}
};
var START=new Date(2026,8,21), EIND=new Date(2026,8,30,23,59,59);
var $=function(s,c){return (c||document).querySelector(s);};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));};

/* ============ TOAST ============ */
var toastTimer=null;
function toast(t){var el=$("#toast");el.textContent=t;el.classList.add("zichtbaar");clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove("zichtbaar");},2600);}

/* ============ ROLLENDE PIZZA BIJ ELKE WISSEL ============ */
var pizzaTeller=0;
function rolPizza(){
  try{if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;}catch(e){}
  var el=document.createElement("div");
  el.className="pizza-rol"+(pizzaTeller++%2?" terug":"");
  el.setAttribute("aria-hidden","true");
  el.textContent="🍕";
  document.body.appendChild(el);
  var weg=function(){if(el.parentNode)el.parentNode.removeChild(el);};
  el.addEventListener("animationend",weg);
  setTimeout(weg,2600);
}
$$(".kompas-stop").forEach(function(s){s.addEventListener("click",rolPizza);});

/* ============ PERSONA ============ */
function zetPersona(p){
  staat.persona=p;schrijf("persona",p);
  var badge=$("#kompas-badge");
  badge.classList.remove("p-roos","p-marco");
  if(p){badge.classList.add("p-"+p);$("#kompas-badge-emoji").textContent=PERSONAS[p].emoji;}
  var pa=$("#pas-avatar"),pn=$("#pas-naam"),pr=$("#pas-rol");
  if(p){pa.textContent=PERSONAS[p].emoji;pn.textContent=PERSONAS[p].naam;pr.textContent=PERSONAS[p].rol;}
  $("#arcade-wie").textContent=p?PERSONAS[p].naam:"reiziger";
  $("#ar-record").textContent=p?(staat.arcade[p]||0):0;
  herbereken();
}
$("#kompas-badge").addEventListener("click",function(){$("#persona-overlay").classList.add("open");});
$("#persona-sluit").addEventListener("click",function(){$("#persona-overlay").classList.remove("open");});
$("#persona-overlay").addEventListener("click",function(e){if(e.target===this)this.classList.remove("open");});
$$(".persona-keuze").forEach(function(b){
  b.addEventListener("click",function(){
    zetPersona(b.dataset.persona);
    $("#persona-overlay").classList.remove("open");
    toast(PERSONAS[b.dataset.persona].emoji+" Welkom, "+PERSONAS[b.dataset.persona].naam+"! Jouw punten tellen nu mee.");
  });
});
if(!staat.persona){setTimeout(function(){$("#persona-overlay").classList.add("open");},900);}

/* ============ KOMPAS: scrollspy + voortgang ============ */
var secties=["cassano","sangregorio","burchen"].map(function(id){return document.getElementById(id);});
function updateKompas(){
  var y=window.scrollY,h=document.documentElement.scrollHeight-window.innerHeight;
  $("#kompas-progress-bar").style.width=(h>0?(y/h*100):0)+"%";
  var actief=null;
  secties.forEach(function(s){if(s.getBoundingClientRect().top<window.innerHeight*.45)actief=s.id;});
  $$(".kompas-stop[data-stop]").forEach(function(st){
    st.classList.remove("current","visited");
    var idx=secties.findIndex(function(s){return s.id===st.dataset.stop;});
    var actIdx=secties.findIndex(function(s){return s.id===actief;});
    if(st.dataset.stop===actief)st.classList.add("current");
    else if(actIdx>-1&&idx<actIdx)st.classList.add("visited");
  });
}
window.addEventListener("scroll",updateKompas,{passive:true});updateKompas();

/* ============ COUNTDOWN + DAGTELLER ============ */
function pad(n){return String(n).padStart(2,"0");}
function updateTijd(){
  var nu=new Date();
  var cd=$("#countdown");
  if(nu<START){
    var diff=START-nu;
    $("#cd-titel").textContent="het aftellen is begonnen...";
    $("#cd-d").textContent=Math.floor(diff/864e5);
    $("#cd-h").textContent=pad(Math.floor(diff/36e5)%24);
    $("#cd-m").textContent=pad(Math.floor(diff/6e4)%60);
    $("#cd-s").textContent=pad(Math.floor(diff/1e3)%60);
  }else if(nu<=EIND){
    cd.innerHTML='<div class="cd-titel">🚗 Jullie zijn onderweg! Buon viaggio!</div>';
  }else{
    cd.innerHTML='<div class="cd-titel">✨ De reis zit erop... maar de herinneringen niet.</div>';
  }
  var dagen=["Heenreis naar Cassano Magnago 🚗","Rit naar het borgo: San Gregorio 🏰","Rome, dag één 🏛️","Rome, dag twee ⛲","Pompeii en Napels 🌋","Tivoli en de villa's 🌿","Over de Simplon naar Bürchen ⛰️","Moosalp-dag 🐄","De grote bergdag 🏔️","Terugreis naar Leerbroek 🏡"];
  var dg=$("#dt-groot"),ds=$("#dt-sub"),dv=$("#dt-vandaag");
  if(nu<START){
    dg.textContent=Math.ceil((START-nu)/864e5);
    ds.textContent="nachtjes slapen tot vertrek";
    dv.innerHTML="Eerste etappe: <b>Leerbroek → Cassano Magnago</b>, maandag 21 september.";
  }else if(nu<=EIND){
    var dag=Math.floor((nu-START)/864e5)+1;
    dg.textContent=dag;ds.textContent="van jullie nazomerdroom";
    dv.innerHTML="Vandaag: <b>"+(dagen[dag-1]||"genieten")+"</b>";
  }else{
    dg.textContent="✓";ds.textContent="nazomerdroom volbracht";
    dv.innerHTML="Tot de volgende... en vergeet het <b>muntje in de Trevi</b> niet: jullie kómen terug.";
  }
}
updateTijd();setInterval(updateTijd,1000);

/* ============ FEITJES ============ */
var feiten=[
  ["🚇","De Gotthardtunnel was bij de opening in 1980 de langste wegtunnel ter wereld: 16,9 km. Jullie zijn er in twaalf minuten doorheen."],
  ["🍦","Gelato bevat minder vet en minder lucht dan Nederlands ijs, en wordt warmer geserveerd. Daarom smaakt het intenser. Wetenschap zegt: neem er nog één."],
  ["⛲","Rome heeft meer dan 2.500 gratis drinkfonteintjes, de 'nasoni'. Houd het gat onderaan dicht en er spuit een boogje omhoog: gratis en ijskoud."],
  ["🌋","Pompeii werd in het jaar 79 bedolven en pas in 1748 serieus opgegraven. Er ligt nóg een derde van de stad onder de as."],
  ["🏛️","De koepel van het Pantheon is al 1.900 jaar de grootste ongewapende betonkoepel ter wereld. Het Romeinse beton-recept zijn we eeuwenlang kwijt geweest."],
  ["💰","Er wordt jaarlijks ruim een miljoen euro uit de Trevifontein gehaald. Alles gaat naar een goededoelenorganisatie."],
  ["🏔️","De Matterhorn (4.478 m) werd pas in 1865 voor het eerst beklommen. Vier van de zeven klimmers overleefden de afdaling niet; het touw hangt in het museum in Zermatt."],
  ["🧊","De Grote Aletschgletsjer is ruim 20 km lang en op het dikste punt 800 meter dik. Hij beweegt zo'n 200 meter per jaar."],
  ["🧀","Raclette komt uit het Wallis: herders smolten de snijkant van een kaaswiel bij het vuur en schraapten hem af. 'Racler' is Frans voor schrapen."],
  ["🍇","September is in Italië de maand van de vendemmia, de wijnoogst. In de Castelli Romani bij San Gregorio ruikt het dan letterlijk naar most."],
  ["🚗","De Simplonpas (2.005 m) werd op bevel van Napoleon aangelegd, zodat zijn kanonnen de Alpen over konden. Jullie Cupra heeft het iets makkelijker."],
  ["🐐","Het Wallis heeft een eigen geitenras: de zwartnekgeit, half zwart, half wit, precies doormidden. Eenmaal gezien, nooit meer vergeten."],
  ["☕","Espresso 'al banco' (staand aan de bar) kost in Italië vaak ruim de helft minder dan zittend aan een tafeltje. Marco's budget-hack bestaat dus echt."],
  ["🚞","De Gornergratbahn klimt sinds 1898 naar 3.089 meter en was de eerste volledig elektrische tandradbaan van Zwitserland."],
  ["🌲","De lariks is de enige naaldboom die zijn naalden verliest. Eind september beginnen de hellingen boven Bürchen goud te kleuren: jullie timing is perfect."],
  ["🍕","De pizza margherita is vernoemd naar koningin Margherita, die in 1889 in Napels een pizza in de kleuren van de vlag kreeg: tomaat, mozzarella, basilicum."]
];
var feitIdx=-1;
$("#feit-btn").addEventListener("click",function(){
  var i;do{i=Math.floor(Math.random()*feiten.length);}while(i===feitIdx&&feiten.length>1);
  feitIdx=i;
  $("#feit-icoon").textContent=feiten[i][0];
  $("#feit-tekst").textContent=feiten[i][1];
});

/* ============ TELLERS ============ */
$$(".teller").forEach(function(t){
  var key=t.dataset.teller,hold=null,gehouden=false;
  function render(){$('[data-teller-num="'+key+'"]').textContent=staat.tellers[key]||0;}
  render();
  t.addEventListener("pointerdown",function(){
    gehouden=false;
    hold=setTimeout(function(){
      gehouden=true;
      if(staat.tellers[key]>0){staat.tellers[key]--;schrijf("tellers",staat.tellers);render();herbereken();toast("−1 ... foutje hersteld");}
    },600);
  });
  function los(){clearTimeout(hold);}
  t.addEventListener("pointerleave",los);t.addEventListener("pointercancel",los);
  t.addEventListener("pointerup",function(){
    clearTimeout(hold);
    if(gehouden)return;
    staat.tellers[key]=(staat.tellers[key]||0)+1;schrijf("tellers",staat.tellers);render();herbereken();
  });
  t.addEventListener("contextmenu",function(e){e.preventDefault();});
});

/* ============ QUIZ ============ */
$$(".duo-zone").forEach(function(zone){
  var loc=zone.dataset.loc;
  $$(".duo-tab",zone).forEach(function(tab){
    tab.addEventListener("click",function(){
      if(!tab.classList.contains("active"))rolPizza();
      $$(".duo-tab",zone).forEach(function(t){t.classList.remove("active");});
      tab.classList.add("active");
      $$(".duo-paneel",zone).forEach(function(p){p.classList.remove("active");});
      var pnl=zone.querySelector(".duo-paneel."+tab.dataset.panel);
      if(pnl)pnl.classList.add("active");
    });
  });
  $$(".quiz-vraag",zone).forEach(function(vraag){
    var q=vraag.dataset.q,sleutel=loc+":"+q;
    var opgeslagen=staat.quiz[sleutel];
    if(opgeslagen){
      vraag.classList.add("klaar");
      $$(".quiz-optie",vraag).forEach(function(o){
        if(o.dataset.correct==="1")o.classList.add("goed");
      });
    }
    $$(".quiz-optie",vraag).forEach(function(optie){
      optie.addEventListener("click",function(){
        if(vraag.classList.contains("klaar"))return;
        if(!staat.persona){$("#persona-overlay").classList.add("open");toast("Kies eerst wie je bent, anders tellen de punten niet!");return;}
        vraag.classList.add("klaar");
        var goed=optie.dataset.correct==="1";
        $$(".quiz-optie",vraag).forEach(function(o){if(o.dataset.correct==="1")o.classList.add("goed");});
        if(!goed)optie.classList.add("fout-gekozen");
        staat.quiz[sleutel]={goed:goed,wie:staat.persona};
        schrijf("quiz",staat.quiz);
        toast(goed?"✔ Goed! +1 punt voor "+PERSONAS[staat.persona].naam:"✘ Helaas... geen punt. Wisselen van reisgenoot helpt niet, we zien alles 😉");
        herbereken();
      });
    });
  });
  $$(".bingo-item",zone).forEach(function(item){
    var sleutel=loc+":"+item.dataset.i;
    if(staat.bingo[sleutel])item.classList.add("gevonden");
    item.addEventListener("click",function(){
      if(staat.bingo[sleutel]){delete staat.bingo[sleutel];item.classList.remove("gevonden");}
      else{staat.bingo[sleutel]=true;item.classList.add("gevonden");}
      schrijf("bingo",staat.bingo);herbereken();
    });
  });
  $$(".lang-card",zone).forEach(function(kaart){
    kaart.addEventListener("click",function(){
      try{
        var u=new SpeechSynthesisUtterance(kaart.dataset.text);
        u.lang=kaart.dataset.lang||"it-IT";u.rate=.9;
        speechSynthesis.cancel();speechSynthesis.speak(u);
      }catch(e){toast("Uitspreken lukt niet op dit apparaat");}
    });
  });
});

/* ============ STEMPELS ============ */
var stempelNamen={cassano:"Cassano Magnago",sangregorio:"San Gregorio",burchen:"Bürchen"};
function renderStempels(){
  $$(".stamp-btn").forEach(function(b){b.classList.toggle("gestempeld",!!staat.stempels[b.dataset.stamp]);});
  $$(".stempel-vak").forEach(function(v){
    var loc=v.dataset.stempel,gezet=!!staat.stempels[loc];
    v.classList.toggle("gezet",gezet);
    $('[data-stempel-datum="'+loc+'"]').textContent=gezet?staat.stempels[loc]:"nog niet";
  });
}
$$(".stamp-btn").forEach(function(b){
  b.addEventListener("click",function(){
    var loc=b.dataset.stamp;
    if(staat.stempels[loc]){delete staat.stempels[loc];toast("Stempel uitgewist");}
    else{
      var d=new Date();
      staat.stempels[loc]=d.getDate()+"-"+(d.getMonth()+1)+"-"+d.getFullYear();
      toast("🛂 Stempel gezet: "+stempelNamen[loc]+"!");
    }
    schrijf("stempels",staat.stempels);renderStempels();herbereken();
  });
});
renderStempels();

/* ============ DAGPLANNER ============ */
$$("#dagplan-tabs .dagplan-tab").forEach(function(tab){
  tab.addEventListener("click",function(){
    if(!tab.classList.contains("active"))rolPizza();
    $$("#dagplan-tabs .dagplan-tab").forEach(function(t){t.classList.remove("active");});
    tab.classList.add("active");
    $$("#dagplan .dagplan-paneel").forEach(function(p){p.classList.toggle("active",p.dataset.dag===tab.dataset.dag);});
  });
});

/* ============ CHECKLIST ============ */
$$(".check-item").forEach(function(c){
  if(staat.checks[c.dataset.check])c.classList.add("af");
  c.addEventListener("click",function(){
    if(staat.checks[c.dataset.check]){delete staat.checks[c.dataset.check];c.classList.remove("af");}
    else{staat.checks[c.dataset.check]=true;c.classList.add("af");}
    schrijf("checks",staat.checks);herbereken();
  });
});

/* ============ QUEST ============ */
var questDagen=[
  {d:"ma 21",naam:"Heenreis + Cassano",ops:[["Zonder ruzie de Gotthard gehaald",15],["Eerste Italiaanse pizza gegeten",10],["'Buonasera' tegen een echte Italiaan gezegd",10]]},
  {d:"di 22",naam:"Rit naar het borgo",ops:[["Panino met porchetta gescoord bij een Autogrill",10],["Aangekomen zonder één verkeerde afslag (navigator-eer)",15],["Avondrondje door San Gregorio gelopen",10]]},
  {d:"wo 23",naam:"Rome I",ops:[["Vóór 9 uur bij het Colosseum gestaan",15],["Selfie met het Forum op de achtergrond",10],["Carbonara óf cacio e pepe gegeten in Monti",10]]},
  {d:"do 24",naam:"Rome II",ops:[["Muntje in de Trevifontein gegooid",10],["De oculus van het Pantheon gezien",10],["Zonsondergang vanaf de Pincio bekeken",15]]},
  {d:"vr 25",naam:"Pompeii + Napels",ops:[["Voor 8 uur in de auto gezeten (respect)",15],["De Vesuvius gefotografeerd vanuit Pompeii",10],["Pizza gegeten in de stad waar hij is uitgevonden",15]]},
  {d:"za 26",naam:"Tivoli",ops:[["Honderd fonteinen geteld in Villa d'Este (schatting mag)",10],["Door Villa Adriana gedwaald",10],["Laatste Italiaanse gelato... geteld in de teller",10]]},
  {d:"zo 27",naam:"Naar Bürchen",ops:[["Foto met de Cupra op de Simplonpas",15],["De adelaar op de pas gespot",10],["Eerste 'Grüezi' correct uitgesproken",10]]},
  {d:"ma 28",naam:"Moosalp",ops:[["Bergmeertje bereikt te voet",15],["Raclette gegeten waar hij is uitgevonden",15],["Koe met bel geaaid (of in elk geval geprobeerd)",10]]},
  {d:"di 29",naam:"De grote bergdag",ops:[["De Matterhorn of de Aletschgletsjer in het echt gezien",20],["Boven de 3.000 meter geweest",15],["Toblerone naast de echte Matterhorn gehouden",10]]},
  {d:"wo 30",naam:"Terugreis",ops:[["Koffer dicht gekregen ondanks de kaas",10],["Top 3 momenten van de reis uitgewisseld in de auto",15],["Veilig thuis: nazomerdroom volbracht",20]]}
];
var actieveQuestDag=0;
function questKlaarPerDag(di){var n=0;questDagen[di].ops.forEach(function(_,i){if(staat.quest[di+":"+i])n++;});return n;}
function renderQuestTabs(){
  var wrap=$("#quest-day-tabs");wrap.innerHTML="";
  questDagen.forEach(function(dag,di){
    var b=document.createElement("button");
    b.className="qd-tab"+(di===actieveQuestDag?" active":"");
    b.innerHTML=dag.d+'<span class="qd-klaar">'+questKlaarPerDag(di)+"/"+dag.ops.length+"</span>";
    b.addEventListener("click",function(){if(di!==actieveQuestDag)rolPizza();actieveQuestDag=di;renderQuestTabs();renderQuestLijst();});
    wrap.appendChild(b);
  });
  $("#quest-dag-naam").textContent=questDagen[actieveQuestDag].naam;
}
function renderQuestLijst(){
  var wrap=$("#quest-daglijst");wrap.innerHTML="";
  questDagen[actieveQuestDag].ops.forEach(function(op,i){
    var sleutel=actieveQuestDag+":"+i;
    var el=document.createElement("div");
    el.className="quest-opdracht"+(staat.quest[sleutel]?" af":"");
    el.innerHTML='<span class="box">✓</span><span class="tekst">'+op[0]+'</span><span class="xp">+'+op[1]+' XP</span>';
    el.addEventListener("click",function(){
      if(staat.quest[sleutel]){delete staat.quest[sleutel];}
      else{staat.quest[sleutel]=true;toast("🏆 +"+op[1]+" XP!");}
      schrijf("quest",staat.quest);
      renderQuestTabs();renderQuestLijst();herbereken();
    });
    wrap.appendChild(el);
  });
}
// bij reisdag: automatisch juiste dag openen
(function(){var nu=new Date();if(nu>=START&&nu<=EIND){actieveQuestDag=Math.min(9,Math.floor((nu-START)/864e5));}})();
renderQuestTabs();renderQuestLijst();

/* ============ BADGES ============ */
var badges=[
  {id:"vertrokken",icoon:"🚗",naam:"Kilometervreter",hoe:"vink alle rij-opdrachten af",check:function(){return staat.quest["0:0"]&&staat.quest["6:0"]&&staat.quest["9:2"];}},
  {id:"stempels",icoon:"🛂",naam:"Stempelaar",hoe:"alle 3 de stempels gezet",check:function(){return ["cassano","sangregorio","burchen"].every(function(l){return staat.stempels[l];});}},
  {id:"gladiator",icoon:"🏛️",naam:"Gladiator",hoe:"Rome-dag I volledig",check:function(){return [0,1,2].every(function(i){return staat.quest["2:"+i];});}},
  {id:"vulkaan",icoon:"🌋",naam:"Vulkaanbedwinger",hoe:"Pompeii-dag volledig",check:function(){return [0,1,2].every(function(i){return staat.quest["4:"+i];});}},
  {id:"trevi",icoon:"🪙",naam:"Fonteinwerper",hoe:"muntje in de Trevi",check:function(){return !!staat.quest["3:0"];}},
  {id:"matterhorn",icoon:"🏔️",naam:"Matterhorn-spotter",hoe:"de grote berg gezien",check:function(){return !!staat.quest["8:0"];}},
  {id:"gelato",icoon:"🍦",naam:"Gelato-goeroe",hoe:"7 gelato's geturfd",check:function(){return (staat.tellers.gelato||0)>=7;}},
  {id:"pizzaiolo",icoon:"🍕",naam:"Pizzaiolo",hoe:"5 pizza's geturfd",check:function(){return (staat.tellers.pizza||0)>=5;}},
  {id:"barista",icoon:"☕",naam:"Barista's vriend",hoe:"10 espresso's geturfd",check:function(){return (staat.tellers.espresso||0)>=10;}},
  {id:"quiz",icoon:"🧠",naam:"Quizmeester",hoe:"alle 10 quizvragen goed",check:function(){var goed=0;for(var k in staat.quiz){if(staat.quiz[k].goed)goed++;}return goed>=10;}},
  {id:"bingo",icoon:"🎯",naam:"Bingo-legende",hoe:"alle 27 bingovakjes",check:function(){return Object.keys(staat.bingo).length>=27;}},
  {id:"arcade",icoon:"🕹️",naam:"Arcade-kampioen",hoe:"score 300+ in Gelato Rush",check:function(){return Math.max(staat.arcade.roos||0,staat.arcade.marco||0)>=300;}}
];
var eerderVerdiend=lees("badges_gezien",{});
function renderBadges(){
  var grid=$("#badge-grid");grid.innerHTML="";var verdiend=0;
  badges.forEach(function(b){
    var af=!!b.check();if(af)verdiend++;
    if(af&&!eerderVerdiend[b.id]){eerderVerdiend[b.id]=true;schrijf("badges_gezien",eerderVerdiend);toast("🎖️ Badge verdiend: "+b.naam+"!");}
    var el=document.createElement("div");
    el.className="badge-kaart"+(af?" verdiend":"");
    el.innerHTML='<div class="b-icoon">'+b.icoon+'</div><div class="b-naam">'+b.naam+'</div><div class="b-hoe">'+b.hoe+'</div>';
    grid.appendChild(el);
  });
  $("#badge-teller").textContent=verdiend+"/12";
  return verdiend;
}

/* ============ XP + SCORES + PASPOORT ============ */
var MAXXP=questDagen.reduce(function(s,d){return s+d.ops.reduce(function(a,o){return a+o[1];},0);},0);
var niveaus=[[0,"Thuisblijver"],[60,"Dagjesmens"],[140,"Reiziger"],[240,"Avonturier"],[330,"Wereldburger"],[MAXXP,"Nazomerdromer"]];
function herbereken(){
  var xp=0;
  questDagen.forEach(function(dag,di){dag.ops.forEach(function(op,i){if(staat.quest[di+":"+i])xp+=op[1];});});
  var niveau=niveaus[0][1];niveaus.forEach(function(n){if(xp>=n[0])niveau=n[1];});
  $("#xp-stand").textContent=xp+" / "+MAXXP+" XP";
  $("#xp-level").textContent="Niveau: "+niveau;
  $("#xp-vul").style.width=Math.min(100,xp/MAXXP*100)+"%";
  // score-badges per locatie
  $$("[data-score-loc]").forEach(function(sb){
    var loc=sb.dataset.scoreLoc,tot=0,goed=0;
    $$('.duo-zone[data-loc="'+loc+'"] .quiz-vraag').forEach(function(v){
      tot++;var st=staat.quiz[loc+":"+v.dataset.q];if(st&&st.goed)goed++;
    });
    sb.textContent=goed+" / "+tot;
  });
  $$("[data-bingo-loc]").forEach(function(bb){
    var loc=bb.dataset.bingoLoc,n=0;
    for(var k in staat.bingo){if(k.indexOf(loc+":")===0)n++;}
    bb.textContent=n+" / 9";
  });
  // duel
  var sr=0,sm=0;
  for(var k in staat.quiz){if(staat.quiz[k].goed){if(staat.quiz[k].wie==="roos")sr++;else if(staat.quiz[k].wie==="marco")sm++;}}
  $("#score-roos").textContent=sr;$("#score-marco").textContent=sm;
  $("#duel-roos").classList.toggle("leidt",sr>sm);
  $("#duel-marco").classList.toggle("leidt",sm>sr);
  var oordeel=$("#duel-oordeel");
  if(sr===0&&sm===0)oordeel.textContent="nog geen vraag beantwoord... wie durft eerst?";
  else if(sr===sm)oordeel.textContent="gelijkspel! dit vraagt om een beslissingsronde bij de gelateria";
  else if(sr>sm)oordeel.textContent="Roos leidt met "+(sr-sm)+" punt"+(sr-sm>1?"en":"")+" ... Marco, de achterbank lonkt";
  else oordeel.textContent="Marco leidt met "+(sm-sr)+" punt"+(sm-sr>1?"en":"")+" ... Roos, tijd voor een tegenaanval";
  // paspoort
  var verdiend=renderBadges();
  $("#pt-xp").textContent=xp;
  $("#pt-badges").textContent=verdiend;
  $("#pt-gelato").textContent=staat.tellers.gelato||0;
}
$("#quest-fab").addEventListener("click",function(){document.getElementById("questmode").scrollIntoView({behavior:"smooth"});});

/* ============ KOPIEER-KNOPPEN ============ */
$$(".copy-link").forEach(function(b){
  b.addEventListener("click",function(){
    var url=b.dataset.url;
    function ok(){toast("Link gekopieerd: stuur naar jezelf of plak in je navigatie-app");}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(ok,function(){toast(url);});}
    else{toast(url);}
  });
});

/* ============ MAAN EASTER EGG ============ */
var maanTikken=0;
$("#cover-maan").addEventListener("click",function(){
  maanTikken++;
  if(maanTikken===3){toast("🌙 Geheim: wie het eerst de Matterhorn ziet, mag de terugreis-playlist kiezen.");maanTikken=0;}
  else toast("✨");
});

/* ============ VUURVLIEGJES ============ */
(function(){
  var canvas=$("#vuurvliegjes");if(!canvas)return;
  var ctx=canvas.getContext("2d"),vlgs=[],rM=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(rM)return;
  function maat(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;}
  maat();window.addEventListener("resize",maat);
  for(var i=0;i<26;i++){vlgs.push({x:Math.random(),y:Math.random(),r:1+Math.random()*2,f:.2+Math.random()*.8,ph:Math.random()*7,vx:(Math.random()-.5)*.0004,vy:(Math.random()-.5)*.0003});}
  (function teken(t){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    vlgs.forEach(function(v){
      v.x+=v.vx;v.y+=v.vy;
      if(v.x<0||v.x>1)v.vx*=-1;if(v.y<0||v.y>1)v.vy*=-1;
      var a=.25+.55*Math.abs(Math.sin(t*.001*v.f+v.ph));
      ctx.beginPath();ctx.arc(v.x*canvas.width,v.y*canvas.height,v.r,0,7);
      ctx.fillStyle="rgba(255,226,138,"+a+")";ctx.shadowBlur=8;ctx.shadowColor="rgba(255,226,138,.8)";ctx.fill();ctx.shadowBlur=0;
    });
    requestAnimationFrame(teken);
  })(0);
})();

/* ============ MUZIEK (WebAudio doosje) ============ */
(function(){
  var actx=null,speelt=false,timer=null,knop=$("#muziek-knop");
  var toonladder=[293.66,329.63,369.99,440,493.88,587.33,659.25];  // D-groot pentatonisch-achtig
  function noot(){
    if(!actx)return;
    var nu=actx.currentTime;
    var f=toonladder[Math.floor(Math.random()*toonladder.length)]*(Math.random()<.25?.5:1);
    var o=actx.createOscillator(),g=actx.createGain();
    o.type="sine";o.frequency.value=f;
    g.gain.setValueAtTime(0,nu);
    g.gain.linearRampToValueAtTime(.05,nu+.05);
    g.gain.exponentialRampToValueAtTime(.0001,nu+2.4);
    o.connect(g);g.connect(actx.destination);
    o.start(nu);o.stop(nu+2.5);
  }
  knop.addEventListener("click",function(){
    if(!speelt){
      try{
        if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();
        actx.resume();
        speelt=true;knop.classList.add("speelt");knop.textContent="🎶";
        noot();timer=setInterval(noot,1400);
        toast("🎵 Reismuziekje aan (zachtjes, beloofd)");
      }catch(e){toast("Geen audio beschikbaar op dit apparaat");}
    }else{
      speelt=false;clearInterval(timer);knop.classList.remove("speelt");knop.textContent="🎵";
      toast("Muziek uit");
    }
  });
})();

/* ============ GELATO RUSH ============ */
(function(){
  var canvas=$("#gelato-canvas"),ctx=canvas.getContext("2d");
  var bezig=false,score=0,levens=3,spullen=[],speler={x:.5},laatste=0,spawnTimer=0,snelheid=1;
  var W=560,H=420;
  function record(){return staat.persona?(staat.arcade[staat.persona]||0):0;}
  function hud(){
    $("#ar-score").textContent=score;
    $("#ar-levens").textContent=levens>0?"❤".repeat(levens):"—";
    $("#ar-record").textContent=record();
  }
  function achtergrond(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="rgba(255,255,255,.5)";
    [[60,40],[180,90],[320,50],[460,80],[520,30],[100,140],[400,150]].forEach(function(s){ctx.fillRect(s[0],s[1],2,2);});
    ctx.font="30px serif";ctx.fillText("🏔️",30,395);ctx.fillText("🏔️",495,395);
  }
  function tekenSpeler(){
    ctx.font="42px serif";ctx.textAlign="center";
    ctx.fillText("🛒",speler.x*W,H-18);
  }
  function tekenIntro(){
    achtergrond();
    ctx.fillStyle="rgba(253,241,211,.95)";ctx.textAlign="center";
    ctx.font="700 26px Georgia";ctx.fillText("GELATO RUSH",W/2,150);
    ctx.font="15px Georgia";ctx.fillText("Vang wat lekker is, ontwijk de wolken",W/2,185);
    ctx.font="52px serif";ctx.fillText("🍦 🍕 ☁️",W/2,260);
    tekenSpeler();
  }
  function start(){
    if(!staat.persona){$("#persona-overlay").classList.add("open");toast("Kies eerst wie je bent: de highscore is persoonlijk!");return;}
    bezig=true;score=0;levens=3;spullen=[];snelheid=1;spawnTimer=0;laatste=performance.now();
    hud();requestAnimationFrame(stap);
  }
  function spawn(){
    var r=Math.random();
    var soort=r<.5?"gelato":(r<.72?"pizza":(r<.9?"wolk":"kaas"));
    spullen.push({soort:soort,x:.06+Math.random()*.88,y:-.08,vy:(.16+Math.random()*.12)*snelheid,rot:Math.random()*6});
  }
  function stap(t){
    if(!bezig)return;
    var dt=Math.min(.05,(t-laatste)/1000);laatste=t;
    spawnTimer-=dt;
    if(spawnTimer<=0){spawn();spawnTimer=Math.max(.35,1-.06*snelheid)/snelheid*.9;}
    snelheid+=dt*.02;
    achtergrond();
    var vangX=speler.x,vangY=1-.075;
    spullen=spullen.filter(function(s){
      s.y+=s.vy*dt*(s.soort==="wolk"?.85:1);
      var em=s.soort==="gelato"?"🍦":s.soort==="pizza"?"🍕":s.soort==="kaas"?"🧀":"☁️";
      ctx.font="34px serif";ctx.textAlign="center";
      ctx.fillText(em,s.x*W,s.y*H);
      if(Math.abs(s.x-vangX)<.075&&Math.abs(s.y-vangY)<.06){
        if(s.soort==="wolk"){levens--;toast("☁️ Nat pak! −1 leven");}
        else{score+=s.soort==="pizza"?25:s.soort==="kaas"?15:10;}
        hud();return false;
      }
      return s.y<1.1;
    });
    tekenSpeler();
    ctx.fillStyle="rgba(253,241,211,.6)";ctx.font="12px Georgia";ctx.textAlign="left";
    ctx.fillText("snelheid "+snelheid.toFixed(1)+"×",10,H-10);
    if(levens<=0){einde();return;}
    requestAnimationFrame(stap);
  }
  function einde(){
    bezig=false;
    var oud=record();
    if(staat.persona&&score>oud){staat.arcade[staat.persona]=score;schrijf("arcade",staat.arcade);toast("🏆 Nieuw record voor "+PERSONAS[staat.persona].naam+": "+score+"!");}
    hud();herbereken();
    achtergrond();
    ctx.fillStyle="rgba(253,241,211,.95)";ctx.textAlign="center";
    ctx.font="700 30px Georgia";ctx.fillText("GAME OVER",W/2,170);
    ctx.font="18px Georgia";ctx.fillText("Score: "+score+(score>oud?"  ·  NIEUW RECORD! 🎉":""),W/2,210);
    ctx.font="14px Georgia";ctx.fillText("Druk op start voor nog een rondje",W/2,245);
  }
  function beweeg(clientX){
    var r=canvas.getBoundingClientRect();
    speler.x=Math.min(.96,Math.max(.04,(clientX-r.left)/r.width));
  }
  canvas.addEventListener("pointermove",function(e){beweeg(e.clientX);});
  canvas.addEventListener("pointerdown",function(e){beweeg(e.clientX);});
  window.addEventListener("keydown",function(e){
    if(!bezig)return;
    if(e.key==="ArrowLeft"){speler.x=Math.max(.04,speler.x-.05);e.preventDefault();}
    if(e.key==="ArrowRight"){speler.x=Math.min(.96,speler.x+.05);e.preventDefault();}
  });
  $("#arcade-start").addEventListener("click",start);
  tekenIntro();hud();
})();

/* init */
zetPersona(staat.persona);
herbereken();
})();
