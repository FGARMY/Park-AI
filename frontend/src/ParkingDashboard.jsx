import { useState, useEffect, useRef } from "react";

const ROWS = ["A","B","C","D","E","F"];
const COLS = 10;
const TOTAL = ROWS.length * COLS;
const VEHICLES = ["MH12AB1234","KA03MH4561","DL8CAF9201","MH20EE4321","GJ01AA7890","MH14ZZ0011","TN22BC3344","RJ14UA5566"];

function makeSlots() {
  return ROWS.flatMap(row =>
    Array.from({ length: COLS }, (_, i) => {
      const occupied = Math.random() > 0.52;
      return {
        id: `${row}${i+1}`, row, col: i+1, occupied,
        vehicle: occupied ? VEHICLES[Math.floor(Math.random()*VEHICLES.length)] : null,
        duration: occupied ? `0${Math.floor(Math.random()*4)+1}:${String(Math.floor(Math.random()*60)).padStart(2,"0")} HRS` : null,
      };
    })
  );
}

function FeedCanvas({ slots }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const C = 10, R = 6, PAD = 20;
    const sw = (W - PAD*2) / C, sh = (H - PAD*2) / R;
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0,0,W,H);
    slots.forEach((s,i) => {
      const c = i%C, r = Math.floor(i/C); if(r>=R) return;
      const x = PAD+c*sw+3, y = PAD+r*sh+3, w = sw-6, h = sh-6;
      if (s.occupied) {
        ctx.fillStyle="#2a2040"; ctx.fillRect(x,y,w,h);
        ctx.fillStyle="#5a4080"; ctx.fillRect(x+w*.12,y+h*.22,w*.76,h*.56);
        ctx.fillStyle="#7a60a0"; ctx.fillRect(x+w*.22,y+h*.15,w*.56,h*.28);
        ctx.strokeStyle="rgba(200,80,80,0.7)"; ctx.lineWidth=1.5; ctx.strokeRect(x,y,w,h);
      } else {
        ctx.fillStyle="rgba(26,122,74,0.15)"; ctx.fillRect(x,y,w,h);
        ctx.strokeStyle="rgba(26,122,74,0.5)"; ctx.lineWidth=1; ctx.setLineDash([3,3]);
        ctx.strokeRect(x+1,y+1,w-2,h-2); ctx.setLineDash([]);
        ctx.fillStyle="rgba(26,122,74,0.5)"; ctx.font=`bold 9px monospace`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("P", x+w/2, y+h/2);
      }
    });
    ctx.strokeStyle="rgba(255,255,255,0.05)"; ctx.lineWidth=0.5; ctx.setLineDash([]);
    for(let c=0;c<=C;c++){ctx.beginPath();ctx.moveTo(PAD+c*sw,PAD);ctx.lineTo(PAD+c*sw,PAD+R*sh);ctx.stroke();}
    for(let r=0;r<=R;r++){ctx.beginPath();ctx.moveTo(PAD,PAD+r*sh);ctx.lineTo(PAD+C*sw,PAD+R*sh-r*0+PAD+r*sh-PAD);ctx.stroke();}
    // scan line
    const scanY = PAD + ((Date.now()/3000)%1)*(R*sh);
    const g = ctx.createLinearGradient(0,scanY-4,0,scanY+4);
    g.addColorStop(0,"rgba(26,122,74,0)"); g.addColorStop(0.5,"rgba(26,122,74,0.25)"); g.addColorStop(1,"rgba(26,122,74,0)");
    ctx.fillStyle=g; ctx.fillRect(0,scanY-4,W,8);
  }, [slots]);
  return <canvas ref={ref} width={700} height={360} style={{width:"100%",height:"100%",display:"block"}} />;
}

export default function ParkingDashboard() {
  const [slots,    setSlots]    = useState(makeSlots);
  const [hovered,  setHovered]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [tab,      setTab]      = useState("map"); // map | camera
  const [search,   setSearch]   = useState("");
  const [tick,     setTick]     = useState(new Date());

  const occupied = slots.filter(s=>s.occupied).length;
  const free     = TOTAL - occupied;
  const pct      = Math.round((occupied/TOTAL)*100);

  useEffect(()=>{
    const id = setInterval(()=>{
      setTick(new Date());
      setSlots(prev=>{
        const next=[...prev], i=Math.floor(Math.random()*next.length);
        const nowOcc=!next[i].occupied;
        next[i]={...next[i],occupied:nowOcc,vehicle:nowOcc?VEHICLES[Math.floor(Math.random()*VEHICLES.length)]:null,duration:nowOcc?"00:01 HRS":null};
        return next;
      });
    },2500);
    return ()=>clearInterval(id);
  },[]);

  const visible = slots.filter(s=>{
    if(filter==="vacant"   && s.occupied)  return false;
    if(filter==="occupied" && !s.occupied) return false;
    if(search && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const byRow = ROWS.map(row=>({ row, slots: visible.filter(s=>s.row===row) }));
  const hovSlot = slots.find(s=>s.id===hovered);

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      body{background:#f4f6f8;font-family:'Inter',sans-serif;}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
      @keyframes fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      .slot-btn{transition:transform 0.12s,box-shadow 0.12s;cursor:pointer;}
      .slot-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.1);}
    `}</style>

    <div style={{minHeight:"100vh",background:"#f4f6f8",display:"flex",flexDirection:"column"}}>

      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:"1px solid #e8eaed",padding:"0 24px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,background:"#1a7a4a",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:13}}>P</span>
          </div>
          <span style={{fontWeight:700,fontSize:14,color:"#1a1a2e"}}>PARKAI</span>
          <span style={{color:"#ddd",fontSize:14}}>|</span>
          <span style={{fontSize:13,color:"#777",fontWeight:500}}>Parking Management System</span>
        </div>
        <div style={{background:"#f4f6f8",border:"1px solid #e0e3e8",borderRadius:7,padding:"5px 12px",fontSize:12,color:"#333",fontWeight:500}}>
          Mall of India – Main ▾
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:12,color:"#555",fontWeight:500}}>Admin / Floor 1</span>
          <div style={{width:28,height:28,borderRadius:"50%",background:"#e8eaf0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"#555"}}>A</div>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#1a7a4a",animation:"blink 2s infinite"}}/>
          <span style={{fontSize:11,color:"#888"}}>{tick.toTimeString().slice(0,8)}</span>
        </div>
      </div>

      {/* STAT STRIP — compact single row */}
      <div style={{display:"flex",gap:12,padding:"12px 24px",background:"#fff",borderBottom:"1px solid #e8eaed"}}>

        {/* Live Availability */}
        <div style={{display:"flex",alignItems:"center",gap:12,background:"#f9fafb",border:"1px solid #e8eaed",borderRadius:10,padding:"10px 16px",flex:1}}>
          <div>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"#888",marginBottom:3}}>Live Availability</div>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{fontSize:22,fontWeight:700,color:"#1a7a4a",lineHeight:1}}>{free}</span>
              <span style={{fontSize:13,color:"#aaa",fontWeight:400}}>/ {TOTAL}</span>
            </div>
            <div style={{fontSize:10,color:"#aaa",marginTop:2}}>Available slots</div>
          </div>
          <svg width={44} height={44} style={{flexShrink:0,marginLeft:"auto"}}>
            <circle cx={22} cy={22} r={17} fill="none" stroke="#f0f0f0" strokeWidth={5}/>
            <circle cx={22} cy={22} r={17} fill="none" stroke="#1a7a4a" strokeWidth={5}
              strokeDasharray={`${(free/TOTAL)*106.8} 106.8`}
              strokeLinecap="round" transform="rotate(-90 22 22)"/>
            <text x={22} y={26} textAnchor="middle" fontSize={9} fontWeight={700} fill="#1a1a2e">{Math.round(free/TOTAL*100)}%</text>
          </svg>
        </div>

        {/* Occupancy Rate */}
        <div style={{display:"flex",alignItems:"center",gap:12,background:"#f9fafb",border:"1px solid #e8eaed",borderRadius:10,padding:"10px 16px",flex:1}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"#888",marginBottom:3}}>Occupancy Rate</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontSize:22,fontWeight:700,color: pct>80?"#c05050":pct>55?"#b07d00":"#1a7a4a",lineHeight:1}}>{pct}%</span>
              <span style={{fontSize:10,background:"#fff8e6",color:"#b07d00",padding:"2px 7px",borderRadius:10,fontWeight:600}}>↑ 12% today</span>
            </div>
            <div style={{marginTop:8,height:3,background:"#ebebeb",borderRadius:2}}>
              <div style={{height:"100%",width:`${pct}%`,background:pct>80?"#c05050":pct>55?"#e09030":"#1a7a4a",borderRadius:2,transition:"width 0.5s"}}/>
            </div>
          </div>
        </div>

        {/* quick counts */}
        <div style={{display:"flex",gap:8}}>
          <div style={{background:"#edf7f1",border:"1px solid #a8d5b8",borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:70}}>
            <div style={{fontSize:18,fontWeight:700,color:"#1a7a4a"}}>{free}</div>
            <div style={{fontSize:10,color:"#2d8a54",fontWeight:600,marginTop:2}}>FREE</div>
          </div>
          <div style={{background:"#f0e8e8",border:"1px solid #c49a9a",borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:70}}>
            <div style={{fontSize:18,fontWeight:700,color:"#7a3a3a"}}>{occupied}</div>
            <div style={{fontSize:10,color:"#b05050",fontWeight:600,marginTop:2}}>OCCUPIED</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{flex:1,padding:"16px 24px 24px",display:"flex",flexDirection:"column",gap:0}}>

        {/* TAB BAR + SEARCH */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:0,background:"#fff",borderRadius:"12px 12px 0 0",border:"1px solid #e8eaed",borderBottom:"none",padding:"12px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:12,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#1a1a2e",marginRight:12}}>Floor Map (Floor 1)</span>
            {/* tabs */}
            {["map","camera"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                background: tab===t?"#1a7a4a":"transparent",
                color: tab===t?"#fff":"#888",
                border: tab===t?"none":"1px solid #e0e3e8",
                borderRadius:7, padding:"5px 14px", fontSize:12, fontWeight:600,
                cursor:"pointer", textTransform:"capitalize",
              }}>
                {t==="map"?"🗺 Floor Map":"📷 Live Camera"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {/* filter pills */}
            {["all","vacant","occupied"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{
                background: filter===f?(f==="occupied"?"#f0e8e8":f==="vacant"?"#edf7f1":"#1a1a2e"):"transparent",
                color: filter===f?(f==="occupied"?"#7a3a3a":f==="vacant"?"#1a7a4a":"#fff"):"#888",
                border:`1px solid ${filter===f?(f==="occupied"?"#c49a9a":f==="vacant"?"#a8d5b8":"#1a1a2e"):"#e0e3e8"}`,
                borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600,
                cursor:"pointer", textTransform:"capitalize",
              }}>
                {f==="all"?"All Slots":f==="vacant"?"Vacant":"Occupied"}
              </button>
            ))}
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="🔍 Search slot..."
              style={{border:"1px solid #e0e3e8",borderRadius:8,padding:"5px 10px",fontSize:12,color:"#333",width:150,outline:"none"}}
            />
          </div>
        </div>

        {/* PANEL */}
        <div style={{background:"#fff",border:"1px solid #e8eaed",borderTop:"none",borderRadius:"0 0 12px 12px",flex:1,overflow:"hidden"}}>

          {/* MAP TAB */}
          {tab==="map" && (
            <div style={{padding:"16px 18px 18px",position:"relative"}}>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {byRow.map(({row,slots:rowSlots})=>(
                  <div key={row} style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#ccc",width:14,flexShrink:0,textAlign:"center"}}>{row}</span>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {rowSlots.map(s=>{
                        const isSel=selected===s.id;
                        return(
                          <div key={s.id} className="slot-btn"
                            onMouseEnter={()=>setHovered(s.id)}
                            onMouseLeave={()=>setHovered(null)}
                            onClick={()=>setSelected(isSel?null:s.id)}
                            style={{
                              width:82,padding:"8px 6px",borderRadius:9,
                              border:isSel?"2px solid #3b82f6":`1.5px solid ${s.occupied?"#c49a9a":"#a8d5b8"}`,
                              background:isSel?"#eff6ff":s.occupied?"#f0e8e8":"#edf7f1",
                              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                              position:"relative",
                            }}>
                            {!s.occupied&&<span style={{position:"absolute",top:5,left:6,fontSize:8,fontWeight:700,color:"#1a7a4a",background:"#d4edda",borderRadius:3,padding:"1px 4px"}}>P</span>}
                            <span style={{fontSize:14,fontWeight:700,color:s.occupied?"#7a3a3a":isSel?"#1d4ed8":"#1a4a2e",marginTop:1}}>{s.id}</span>
                            <span style={{fontSize:8,fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",color:s.occupied?"#b05050":"#2d8a54"}}>
                              {isSel?"SELECTED":s.occupied?"OCCUPIED":"AVAILABLE"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* tooltip */}
              {hovSlot&&hovSlot.occupied&&(
                <div style={{
                  position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",
                  background:"#fff",border:"1px solid #e0e3e8",borderRadius:10,
                  padding:"10px 18px",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
                  fontSize:12,color:"#333",zIndex:200,animation:"fadein 0.15s ease",
                  minWidth:220,pointerEvents:"none",
                }}>
                  <div style={{fontWeight:700,marginBottom:3,color:"#1a1a2e"}}>
                    SLOT {hovSlot.id}: <span style={{color:"#c05050"}}>OCCUPIED</span>
                    <span style={{fontWeight:400,color:"#888",marginLeft:6}}>({hovSlot.duration})</span>
                  </div>
                  <div style={{fontSize:11,color:"#555"}}>Vehicle ID: <span style={{fontWeight:600,color:"#333"}}>{hovSlot.vehicle}</span></div>
                </div>
              )}
            </div>
          )}

          {/* CAMERA TAB */}
          {tab==="camera" && (
            <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:420}}>
              <div style={{padding:"10px 18px",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#1a7a4a",animation:"blink 1.5s infinite"}}/>
                <span style={{fontSize:11,fontWeight:600,color:"#555",letterSpacing:"0.08em",textTransform:"uppercase"}}>CAM_01 · Lot-A · Ground Floor</span>
                <span style={{marginLeft:"auto",fontSize:10,color:"#aaa"}}>YOLOv8 analysis · 48 slots</span>
              </div>
              <div style={{flex:1,background:"#1a1a2e",overflow:"hidden"}}>
                <FeedCanvas slots={slots}/>
              </div>
              <div style={{padding:"8px 18px",background:"#f9fafb",borderTop:"1px solid #f0f0f0",display:"flex",gap:16,fontSize:11,color:"#888"}}>
                <span>🟢 Free: <strong style={{color:"#1a7a4a"}}>{free}</strong></span>
                <span>🔴 Occupied: <strong style={{color:"#c05050"}}>{occupied}</strong></span>
                <span style={{marginLeft:"auto"}}>Connect real feed → replace canvas with <code style={{background:"#f0f0f0",padding:"1px 5px",borderRadius:3}}>localhost:8000/video-feed</code></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </>);
}
