import { useState, useEffect } from "react";

const PROXY = "https://mygreece-proxy.vercel.app/api/notion";

const REGIONS = [
  { id: "Chania",    tagline: "Old Harbour & White Mountains",     color1: "#0A1E28", color2: "#1D5A6B", emoji: "⛵" },
  { id: "Rethymno", tagline: "Venetian Fortresses & Monasteries",  color1: "#3A1A0A", color2: "#6B3A20", emoji: "🏰" },
  { id: "Heraklion",tagline: "Minoan Palaces & Vineyards",         color1: "#0A2A18", color2: "#1D5A36", emoji: "🏛" },
  { id: "Lasithi",  tagline: "Windmills, Caves & Wild East",       color1: "#1A0A38", color2: "#3A206B", emoji: "🌿" },
];

const CATS = [
  { id: "Beach",      label: "Beaches",      icon: "🌊" },
  { id: "Restaurant", label: "Food & Drink", icon: "🫒" },
  { id: "Activity",   label: "Activities",   icon: "🧗" },
  { id: "Hotel",      label: "Stay",         icon: "🏡" },
  { id: "Village",    label: "Villages",     icon: "⛪" },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --ink:#18181A;--ivory:#F9F6F0;--sand:#EDE8DC;--stone:#9A9490;
  --gold:#C4A55A;--gold-lt:#E8D8AC;--white:#FFFFFF;--cream:#F2EDE3;
  --border:rgba(196,165,90,0.22);
}
body{font-family:'Jost',sans-serif;background:var(--ivory);color:var(--ink);-webkit-font-smoothing:antialiased;}
.app{min-height:100vh;max-width:430px;margin:0 auto;background:var(--ivory);overflow-x:hidden;position:relative;}

/* NAV */
.nav{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:200;
  padding:14px 20px 12px;display:flex;align-items:center;justify-content:space-between;
  background:rgba(249,246,240,0.93);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);}
.logo{display:flex;align-items:baseline;gap:1px;cursor:pointer;}
.logo-my{font-family:'Playfair Display',serif;font-size:21px;font-weight:400;font-style:italic;color:var(--gold);}
.logo-gr{font-family:'Jost',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink);}
.nav-back{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--stone);cursor:pointer;}
.nav-right{font-size:10px;letter-spacing:0.14em;color:var(--stone);text-transform:uppercase;}

/* HERO */
.hero{height:76vh;position:relative;overflow:hidden;display:flex;align-items:flex-end;}
.hero-bg{position:absolute;inset:0;background:linear-gradient(160deg,#0A1E28 0%,#1D4D5E 50%,#3A7A90 100%);}
.hero-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 22% 68%,rgba(196,165,90,0.2) 0%,transparent 55%);}
.hero-dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.055) 1px,transparent 1px);background-size:28px 28px;}
.hero-fade{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 35%,rgba(18,18,20,0.9) 100%);}
.hero-c{position:relative;padding:0 24px 40px;width:100%;}
.h-eye{font-size:10px;font-weight:500;letter-spacing:0.24em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;}
.h-h1{font-family:'Playfair Display',serif;font-size:56px;font-weight:400;line-height:0.95;color:var(--white);margin-bottom:8px;}
.h-h1 em{font-style:italic;color:var(--gold-lt);}
.h-tag{font-size:13px;font-weight:300;color:rgba(255,255,255,0.62);letter-spacing:0.04em;line-height:1.55;margin-bottom:22px;}
.h-stats{display:flex;border:1px solid rgba(196,165,90,0.3);border-radius:12px;overflow:hidden;background:rgba(18,18,20,0.32);backdrop-filter:blur(10px);}
.h-stat{flex:1;padding:13px 0;text-align:center;border-right:1px solid rgba(196,165,90,0.2);}
.h-stat:last-child{border-right:none;}
.h-sn{font-family:'Playfair Display',serif;font-size:21px;color:var(--gold-lt);}
.h-sl{font-size:9px;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.42);margin-top:2px;}

/* SECTION */
.sp{padding:28px 20px 0;}
.sh{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18px;}
.st{font-family:'Playfair Display',serif;font-size:26px;font-weight:400;}

/* REGION CARDS */
.regions{padding:0 20px 8px;display:flex;flex-direction:column;gap:12px;}
.rc{border-radius:18px;overflow:hidden;position:relative;height:150px;cursor:pointer;transition:transform 0.2s;}
.rc:active{transform:scale(0.98);}
.rc-shim{position:absolute;inset:0;background:linear-gradient(110deg,rgba(255,255,255,0.07) 0%,transparent 55%);}
.rc-fade{position:absolute;inset:0;background:linear-gradient(100deg,rgba(18,18,20,0.82) 0%,transparent 62%);}
.rc-body{position:absolute;bottom:18px;left:20px;}
.rc-name{font-family:'Playfair Display',serif;font-size:30px;font-weight:400;color:var(--white);line-height:1;}
.rc-sub{font-size:11px;color:rgba(255,255,255,0.58);margin-top:3px;}
.rc-badge{position:absolute;top:14px;right:14px;background:rgba(196,165,90,0.18);border:1px solid rgba(196,165,90,0.45);border-radius:20px;padding:4px 12px;font-size:9px;letter-spacing:0.1em;color:var(--gold-lt);}
.rc-emoji{position:absolute;right:20px;bottom:16px;font-size:34px;opacity:0.32;}

/* CHIPS */
.chips{padding:22px 20px 28px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;}
.chips::-webkit-scrollbar{display:none;}
.chip{flex-shrink:0;display:flex;align-items:center;gap:5px;padding:8px 16px;border-radius:24px;cursor:pointer;
  font-size:11px;font-weight:500;letter-spacing:0.05em;transition:all 0.18s;
  border:1.5px solid var(--sand);background:var(--white);color:var(--stone);}

/* REGION HERO */
.rh{height:54vh;position:relative;overflow:hidden;display:flex;align-items:flex-end;}
.rh-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 15% 80%,rgba(196,165,90,0.2) 0%,transparent 50%);}
.rh-fade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(18,18,20,0.12) 0%,rgba(18,18,20,0.86) 100%);}
.rh-c{position:relative;padding:0 24px 28px;width:100%;}
.rh-eye{font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
.rh-name{font-family:'Playfair Display',serif;font-size:52px;font-weight:400;line-height:1;color:var(--white);}
.rh-name em{font-style:italic;color:var(--gold-lt);font-size:23px;display:block;margin-top:3px;}
.rh-stats{display:flex;gap:20px;margin-top:14px;}
.rh-sn{font-family:'Playfair Display',serif;font-size:20px;color:var(--gold-lt);}
.rh-sl{font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.48);}

/* CAT SECTION */
.cs{padding:24px 0 2px;}
.cs-head{padding:0 20px;display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.cs-icon{width:34px;height:34px;border-radius:10px;background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.cs-title{font-family:'Playfair Display',serif;font-size:21px;font-weight:400;}
.cs-count{margin-left:auto;font-size:10px;letter-spacing:0.08em;color:var(--stone);}

/* LISTING CARDS */
.ls{padding:0 20px;display:flex;gap:11px;overflow-x:auto;scrollbar-width:none;padding-bottom:6px;}
.ls::-webkit-scrollbar{display:none;}
.lc{flex-shrink:0;width:188px;border-radius:14px;overflow:hidden;background:var(--white);
  box-shadow:0 2px 18px rgba(18,18,20,0.07);cursor:pointer;transition:transform 0.18s;}
.lc:active{transform:scale(0.97);}
.lc-img{height:118px;background:var(--cream);position:relative;display:flex;align-items:center;justify-content:center;font-size:42px;}
.lc-feat{position:absolute;top:8px;left:8px;background:var(--gold);border-radius:4px;padding:2px 7px;font-size:9px;font-weight:700;letter-spacing:0.1em;color:var(--ink);}
.lc-price{position:absolute;top:8px;right:8px;background:rgba(18,18,20,0.62);border-radius:4px;padding:2px 8px;font-size:10px;color:var(--gold-lt);}
.lc-body{padding:10px 13px 13px;}
.lc-name{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:3px;line-height:1.3;}
.lc-sub{font-size:10px;color:var(--stone);}
.lc-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px;}
.lc-tag{background:var(--cream);border-radius:4px;padding:2px 6px;font-size:9px;color:var(--stone);}

/* EMPTY STATE */
.empty{padding:28px 20px;text-align:center;color:var(--stone);font-size:13px;font-weight:300;letter-spacing:0.04em;}
.empty span{display:block;font-size:28px;margin-bottom:8px;opacity:0.4;}

/* LOADING */
.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:40vh;gap:14px;}
.spinner{width:32px;height:32px;border:2px solid var(--sand);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loading-text{font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--stone);}

/* ERROR */
.error-box{margin:20px;padding:16px 18px;background:#fff5f5;border:1px solid #ffcccc;border-radius:12px;font-size:13px;color:#cc4444;line-height:1.5;}

.divider{height:1px;background:var(--sand);margin:4px 20px 0;}
.pb{height:72px;}

/* BOTTOM NAV */
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:200;
  display:flex;background:rgba(249,246,240,0.96);backdrop-filter:blur(16px);
  border-top:1px solid var(--sand);padding:10px 0 18px;}
.bni{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;}
.bni-i{font-size:20px;}
.bni-l{font-size:9px;font-weight:500;letter-spacing:0.08em;color:var(--stone);text-transform:uppercase;}
.bni.on .bni-l{color:var(--gold);}
`;

export default function App() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState("home");
  const [region, setRegion]   = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(PROXY);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setItems(data);
      setLastFetch(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const goHome   = () => { setPage("home"); setRegion(null); };
  const goRegion = r  => { setRegion(r); setPage("region"); };

  const forRegion = (area, cat) =>
    items.filter(i => i.area === area && i.category === cat);

  const totalBeaches = items.filter(i => i.category === "Beach").length;
  const rGrad = r => `linear-gradient(150deg,${r.color1} 0%,${r.color2} 100%)`;

  const CardRow = ({ areaId, cat }) => {
    const list = forRegion(areaId, cat.id);
    if (!list.length) return (
      <div className="empty"><span>{cat.icon}</span>No {cat.label} added yet — add them in Notion!</div>
    );
    return (
      <div className="ls">
        {list.map(b => (
          <div key={b.id} className="lc">
            <div className="lc-img">
              {b.emoji || cat.icon}
              {b.featured && <div className="lc-feat">Featured</div>}
              {b.price && <div className="lc-price">{b.price}</div>}
            </div>
            <div className="lc-body">
              <div className="lc-name">{b.name}</div>
              {b.subarea && <div className="lc-sub">📍 {b.subarea}</div>}
              <div className="lc-tags">
                {b.tags.slice(0,3).map((t,i)=><span key={i} className="lc-tag">{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* NAV */}
        <nav className="nav">
          {page === "home" ? (
            <>
              <div className="logo" onClick={goHome}><span className="logo-my">My</span><span className="logo-gr">Greece</span></div>
              <div className="nav-right">Crete ◈</div>
            </>
          ) : (
            <>
              <div className="nav-back" onClick={goHome}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                {page === "region" ? region.id : "Home"}
              </div>
              <div className="logo" onClick={goHome}><span className="logo-my">My</span><span className="logo-gr">Greece</span></div>
            </>
          )}
        </nav>

        {/* ── HOME ── */}
        {page === "home" && <>
          <div className="hero">
            <div className="hero-bg"/>
            <div className="hero-glow"/>
            <div className="hero-dots"/>
            <div className="hero-fade"/>
            <div className="hero-c">
              <div className="h-eye">Your Insider Guide to</div>
              <div className="h-h1">Crete,<br/><em>Curated.</em></div>
              <div className="h-tag">Beaches, tavernas, hidden villages &amp; stays —<br/>hand-picked by locals for you.</div>
              <div className="h-stats">
                <div className="h-stat"><div className="h-sn">4</div><div className="h-sl">Regions</div></div>
                <div className="h-stat"><div className="h-sn">{loading ? "…" : totalBeaches}</div><div className="h-sl">Beaches</div></div>
                <div className="h-stat"><div className="h-sn">{loading ? "…" : items.length}</div><div className="h-sl">Places</div></div>
              </div>
            </div>
          </div>

          <div className="sp"><div className="sh"><div className="st">Explore Regions</div></div></div>

          {error && <div className="error-box">⚠️ Could not load data: {error}<br/><small>Check your Vercel proxy and Notion connection.</small></div>}

          <div className="regions">
            {REGIONS.map(r => (
              <div key={r.id} className="rc" onClick={()=>goRegion(r)}>
                <div style={{position:"absolute",inset:0,background:rGrad(r)}}/>
                <div className="rc-shim"/><div className="rc-fade"/>
                <div className="rc-body">
                  <div className="rc-name">{r.id}</div>
                  <div className="rc-sub">{r.tagline}</div>
                </div>
                <div className="rc-badge">{forRegion(r.id, "Beach").length + forRegion(r.id, "Restaurant").length + forRegion(r.id, "Activity").length + forRegion(r.id, "Hotel").length + forRegion(r.id, "Village").length} places</div>
                <div className="rc-emoji">{r.emoji}</div>
              </div>
            ))}
          </div>

          <div className="sp" style={{paddingBottom:0}}><div className="sh"><div className="st">Browse by Vibe</div></div></div>
          <div className="chips">
            {CATS.map(c=><div key={c.id} className="chip"><span style={{fontSize:14}}>{c.icon}</span> {c.label}</div>)}
          </div>
          <div className="pb"/>
        </>}

        {/* ── REGION ── */}
        {page === "region" && region && <>
          <div className="rh">
            <div style={{position:"absolute",inset:0,background:rGrad(region)}}/>
            <div className="rh-glow"/><div className="rh-fade"/>
            <div className="rh-c">
              <div className="rh-eye">MyGreece ◈ Crete</div>
              <div className="rh-name">{region.id}<em>{region.tagline}</em></div>
              <div className="rh-stats">
                <div><div className="rh-sn">{forRegion(region.id,"Beach").length}</div><div className="rh-sl">Beaches</div></div>
                <div><div className="rh-sn">{CATS.reduce((a,c)=>a+forRegion(region.id,c.id).length,0)}</div><div className="rh-sl">Total Places</div></div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"/>
              <div className="loading-text">Loading from Notion…</div>
            </div>
          ) : (
            <>
              {CATS.map((cat, i) => (
                <div key={cat.id}>
                  <div className="cs">
                    <div className="cs-head">
                      <div className="cs-icon">{cat.icon}</div>
                      <div className="cs-title">{cat.label}</div>
                      <div className="cs-count">{forRegion(region.id, cat.id).length} spots</div>
                    </div>
                    <CardRow areaId={region.id} cat={cat}/>
                  </div>
                  {i < CATS.length-1 && <div className="divider"/>}
                </div>
              ))}
            </>
          )}
          <div className="pb"/>
        </>}

        {/* BOTTOM NAV */}
        <div className="bnav">
          {[
            { id:"home",    icon:"🏠", label:"Home",    action: goHome },
            { id:"chania",  icon:"⛵", label:"Chania",  action: ()=>goRegion(REGIONS[0]) },
            { id:"rethymno",icon:"🏰", label:"Rethymno",action: ()=>goRegion(REGIONS[1]) },
            { id:"refresh", icon:"↻",  label:"Refresh", action: fetchData },
          ].map(n=>(
            <div key={n.id} className={`bni ${page==="home"&&n.id==="home"?"on":page==="region"&&region?.id===n.id?"on":""}`} onClick={n.action}>
              <div className="bni-i">{n.icon}</div>
              <div className="bni-l">{n.label}</div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
