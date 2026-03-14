import{j as e}from"./vendor-charts-B7prpoRT.js";import{r as s}from"./vendor-react-F98pCYxu.js";import{$ as I,a as E}from"./vendor-music-BVvkMYeY.js";import{m as k}from"./musicUtils-BWXlh5Gu.js";const M=()=>e.jsx("svg",{width:"40",height:"40",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5v14l11-7z"})}),z=()=>e.jsx("svg",{width:"40",height:"40",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}),R=({color:a="white",size:x=20})=>e.jsx("svg",{width:x,height:x,viewBox:"0 0 24 24",fill:a,children:e.jsx("path",{d:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"})}),T=new Blob([`
    let timerID = null;
    let interval = 25;
    self.onmessage = (e) => {
        if (e.data === "start") {
            timerID = setInterval(() => postMessage("tick"), interval);
        } else if (e.data === "stop") {
            clearInterval(timerID);
            timerID = null;
        }
    };
`],{type:"application/javascript"}),A=({bpm:a,isPlaying:x=!1,variant:f="floating"})=>{const[l,w]=s.useState(x),[i,m]=s.useState(!1),b=s.useMemo(()=>Math.random().toString(36).substr(2,9),[]),S=s.useRef(a),v=s.useRef(i),n=s.useRef(null),o=s.useRef(0),t=s.useRef(null),d=s.useRef(0);s.useEffect(()=>{S.current=a},[a]),s.useEffect(()=>{v.current=i},[i]);const h=s.useCallback((r,p)=>{if(!n.current)return;n.current.state==="suspended"&&n.current.resume();const u=n.current.createOscillator(),g=n.current.createGain(),C=n.current.createBiquadFilter();C.type="highpass",C.frequency.setValueAtTime(800,r),u.type="square",u.frequency.setValueAtTime(p?1600:1e3,r),g.gain.setValueAtTime(0,r),g.gain.linearRampToValueAtTime(p?.7:.4,r+.005),g.gain.exponentialRampToValueAtTime(.001,r+.04),u.connect(g),g.connect(C),C.connect(n.current.destination),u.start(r),u.stop(r+.06)},[]),y=s.useCallback(()=>{if(n.current)for(o.current<n.current.currentTime&&(o.current=n.current.currentTime+.05);o.current<n.current.currentTime+.1;){const r=d.current,p=r%2!==0,u=r===0;(!p||v.current)&&h(o.current,u);const g=60/S.current;o.current+=g/2,d.current=(d.current+1)%8}},[h]);s.useEffect(()=>{const r=p=>{p.detail?.id!==b&&c()};return window.addEventListener("metronome-play",r),()=>window.removeEventListener("metronome-play",r)},[b]);const c=()=>{t.current&&t.current.postMessage("stop"),w(!1)},j=r=>{if(r&&r.stopPropagation(),l)c();else{if(window.dispatchEvent(new CustomEvent("metronome-play",{detail:{id:b}})),n.current||(n.current=new(window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"})),n.current.state==="suspended"&&n.current.resume(),!t.current){const p=URL.createObjectURL(T);t.current=new Worker(p),t.current.onmessage=u=>{u.data==="tick"&&y()}}d.current=0,o.current=n.current.currentTime+.05,w(!0),t.current.postMessage("start")}};return s.useEffect(()=>()=>{t.current&&(t.current.postMessage("stop"),t.current.terminate())},[]),f==="card"?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},onClick:r=>r.stopPropagation(),children:[e.jsx("button",{onClick:j,className:"btn-icon",style:{width:"58px",height:"58px",backgroundColor:l?"var(--color-danger-red)":"var(--color-brand-blue)",color:"white",boxShadow:"0 4px 8px rgba(0,0,0,0.2)",transition:"background-color 0.2s"},children:l?e.jsx("svg",{width:"36",height:"36",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}):e.jsx("svg",{width:"36",height:"36",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5v14l11-7z"})})}),e.jsx("button",{onClick:r=>{r.stopPropagation(),m(!i)},className:"btn-icon",style:{width:"58px",height:"58px",backgroundColor:i?"var(--color-brand-blue)":"var(--color-ui-surface)",color:i?"white":"var(--color-ui-text)",boxShadow:"0 2px 4px rgba(0,0,0,0.1)"},title:"Corcheas",children:e.jsx(R,{color:"currentColor",size:36})})]}):f==="inline"?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px",padding:"8px 0"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column"},children:[e.jsx("span",{className:"text-overline",style:{color:"gray",fontSize:"10px"},children:"RITMO"}),e.jsxs("span",{style:{fontWeight:"bold",fontSize:"16px",color:"var(--color-ui-text)"},children:[a," ",e.jsx("span",{style:{fontSize:"12px",fontWeight:"normal",color:"gray"},children:"BPM"})]})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("button",{onClick:j,className:"btn-icon",style:{width:"56px",height:"56px",backgroundColor:l?"var(--color-danger-red)":"var(--color-brand-blue)",color:"white",boxShadow:"0 4px 12px rgba(0,0,0,0.2)",transition:"all 0.2s"},title:l?"Pausar":"Reproducir",children:l?e.jsx(z,{}):e.jsx(M,{})}),e.jsx("button",{onClick:()=>m(!i),className:"btn-icon",style:{width:"56px",height:"56px",backgroundColor:i?"var(--color-brand-blue)":"var(--color-ui-surface)",color:i?"white":"var(--color-ui-text)",border:"1px solid var(--color-border-subtle)",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",transition:"all 0.2s"},title:"Corcheas",children:e.jsx(R,{color:"currentColor",size:30})})]})]}):e.jsxs("div",{style:{position:"fixed",right:"24px",bottom:"100px",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"},children:[e.jsxs("div",{onClick:j,style:{width:"72px",height:"72px",borderRadius:"50%",backgroundColor:l?"var(--color-danger-red)":"var(--color-brand-blue)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",transition:"all 0.2s",border:"none"},children:[e.jsx("span",{className:"text-overline",style:{fontSize:"11px",color:"white",fontWeight:"bold",lineHeight:1,marginBottom:"4px"},children:"BPM"}),l?e.jsx(z,{}):e.jsx(M,{})]}),e.jsx("button",{onClick:()=>m(!i),className:"btn-icon",style:{width:"52px",height:"52px",backgroundColor:i?"var(--color-brand-blue)":"var(--color-ui-surface)",color:i?"white":"var(--color-ui-text)",boxShadow:"0 2px 10px rgba(0,0,0,0.15)",transition:"all 0.2s"},title:"Corcheas",children:e.jsx(R,{color:"currentColor",size:28})})]})},V=({content:a,transpose:x,viewMode:f,songKey:l,fontSize:w=16})=>{if(!a||!a.trim())return e.jsx("div",{style:{padding:"20px",textAlign:"center",opacity:.5,fontStyle:"italic"},children:"Sin contenido de letra o acordes."});const i=a.split(`
`).map(o=>{o=o.replace(/\[([^\]]*)\}/g,"[$1]");let t=0;for(let c=0;c<o.length;c++)o[c]==="["&&t++,o[c]==="]"&&t--;let d=t>0?o+"]".repeat(t):o;const y=d.trim().match(/^\[([^\]]+)\]$/);if(y){let c=y[1].trim();if(c=c.replace(/\}$/,""),["intro","coro","verse","verso","estrofa","puente","bridge","solo","final","outro","instrumental","interlude","coda","pre-coro","pre-chorus","estribillo","parte"].some(p=>c.toLowerCase().includes(p))||c.length>4&&!/^[A-G][b#]?(m|maj|min|dim|aug)?[0-9]?/.test(c))return`{c: ${c}}`}return d.replace(/\[\]/g,"[ ]")}).join(`
`);let m;try{m=new I().parse(i)}catch(o){return console.warn("ChordSheetJS parsing error:",o),e.jsxs("div",{className:"chord-sheet-container",children:[e.jsxs("div",{style:{padding:"16px",backgroundColor:"rgba(239, 68, 68, 0.05)",borderRadius:"8px",border:"1px dashed rgba(239, 68, 68, 0.3)",color:"#EF4444",fontSize:"12px",marginBottom:"16px"},children:[e.jsx("span",{className:"material-symbols-outlined",style:{verticalAlign:"middle",marginRight:"8px",fontSize:"18px"},children:"warning"}),"Error al procesar acordes. Revisa que todos los corchetes [ ] estén cerrados."]}),e.jsx("pre",{style:{whiteSpace:"pre-wrap",fontStyle:"italic",opacity:.7},children:a})]})}const b=k.transposeNote(l,x);m.lines.forEach(o=>{o.items.forEach(t=>{if(typeof t=="object"&&t!==null&&"chords"in t&&t.chords){const d=t;let h=k.transposeNote(d.chords,x,b);f==="roman"?h=k.toRoman(h,b):f==="spanish"&&(h=k.toSolfege(h)),d.chords=h}})});let v=new E().format(m);v=v.replace(/<div class="row">\s*<div class="comment">/g,'<div class="row row-has-comment"><div class="comment">');const n=`
        .chord-sheet-container {
            font-family: 'Roboto Mono', monospace;
            font-size: ${w}px;
            line-height: normal;
            color: var(--color-ui-text);
        }
        .chord-sheet-container .paragraph {
            margin-bottom: 16px;
        }
        .chord-sheet-container .row {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end; /* Align lyrics when chords are hidden */
            margin-bottom: 12px;
        }
        .chord-sheet-container .row-has-comment {
            margin-bottom: 4px;
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
            padding-right: 8px; /* Ensure space between adjacent chords */
            margin-right: 4px; /* Ensure space between adjacent chords */
            white-space: pre; /* Prevent wrapping inside chord names */
            display: ${f==="lyrics"?"none":"block"};
        }
        .chord-sheet-container .chord:empty {
            display: none !important; /* Hide empty chords so lyric lines don't get huge gaps */
        }
        .chord-sheet-container .lyrics {
            min-height: 1.25em;
            white-space: pre;
        }
        .chord-sheet-container .comment {
            font-weight: bold;
            color: var(--color-brand-blue);
            margin-bottom: 4px;
            display: block;
            text-transform: uppercase;
            font-size: 0.85em;
            opacity: 0.8;
            border-bottom: 1px solid var(--color-border-subtle);
            padding-bottom: 2px;
        }

    `;return e.jsxs("div",{className:"chord-sheet-container",children:[e.jsx("style",{children:n}),e.jsx("div",{dangerouslySetInnerHTML:{__html:v}})]})};export{V as C,A as M};
