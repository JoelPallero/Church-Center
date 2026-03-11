import{j as e}from"./vendor-charts-B7prpoRT.js";import{r as n}from"./vendor-react-F98pCYxu.js";import{$ as T,a as M}from"./vendor-music-BVvkMYeY.js";import{m as w}from"./musicUtils-BWXlh5Gu.js";const S=()=>e.jsx("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5v14l11-7z"})}),R=()=>e.jsx("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}),k=({color:c="white"})=>e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:c,children:e.jsx("path",{d:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"})}),B=({bpm:c,isPlaying:y=!1,variant:h="floating"})=>{const[i,v]=n.useState(y),[o,d]=n.useState(!1),g=n.useRef(c),j=n.useRef(o),t=n.useRef(null),x=n.useRef(0),l=n.useRef(null),s=n.useRef(0);n.useEffect(()=>{g.current=c},[c]),n.useEffect(()=>{j.current=o},[o]);const b=n.useCallback((r,m)=>{if(!t.current)return;const u=t.current.createOscillator(),p=t.current.createGain(),f=t.current.createBiquadFilter();f.type="highpass",f.frequency.setValueAtTime(800,r),u.type="square",u.frequency.setValueAtTime(m?1600:1e3,r),p.gain.setValueAtTime(m?.7:.4,r),p.gain.exponentialRampToValueAtTime(.001,r+.04),u.connect(p),p.connect(f),f.connect(t.current.destination),u.start(r),u.stop(r+.06)},[]),a=n.useCallback(function r(){if(t.current){for(;x.current<t.current.currentTime+.1;){const m=s.current,u=m%2!==0,p=m===0;(!u||j.current)&&b(x.current,p);const f=60/g.current;x.current+=f/2,s.current=(s.current+1)%8}l.current=window.setTimeout(r,25)}},[b]),C=r=>{r&&r.stopPropagation(),i?(l.current&&clearTimeout(l.current),v(!1)):(t.current||(t.current=new(window.AudioContext||window.webkitAudioContext)),t.current.state==="suspended"&&t.current.resume(),s.current=0,x.current=t.current.currentTime+.05,v(!0),a())};return n.useEffect(()=>()=>{l.current&&clearTimeout(l.current)},[]),h==="card"?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},onClick:r=>r.stopPropagation(),children:[e.jsx("button",{onClick:C,className:"btn-icon",style:{width:"28px",height:"28px",backgroundColor:"var(--color-brand-blue)",color:"white",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"},children:i?e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}):e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5v14l11-7z"})})}),e.jsx("button",{onClick:r=>{r.stopPropagation(),d(!o)},className:"btn-icon",style:{width:"28px",height:"28px",backgroundColor:o?"var(--color-brand-blue)":"var(--color-ui-surface)",color:o?"white":"var(--color-ui-text)",boxShadow:"0 1px 2px rgba(0,0,0,0.1)"},title:"Corcheas",children:e.jsx(k,{color:"currentColor"})})]}):h==="inline"?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px",padding:"8px 0"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column"},children:[e.jsx("span",{className:"text-overline",style:{color:"gray",fontSize:"10px"},children:"RITMO"}),e.jsxs("span",{style:{fontWeight:"bold",fontSize:"16px",color:"var(--color-ui-text)"},children:[c," ",e.jsx("span",{style:{fontSize:"12px",fontWeight:"normal",color:"gray"},children:"BPM"})]})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("button",{onClick:C,className:"btn-icon",style:{width:"44px",height:"44px",backgroundColor:i?"var(--color-danger-red)":"var(--color-brand-blue)",color:"white",boxShadow:"0 4px 12px rgba(0,0,0,0.2)",transition:"all 0.2s"},title:i?"Pausar":"Reproducir",children:i?e.jsx(R,{}):e.jsx(S,{})}),e.jsx("button",{onClick:()=>d(!o),className:"btn-icon",style:{width:"44px",height:"44px",backgroundColor:o?"var(--color-brand-blue)":"var(--color-ui-surface)",color:o?"white":"var(--color-ui-text)",border:"1px solid var(--color-border-subtle)",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",transition:"all 0.2s"},title:"Corcheas",children:e.jsx(k,{color:"currentColor"})})]})]}):e.jsxs("div",{style:{position:"fixed",right:"24px",bottom:"100px",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"},children:[e.jsxs("div",{onClick:C,style:{width:"64px",height:"64px",borderRadius:"50%",backgroundColor:"var(--color-brand-blue)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",transition:"transform 0.1s",border:"none"},onMouseDown:r=>r.currentTarget.style.transform="scale(0.92)",onMouseUp:r=>r.currentTarget.style.transform="scale(1)",children:[e.jsx("span",{className:"text-overline",style:{fontSize:"11px",color:"white",fontWeight:"bold",lineHeight:1,marginBottom:"4px"},children:"BPM"}),i?e.jsx(R,{}):e.jsx(S,{})]}),e.jsx("button",{onClick:()=>d(!o),className:"btn-icon",style:{width:"40px",height:"40px",backgroundColor:o?"var(--color-brand-blue)":"var(--color-ui-surface)",color:o?"white":"var(--color-ui-text)",boxShadow:"0 2px 10px rgba(0,0,0,0.15)",transition:"all 0.2s"},title:"Corcheas",children:e.jsx(k,{color:"currentColor"})})]})},V=({content:c,transpose:y,viewMode:h,songKey:i,fontSize:v=16})=>{const d=new T().parse(c),g=w.transposeNote(i,y);d.lines.forEach(l=>{l.items.forEach(s=>{if(typeof s=="object"&&s!==null&&"chords"in s&&s.chords){const b=s;let a=w.transposeNote(b.chords,y,g);h==="roman"?a=w.toRoman(a,g):h==="spanish"&&(a=w.toSolfege(a)),b.chords=a}})});const t=new M().format(d),x=`
        .chord-sheet-container {
            font-family: 'Roboto Mono', monospace;
            font-size: ${v}px;
            line-height: normal;
            color: var(--color-ui-text);
        }
        .chord-sheet-container .paragraph {
            margin-bottom: 32px;
        }
        .chord-sheet-container .row {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }
        .chord-sheet-container .column {
            display: flex;
            flex-direction: column;
            margin-right: 0;
        }
        .chord-sheet-container .chord {
            color: var(--color-brand-blue);
            font-weight: bold;
            height: 1.5em;
            padding-top: 4px;
            display: ${h==="lyrics"?"none":"block"};
        }
        .chord-sheet-container .lyrics {
            min-height: 1.25em;
            white-space: pre;
        }
        .chord-sheet-container .comment {
            font-style: italic;
            color: gray;
            margin-bottom: 12px;
            display: block;
        }
    `;return e.jsxs("div",{className:"chord-sheet-container",children:[e.jsx("style",{children:x}),e.jsx("div",{dangerouslySetInnerHTML:{__html:t}})]})};export{V as C,B as M};
