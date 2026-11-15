"use client";
/* Read-only adaptation of the supplied glass-folder-cards.tsx.
   The authored panel paths, hinge, sheet fan and glass CSS are retained.
   Real public covers replace generated canvas art. No creation/menu API exists. */
import * as React from "react";
import "./glass-folder-cards.css";
export type FolderFile={name:string;meta?:string;image?:string;href:string};
export type GlassFolderProps={label:string;image:string;darkImage?:string;files:readonly FolderFile[];appearDelay?:number};
const W=340,H=272,HEADROOM=54,FRONT_H=198;
const BACK_PATH="M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
const FRONT_PATH="M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 176A22 22 0 0 1 318 198L22 198A22 22 0 0 1 0 176Z";
export default function GlassFolder({label,image,darkImage,files,appearDelay=0}:GlassFolderProps){
 const uid=React.useId().replace(/:/g,'');const root=React.useRef<HTMLDivElement>(null),hit=React.useRef<HTMLButtonElement>(null);
 const [open,setOpen]=React.useState(false),[entered,setEntered]=React.useState(false),[width,setWidth]=React.useState(280);
 const k=width/W;
 React.useLayoutEffect(()=>{const el=root.current;if(!el)return;const measure=()=>setWidth(Math.min(W,el.getBoundingClientRect().width)||280);measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[]);
 React.useEffect(()=>{
  const el=root.current;if(!el)return;let timer=0;
  const observer=new IntersectionObserver(entries=>{if(!entries.some(entry=>entry.isIntersecting))return;observer.disconnect();timer=window.setTimeout(()=>setEntered(true),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:appearDelay);},{threshold:.15});
  observer.observe(el);return()=>{observer.disconnect();window.clearTimeout(timer);};
 },[appearDelay]);
 React.useEffect(()=>{
  const el=root.current;if(!el)return;let raf=0,px=0,py=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const write=()=>{raf=0;el.style.setProperty('--gf-px',px.toFixed(3));el.style.setProperty('--gf-py',py.toFixed(3));};
  const reset=()=>{px=py=0;cancelAnimationFrame(raf);write();};
  const move=(event:PointerEvent)=>{if(event.pointerType==='touch'||reduced.matches)return;const rect=el.getBoundingClientRect();px=((event.clientX-rect.left)/rect.width)*2-1;py=((event.clientY-rect.top)/rect.height)*2-1;if(!raf)raf=requestAnimationFrame(write);};
  el.addEventListener('pointermove',move);el.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);
  return()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',reset);reduced.removeEventListener('change',reset);cancelAnimationFrame(raf);};
 },[]);
 React.useEffect(()=>{
  if(!open)return;
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);hit.current?.focus();}};
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);
  return()=>{document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);};
 },[open]);
 return <div ref={root} className="gf-root" data-open={open||undefined} data-entered={entered||undefined} data-place="bottom-left" onFocusCapture={()=>setEntered(true)}>
  <div className="gf-stage" style={{transform:`translateY(${HEADROOM*k}px) scale(${k})`}}><div className="gf-tilt">
   <div className="gf-shadow" aria-hidden="true"/>
   <div className="gf-back" style={{clipPath:`path('${BACK_PATH}')`}} aria-hidden="true">
    {/* Public authored SVG/PNG resources, not user-supplied remote image URLs. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className={`gf-art${darkImage?' gf-cover-light':''}`} src={image} width={W+24} height={H+24} alt="" loading="lazy" decoding="async" draggable={false}/>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {darkImage&&<img className="gf-art gf-cover-dark" src={darkImage} width={W+24} height={H+24} alt="" loading="lazy" decoding="async" draggable={false}/>}
    <div className="gf-back-sheen"/>
   </div>
   <svg className="gf-rim gf-back-rim" viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><path d={BACK_PATH}/></svg>
   <div className="gf-front" style={{clipPath:`path('${FRONT_PATH}')`}}>
    <div className="gf-tint" aria-hidden="true"/><div className="gf-spec" aria-hidden="true"/>
    <svg className="gf-rim gf-front-rim" viewBox={`0 0 ${W} ${FRONT_H}`} aria-hidden="true"><defs><linearGradient id={`gf-rim-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".95"/><stop offset=".35" stopColor="#fff" stopOpacity=".35"/><stop offset="1" stopColor="#fff" stopOpacity=".12"/></linearGradient></defs><path d={FRONT_PATH} stroke={`url(#gf-rim-${uid})`}/></svg>
    <button ref={hit} type="button" className="gf-hit" aria-expanded={open} aria-controls={`gf-files-${uid}`} aria-label={`${open?'Close':'Open'} ${label}, ${files.length} public materials`} onClick={()=>setOpen(value=>!value)}/>
    <div className="gf-label" aria-hidden="true"><span className="gf-title">{label}</span><span className="gf-meta">{files.length} public materials</span></div>
   </div>
   <div className="gf-files" id={`gf-files-${uid}`} role="list" aria-label={`${label} contents`} inert={!open} aria-hidden={!open}>
    {files.map((file,index)=>{
     const slot=files.length<=1?0:index/(files.length-1)*2-1;
     const style={'--gf-slot':slot,'--gf-depth':files.length-1-index,'--gf-jx':`${index%2?2:-2}px`,'--gf-jr':`${index%2?1:-1}deg`,zIndex:index+1} as React.CSSProperties;
     return <div role="listitem" className="gf-sheet-slot" key={file.href}><a className={`gf-sheet${file.image?' gf-sheet--art':''}`} style={style} href={file.href} tabIndex={open?0:-1} aria-label={`${file.name}: ${label}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {file.image?<img className="gf-sheet-art" src={file.image} alt="" width={272} height={184} loading="lazy" decoding="async" draggable={false}/>:<span className="gf-lines" aria-hidden="true">{[86,92,64,88,42].map((size,i)=><i key={i} style={{width:`${size}%`}}/>)}</span>}
      <span className="gf-sheet-head"><span className="gf-sheet-name">{file.name}</span>{file.meta&&<span className="gf-sheet-meta">{file.meta}</span>}</span>
     </a></div>;
    })}
   </div>
  </div></div>
 </div>;
}
