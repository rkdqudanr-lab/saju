// ═══════════════════════════════════════════════════════════
//  🀄 사주 엔진
// ═══════════════════════════════════════════════════════════
const CG=["갑","을","병","정","무","기","경","신","임","계"];
const JJ=["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CGH=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JJH=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CGO=["목","목","화","화","토","토","금","금","수","수"];
const JJO=["수","토","목","목","토","화","화","토","금","금","토","수"];
const OC={목:"#5FAD7A",화:"#E05A3A",토:"#C08830",금:"#B8A035",수:"#4A8EC4"};
const OE={목:"🌿",화:"🔥",토:"🍂",금:"✦",수:"💧"};
const ON={목:"나무",화:"불",토:"흙",금:"금",수:"물"};

const ILGAN_DESC={
  갑:"새로운 길을 먼저 열고 싶은 선구자 기질",
  을:"유연하지만 끝까지 자기 길을 찾는 넝쿨 같은 기질",
  병:"주변을 따뜻하게 밝히는 태양 같은 기질",
  정:"가까운 사람을 위해 자신을 태우는 촛불 같은 기질",
  무:"모든 것을 안아주는 대지 같은 든든한 기질",
  기:"섬세하게 조화를 만드는 정원사 같은 기질",
  경:"한번 결심하면 끝까지 가는 검처럼 날카로운 기질",
  신:"세상을 선명하게 보는 보석 같은 예리한 기질",
  임:"깊이 흐르는 강처럼 지혜롭고 통찰력 있는 기질",
  계:"남들이 못 느끼는 것을 먼저 느끼는 이슬 같은 섬세한 기질",
};

function getSaju(y,m,d,h){
  const yg=((y-4)%10+10)%10,yj=((y-4)%12+12)%12;
  const mb=(y-1900)*12+(m-1),wg=((mb+2)%10+10)%10,wj=((m+1)%12+12)%12;
  const df=Math.floor((new Date(y,m-1,d)-new Date(1900,0,1))/86400000);
  const ig=((df+6)%10+10)%10,ij=((df+2)%12+12)%12;
  const si=Math.floor((h+1)/2)%12,sg=(((ig%5)*2+si)%10+10)%10;
  const all=[CGO[yg],JJO[yj],CGO[wg],JJO[wj],CGO[ig],JJO[ij],CGO[sg],JJO[si%12]];
  const or={목:0,화:0,토:0,금:0,수:0};
  all.forEach(o=>{if(or[o]!==undefined)or[o]++;});
  const dom=Object.entries(or).sort((a,b)=>b[1]-a[1])[0][0];
  const lac=Object.entries(or).sort((a,b)=>a[1]-b[1])[0][0];
  return{
    yeon:{g:CG[yg],j:JJ[yj],gh:CGH[yg],jh:JJH[yj]},
    wol:{g:CG[wg],j:JJ[wj],gh:CGH[wg],jh:JJH[wj]},
    il:{g:CG[ig],j:JJ[ij],gh:CGH[ig],jh:JJH[ij]},
    si:{g:CG[sg],j:JJ[si%12],gh:CGH[sg],jh:JJH[si%12]},
    ilgan:CG[ig],ilji:JJ[ij],ilganDesc:ILGAN_DESC[CG[ig]],or,dom,lac
  };
}


export { STEMS, BRANCHES, ON, getSaju };
