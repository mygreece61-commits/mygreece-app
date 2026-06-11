import { useState, useEffect, useRef, useCallback } from "react";

const PROXY      = "https://mygreece-proxy.vercel.app/api/notion";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzptpWWo0eF9JG1SLFHNpYxQHp7AoajGZlRfmOryQD703r_RO0RekR0vIXPCx3MV_XW/exec";
const SECRET_KEY = "mygreece2024secret"; // ← change this to match your Apps Script

const REGIONS = [
  { id:"Chania",    tagline:"Old Harbour & White Mountains",     color1:"#0A1E28", color2:"#1D5A6B", emoji:"⛵" },
  { id:"Rethymno",  tagline:"Venetian Fortresses & Monasteries", color1:"#3A1A0A", color2:"#6B3A20", emoji:"🏰" },
  { id:"Heraklion", tagline:"Minoan Palaces & Vineyards",        color1:"#0A2A18", color2:"#1D5A36", emoji:"🏛" },
  { id:"Lasithi",   tagline:"Windmills, Caves & Wild East",      color1:"#1A0A38", color2:"#3A206B", emoji:"🌿" },
];

const CATS = [
  { id:"Beach",      label:"Beaches",      icon:"🌊" },
  { id:"Restaurant", label:"Food & Drink", icon:"🫒" },
  { id:"Activity",   label:"Activities",   icon:"🧗" },
  { id:"Hotel",      label:"Stay",         icon:"🏡" },
  { id:"Village",    label:"Villages",     icon:"⛪" },
];

const DEFAULT_TIPS = {
  Beach:      ["Visit early morning to avoid crowds","Bring water and snacks — facilities may be limited","Check wind conditions before visiting","Water shoes recommended for rocky entry points"],
  Restaurant: ["Reservations recommended in peak season","Ask for the daily specials — usually the freshest","Lunch is often better value than dinner","Tipping 10% is appreciated but not mandatory"],
  Activity:   ["Book in advance during summer months","Wear appropriate footwear and sun protection","Check weather forecasts before heading out","Start early to avoid the midday heat"],
  Hotel:      ["Request a sea view room when booking","Check cancellation policy before confirming","Breakfast is often worth adding","Ask about early check-in if arriving by morning flight"],
  Village:    ["Visit on weekday mornings for authentic experience","Find the local kafeneio — great place to meet locals","Park outside and explore on foot","Dress modestly when visiting churches"],
};

const parseTips = (raw, cat) => {
  if (raw && raw.trim()) return raw.split("\n").map(t=>t.trim()).filter(Boolean);
  return DEFAULT_TIPS[cat] || DEFAULT_TIPS.Beach;
};

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

/* ── GATE PAGE ── */
.gate{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;background:var(--ivory);}
.gate-logo{display:flex;align-items:baseline;gap:1px;margin-bottom:40px;}
.gate-my{font-family:'Playfair Display',serif;font-size:32px;font-weight:400;font-style:italic;color:var(--gold);}
.gate-gr{font-family:'Jost',sans-serif;font-size:22px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink);}
.gate-hero{width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,#0A1E28,#1D5A6B);
  display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:28px;
  box-shadow:0 8px 32px rgba(29,77,94,0.3);}
.gate-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:400;text-align:center;margin-bottom:8px;line-height:1.2;}
.gate-sub{font-size:13px;font-weight:300;color:var(--stone);text-align:center;line-height:1.6;margin-bottom:36px;}
.gate-input-wrap{width:100%;max-width:340px;position:relative;margin-bottom:14px;}
.gate-input{width:100%;padding:16px 20px;border:2px solid var(--sand);border-radius:14px;
  font-family:'Jost',sans-serif;font-size:15px;font-weight:500;letter-spacing:0.08em;
  color:var(--ink);background:var(--white);outline:none;transition:border 0.2s;text-align:center;text-transform:uppercase;}
.gate-input:focus{border-color:var(--gold);}
.gate-input::placeholder{letter-spacing:0.06em;font-weight:300;text-transform:none;color:var(--stone);}
.gate-btn{width:100%;max-width:340px;padding:16px;border-radius:14px;background:var(--ink);
  color:var(--gold);font-family:'Jost',sans-serif;font-size:13px;font-weight:600;
  letter-spacing:0.12em;text-transform:uppercase;border:none;cursor:pointer;transition:opacity 0.2s;margin-bottom:16px;}
.gate-btn:active{opacity:0.82;}
.gate-btn:disabled{opacity:0.5;cursor:not-allowed;}
.gate-error{font-size:12px;color:#cc4444;text-align:center;margin-bottom:8px;min-height:18px;}
.gate-success{font-size:12px;color:#2d8a4e;text-align:center;margin-bottom:8px;}
.gate-footer{font-size:11px;color:var(--stone);text-align:center;line-height:1.6;margin-top:8px;}
.gate-divider{display:flex;align-items:center;gap:12px;width:100%;max-width:340px;margin:20px 0;}
.gate-divider-line{flex:1;height:1px;background:var(--sand);}
.gate-divider-text{font-size:11px;color:var(--stone);letter-spacing:0.08em;text-transform:uppercase;}
.gate-buy-btn{width:100%;max-width:340px;padding:16px;border-radius:14px;
  background:linear-gradient(135deg,#C4A55A,#E8D8AC);
  color:var(--ink);font-family:'Jost',sans-serif;font-size:13px;font-weight:700;
  letter-spacing:0.1em;text-transform:uppercase;border:none;cursor:pointer;
  transition:opacity 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;
  box-shadow:0 4px 20px rgba(196,165,90,0.35);}
.gate-buy-btn:active{opacity:0.85;}
.gate-buy-sub{font-size:11px;color:var(--stone);text-align:center;margin-top:8px;}
.cr-wrap{width:100%;max-width:340px;margin:28px 0 0;}
.cr-label{font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--stone);text-align:center;margin-bottom:16px;}
.cr-outer{overflow:hidden;border-radius:20px;box-shadow:0 8px 40px rgba(18,18,20,0.18);border:1.5px solid var(--border);cursor:pointer;}
.cr-track{display:flex;transition:transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94);}
.cr-slide{flex-shrink:0;width:100%;}
.cr-slide img{width:100%;display:block;}
.cr-dots{display:flex;gap:7px;justify-content:center;margin-top:14px;}
.cr-dot{width:6px;height:6px;border-radius:50%;background:var(--sand);transition:all 0.25s;cursor:pointer;}
.cr-dot.on{width:20px;border-radius:4px;background:var(--gold);}
.cr-caps{display:flex;gap:8px;justify-content:center;margin-top:10px;}
.cr-cap{font-size:10px;font-weight:500;letter-spacing:0.06em;color:var(--stone);opacity:0.6;transition:all 0.25s;cursor:pointer;}
.cr-cap.on{color:var(--ink);opacity:1;font-weight:700;}
.gate-preview{width:100%;max-width:340px;margin:24px 0 0;}
.gate-preview-title{font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--stone);text-align:center;margin-bottom:14px;}
.gate-screens{display:flex;gap:10px;justify-content:center;}
.gate-screen{flex:1;max-width:150px;border-radius:14px;overflow:hidden;border:1.5px solid var(--border);
  box-shadow:0 4px 20px rgba(18,18,20,0.1);background:var(--ink);}
.gate-screen-header{background:var(--ink);padding:8px 10px;display:flex;align-items:center;justify-content:space-between;}
.gate-screen-logo{font-size:10px;color:var(--gold);font-style:italic;font-weight:600;}
.gate-screen-body{background:var(--ivory);}
.gate-screen-hero{height:72px;background:linear-gradient(135deg,#0A1E28,#1D5A6B);display:flex;align-items:flex-end;padding:8px;}
.gate-screen-hero-text{font-size:11px;color:var(--white);font-style:italic;opacity:0.9;}
.gate-screen-section{padding:8px;}
.gate-screen-label{font-size:8px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--stone);margin-bottom:6px;}
.gate-screen-card{background:var(--white);border-radius:6px;padding:6px 8px;margin-bottom:5px;display:flex;align-items:center;gap:6px;border:1px solid var(--sand);}
.gate-screen-card-img{width:24px;height:24px;border-radius:5px;font-size:14px;display:flex;align-items:center;justify-content:center;background:var(--cream);}
.gate-screen-card-name{font-size:8px;font-weight:500;color:var(--ink);}
.gate-screen-card-sub{font-size:7px;color:var(--stone);}
.gate-screen-map{height:90px;background:linear-gradient(160deg,#b8d8e8,#c8e4d8);position:relative;overflow:hidden;}
.gate-screen-pin{position:absolute;display:flex;flex-direction:column;align-items:center;}
.gate-screen-pin-bubble{background:#1D7A9E;color:white;font-size:7px;padding:2px 6px;border-radius:8px;font-weight:600;white-space:nowrap;}
.gate-screen-pin-tail{width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;border-top:4px solid #1D7A9E;}
.gate-spinner{width:20px;height:20px;border:2px solid rgba(196,165,90,0.3);border-top-color:var(--gold);
  border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto;}
@keyframes spin{to{transform:rotate(360deg);}}

/* ── NAV ── */
.nav{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:200;
  padding:14px 20px 12px;display:flex;align-items:center;justify-content:space-between;
  background:rgba(249,246,240,0.93);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);}
.logo{display:flex;align-items:baseline;gap:1px;cursor:pointer;}
.logo-my{font-family:'Playfair Display',serif;font-size:21px;font-weight:400;font-style:italic;color:var(--gold);}
.logo-gr{font-family:'Jost',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink);}
.nav-back{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--stone);cursor:pointer;}
.nav-right{font-size:10px;letter-spacing:0.14em;color:var(--stone);text-transform:uppercase;cursor:pointer;}

/* ── HERO ── */
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

.sp{padding:28px 20px 0;}
.sh{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18px;}
.st{font-family:'Playfair Display',serif;font-size:26px;font-weight:400;}

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

.chips{padding:22px 20px 28px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;}
.chips::-webkit-scrollbar{display:none;}
.chip{flex-shrink:0;display:flex;align-items:center;gap:5px;padding:8px 16px;border-radius:24px;
  font-size:11px;font-weight:500;border:1.5px solid var(--sand);background:var(--white);color:var(--stone);}

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

.cs{padding:24px 0 2px;}
.cs-head{padding:0 20px;display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.cs-icon{width:34px;height:34px;border-radius:10px;background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.cs-title{font-family:'Playfair Display',serif;font-size:21px;font-weight:400;}
.cs-count{margin-left:auto;font-size:10px;letter-spacing:0.08em;color:var(--stone);}

.ls{padding:0 20px;display:flex;gap:11px;overflow-x:auto;scrollbar-width:none;padding-bottom:6px;}
.ls::-webkit-scrollbar{display:none;}
.lc{flex-shrink:0;width:188px;border-radius:14px;overflow:hidden;background:var(--white);
  box-shadow:0 2px 18px rgba(18,18,20,0.07);cursor:pointer;transition:transform 0.18s;}
.lc:active{transform:scale(0.97);}
.lc-img{height:118px;background:var(--cream);position:relative;display:flex;align-items:center;justify-content:center;font-size:42px;overflow:hidden;}
.lc-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.lc-emoji{position:relative;z-index:1;}
.lc-feat{position:absolute;top:8px;left:8px;background:var(--gold);border-radius:4px;padding:2px 7px;font-size:9px;font-weight:700;letter-spacing:0.1em;color:var(--ink);z-index:2;}
.lc-price{position:absolute;top:8px;right:8px;background:rgba(18,18,20,0.62);border-radius:4px;padding:2px 8px;font-size:10px;color:var(--gold-lt);z-index:2;}
.lc-body{padding:10px 13px 13px;}
.lc-name{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:3px;line-height:1.3;}
.lc-sub{font-size:10px;color:var(--stone);}
.lc-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px;}
.lc-tag{background:var(--cream);border-radius:4px;padding:2px 6px;font-size:9px;color:var(--stone);}

.dp{padding-bottom:90px;}
.dp-hero{height:58vw;min-height:240px;max-height:320px;position:relative;overflow:hidden;margin-top:52px;display:flex;align-items:flex-end;background:var(--cream);}
.dp-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.dp-hero-emoji{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:64px;}
.dp-hero-fade{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(18,18,20,0.65) 100%);}
.dp-hero-badges{position:relative;padding:0 20px 16px;display:flex;gap:8px;flex-wrap:wrap;}
.dp-badge{padding:5px 12px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:0.08em;}
.dp-badge-gold{background:var(--gold);color:var(--ink);}
.dp-badge-dark{background:rgba(18,18,20,0.7);color:var(--gold-lt);border:1px solid rgba(196,165,90,0.3);}
.dp-body{padding:24px 20px 0;}
.dp-cat{font-size:10px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
.dp-name{font-family:'Playfair Display',serif;font-size:36px;font-weight:400;line-height:1.1;margin-bottom:6px;}
.dp-location{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--stone);margin-bottom:20px;}
.dp-desc{font-size:14px;font-weight:300;line-height:1.75;color:var(--ink);margin-bottom:24px;}
.dp-tags{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:28px;}
.dp-tag{background:var(--cream);border-radius:20px;padding:5px 12px;font-size:11px;color:var(--stone);}
.dp-info-row{display:flex;gap:10px;margin-bottom:24px;}
.dp-info-card{flex:1;background:var(--white);border-radius:14px;padding:14px;border:1px solid var(--sand);}
.dp-info-icon{font-size:20px;margin-bottom:6px;}
.dp-info-label{font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--stone);margin-bottom:3px;}
.dp-info-value{font-size:13px;font-weight:500;color:var(--ink);}
.dp-tips{background:var(--white);border-radius:16px;padding:18px;margin-bottom:24px;border:1px solid var(--sand);}
.dp-tips-title{font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;}
.dp-tip{display:flex;gap:10px;margin-bottom:12px;}
.dp-tip:last-child{margin-bottom:0;}
.dp-tip-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);margin-top:6px;flex-shrink:0;}
.dp-tip-text{font-size:13px;font-weight:300;line-height:1.6;color:var(--ink);}
.maps-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
  padding:17px;border-radius:16px;background:var(--ink);border:none;cursor:pointer;
  font-family:'Jost',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.1em;
  text-transform:uppercase;color:var(--gold);margin-bottom:12px;transition:opacity 0.2s;}
.maps-btn:active{opacity:0.82;}
.share-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;
  padding:14px;border-radius:16px;background:var(--white);border:1.5px solid var(--sand);cursor:pointer;
  font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.08em;
  text-transform:uppercase;color:var(--stone);margin-bottom:12px;}

/* MAP PAGE */
.map-page{position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;height:100vh;z-index:50;}
.map-container{position:absolute;inset:0;top:52px;bottom:68px;}
.map-filters{position:absolute;top:52px;left:0;right:0;z-index:60;
  padding:10px 16px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;
  background:rgba(249,246,240,0.93);backdrop-filter:blur(12px);
  border-bottom:1px solid var(--sand);}
.map-filters::-webkit-scrollbar{display:none;}
.map-chip{flex-shrink:0;display:flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;
  font-size:11px;font-weight:500;cursor:pointer;transition:all 0.18s;
  border:1.5px solid var(--sand);background:var(--white);color:var(--stone);}
.map-chip.on{background:var(--ink);color:var(--gold);border-color:var(--ink);}
.map-container{position:absolute;top:100px;left:0;right:0;bottom:68px;}
.map-div{width:100%;height:100%;}
.map-card{position:absolute;bottom:80px;left:16px;right:16px;z-index:60;
  background:var(--white);border-radius:16px;padding:16px;
  display:flex;gap:12px;align-items:center;
  box-shadow:0 8px 32px rgba(18,18,20,0.15);border:1px solid var(--sand);
  animation:slideup 0.25s ease;}
@keyframes slideup{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
.map-card-img{width:56px;height:56px;border-radius:10px;background:var(--cream);
  display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;overflow:hidden;}
.map-card-img img{width:100%;height:100%;object-fit:cover;}
.map-card-info{flex:1;min-width:0;}
.map-card-name{font-size:14px;font-weight:500;color:var(--ink);margin-bottom:3px;}
.map-card-meta{font-size:11px;color:var(--stone);margin-bottom:6px;}
.map-card-tags{display:flex;gap:5px;flex-wrap:wrap;}
.map-card-tag{background:var(--cream);border-radius:4px;padding:2px 6px;font-size:9px;color:var(--stone);}
.map-card-arrow{width:38px;height:38px;border-radius:50%;background:var(--ink);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;
  transition:transform 0.18s;}
.map-card-arrow:active{transform:scale(0.92);}
.map-loading{position:absolute;inset:0;top:100px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:12px;background:var(--cream);}

/* INFO PAGE */
.info-page{padding:72px 20px 100px;}
.info-hero{background:linear-gradient(135deg,#0A1E28,#1D5A6B);border-radius:20px;padding:28px 24px;margin-bottom:28px;}
.info-hero-eye{font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
.info-hero-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:400;color:var(--white);line-height:1.2;margin-bottom:8px;}
.info-hero-sub{font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;}
.info-section{margin-bottom:20px;}
.info-section-title{font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--sand);}
.info-card{background:var(--white);border-radius:14px;padding:18px;margin-bottom:10px;border:1px solid var(--sand);}
.info-card-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--ink);margin-bottom:10px;}
.info-card-icon{font-size:18px;}
.info-card-body{font-size:13px;font-weight:300;color:var(--stone);line-height:1.7;}
.info-card-body strong{color:var(--ink);font-weight:500;}
.info-card-body ul{padding-left:16px;margin-top:8px;}
.info-card-body ul li{margin-bottom:5px;}
.info-warning{background:#fff8f0;border:1.5px solid #f0d0a0;border-radius:14px;padding:16px;margin-bottom:10px;}
.info-warning-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#c07820;margin-bottom:8px;}
.info-warning-body{font-size:12px;color:#8a6030;line-height:1.6;}
.info-contact-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;
  padding:15px;border-radius:14px;background:var(--ink);color:var(--gold);
  font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.1em;
  text-transform:uppercase;border:none;cursor:pointer;margin-top:8px;}

.empty{padding:28px 20px;text-align:center;color:var(--stone);font-size:13px;font-weight:300;}
.empty span{display:block;font-size:28px;margin-bottom:8px;opacity:0.4;}
.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:40vh;gap:14px;}
.spinner{width:32px;height:32px;border:2px solid var(--sand);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;}
.loading-text{font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--stone);}
.error-box{margin:20px;padding:16px 18px;background:#fff5f5;border:1px solid #ffcccc;border-radius:12px;font-size:13px;color:#cc4444;line-height:1.5;}
.divider{height:1px;background:var(--sand);margin:4px 20px 0;}
.pb{height:72px;}

.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:200;
  display:flex;background:rgba(249,246,240,0.96);backdrop-filter:blur(16px);
  border-top:1px solid var(--sand);padding:10px 0 18px;}
.bni{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;}
.bni-i{font-size:20px;}
.bni-l{font-size:9px;font-weight:500;letter-spacing:0.08em;color:var(--stone);text-transform:uppercase;}
.bni.on .bni-l{color:var(--gold);}
`;

const getCat = id => CATS.find(c=>c.id===id)||CATS[0];

// Read code from URL param
const getUrlCode = () => {
  const p = new URLSearchParams(window.location.search);
  return p.get("code") || "";
};

export default function App() {
  const [access,setAccess]   = useState(false);
  const [crIdx,setCrIdx]     = useState(0);   // has valid code
  const [checking,setChecking] = useState(true);  // checking stored/url code
  const [codeInput,setCodeInput] = useState("");
  const [codeError,setCodeError] = useState("");
  const [codeLoading,setCodeLoading] = useState(false);

  const [items,setItems]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError]     = useState(null);
  const [page,setPage]       = useState("home");
  const [region,setRegion]   = useState(null);
  const [detail,setDetail]   = useState(null);
  const [mapPin,setMapPin]   = useState(null);
  const [mapFilter,setMapFilter] = useState("all");
  const mapRef               = useRef(null);
  const gMapRef              = useRef(null);
  const markersRef           = useRef([]);

  // Device ID — persistent UUID per browser
  const getDeviceId = () => {
    let id = localStorage.getItem("mg_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("mg_device_id", id);
    }
    return id;
  };

  // Track login silently
  const trackLogin = async (code) => {
    try {
      await fetch(`${PROXY}?action=track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          deviceId:  getDeviceId(),
          userAgent: navigator.userAgent,
        }),
      });
    } catch(e) { console.warn("Tracking failed:", e); }
  };

  // On mount: check URL param or localStorage
  useEffect(()=>{
    const stored  = localStorage.getItem("mg_code");
    const urlCode = getUrlCode();
    const toCheck = urlCode || stored;
    if (toCheck) {
      verifyCode(toCheck, true);
    } else {
      setChecking(false);
    }
  },[]);

  const verifyCode = async (code, silent=false) => {
    if (!silent) setCodeLoading(true);
    setCodeError("");
    try {
      const url = `${PROXY}?action=verify&code=${encodeURIComponent(code.trim().toUpperCase())}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("mg_code", code.trim().toUpperCase());
        setAccess(true);
        trackLogin(code.trim().toUpperCase());
        fetchContent();
      } else {
        if (!silent) setCodeError("Invalid code. Please check and try again.");
        localStorage.removeItem("mg_code");
      }
    } catch(e) {
      if (!silent) setCodeError("Connection error. Please try again.");
    } finally {
      setCodeLoading(false);
      setChecking(false);
    }
  };

  const handleSubmit = () => {
    if (!codeInput.trim()) { setCodeError("Please enter your access code."); return; }
    verifyCode(codeInput);
  };

  const logout = () => {
    localStorage.removeItem("mg_code");
    setAccess(false);
    setPage("home");
    setRegion(null);
    setDetail(null);
  };

  const fetchContent = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(PROXY);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setItems(await res.json());
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const scrollTop = () => window.scrollTo({top:0, behavior:"instant"});

  const goHome   = ()=>{ setPage("home");   setRegion(null); setDetail(null); setMapPin(null); scrollTop(); };
  const goRegion = r =>{ setRegion(r);      setPage("region"); setDetail(null); scrollTop(); };
  const goDetail = b =>{ setDetail(b);      setPage("detail"); scrollTop(); };
  const goBack   = ()=>{ setPage("region"); setDetail(null); scrollTop(); };
  const goMap    = ()=>{ setPage("map");    setDetail(null); setRegion(null); scrollTop(); };

  // ── MapLibre Implementation (Free, no API key needed) ──────
  const CAT_COLORS = {
    Beach: "#1D7A9E", Restaurant: "#8B6914",
    Activity: "#1A7A4A", Hotel: "#6B2D8B", Village: "#9E4A1D",
  };

  const loadMapLibre = useCallback(() => {
    if (!mapRef.current || gMapRef.current) return;

    // Load MapLibre CSS + JS if not already loaded
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id   = "maplibre-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    const loadLib = () => {
      if (window.maplibregl) { initMapLibre(); return; }
      if (document.getElementById("maplibre-js")) return;
      const script = document.createElement("script");
      script.id  = "maplibre-js";
      script.src = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js";
      script.onload = () => initMapLibre();
      document.head.appendChild(script);
    };
    loadLib();
  }, [items, mapFilter]);

  const initMapLibre = () => {
    if (!mapRef.current || gMapRef.current) return;
    const ml = window.maplibregl;

    const map = new ml.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          "carto": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap © CARTO",
          }
        },
        layers: [{
          id: "carto-tiles",
          type: "raster",
          source: "carto",
          paint: {
            "raster-saturation": -0.25,
            "raster-brightness-min": 0.08,
            "raster-contrast": 0.05,
            "raster-opacity": 0.9,
          }
        }],
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
      },
      center: [24.8093, 35.2401],
      zoom: 8.5,
      minZoom: 7,
      maxZoom: 16,
      maxBounds: [[22.0, 34.2], [27.5, 36.8]],
    });

    // Add zoom controls
    map.addControl(new ml.NavigationControl({ showCompass: false }), "bottom-right");

    gMapRef.current = map;

    map.on("load", () => {
      addMapLibreMarkers(map, mapFilter);
    });
  };

  const addMapLibreMarkers = (map, filter) => {
    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const toShow = filter === "all"
      ? items.filter(i => i.lat && i.lng)
      : items.filter(i => i.category === filter && i.lat && i.lng);

    toShow.forEach(item => {
      const color = CAT_COLORS[item.category] || "#C4A55A";
      const cat   = getCat(item.category);

      // Custom bubble marker element
      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
      el.innerHTML = `
        <div style="
          display:flex;align-items:center;gap:4px;
          background:${color};color:white;
          padding:5px 11px;border-radius:20px;
          font-family:'Jost',sans-serif;font-size:11px;font-weight:600;
          white-space:nowrap;letter-spacing:0.02em;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
          transition:transform 0.15s;
        ">${cat.icon} ${item.name}</div>
        <div style="
          width:0;height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:7px solid ${color};
        "></div>
      `;

      el.addEventListener("mouseenter", () => {
        el.querySelector("div").style.transform = "scale(1.08)";
      });
      el.addEventListener("mouseleave", () => {
        el.querySelector("div").style.transform = "scale(1)";
      });
      el.addEventListener("click", () => {
        setMapPin(item);
        gMapRef.current.flyTo({
          center: [parseFloat(item.lng), parseFloat(item.lat)],
          zoom: Math.max(gMapRef.current.getZoom(), 11),
          duration: 600,
        });
      });

      const marker = new window.maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([parseFloat(item.lng), parseFloat(item.lat)])
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  // Load MapLibre when map page opens
  useEffect(() => {
    if (page === "map") {
      const timer = setTimeout(() => loadMapLibre(), 150);
      return () => clearTimeout(timer);
    }
  }, [page, items]);

  // Re-filter markers when filter changes
  useEffect(() => {
    if (gMapRef.current && window.maplibregl) {
      if (gMapRef.current.loaded()) {
        addMapLibreMarkers(gMapRef.current, mapFilter);
      }
    }
  }, [mapFilter, items]);

  const forRegion = (area,cat) => items.filter(i=>i.area===area&&i.category===cat);
  const rGrad = r=>`linear-gradient(150deg,${r.color1} 0%,${r.color2} 100%)`;

  const openMaps = item => {
    const url = item.maps
      ? item.maps
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name+' '+item.area+' Crete Greece')}`;
    // Use location.href for iOS Safari compatibility — prevents blank page on return
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const Card = ({b}) => {
    const cat = getCat(b.category);
    return (
      <div className="lc" onClick={()=>goDetail(b)}>
        <div className="lc-img">
          {b.image && <img src={b.image} alt={b.name} onError={e=>e.target.style.display='none'}/>}
          {!b.image && <span className="lc-emoji">{b.emoji||cat.icon}</span>}
          {b.featured && <div className="lc-feat">Featured</div>}
          {b.price && <div className="lc-price">{b.price}</div>}
        </div>
        <div className="lc-body">
          <div className="lc-name">{b.name}</div>
          {b.subarea && <div className="lc-sub">📍 {b.subarea}</div>}
          <div className="lc-tags">{b.tags.slice(0,3).map((t,i)=><span key={i} className="lc-tag">{t}</span>)}</div>
        </div>
      </div>
    );
  };

  const CardRow = ({areaId,cat}) => {
    const list = forRegion(areaId,cat.id);
    if (!list.length) return <div className="empty"><span>{cat.icon}</span>No {cat.label} yet!</div>;
    return <div className="ls">{list.map(b=><Card key={b.id} b={b}/>)}</div>;
  };

  // ── CHECKING stored code ──
  if (checking) {
    return (
      <>
        <style>{css}</style>
        <div className="gate">
          <div className="gate-logo"><span className="gate-my">My</span><span className="gate-gr">Greece</span></div>
          <div className="gate-spinner"/>
        </div>
      </>
    );
  }

  // ── ACCESS GATE ──
  if (!access) {
    return (
      <>
        <style>{css}</style>
        <div className="gate">
          <div className="gate-logo"><span className="gate-my">My</span><span className="gate-gr">Greece</span></div>
          <div className="gate-hero">🌊</div>
          <div className="gate-title">Your Crete Guide<br/>Awaits</div>
          <div className="gate-sub">Enter your unique access code below to unlock the full MyGreece experience.</div>
          <div className="gate-input-wrap">
            <input
              className="gate-input"
              placeholder="Enter your access code"
              value={codeInput}
              onChange={e=>setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
              maxLength={20}
            />
          </div>
          <div className="gate-error">{codeError}</div>
          <button className="gate-btn" onClick={handleSubmit} disabled={codeLoading}>
            {codeLoading ? <div className="gate-spinner"/> : "Unlock MyGreece →"}
          </button>
          <div className="gate-footer">
            Already purchased? Check your email for your unique code.
          </div>

          <div className="gate-divider">
            <div className="gate-divider-line"/>
            <div className="gate-divider-text">or</div>
            <div className="gate-divider-line"/>
          </div>

          <button className="gate-buy-btn" onClick={()=>window.open("https://buy.stripe.com/bJe00cd2qdis4zA2lK8ww00","_blank")}>
            <span>✦</span> Get Access — Buy Now
          </button>
          <div className="gate-buy-sub">One payment · Lifetime access · Instant delivery</div>

          {/* Premium Swipeable Carousel */}
          <div className="cr-wrap">
            <div className="cr-label">✦ Inside the guide</div>
            <div className="cr-outer"
              onTouchStart={e=>{ window._tx=e.touches[0].clientX; }}
              onTouchEnd={e=>{
                const d=window._tx-e.changedTouches[0].clientX;
                if(Math.abs(d)>40) setCrIdx(p=>d>0?Math.min(p+1,3):Math.max(p-1,0));
              }}
              onClick={e=>{
                const r=e.currentTarget.getBoundingClientRect();
                const x=e.clientX-r.left;
                if(x>r.width*0.6) setCrIdx(p=>Math.min(p+1,3));
                else if(x<r.width*0.4) setCrIdx(p=>Math.max(p-1,0));
              }}
            >
              <div className="cr-track" style={{transform:`translateX(-${crIdx*100}%)`}}>
                <div className="cr-slide"><img src="data:image/jpeg;base64,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" alt="Regions"/></div>
                <div className="cr-slide"><img src="data:image/jpeg;base64,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bW5Jce0m6jb1/e+ib1/e+icZOUJSEXFiou9f3vom9f3vonGTlCSLjRr3Adl17d/vH/RRd6/vfRN6/vfROMnKEq7/AHj/AKJd/vH/AEUXev730Tev730TjJyhJILtHOc4dhK9UXev730Tev730TjJyhKXlrG4JaT2Gyjb1/e+ib1/e+icZOUJV3+8f9Eu/wB4/wCii71/e+ib1/e+icZOUJV3+8f9Eu/3j/oou+f3vom9f3vonGTlCVd/vH/RLv8AePUXev730Tev730U8ZOUKERFdkIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAi9ykx5+V8pXiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIguU5G9dG4gNkFte1SXUjNyAL5w21+1QicpDhxabrKRyMlYHsNwVWV692LCKqRuSZ7ewqlWUEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQF41z4XZ4nWPEjkV6iCqR7ZZnPabh1v6KlERIiIiBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFS54C8kflauR7b7YVVbiE2G0UzoqSFxY9zDYyuHHXsHCy1x45yTqGWXLGONy6jJi9DE8tkrKdjhxDpWg/1VHrzDv4+l/Gb+a4DHSzTRSSx08kkcer3tYSG/E8lasOweS6/qR7cf3J9PoP15h38dS/jN/NPXmHfx9L+M3818/OicwDPEW5tRmba/wXpgeIBMYiInOLA/LoXAXIv22I80+pHs+5Pp9AevMO/j6X8Zv5p68w7+Opfxm/mvnzKO6PJellgCWWB1FxxT6kez7k+n0F68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" alt="Map"/></div>
                <div className="cr-slide"><img src="data:image/jpeg;base64,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mffSeS076TyWsKU2aZGWQ+6PpWPiTnJPUmlKBXqu6DCkY8jXlKDPvpPJad9J5LWFKbNM++k8lp30nktYUps0z76TyWnfSeS1hSmzTPvpPJad9J5LWFKbNM++k/1awYs5yxzjw8KUoFKUoFKUJwM0HhIHWvefdb901uijCjcR6x/lWyrpNovPut+6ac+637pqVSmjaLz7rfumnPut+6alUpo2i8+637ppz7rfumpVKaNovPut+6ac+637pqVSmjaLz7rfumnPut+6alUpo2i8+637ppz7rfumpVKaNovPut+6ac+637pqVSmjaLz7rfumnPut+6alUpo2i8+637ppz7rfumpVKaNovPut+6ac+637pqVSmjaLz7rfumnPut+6alUpo2i8+637ppz7rfumpVKaNovPut+6ac+637pqVSmjaLz7rfumnPut+6alUpo2i8+637ppz7rfumpVKaNovPut+6ac+637pqVSmjaLz7rfumvAQehqXWuWPcNwHrD+dNG2mlAcjNKileN7B+Ve143sH5UEulKj31s93ZSQRzvbs4wHTGRWr0nRlvBDAEEEHxFeCWMgEOpydo56nyqDolhLpulRW007TOo5z0X4D4D41hDpRj1h7ksDACZI4/dkbhj9h/2jWPNlqXTWonmeIBCZUAc4Ulh6x+HnR54YwS8qKAcHLAc+VUcmjXfoNhGkcBmtwVLM2QuSCeCCGHHwPTFSLvSpLi21JNsTG5kV493hhVHPHHQ1nz5ey6nutPSIRs/Wp+s9j1h63y86976Pve67xe8xnbkZ+1U2oaRNLPcCG3t5EuIliVpDg2+M8gY6c54xzRtHn/PqXpZXjV0ODgMcIV3ZxnqenQ08+W9aNT3XEtxDCQJZUTPTcwGa9eeJFLPKihTgksBg1E1KwF61qe7jfupldt4B9XnI/wAKh3WkT3BnUFFEl4k4PBwoUA8EYzxWsssp2iSRbtNGpQNIoL8Lk+18vOs6pLrRpENklmiEW4CB5WzgbgTlSCD08MEGrurjbbZYlk+xSlK2hSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKCInsD5V7XiewK9rDTHevnXjOu081nSoN/fx++Kd/H74rRmla2mm/v4/fFO/j98VopTY39/H74p38fvitFKbG/v4/fFO/j98VopTY39/H74p38fvitFKb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" alt="Beach"/></div>
                <div className="cr-slide"><img src="data:image/jpeg;base64,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" alt="Tips"/></div>
              </div>
            </div>
            <div className="cr-dots">
              {[0,1,2,3].map(i=>(
                <div key={i} className={`cr-dot ${crIdx===i?"on":""}`} onClick={()=>setCrIdx(i)}/>
              ))}
            </div>
            <div className="cr-caps">
              {["Regions","Map","Beaches","Tips"].map((cap,i)=>(
                <div key={i} className={`cr-cap ${crIdx===i?"on":""}`} onClick={()=>setCrIdx(i)}>{cap}</div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN APP (access granted) ──
  return (
    <>
      <style>{css}</style>
      <div className="app">

        <nav className="nav">
          {page==="home" ? (
            <>
              <div className="logo" onClick={goHome}><span className="logo-my">My</span><span className="logo-gr">Greece</span></div>
              <div className="nav-right" onClick={logout} title="Sign out">✕ Exit</div>
            </>
          ) : (
            <>
              <div className="nav-back" onClick={page==="detail"?goBack:goHome}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                {page==="detail"?(region?.id||"Back"):page==="region"?region.id:"Home"}
              </div>
              <div className="logo" onClick={goHome}><span className="logo-my">My</span><span className="logo-gr">Greece</span></div>
            </>
          )}
        </nav>

        {page==="home" && <>
          <div className="hero">
            <div className="hero-bg"/><div className="hero-glow"/><div className="hero-dots"/><div className="hero-fade"/>
            <div className="hero-c">
              <div className="h-eye">Your Insider Guide to</div>
              <div className="h-h1">Crete,<br/><em>Curated.</em></div>
              <div className="h-tag">Beaches, tavernas, hidden villages &amp; stays —<br/>hand-picked by locals for you.</div>
              <div className="h-stats">
                <div className="h-stat"><div className="h-sn">4</div><div className="h-sl">Regions</div></div>
                <div className="h-stat"><div className="h-sn">{loading?"…":items.filter(i=>i.category==="Beach").length}</div><div className="h-sl">Beaches</div></div>
                <div className="h-stat"><div className="h-sn">{loading?"…":items.length}</div><div className="h-sl">Places</div></div>
              </div>
            </div>
          </div>
          <div className="sp"><div className="sh"><div className="st">Explore Regions</div></div></div>
          {error && <div className="error-box">⚠️ {error}</div>}
          <div className="regions">
            {REGIONS.map(r=>(
              <div key={r.id} className="rc" onClick={()=>goRegion(r)}>
                <div style={{position:"absolute",inset:0,background:rGrad(r)}}/>
                <div className="rc-shim"/><div className="rc-fade"/>
                <div className="rc-body"><div className="rc-name">{r.id}</div><div className="rc-sub">{r.tagline}</div></div>
                <div className="rc-badge">{CATS.reduce((a,c)=>a+forRegion(r.id,c.id).length,0)} places</div>
                <div className="rc-emoji">{r.emoji}</div>
              </div>
            ))}
          </div>
          <div className="sp" style={{paddingBottom:0}}><div className="sh"><div className="st">Browse by Vibe</div></div></div>
          <div className="chips">{CATS.map(c=><div key={c.id} className="chip"><span style={{fontSize:14}}>{c.icon}</span> {c.label}</div>)}</div>
          <div className="pb"/>
        </>}

        {page==="region" && region && <>
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
          {loading
            ? <div className="loading"><div className="spinner"/><div className="loading-text">Loading…</div></div>
            : CATS.map((cat,i)=>(
                <div key={cat.id}>
                  <div className="cs">
                    <div className="cs-head">
                      <div className="cs-icon">{cat.icon}</div>
                      <div className="cs-title">{cat.label}</div>
                      <div className="cs-count">{forRegion(region.id,cat.id).length} spots</div>
                    </div>
                    <CardRow areaId={region.id} cat={cat}/>
                  </div>
                  {i<CATS.length-1 && <div className="divider"/>}
                </div>
              ))
          }
          <div className="pb"/>
        </>}

        {page==="detail" && detail && (()=>{
          const cat  = getCat(detail.category);
          const tips = parseTips(detail.tips, detail.category);
          return (
            <div className="dp">
              <div className="dp-hero">
                {detail.image ? <img src={detail.image} alt={detail.name} onError={e=>e.target.style.display='none'}/> : <div className="dp-hero-emoji">{detail.emoji||cat.icon}</div>}
                <div className="dp-hero-fade"/>
                <div className="dp-hero-badges">
                  {detail.featured && <span className="dp-badge dp-badge-gold">⭐ Featured</span>}
                  {detail.price    && <span className="dp-badge dp-badge-dark">{detail.price}</span>}
                  {detail.tags.slice(0,2).map((t,i)=><span key={i} className="dp-badge dp-badge-dark">{t}</span>)}
                </div>
              </div>
              <div className="dp-body">
                <div className="dp-cat">{cat.icon} {cat.label}</div>
                <div className="dp-name">{detail.name}</div>
                {detail.subarea && <div className="dp-location"><span>📍</span><span>{detail.subarea}, {detail.area} · Crete</span></div>}
                <div className="dp-desc">{detail.description||"Add a description in Notion to show it here."}</div>
                {detail.tags.length>0 && <div className="dp-tags">{detail.tags.map((t,i)=><span key={i} className="dp-tag">{t}</span>)}</div>}
                <div className="dp-info-row">
                  <div className="dp-info-card"><div className="dp-info-icon">💰</div><div className="dp-info-label">Price</div><div className="dp-info-value">{detail.price||"Free"}</div></div>
                  <div className="dp-info-card"><div className="dp-info-icon">📍</div><div className="dp-info-label">Area</div><div className="dp-info-value">{detail.area}</div></div>
                  <div className="dp-info-card"><div className="dp-info-icon">{cat.icon}</div><div className="dp-info-label">Type</div><div className="dp-info-value">{detail.category}</div></div>
                </div>
                <div className="dp-tips">
                  <div className="dp-tips-title">✦ Visitor Tips</div>
                  {tips.map((tip,i)=>(
                    <div key={i} className="dp-tip"><div className="dp-tip-dot"/><div className="dp-tip-text">{tip}</div></div>
                  ))}
                </div>
                <button className="maps-btn" onClick={()=>openMaps(detail)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {detail.maps?"Open Exact Location in Maps":"Search in Google Maps"}
                </button>
                <button className="share-btn" onClick={()=>navigator.share&&navigator.share({title:detail.name,text:`Check out ${detail.name} in ${detail.area}, Crete — via MyGreece`,url:window.location.href})}>
                  <span>↑</span> Share this place
                </button>
              </div>
            </div>
          );
        })()}

        {/* MAP PAGE — always rendered, hidden when not active to preserve map state */}
        <div style={{display: page==="map" ? "block" : "none"}} className="map-page">
          {/* Filters */}
          <div className="map-filters">
            {[
              {id:"all",       label:"All",        icon:"🗺"},
              {id:"Beach",     label:"Beaches",    icon:"🌊"},
              {id:"Restaurant",label:"Food",       icon:"🫒"},
              {id:"Hotel",     label:"Stay",       icon:"🏡"},
              {id:"Activity",  label:"Activities", icon:"🧗"},
              {id:"Village",   label:"Villages",   icon:"⛪"},
            ].map(f=>(
              <div key={f.id}
                className={`map-chip ${mapFilter===f.id?"on":""}`}
                onClick={()=>setMapFilter(f.id)}>
                <span>{f.icon}</span>{f.label}
              </div>
            ))}
          </div>

          {/* Map container */}
          <div className="map-container">
            <div ref={mapRef} className="map-div"/>
          </div>

          {/* Place card popup */}
          {mapPin && page==="map" && (
            <div className="map-card">
              <div className="map-card-img">
                {mapPin.image
                  ? <img src={mapPin.image} alt={mapPin.name} onError={e=>e.target.style.display="none"}/>
                  : <span style={{fontSize:24}}>{mapPin.emoji || getCat(mapPin.category).icon}</span>}
              </div>
              <div className="map-card-info">
                <div className="map-card-name">{mapPin.name}</div>
                <div className="map-card-meta">📍 {mapPin.subarea}, {mapPin.area}</div>
                <div className="map-card-tags">
                  {mapPin.tags.slice(0,3).map((t,i)=><span key={i} className="map-card-tag">{t}</span>)}
                </div>
              </div>
              <div className="map-card-arrow" onClick={()=>{
                setDetail(mapPin);
                setPage("detail");
                setRegion(REGIONS.find(r=>r.id===mapPin.area)||REGIONS[0]);
              }} style={{background:"#18181A",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="#C4A55A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5L19 12L12 19" stroke="#C4A55A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* INFO PAGE */}
        {page==="info" && (
          <div className="info-page">
            <div className="info-hero">
              <div className="info-hero-eye">MyGreece ◈ Guidelines</div>
              <div className="info-hero-title">App Guidelines &amp; Important Information</div>
              <div className="info-hero-sub">Please read carefully before using the app.</div>
            </div>

            <div className="info-section">
              <div className="info-section-title">🍽 Reservations</div>
              <div className="info-card">
                <div className="info-card-title"><span className="info-card-icon">📧</span>How to Request a Reservation</div>
                <div className="info-card-body">
                  If you would like us to arrange a reservation for a restaurant, accommodation, or activity, simply send us an email with the following details:
                  <ul>
                    <li>Name of the restaurant, accommodation, or activity</li>
                    <li>Preferred date and time</li>
                    <li>Number of guests / participants</li>
                    <li>Any special requests or requirements</li>
                  </ul>
                  <br/>We will do our best to assist you and confirm availability.
                </div>
              </div>
            </div>

            <div className="info-section">
              <div className="info-section-title">🔐 Account & Device Policy</div>
              <div className="info-warning">
                <div className="info-warning-title">⚠️ One Device Per Access Code</div>
                <div className="info-warning-body">
                  Each access code is valid for <strong>one device only</strong>. It is strictly prohibited to use the same access code on multiple active devices. If our system detects that an access code has been shared or used on more than one device, access may be <strong>permanently revoked</strong> for all involved users.
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-title"><span className="info-card-icon">🔒</span>Keep Your Code Private</div>
                <div className="info-card-body">
                  Please do not share your access code or application link with anyone. Your code is personal and linked to your purchase.
                </div>
              </div>
            </div>

            <div className="info-section">
              <div className="info-section-title">💳 Refund Policy</div>
              <div className="info-card">
                <div className="info-card-title"><span className="info-card-icon">❌</span>No Refunds</div>
                <div className="info-card-body">
                  All purchases are final. <strong>No refunds will be issued under any circumstances.</strong> Please make sure you understand what you are purchasing before completing your payment.
                </div>
              </div>
            </div>

            <div className="info-section">
              <div className="info-section-title">💬 Support</div>
              <div className="info-card">
                <div className="info-card-title"><span className="info-card-icon">🤝</span>We're Here to Help</div>
                <div className="info-card-body">
                  If you have any questions, need assistance, or require support, feel free to contact us at any time via email. We will be happy to help.
                </div>
              </div>
              <button className="info-contact-btn" onClick={()=>window.open("mailto:mygreece61@gmail.com","_blank")}>
                ✉️ Contact Us — mygreece61@gmail.com
              </button>
            </div>

            <div style={{height:80}}/>
          </div>
        )}

        <div className="bnav">
          {[
            {id:"home",    icon:"🏠",label:"Home",    action:goHome},
            {id:"map",     icon:"🗺", label:"Map",     action:goMap},
            {id:"Chania",  icon:"⛵",label:"Chania",  action:()=>goRegion(REGIONS[0])},
            {id:"info",    icon:"ℹ️", label:"Info",    action:()=>{ setPage("info"); scrollTop(); }},
            {id:"refresh", icon:"↻", label:"Refresh", action:fetchContent},
          ].map(n=>(
            <div key={n.id} className={`bni ${page===n.id?"on":page==="home"&&n.id==="home"?"on":page==="region"&&region?.id===n.id?"on":""}`} onClick={n.action}>
              <div className="bni-i">{n.icon}</div>
              <div className="bni-l">{n.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
