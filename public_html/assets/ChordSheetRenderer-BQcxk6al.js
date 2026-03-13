import{j as e}from"./vendor-charts-B7prpoRT.js";import{r as i}from"./vendor-react-F98pCYxu.js";import{$ as z,a as T}from"./vendor-music-BVvkMYeY.js";import{m as w}from"./musicUtils-BWXlh5Gu.js";const k=()=>e.jsx("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5v14l11-7z"})}),R=()=>e.jsx("svg",{width:"32",height:"32",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}),S=({color:l="white"})=>e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:l,children:e.jsx("path",{d:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"})}),P=({bpm:l,isPlaying:y=!1,variant:u="floating"})=>{const[a,v]=i.useState(y),[n,d]=i.useState(!1),m=i.useRef(l),j=i.useRef(n),s=i.useRef(null),x=i.useRef(0),t=i.useRef(null),o=i.useRef(0);i.useEffect(()=>{m.current=l},[l]),i.useEffect(()=>{j.current=n},[n]);const p=i.useCallback((r,b)=>{if(!s.current)return;const h=s.current.createOscillator(),f=s.current.createGain(),g=s.current.createBiquadFilter();g.type="highpass",g.frequency.setValueAtTime(800,r),h.type="square",h.frequency.setValueAtTime(b?1600:1e3,r),f.gain.setValueAtTime(b?.7:.4,r),f.gain.exponentialRampToValueAtTime(.001,r+.04),h.connect(f),f.connect(g),g.connect(s.current.destination),h.start(r),h.stop(r+.06)},[]),c=i.useCallback(function r(){if(s.current){for(;x.current<s.current.currentTime+.1;){const b=o.current,h=b%2!==0,f=b===0;(!h||j.current)&&p(x.current,f);const g=60/m.current;x.current+=g/2,o.current=(o.current+1)%8}t.current=window.setTimeout(r,25)}},[p]),C=r=>{r&&r.stopPropagation(),a?(t.current&&clearTimeout(t.current),v(!1)):(s.current||(s.current=new(window.AudioContext||window.webkitAudioContext)),s.current.state==="suspended"&&s.current.resume(),o.current=0,x.current=s.current.currentTime+.05,v(!0),c())};return i.useEffect(()=>()=>{t.current&&clearTimeout(t.current)},[]),u==="card"?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},onClick:r=>r.stopPropagation(),children:[e.jsx("button",{onClick:C,className:"btn-icon",style:{width:"28px",height:"28px",backgroundColor:"var(--color-brand-blue)",color:"white",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"},children:a?e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M6 19h4V5H6v14zm8-14v14h4V5h-4z"})}):e.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5v14l11-7z"})})}),e.jsx("button",{onClick:r=>{r.stopPropagation(),d(!n)},className:"btn-icon",style:{width:"28px",height:"28px",backgroundColor:n?"var(--color-brand-blue)":"var(--color-ui-surface)",color:n?"white":"var(--color-ui-text)",boxShadow:"0 1px 2px rgba(0,0,0,0.1)"},title:"Corcheas",children:e.jsx(S,{color:"currentColor"})})]}):u==="inline"?e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px",padding:"8px 0"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column"},children:[e.jsx("span",{className:"text-overline",style:{color:"gray",fontSize:"10px"},children:"RITMO"}),e.jsxs("span",{style:{fontWeight:"bold",fontSize:"16px",color:"var(--color-ui-text)"},children:[l," ",e.jsx("span",{style:{fontSize:"12px",fontWeight:"normal",color:"gray"},children:"BPM"})]})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"12px"},children:[e.jsx("button",{onClick:C,className:"btn-icon",style:{width:"44px",height:"44px",backgroundColor:a?"var(--color-danger-red)":"var(--color-brand-blue)",color:"white",boxShadow:"0 4px 12px rgba(0,0,0,0.2)",transition:"all 0.2s"},title:a?"Pausar":"Reproducir",children:a?e.jsx(R,{}):e.jsx(k,{})}),e.jsx("button",{onClick:()=>d(!n),className:"btn-icon",style:{width:"44px",height:"44px",backgroundColor:n?"var(--color-brand-blue)":"var(--color-ui-surface)",color:n?"white":"var(--color-ui-text)",border:"1px solid var(--color-border-subtle)",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",transition:"all 0.2s"},title:"Corcheas",children:e.jsx(S,{color:"currentColor"})})]})]}):e.jsxs("div",{style:{position:"fixed",right:"24px",bottom:"100px",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"},children:[e.jsxs("div",{onClick:C,style:{width:"64px",height:"64px",borderRadius:"50%",backgroundColor:"var(--color-brand-blue)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.3)",transition:"transform 0.1s",border:"none"},onMouseDown:r=>r.currentTarget.style.transform="scale(0.92)",onMouseUp:r=>r.currentTarget.style.transform="scale(1)",children:[e.jsx("span",{className:"text-overline",style:{fontSize:"11px",color:"white",fontWeight:"bold",lineHeight:1,marginBottom:"4px"},children:"BPM"}),a?e.jsx(R,{}):e.jsx(k,{})]}),e.jsx("button",{onClick:()=>d(!n),className:"btn-icon",style:{width:"40px",height:"40px",backgroundColor:n?"var(--color-brand-blue)":"var(--color-ui-surface)",color:n?"white":"var(--color-ui-text)",boxShadow:"0 2px 10px rgba(0,0,0,0.15)",transition:"all 0.2s"},title:"Corcheas",children:e.jsx(S,{color:"currentColor"})})]})},V=({content:l,transpose:y,viewMode:u,songKey:a,fontSize:v=16})=>{if(!l||!l.trim())return e.jsx("div",{style:{padding:"20px",textAlign:"center",opacity:.5,fontStyle:"italic"},children:"Sin contenido de letra o acordes."});const n=l.split(`
`).map(t=>{let o=0;for(let c=0;c<t.length;c++)t[c]==="["&&o++,t[c]==="]"&&o--;return(o>0?t+"]".repeat(o):t).replace(/\[\]/g,"[ ]")}).join(`
`);let d;try{d=new z().parse(n)}catch(t){return console.warn("ChordSheetJS parsing error:",t),e.jsxs("div",{className:"chord-sheet-container",children:[e.jsxs("div",{style:{padding:"16px",backgroundColor:"rgba(239, 68, 68, 0.05)",borderRadius:"8px",border:"1px dashed rgba(239, 68, 68, 0.3)",color:"#EF4444",fontSize:"12px",marginBottom:"16px"},children:[e.jsx("span",{className:"material-symbols-outlined",style:{verticalAlign:"middle",marginRight:"8px",fontSize:"18px"},children:"warning"}),"Error al procesar acordes. Revisa que todos los corchetes [ ] estén cerrados."]}),e.jsx("pre",{style:{whiteSpace:"pre-wrap",fontStyle:"italic",opacity:.7},children:l})]})}const m=w.transposeNote(a,y);d.lines.forEach(t=>{t.items.forEach(o=>{if(typeof o=="object"&&o!==null&&"chords"in o&&o.chords){const p=o;let c=w.transposeNote(p.chords,y,m);u==="roman"?c=w.toRoman(c,m):u==="spanish"&&(c=w.toSolfege(c)),p.chords=c}})});const s=new T().format(d),x=`
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
            display: ${u==="lyrics"?"none":"block"};
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
    `;return e.jsxs("div",{className:"chord-sheet-container",children:[e.jsx("style",{children:x}),e.jsx("div",{dangerouslySetInnerHTML:{__html:s}})]})};export{V as C,P as M};
