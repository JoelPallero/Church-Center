import{j as e}from"./vendor-charts-B7prpoRT.js";import{r as i}from"./vendor-react-F98pCYxu.js";import{$ as z,a as T}from"./vendor-music-BVvkMYeY.js";import{m as j}from"./musicUtils-BWXlh5Gu.js";const k=()=>e.jsx("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5v14l11-7z"})}),R=()=>e.jsx("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}),S=({color:c="white"})=>e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:c,children:e.jsx("path",{d:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"})}),P=({bpm:c,isPlaying:v=!1,variant:x="floating"})=>{const[l,w]=i.useState(v),[n,p]=i.useState(!1),y=i.useRef(c),C=i.useRef(n),s=i.useRef(null),f=i.useRef(0),t=i.useRef(null),o=i.useRef(0);i.useEffect(()=>{y.current=c},[c]),i.useEffect(()=>{C.current=n},[n]);const a=i.useCallback((r,m)=>{if(!s.current)return;const u=s.current.createOscillator(),h=s.current.createGain(),b=s.current.createBiquadFilter();b.type="highpass",b.frequency.setValueAtTime(800,r),u.type="square",u.frequency.setValueAtTime(m?1600:1e3,r),h.gain.setValueAtTime(m?.7:.4,r),h.gain.exponentialRampToValueAtTime(.001,r+.04),u.connect(h),h.connect(b),b.connect(s.current.destination),u.start(r),u.stop(r+.06)},[]),d=i.useCallback(function r(){if(s.current){for(;f.current<s.current.currentTime+.1;){const m=o.current,u=m%2!==0,h=m===0;(!u||C.current)&&a(f.current,h);const b=60/y.current;f.current+=b/2,o.current=(o.current+1)%8}t.current=window.setTimeout(r,25)}},[a]),g=r=>{r&&r.stopPropagation(),l?(t.current&&clearTimeout(t.current),w(!1)):(s.current||(s.current=new(window.AudioContext||window.webkitAudioContext)),s.current.state==="suspended"&&s.current.resume(),o.current=0,f.current=s.current.currentTime+.05,w(!0),d())};return i.useEffect(()=>()=>{t.current&&clearTimeout(t.current)},[]),x==="card"?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},onClick:r=>r.stopPropagation(),children:[e.jsx("button",{onClick:g,className:"btn-icon",style:{width:"28px",height:"28px",backgroundColor:"var(--color-brand-blue)",color:"white",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"},children:l?e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}):e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5v14l11-7z"})})}),e.jsx("button",{onClick:r=>{r.stopPropagation(),p(!n)},className:"btn-icon",style:{width:"28px",height:"28px",backgroundColor:n?"var(--color-brand-blue)":"var(--color-ui-surface)",color:n?"white":"var(--color-ui-text)",boxShadow:"0 1px 2px rgba(0,0,0,0.1)"},title:"Corcheas",children:e.jsx(S,{color:"currentColor"})})]}):x==="inline"?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px",padding:"8px 0"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column"},children:[e.jsx("span",{className:"text-overline",style:{color:"gray",fontSize:"10px"},children:"RITMO"}),e.jsxs("span",{style:{fontWeight:"bold",fontSize:"16px",color:"var(--color-ui-text)"},children:[c," ",e.jsx("span",{style:{fontSize:"12px",fontWeight:"normal",color:"gray"},children:"BPM"})]})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("button",{onClick:g,className:"btn-icon",style:{width:"44px",height:"44px",backgroundColor:l?"var(--color-danger-red)":"var(--color-brand-blue)",color:"white",boxShadow:"0 4px 12px rgba(0,0,0,0.2)",transition:"all 0.2s"},title:l?"Pausar":"Reproducir",children:l?e.jsx(R,{}):e.jsx(k,{})}),e.jsx("button",{onClick:()=>p(!n),className:"btn-icon",style:{width:"44px",height:"44px",backgroundColor:n?"var(--color-brand-blue)":"var(--color-ui-surface)",color:n?"white":"var(--color-ui-text)",border:"1px solid var(--color-border-subtle)",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",transition:"all 0.2s"},title:"Corcheas",children:e.jsx(S,{color:"currentColor"})})]})]}):e.jsxs("div",{style:{position:"fixed",right:"24px",bottom:"100px",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"},children:[e.jsxs("div",{onClick:g,style:{width:"64px",height:"64px",borderRadius:"50%",backgroundColor:"var(--color-brand-blue)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",transition:"transform 0.1s",border:"none"},onMouseDown:r=>r.currentTarget.style.transform="scale(0.92)",onMouseUp:r=>r.currentTarget.style.transform="scale(1)",children:[e.jsx("span",{className:"text-overline",style:{fontSize:"11px",color:"white",fontWeight:"bold",lineHeight:1,marginBottom:"4px"},children:"BPM"}),l?e.jsx(R,{}):e.jsx(k,{})]}),e.jsx("button",{onClick:()=>p(!n),className:"btn-icon",style:{width:"40px",height:"40px",backgroundColor:n?"var(--color-brand-blue)":"var(--color-ui-surface)",color:n?"white":"var(--color-ui-text)",boxShadow:"0 2px 10px rgba(0,0,0,0.15)",transition:"all 0.2s"},title:"Corcheas",children:e.jsx(S,{color:"currentColor"})})]})},$=({content:c,transpose:v,viewMode:x,songKey:l,fontSize:w=16})=>{if(!c||!c.trim())return e.jsx("div",{style:{padding:"20px",textAlign:"center",opacity:.5,fontStyle:"italic"},children:"Sin contenido de letra o acordes."});const n=c.split(`
`).map(t=>{let o=0;for(let r=0;r<t.length;r++)t[r]==="["&&o++,t[r]==="]"&&o--;let a=o>0?t+"]".repeat(o):t;const g=a.trim().match(/^\[([^\]]+)\]$/);if(g){const r=g[1].trim();if(["intro","coro","verse","verso","estrofa","puente","bridge","solo","final","outro","instrumental","interlude","coda","pre-coro","pre-chorus","estribillo","parte"].some(h=>r.toLowerCase().includes(h))||r.length>4&&!/^[A-G][b#]?(m|maj|min|dim|aug)?[0-9]?/.test(r))return`{c: ${r}}`}return a.replace(/\[\]/g,"[ ]")}).join(`
`);let p;try{p=new z().parse(n)}catch(t){return console.warn("ChordSheetJS parsing error:",t),e.jsxs("div",{className:"chord-sheet-container",children:[e.jsxs("div",{style:{padding:"16px",backgroundColor:"rgba(239, 68, 68, 0.05)",borderRadius:"8px",border:"1px dashed rgba(239, 68, 68, 0.3)",color:"#EF4444",fontSize:"12px",marginBottom:"16px"},children:[e.jsx("span",{className:"material-symbols-outlined",style:{verticalAlign:"middle",marginRight:"8px",fontSize:"18px"},children:"warning"}),"Error al procesar acordes. Revisa que todos los corchetes [ ] estén cerrados."]}),e.jsx("pre",{style:{whiteSpace:"pre-wrap",fontStyle:"italic",opacity:.7},children:c})]})}const y=j.transposeNote(l,v);p.lines.forEach(t=>{t.items.forEach(o=>{if(typeof o=="object"&&o!==null&&"chords"in o&&o.chords){const a=o;let d=j.transposeNote(a.chords,v,y);x==="roman"?d=j.toRoman(d,y):x==="spanish"&&(d=j.toSolfege(d)),a.chords=d}})});const s=new T().format(p),f=`
        .chord-sheet-container {
            font-family: 'Roboto Mono', monospace;
            font-size: ${w}px;
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
            display: ${x==="lyrics"?"none":"block"};
        }
        .chord-sheet-container .lyrics {
            min-height: 1.25em;
            white-space: pre;
        }
        .chord-sheet-container .comment {
            font-weight: bold;
            color: var(--color-brand-blue);
            margin-bottom: 8px;
            display: block;
            text-transform: uppercase;
            font-size: 0.85em;
            opacity: 0.8;
            border-bottom: 1px solid var(--color-border-subtle);
            padding-bottom: 2px;
        }

    `;return e.jsxs("div",{className:"chord-sheet-container",children:[e.jsx("style",{children:f}),e.jsx("div",{dangerouslySetInnerHTML:{__html:s}})]})};export{$ as C,P as M};
