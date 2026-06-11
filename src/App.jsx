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
.gyg-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
  padding:17px;border-radius:16px;
  background:linear-gradient(135deg,#C4A55A 0%,#E8D8AC 50%,#C4A55A 100%);
  border:none;cursor:pointer;
  font-family:'Jost',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;
  text-transform:uppercase;color:var(--ink);margin-bottom:12px;
  box-shadow:0 4px 20px rgba(196,165,90,0.35);transition:opacity 0.2s;}
.gyg-btn:active{opacity:0.85;}
.gyg-btn-sub{font-size:10px;color:rgba(26,26,24,0.6);font-weight:400;letter-spacing:0.06em;text-transform:none;display:block;margin-top:2px;}

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

  // Track login — get real country from browser-side IP lookup
  const trackLogin = async (code) => {
    try {
      // Step 1: Get real IP + country from free API (called directly from browser)
      let country = "unknown";
      let ip = "unknown";
      try {
        const geo = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
        const geoData = await geo.json();
        country = geoData.country_name || geoData.country || "unknown";
        ip      = geoData.ip || "unknown";
      } catch(e) {
        // Fallback — try alternative
        try {
          const geo2 = await fetch("https://ip-api.com/json/?fields=country,query", { signal: AbortSignal.timeout(3000) });
          const geoData2 = await geo2.json();
          country = geoData2.country || "unknown";
          ip      = geoData2.query  || "unknown";
        } catch(e2) { /* silent */ }
      }

      // Step 2: Send to proxy with real location data
      await fetch(`${PROXY}?action=track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          deviceId:  getDeviceId(),
          userAgent: navigator.userAgent,
          country,
          ip,
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
        // Track EVERY login — both manual code entry and auto-login from stored code
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
                <div className="cr-slide"><img src="https://i.imgur.com/qeCcqwv.jpeg" alt="Regions" style={{width:"100%",display:"block"}}/></div>
                <div className="cr-slide"><img src="https://i.imgur.com/tYbahia.jpeg" alt="Map" style={{width:"100%",display:"block"}}/></div>
                <div className="cr-slide"><img src="https://i.imgur.com/GqU0nF7.jpeg" alt="Beach" style={{width:"100%",display:"block"}}/></div>
                <div className="cr-slide"><img src="https://i.imgur.com/oqmzsO1.jpeg" alt="Tips" style={{width:"100%",display:"block"}}/></div>
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
                {/* GetYourGuide button — only for Activities with a GYG link */}
                {detail.category === "Activity" && detail.gyg && (
                  <button className="gyg-btn" onClick={()=>{
                    const a=document.createElement("a");
                    a.href=detail.gyg;a.target="_blank";a.rel="noopener noreferrer";
                    document.body.appendChild(a);a.click();document.body.removeChild(a);
                  }}>
                    <span>🎟</span>
                    <span>
                      Book This Activity
                      <span className="gyg-btn-sub">via GetYourGuide · Best Price Guaranteed</span>
                    </span>
                  </button>
                )}

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
              <div className="info-section-title">📲 Add to Home Screen</div>
              <div className="info-card">
                <div className="info-card-title"><span className="info-card-icon">🍎</span>iPhone / iPad (Safari)</div>
                <div className="info-card-body">
                  1. Open <strong>mygreece-app.vercel.app</strong> in Safari<br/><br/>
                  2. Tap the <strong>Share button</strong> ↑ at the bottom of the screen<br/><br/>
                  3. Scroll down and tap <strong>"Add to Home Screen"</strong><br/><br/>
                  4. Tap <strong>"Add"</strong> — the app icon appears on your home screen<br/><br/>
                  <strong>Note:</strong> Must use Safari browser, not Chrome or Firefox.
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-title"><span className="info-card-icon">🤖</span>Android (Chrome)</div>
                <div className="info-card-body">
                  1. Open <strong>mygreece-app.vercel.app</strong> in Chrome<br/><br/>
                  2. Tap the <strong>three dots ⋮</strong> menu (top right)<br/><br/>
                  3. Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong><br/><br/>
                  4. Tap <strong>"Add"</strong> — the app icon appears on your home screen
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
