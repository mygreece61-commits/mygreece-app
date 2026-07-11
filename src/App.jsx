import { useState, useEffect, useRef, useCallback } from "react";
import { inject } from "@vercel/analytics";

const PROXY = "https://mygreece-proxy.vercel.app/api/notion";
const GA_ID = "G-YR7XSTZ1G5";

const REGIONS = [
  { id:"Chania",    tagline:"Old Harbour & White Mountains",     color1:"#0A1E28", color2:"#1D5A6B", image:"https://i.imgur.com/9V64R8S.jpeg", imgPos:"center 50%" },
  { id:"Rethymno",  tagline:"Venetian Fortresses & Monasteries", color1:"#3A1A0A", color2:"#6B3A20", image:"https://i.imgur.com/bW7EXfe.jpeg", imgPos:"center 40%" },
  { id:"Heraklion", tagline:"Minoan Palaces & Vineyards",        color1:"#0A2A18", color2:"#1D5A36", image:"https://i.imgur.com/w7rkNoJ.jpeg", imgPos:"center 30%" },
  { id:"Lasithi",   tagline:"Windmills, Caves & Wild East",      color1:"#1A0A38", color2:"#3A206B", image:"https://i.imgur.com/bW7EXfe.jpeg", imgPos:"center 50%" },
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
.dp-contact{background:var(--white);border-radius:16px;padding:18px;margin-bottom:24px;border:1px solid var(--sand);}
.dp-contact-title{font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;}
.dp-contact-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--cream);cursor:pointer;text-decoration:none;}
.dp-contact-item:last-child{border-bottom:none;padding-bottom:0;}
.dp-contact-icon{width:36px;height:36px;border-radius:10px;background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.dp-contact-label{font-size:10px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:var(--stone);margin-bottom:2px;}
.dp-contact-value{font-size:13px;font-weight:400;color:var(--ink);}

.maps-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
  padding:17px;border-radius:16px;background:var(--ink);border:none;cursor:pointer;
  font-family:'Jost',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.1em;
  text-transform:uppercase;color:var(--gold);margin-bottom:12px;transition:opacity 0.2s;}
.maps-btn:active{opacity:0.82;}
.share-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;
  padding:14px;border-radius:16px;background:var(--white);border:1.5px solid var(--sand);cursor:pointer;
  font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.08em;
  text-transform:uppercase;color:var(--stone);margin-bottom:12px;}
.booking-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
  padding:17px;border-radius:16px;
  background:linear-gradient(135deg,#003580 0%,#0066CC 100%);
  border:none;cursor:pointer;
  font-family:'Jost',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;
  text-transform:uppercase;color:#ffffff;margin-bottom:12px;
  box-shadow:0 4px 20px rgba(0,53,128,0.3);transition:opacity 0.2s;}
.booking-btn:active{opacity:0.85;}
.booking-btn-sub{font-size:10px;color:rgba(255,255,255,0.7);font-weight:400;letter-spacing:0.06em;text-transform:none;display:block;margin-top:2px;}
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
.info-contact-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;
  padding:15px;border-radius:14px;background:var(--ink);color:var(--gold);
  font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.1em;
  text-transform:uppercase;border:none;cursor:pointer;margin-top:8px;}

.empty{padding:28px 20px;text-align:center;color:var(--stone);font-size:13px;font-weight:300;}
.empty span{display:block;font-size:28px;margin-bottom:8px;opacity:0.4;}
.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:40vh;gap:14px;}
.spinner{width:32px;height:32px;border:2px solid var(--sand);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
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

/* TRIPS PAGE */
.trips-page{padding:72px 20px 100px;}
.trips-hero{background:linear-gradient(160deg,#0A1E28,#1D4D5E);border-radius:20px;padding:28px 24px;margin-bottom:24px;}
.trips-eye{font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
.trips-title{font-family:'Playfair Display',serif;font-size:30px;font-weight:400;color:var(--white);line-height:1.1;margin-bottom:8px;}
.trips-title em{font-style:italic;color:var(--gold-lt);}
.trips-sub{font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;}
.trips-section-label{font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;}
.itin-card{background:var(--white);border-radius:18px;overflow:hidden;border:1px solid var(--sand);margin-bottom:16px;cursor:pointer;transition:transform 0.18s;}
.itin-card:active{transform:scale(0.98);}
.itin-card-header{padding:18px 18px 14px;}
.itin-card-top{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.itin-card-region{font-size:9px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--gold);}
.itin-card-dur{margin-left:auto;background:var(--ink);color:var(--gold);font-size:9px;font-weight:600;letter-spacing:0.08em;padding:3px 10px;border-radius:20px;}
.itin-card-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:400;color:var(--ink);margin-bottom:6px;line-height:1.3;}
.itin-card-tagline{font-size:12px;font-weight:300;color:var(--stone);line-height:1.5;}
.itin-card-stops{padding:0 18px 18px;display:flex;gap:6px;flex-wrap:wrap;}
.itin-card-stop{background:var(--cream);border-radius:6px;padding:3px 8px;font-size:10px;color:var(--stone);}
.itin-detail{padding:0 0 100px;}
.itin-detail-hero{background:linear-gradient(160deg,#0A1E28,#1D4D5E);padding:80px 24px 28px;}
.itin-detail-eye{font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold);margin-bottom:8px;}
.itin-detail-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:400;color:var(--white);line-height:1.2;margin-bottom:6px;}
.itin-detail-sub{font-size:12px;color:rgba(255,255,255,0.55);line-height:1.5;}
.itin-detail-body{padding:24px 20px 0;}
.timeline{position:relative;padding-left:28px;}
.timeline::before{content:"";position:absolute;left:8px;top:8px;bottom:8px;width:1.5px;background:linear-gradient(to bottom,var(--gold),rgba(196,165,90,0.15));}
.tl-item{position:relative;margin-bottom:14px;}
.tl-dot{position:absolute;left:-24px;top:16px;width:10px;height:10px;border-radius:50%;background:var(--gold);border:2px solid var(--ivory);}
.tl-dot.transit{background:var(--sand);}
.tl-time-label{display:flex;align-items:center;gap:6px;margin-bottom:6px;}
.tl-time{font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);}
.tl-label{font-size:9px;color:var(--stone);letter-spacing:0.08em;}
.tl-card{background:var(--white);border-radius:14px;overflow:hidden;border:1px solid var(--sand);}
.tl-card.transit{background:var(--cream);border-style:dashed;}
.tl-card-img{width:100%;height:120px;object-fit:cover;}
.tl-card-body{padding:12px 14px;}
.tl-card-type{font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);margin-bottom:4px;}
.tl-card-name{font-size:15px;font-weight:500;color:var(--ink);margin-bottom:6px;}
.tl-card-desc{font-size:12px;font-weight:300;color:var(--stone);line-height:1.65;}
.tl-card-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;}
.tl-card-tag{background:var(--cream);border-radius:4px;padding:2px 7px;font-size:9px;color:var(--stone);}
.tl-transit-text{padding:10px 14px;font-size:12px;font-weight:300;color:var(--stone);display:flex;align-items:center;gap:8px;}
.highlights-box{background:linear-gradient(135deg,rgba(196,165,90,0.08),rgba(196,165,90,0.03));border:1px solid rgba(196,165,90,0.25);border-radius:14px;padding:16px 18px;margin-top:16px;}
.highlights-title{font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;}
.highlight-item{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;}
.highlight-item:last-child{margin-bottom:0;}
.highlight-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);margin-top:5px;flex-shrink:0;}
.highlight-text{font-size:12px;font-weight:300;color:var(--stone);line-height:1.5;}

/* Block landscape mode on phones */
@media (orientation: landscape) and (max-width: 900px) {
  .app::before {
    content: "Please rotate your phone back to portrait 🙏";
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: var(--ink);
    color: var(--ivory);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    font-family: 'Jost', sans-serif;
    font-size: 1.2rem;
  }
}
`;

// ── ITINERARIES ───────────────────────────────────────────────
const ITINERARIES = [
  {
    id: "chania-1day",
    region: "Chania",
    duration: "Full Day",
    title: "Komolithi · Balos · Chania Old Town",
    tagline: "Nature, culture, local cuisine & the magic of Chania by night.",
    highlights: [
      "Balos Lagoon — one of Crete's most famous natural wonders",
      "Komolithi — a unique geological landscape away from the crowds",
      "Traditional lunch in Kissamos",
      "Evening walk in Chania's Venetian Harbour",
      "Dinner in the heart of the Old Town",
    ],
    stops: [
      {
        time: "08:00",
        label: "Departure",
        icon: "🚗",
        name: "Departure from Chania",
        description: "Start your day early for the best experience at Balos.",
        type: "transit",
      },
      {
        time: "09:00 – 09:45",
        label: "First Stop",
        icon: "📸",
        name: "Komolithi — Potamida",
        description: "Short stop for photos at one of the most unique geological formations in Crete. A beautiful hidden gem of the Kissamos area, perfect for a first introduction to the western part of the island.",
        type: "Activity",
        tags: ["Hidden gem","Nature","Photos"],
      },
      {
        time: "10:15 – 15:00",
        label: "Main Attraction",
        icon: "🌊",
        name: "Balos Lagoon",
        description: "Visit one of Crete's most iconic natural attractions. Free time for swimming, relaxation and unforgettable photos. Enjoy the unique combination of turquoise waters, white sand and breathtaking scenery.",
        type: "Beach",
        tags: ["Iconic","Swimming","Scenic"],
        image: "https://i.imgur.com/qeCcqwv.jpeg",
      },
      {
        time: "15:30 – 17:00",
        label: "Lunch Stop",
        icon: "🫒",
        name: "Kissamos (Kasteli)",
        description: "Lunch at a local traditional restaurant in the Kissamos area. Free time for a coffee or a short walk around the port of Kissamos.",
        type: "Restaurant",
        tags: ["Local","Traditional","Port"],
      },
      {
        time: "18:00",
        label: "Return",
        icon: "🚗",
        name: "Return to Chania",
        description: "Head back to Chania in time to enjoy the evening.",
        type: "transit",
      },
      {
        time: "18:30 – 20:00",
        label: "Evening",
        icon: "🏛",
        name: "Chania Old Town",
        description: "Explore the charming Venetian Harbour. Walk through the picturesque streets of the Old Town. Enjoy the atmosphere, history and local architecture.",
        type: "Village",
        tags: ["Venetian Harbour","Historic","Evening walk"],
      },
      {
        time: "20:00 – 22:00",
        label: "Dinner",
        icon: "🍽",
        name: "Tamam Restaurant",
        description: "End the day with dinner at Tamam, one of the most well-known restaurants in Chania Old Town. A perfect way to experience traditional Cretan and Mediterranean flavours in a historic setting.",
        type: "Restaurant",
        tags: ["Traditional","Cretan cuisine","Old Town"],
      },
    ],
  },
];



const getCat = id => CATS.find(c=>c.id===id)||CATS[0];
const trackEvent = (eventName, params = {}) => {
  if (window.gtag) window.gtag("event", eventName, params);
};

export default function App() {
  const [items,setItems]         = useState([]);
  const [loading,setLoading]     = useState(true);
  const [error,setError]         = useState(null);
  const [page,setPage]           = useState("home");
  const [region,setRegion]       = useState(null);
  const [detail,setDetail]       = useState(null);
  const [mapPin,setMapPin]       = useState(null);
  const [mapFilter,setMapFilter] = useState("all");
  const [activeItin,setActiveItin] = useState(null);
  const mapRef                   = useRef(null);
  const gMapRef                  = useRef(null);
  const markersRef               = useRef([]);

  // ── Load GA4 + Vercel Analytics + content on mount ───────────
  useEffect(() => {
    // Google Analytics 4
    if (!document.getElementById("ga4-script")) {
      const s = document.createElement("script");
      s.id = "ga4-script";
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      s.async = true;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA_ID);
    }

    // Vercel Analytics
    inject();

    fetchContent();
  }, []);

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

  const goHome  = () => { setPage("home"); setRegion(null); setDetail(null); setMapPin(null); setActiveItin(null); scrollTop(); };
  const goTrips = () => { setPage("trips"); setActiveItin(null); scrollTop(); trackEvent("view_trips"); };
  const goRegion = r => {
    setRegion(r); setPage("region"); setDetail(null); scrollTop();
    trackEvent("view_region", { region: r.id });
  };
  const goDetail = b => {
    setDetail(b); setPage("detail"); scrollTop();
    trackEvent("view_place", { place_name: b.name, place_category: b.category, place_area: b.area });
  };
  const goBack = () => { setPage("region"); setDetail(null); scrollTop(); };
  const goMap  = () => { setPage("map"); setDetail(null); setRegion(null); scrollTop(); trackEvent("view_map"); };

  // ── MapLibre ─────────────────────────────────────────────────
  const CAT_COLORS = {
    Beach:"#1D7A9E", Restaurant:"#8B6914", Activity:"#1A7A4A", Hotel:"#6B2D8B", Village:"#9E4A1D",
  };

  const loadMapLibre = useCallback(() => {
    if (!mapRef.current || gMapRef.current) return;
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }
    const loadLib = () => {
      if (window.maplibregl) { initMapLibre(); return; }
      if (document.getElementById("maplibre-js")) return;
      const script = document.createElement("script");
      script.id = "maplibre-js";
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
        sources: { "carto": { type:"raster", tiles:[
          "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
        ], tileSize:256, attribution:"© OpenStreetMap © CARTO" }},
        layers: [{ id:"carto-tiles", type:"raster", source:"carto", paint:{
          "raster-saturation":-0.25, "raster-brightness-min":0.08, "raster-contrast":0.05, "raster-opacity":0.9,
        }}],
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
      },
      center:[24.8093,35.2401], zoom:8.5, minZoom:7, maxZoom:16,
      maxBounds:[[22.0,34.2],[27.5,36.8]],
    });
    map.addControl(new ml.NavigationControl({ showCompass:false }), "bottom-right");
    gMapRef.current = map;
    map.on("load", () => addMapLibreMarkers(map, mapFilter));
  };

  const addMapLibreMarkers = (map, filter) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const toShow = filter === "all"
      ? items.filter(i => i.lat && i.lng)
      : items.filter(i => i.category === filter && i.lat && i.lng);
    toShow.forEach(item => {
      const color = CAT_COLORS[item.category] || "#C4A55A";
      const cat = getCat(item.category);
      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:4px;background:${color};color:white;
          padding:5px 11px;border-radius:20px;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;
          white-space:nowrap;letter-spacing:0.02em;box-shadow:0 3px 10px rgba(0,0,0,0.3);transition:transform 0.15s;">
          ${cat.icon} ${item.name}
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${color};"></div>
      `;
      el.addEventListener("mouseenter", () => { el.querySelector("div").style.transform = "scale(1.08)"; });
      el.addEventListener("mouseleave", () => { el.querySelector("div").style.transform = "scale(1)"; });
      el.addEventListener("click", () => {
        setMapPin(item);
        gMapRef.current.flyTo({ center:[parseFloat(item.lng),parseFloat(item.lat)], zoom:Math.max(gMapRef.current.getZoom(),11), duration:600 });
        trackEvent("map_pin_click", { place_name:item.name, place_category:item.category });
      });
      const marker = new window.maplibregl.Marker({ element:el, anchor:"bottom" })
        .setLngLat([parseFloat(item.lng), parseFloat(item.lat)]).addTo(map);
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (page === "map") { const t = setTimeout(() => loadMapLibre(), 150); return () => clearTimeout(t); }
  }, [page, items]);

  useEffect(() => {
    if (gMapRef.current && window.maplibregl && gMapRef.current.loaded()) {
      addMapLibreMarkers(gMapRef.current, mapFilter);
    }
  }, [mapFilter, items]);

  const forRegion = (area,cat) => items.filter(i=>i.area===area&&i.category===cat);
  const rGrad = r => `linear-gradient(150deg,${r.color1} 0%,${r.color2} 100%)`;

  const openMaps = item => {
    const url = item.maps
      ? item.maps
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name+' '+item.area+' Crete Greece')}`;
    const a = document.createElement("a");
    a.href=url; a.target="_blank"; a.rel="noopener noreferrer";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    trackEvent("open_maps", { place_name:item.name, place_category:item.category });
  };

  const openExternalLink = (url, item, linkType) => {
    const a = document.createElement("a");
    a.href=url; a.target="_blank"; a.rel="noopener noreferrer";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    trackEvent("click_external_link", { place_name:item.name, place_category:item.category, link_type:linkType });
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

  return (
    <>
      <style>{css}</style>
      <div className="app">

        <nav className="nav">
          {page==="home" ? (
            <div className="logo" onClick={goHome}><span className="logo-my">My</span><span className="logo-gr">Greece</span></div>
          ) : (
            <>
              <div className="nav-back" onClick={()=>{
                if (page==="detail") goBack();
                else if (page==="trips" && activeItin) { setActiveItin(null); scrollTop(); }
                else goHome();
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                {page==="detail"?(region?.id||"Back"):page==="trips"&&activeItin?"Trips":page==="region"?region.id:"Home"}
              </div>
              <div className="logo" onClick={goHome}><span className="logo-my">My</span><span className="logo-gr">Greece</span></div>
            </>
          )}
        </nav>

        {page==="home" && <>
          <div className="hero">
            <img src="https://i.imgur.com/TwfbviO.jpeg" alt="Crete" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 70%"}}/>
            <div className="hero-bg" style={{opacity:0.55}}/><div className="hero-glow"/><div className="hero-fade"/>
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
                {r.image
                  ? <img src={r.image} alt={r.id} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:r.imgPos||"center"}}/>
                  : <div style={{position:"absolute",inset:0,background:rGrad(r)}}/>}
                <div style={{position:"absolute",inset:0,background:"linear-gradient(100deg,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.35) 100%)"}}/>
                <div className="rc-shim"/>
                <div className="rc-body"><div className="rc-name">{r.id}</div><div className="rc-sub">{r.tagline}</div></div>
                <div className="rc-badge">{CATS.reduce((a,c)=>a+forRegion(r.id,c.id).length,0)} places</div>
              </div>
            ))}
          </div>
          <div className="pb"/>
        </>}

        {page==="region" && region && <>
          <div className="rh">
            {region.image && <img src={region.image} alt={region.id} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:region.imgPos||"center",filter:"blur(6px) brightness(0.45)",transform:"scale(1.05)"}}/>}
            {!region.image && <div style={{position:"absolute",inset:0,background:rGrad(region)}}/>}
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

                {["Beach","Activity","Village"].includes(detail.category) && (
                  <div className="dp-tips">
                    <div className="dp-tips-title">✦ Visitor Tips</div>
                    {tips.map((tip,i)=>(
                      <div key={i} className="dp-tip"><div className="dp-tip-dot"/><div className="dp-tip-text">{tip}</div></div>
                    ))}
                  </div>
                )}

                {["Hotel","Restaurant"].includes(detail.category) && (
                  <div className="dp-contact">
                    <div className="dp-contact-title">📋 Contact & Info</div>
                    {detail.phone && (
                      <a className="dp-contact-item" href={`tel:${detail.phone}`} onClick={()=>trackEvent("click_phone",{place_name:detail.name})}>
                        <div className="dp-contact-icon">📞</div>
                        <div><div className="dp-contact-label">Phone</div><div className="dp-contact-value">{detail.phone}</div></div>
                      </a>
                    )}
                    {detail.email && (
                      <a className="dp-contact-item" href={`mailto:${detail.email}`} onClick={()=>trackEvent("click_email",{place_name:detail.name})}>
                        <div className="dp-contact-icon">✉️</div>
                        <div><div className="dp-contact-label">Email</div><div className="dp-contact-value">{detail.email}</div></div>
                      </a>
                    )}
                    {detail.website && (
                      <a className="dp-contact-item" href={detail.website} target="_blank" rel="noopener noreferrer"
                        onClick={()=>trackEvent("click_external_link",{place_name:detail.name,place_category:detail.category,link_type:"website"})}>
                        <div className="dp-contact-icon">🌐</div>
                        <div><div className="dp-contact-label">Website</div><div className="dp-contact-value">{detail.website.replace(/https?:\/\/(www\.)?/,"")}</div></div>
                      </a>
                    )}
                    {detail.instagram && (
                      <a className="dp-contact-item" href={`https://instagram.com/${detail.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                        onClick={()=>trackEvent("click_external_link",{place_name:detail.name,place_category:detail.category,link_type:"instagram"})}>
                        <div className="dp-contact-icon">📸</div>
                        <div><div className="dp-contact-label">Instagram</div><div className="dp-contact-value">{detail.instagram.startsWith("@")?detail.instagram:`@${detail.instagram}`}</div></div>
                      </a>
                    )}
                    {detail.hours && (
                      <div className="dp-contact-item" style={{cursor:"default"}}>
                        <div className="dp-contact-icon">⏰</div>
                        <div><div className="dp-contact-label">Hours</div><div className="dp-contact-value">{detail.hours}</div></div>
                      </div>
                    )}
                    {detail.address && (
                      <a className="dp-contact-item"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.address)}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={()=>trackEvent("click_external_link",{place_name:detail.name,place_category:detail.category,link_type:"address"})}>
                        <div className="dp-contact-icon">📍</div>
                        <div><div className="dp-contact-label">Address</div><div className="dp-contact-value">{detail.address}</div></div>
                      </a>
                    )}
                    {!detail.phone && !detail.email && !detail.website && !detail.instagram && !detail.hours && !detail.address && (
                      <div style={{fontSize:13,color:"var(--stone)",fontWeight:300}}>Add contact details in Notion to show them here.</div>
                    )}
                  </div>
                )}

                <button className="maps-btn" onClick={()=>openMaps(detail)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {detail.maps?"Open Exact Location in Maps":"Search in Google Maps"}
                </button>

                {detail.category==="Activity" && detail.gyg && (
                  <button className="gyg-btn" onClick={()=>openExternalLink(detail.gyg,detail,"getyourguide")}>
                    <span>🎟</span>
                    <span>Book This Activity<span className="gyg-btn-sub">via GetYourGuide · Best Price Guaranteed</span></span>
                  </button>
                )}

                {detail.category==="Hotel" && detail.booking && (
                  <button className="booking-btn" onClick={()=>openExternalLink(detail.booking,detail,"booking")}>
                    <span>🏨</span>
                    <span>Book on Booking.com<span className="booking-btn-sub">Best price · Free cancellation available</span></span>
                  </button>
                )}

                <button className="share-btn" onClick={()=>{
                  navigator.share&&navigator.share({title:detail.name,text:`Check out ${detail.name} in ${detail.area}, Crete — via MyGreece`,url:window.location.href});
                  trackEvent("share_place",{place_name:detail.name});
                }}>
                  <span>↑</span> Share this place
                </button>
              </div>
            </div>
          );
        })()}

        {/* TRIPS PAGE */}
        {page==="trips" && !activeItin && (
          <div className="trips-page">
            <div className="trips-hero">
              <div className="trips-eye">MyGreece ◈ Curated</div>
              <div className="trips-title">Plan Your<br/><em>Perfect Trip.</em></div>
              <div className="trips-sub">Hand-picked itineraries combining the best of Crete — nature, culture, food & atmosphere.</div>
            </div>
            <div className="trips-section-label">Available Itineraries</div>
            {ITINERARIES.map(itin=>(
              <div key={itin.id} className="itin-card" onClick={()=>{ setActiveItin(itin); scrollTop(); trackEvent("view_itinerary",{itinerary:itin.id}); }}>
                <div className="itin-card-header">
                  <div className="itin-card-top">
                    <div className="itin-card-region">📍 {itin.region}</div>
                    <div className="itin-card-dur">{itin.duration}</div>
                  </div>
                  <div className="itin-card-title">{itin.title}</div>
                  <div className="itin-card-tagline">{itin.tagline}</div>
                </div>
                <div className="itin-card-stops">
                  {itin.stops.filter(s=>s.type!=="transit").map((s,i)=>(
                    <div key={i} className="itin-card-stop">{s.icon} {s.name}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ITINERARY DETAIL */}
        {page==="trips" && activeItin && (
          <div className="itin-detail">
            <div className="itin-detail-hero">
              <div className="itin-detail-eye">MyGreece ◈ {activeItin.region} · {activeItin.duration}</div>
              <div className="itin-detail-title">{activeItin.title}</div>
              <div className="itin-detail-sub">{activeItin.tagline}</div>
            </div>
            <div className="itin-detail-body">
              <div className="timeline">
                {activeItin.stops.map((stop,i)=>(
                  <div key={i} className="tl-item">
                    <div className={`tl-dot ${stop.type==="transit"?"transit":""}`}/>
                    <div className="tl-time-label">
                      <div className="tl-time">{stop.icon} {stop.time}</div>
                      <div className="tl-label">· {stop.label}</div>
                    </div>
                    {stop.type==="transit" ? (
                      <div className="tl-card transit">
                        <div className="tl-transit-text">{stop.name}</div>
                      </div>
                    ) : (
                      <div className="tl-card">
                        {stop.image && <img className="tl-card-img" src={stop.image} alt={stop.name}/>}
                        <div className="tl-card-body">
                          <div className="tl-card-type">{stop.type}</div>
                          <div className="tl-card-name">{stop.name}</div>
                          <div className="tl-card-desc">{stop.description}</div>
                          {stop.tags && <div className="tl-card-tags">{stop.tags.map((t,j)=><span key={j} className="tl-card-tag">{t}</span>)}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="highlights-box">
                <div className="highlights-title">✦ Experience Highlights</div>
                {activeItin.highlights.map((h,i)=>(
                  <div key={i} className="highlight-item">
                    <div className="highlight-dot"/>
                    <div className="highlight-text">{h}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAP PAGE */}
        <div style={{display:page==="map"?"block":"none",position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"430px",height:"100vh",zIndex:page==="map"?50:-1}} className="map-page">
          <div className="map-filters">
            {[
              {id:"all",label:"All",icon:"🗺"},
              {id:"Beach",label:"Beaches",icon:"🌊"},
              {id:"Restaurant",label:"Food",icon:"🫒"},
              {id:"Hotel",label:"Stay",icon:"🏡"},
              {id:"Activity",label:"Activities",icon:"🧗"},
              {id:"Village",label:"Villages",icon:"⛪"},
            ].map(f=>(
              <div key={f.id} className={`map-chip ${mapFilter===f.id?"on":""}`}
                onClick={()=>{ setMapFilter(f.id); trackEvent("map_filter",{filter:f.id}); }}>
                <span>{f.icon}</span>{f.label}
              </div>
            ))}
          </div>
          <div className="map-container">
            <div ref={mapRef} className="map-div"/>
          </div>
          {mapPin && page==="map" && (
            <div className="map-card">
              <div className="map-card-img">
                {mapPin.image
                  ? <img src={mapPin.image} alt={mapPin.name} onError={e=>e.target.style.display="none"}/>
                  : <span style={{fontSize:24}}>{mapPin.emoji||getCat(mapPin.category).icon}</span>}
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
                trackEvent("view_place",{place_name:mapPin.name,place_category:mapPin.category,place_area:mapPin.area,source:"map"});
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
            {id:"home",  icon:"🏠", label:"Home",  action:goHome},
            {id:"map",   icon:"🗺",  label:"Map",   action:goMap},
            {id:"trips", icon:"✈️", label:"Trips",  action:goTrips},
            {id:"info",  icon:"ℹ️",  label:"Info",  action:()=>{ setPage("info"); scrollTop(); }},
          ].map(n=>(
            <div key={n.id} className={`bni ${page===n.id?"on":page==="home"&&n.id==="home"?"on":""}`} onClick={n.action}>
              <div className="bni-i">{n.icon}</div>
              <div className="bni-l">{n.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
