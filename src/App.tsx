import { useEffect, useState } from 'react'
import { icons, Icon } from './shared'
import SettingsPage from './settings/SettingsPage'
import SecurityPage from './security/SecurityPage'
import AdminSplash from './AdminSplash'
import { AdminGate, LiveUsers, LiveBookings, LiveAnalytics, AdminHeader } from './liveAdmin'
import { LiveOverview, LivePaths, LiveMentors, LiveMentorships } from './ecosystem'
import { requireAdmin, signOutAdmin } from './lib/supabase'

type Page='overview'|'users'|'paths'|'mentors'|'mentorship'|'bookings'|'analytics'|'settings'|'security'

// Faint gold constellation, echoing the Starfix landing page hero.
const NODES:[number,number][]=[[60,80],[180,30],[300,110],[420,50],[540,140],[660,70],[780,120],[120,200],[250,240],[380,190],[520,260],[650,210],[760,280],[90,330],[330,340],[590,350]]
const LINES:[number,number][]=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[0,7],[7,8],[8,9],[9,3],[9,10],[10,11],[11,12],[6,12],[7,13],[8,14],[10,15],[13,14],[14,15],[2,9],[4,10]]

function Constellation(){
 const mask='linear-gradient(200deg,#000 20%,transparent 80%)'
 return <svg className="sx-const" aria-hidden="true" viewBox="0 0 840 380" width="840" height="380" style={{position:'absolute',top:20,right:0,opacity:.75,pointerEvents:'none',maskImage:mask,WebkitMaskImage:mask}}>
  {LINES.map(([a,b],i)=><line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke="rgba(212,175,55,.22)" strokeWidth="1"/>)}
  {NODES.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%4===0?2.6:1.6} fill={i%4===0?'#F4D67A':'#D4AF37'} opacity={i%4===0?.95:.6}/>)}
 </svg>
}

import { ErrorBoundary } from './ErrorBoundary'

function Shell({page,setPage,profile}:{page:Page,setPage:(p:Page)=>void,profile:any}){
 const sections=[['Main',[['overview','Overview','overview'],['users','Learners','users'],['mentors','Mentors','mentors'],['mentorship','Mentor–Mentee','graduationCap'],['bookings','Sessions & Bookings','calendar'],['paths','Growth Paths','paths']]],['Insights',[['analytics','Analytics','analytics']]],['System',[['security','Security','shieldCheck'],['settings','Settings','settings']]]] as const
 const name=profile?.full_name||(profile?.email||'').split('@')[0]||'Administrator'
 const[menu,setMenu]=useState(false)
 return <div className="sx-app" style={{display:'flex',minHeight:'100vh',color:'#F7EFD8',fontFamily:'Inter,system-ui,sans-serif',background:'radial-gradient(1200px 620px at 85% -10%,#12204F 0%,transparent 60%),radial-gradient(900px 500px at -10% 110%,rgba(212,175,55,.08) 0%,transparent 60%),#05070F'}}>
  {menu&&<div className="sx-backdrop" onClick={()=>setMenu(false)}/>}
  <aside className={'sx-aside'+(menu?' sx-open':'')} style={{width:272,minWidth:272,background:'linear-gradient(180deg,#0A1030 0%,#060919 100%)',borderRight:'1px solid rgba(212,175,55,.16)',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0}}>
   <div style={{padding:'24px 20px',borderBottom:'1px solid rgba(212,175,55,.16)'}}>
    <div style={{display:'flex',alignItems:'center',gap:12}}>
     <div style={{width:44,height:44,background:'#0A0E1F',border:'1px solid rgba(212,175,55,.55)',borderRadius:13,display:'grid',placeItems:'center',position:'relative',overflow:'hidden',boxShadow:'0 0 26px rgba(212,175,55,.2)'}}>
      <span style={{fontFamily:'Playfair Display,serif',fontSize:26,color:'#D4AF37',fontWeight:600}}>S</span>
      <span style={{position:'absolute',right:5,top:3,color:'#F4D67A',fontSize:10}}>✦</span>
     </div>
     <div>
      <div style={{fontFamily:'Playfair Display,serif',fontWeight:600,fontSize:22,color:'#F4D67A'}}>Starfix</div>
      <div style={{fontSize:11.5,color:'#8A90AB'}}>Growth Operations</div>
     </div>
    </div>
   </div>
   <nav style={{flex:1,padding:'20px 14px',display:'flex',flexDirection:'column',gap:20,overflowY:'auto'}}>
    {sections.map(([title,items])=><div key={title}>
     <div style={{fontSize:11.5,fontWeight:600,color:'#6B7190',letterSpacing:'.04em',padding:'0 14px 8px'}}>{title}</div>
     {items.map(([id,label,icon])=>{const on=page===id;return <button key={id} className="sx-nav" onClick={()=>{setPage(id as Page);setMenu(false)}} style={{display:'flex',alignItems:'center',gap:13,width:'100%',height:44,padding:'0 14px',borderRadius:12,border:0,cursor:'pointer',marginBottom:2,background:on?'linear-gradient(90deg,rgba(212,175,55,.2),rgba(212,175,55,.04))':'transparent',color:on?'#F4D67A':'#9AA0BA',fontSize:13.5,fontWeight:on?600:500,textAlign:'left',boxShadow:on?'inset 2px 0 0 #D4AF37':'none'}}><Icon d={icons[icon as keyof typeof icons]} size={17} style={{color:on?'#D4AF37':'#6B7190'}}/>{label}</button>})}
    </div>)}
   </nav>
   <div style={{
     padding: '14px 16px',
     borderTop: '1px solid rgba(212,175,55,.16)',
     background: 'rgba(5,7,18,0.5)',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'space-between',
     gap: 10
   }}>
    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0,flex:1}}>
     <div style={{position:'relative',flexShrink:0}}>
      <div style={{
        width:36,height:36,borderRadius:'50%',display:'grid',placeItems:'center',
        background:'linear-gradient(135deg,#F4D67A,#B8901F)',color:'#0A0E1F',
        fontWeight:700,fontFamily:'Playfair Display,serif',fontSize:15,
        boxShadow:'0 0 12px rgba(212,175,55,.25)',border:'1px solid rgba(244,214,122,.35)'
      }}>
       {name.charAt(0).toUpperCase()}
      </div>
      <span style={{position:'absolute',bottom:-1,right:-1,width:8,height:8,borderRadius:'50%',background:'#4ADE80',border:'1.5px solid #0A1030',boxShadow:'0 0 5px #4ADE80'}}/>
     </div>
     <div style={{minWidth:0,flex:1}}>
      <div style={{fontSize:12.5,fontWeight:600,color:'#F7EFD8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
      <div style={{fontSize:11,color:'#8A90AB',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{profile?.email||'Administrator'}</div>
     </div>
    </div>
    <button
      type="button"
      onClick={()=>signOutAdmin().then(()=>location.reload())}
      title="Sign out of Starfix"
      style={{
        display:'flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:8,
        border:'1px solid rgba(212,175,55,.22)',background:'rgba(255,255,255,.04)',
        color:'#D4AF37',fontSize:11.5,fontWeight:600,cursor:'pointer',flexShrink:0,
        transition:'all 140ms ease'
      }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(248,113,113,.14)';e.currentTarget.style.borderColor='rgba(248,113,113,.45)';e.currentTarget.style.color='#F87171'}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.04)';e.currentTarget.style.borderColor='rgba(212,175,55,.22)';e.currentTarget.style.color='#D4AF37'}}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      <span>Sign out</span>
    </button>
   </div>
  </aside>
  <div style={{flex:1,minWidth:0,position:'relative'}}>
   <AdminHeader profile={profile} onMenu={()=>setMenu(true)}/>
   <Constellation/>
   <main className="sx-main" style={{position:'relative',zIndex:1}}>
    <ErrorBoundary fallbackTitle={`Error rendering ${page}`}>
      {page==='overview'&&<LiveOverview profile={profile}/>}
      {page==='users'&&<LiveUsers/>}
      {page==='paths'&&<LivePaths/>}
      {page==='mentors'&&<LiveMentors/>}
      {page==='mentorship'&&<LiveMentorships/>}
      {page==='bookings'&&<LiveBookings/>}
      {page==='analytics'&&<LiveAnalytics/>}
      {page==='security'&&<SecurityPage/>}
      {page==='settings'&&<SettingsPage profile={profile}/>}
    </ErrorBoundary>
   </main>
  </div>
 </div>
}

export default function App(){const[profile,setProfile]=useState<any>(null);const[page,setPage]=useState<Page>('overview');useEffect(()=>{requireAdmin().then(r=>setProfile(r.profile))},[]);return <ErrorBoundary fallbackTitle="Application Error"><AdminSplash><AdminGate><Shell page={page} setPage={setPage} profile={profile}/></AdminGate></AdminSplash></ErrorBoundary>}
