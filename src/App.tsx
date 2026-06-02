import { useState, useEffect, useRef, type JSX } from "react";

// ─── THEME & CONSTANTS ────────────────────────────────────────────────────────
const COMPATIBILITY = {
  "O-":  ["O-","O+","A-","A+","B-","B+","AB-","AB+"],
  "O+":  ["O+","A+","B+","AB+"],
  "A-":  ["A-","A+","AB-","AB+"],
  "A+":  ["A+","AB+"],
  "B-":  ["B-","B+","AB-","AB+"],
  "B+":  ["B+","AB+"],
  "AB-": ["AB-","AB+"],
  "AB+": ["AB+"],
};
const RECEIVE_FROM = {
  "O-":  ["O-"],
  "O+":  ["O-","O+"],
  "A-":  ["O-","A-"],
  "A+":  ["O-","O+","A-","A+"],
  "B-":  ["O-","B-"],
  "B+":  ["O-","O+","B-","B+"],
  "AB-": ["O-","A-","B-","AB-"],
  "AB+": ["O-","O+","A-","A+","B-","B+","AB-","AB+"],
};
const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const CITIES = ["Bengaluru","Mumbai","Delhi","Hyderabad","Chennai","Pune","Kolkata","Ahmedabad"];

const MOCK_DONORS: Array<{
  id: number;
  name: string;
  blood: BloodGroup;
  city: string;
  distance: number;
  time: string;
  available: boolean;
  lastDonated: string;
  gender: "male" | "female" | "other";
  age: number;
}> = [
  { id:1, name:"Arjun Sharma", blood:"O+", city:"Bengaluru", distance:2.3, time:"8 min", available:true, lastDonated:"2025-01-10", gender:"male", age:26 },
  { id:2, name:"Priya Nair", blood:"A+", city:"Bengaluru", distance:4.1, time:"14 min", available:true, lastDonated:"2025-02-20", gender:"female", age:24 },
  { id:3, name:"Mohammed Rafi", blood:"O-", city:"Bengaluru", distance:1.8, time:"6 min", available:true, lastDonated:"2025-03-05", gender:"male", age:30 },
  { id:4, name:"Sneha Kulkarni", blood:"B+", city:"Bengaluru", distance:6.2, time:"20 min", available:false, lastDonated:"2025-01-28", gender:"female", age:22 },
  { id:5, name:"Vikram Singh", blood:"AB+", city:"Bengaluru", distance:3.5, time:"12 min", available:true, lastDonated:"2024-12-15", gender:"male", age:35 },
  { id:6, name:"Lakshmi Devi", blood:"O+", city:"Bengaluru", distance:5.0, time:"17 min", available:true, lastDonated:"2025-02-01", gender:"female", age:28 },
];

const MOCK_REQUESTS: Array<{
  id: number;
  patient: string;
  blood: BloodGroup;
  hospital: string;
  units: number;
  urgency: UrgencyLevel;
  time: string;
  city: string;
}> = [
  { id:1, patient:"Rahul Mehta", blood:"O+", hospital:"Manipal Hospital", units:2, urgency:"Critical", time:"12 min ago", city:"Bengaluru" },
  { id:2, patient:"Anita Roy", blood:"A-", hospital:"Fortis Hospital", units:1, urgency:"Urgent", time:"45 min ago", city:"Bengaluru" },
  { id:3, patient:"Suresh Kumar", blood:"B+", hospital:"Apollo Hospital", units:3, urgency:"Normal", time:"2 hrs ago", city:"Bengaluru" },
];

type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
type BadgeSize = "sm" | "lg";
type UrgencyLevel = "Critical" | "Urgent" | "Normal";

// ─── ATOMS & UTILITIES ────────────────────────────────────────────────────────
const BloodBadge = ({ group, size = "sm" }: { group: BloodGroup; size?: BadgeSize }) => {
  const colors = {
    "O-":"#FF3B3B","O+":"#FF6B35","A-":"#C62A88","A+":"#E040FB",
    "B-":"#1565C0","B+":"#29B6F6","AB-":"#2E7D32","AB+":"#66BB6A",
  };
  const s = size === "lg" ? { fontSize:20, w:52, h:52 } : { fontSize:12, w:36, h:28 };
  return (
    <span style={{
      background: colors[group] || "#555",
      color:"#fff", fontFamily:"'DM Mono', monospace",
      fontWeight:700, fontSize:s.fontSize,
      padding: size==="lg" ? "8px 18px" : "3px 8px",
      borderRadius:6, letterSpacing:1,
      boxShadow:`0 2px 8px ${colors[group]}55`,
      display:"inline-block", whiteSpace:"nowrap"
    }}>{group}</span>
  );
};

const UrgencyBadge = ({ level }: { level: UrgencyLevel }) => {
  const map = { Critical:["#FF1744","#FFF"], Urgent:["#FF6D00","#FFF"], Normal:["#00C853","#FFF"] };
  const [bg, fg] = map[level] || ["#555","#fff"];
  return (
    <span style={{
      background:bg, color:fg, fontSize:10, fontWeight:700,
      padding:"2px 8px", borderRadius:20, letterSpacing:1,
      textTransform:"uppercase", fontFamily:"'DM Mono',monospace"
    }}>{level}</span>
  );
};

const Pulse = ({ color = "#FF3B3B" }) => (
  <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", width:12, height:12 }}>
    <span style={{
      position:"absolute", width:"100%", height:"100%", borderRadius:"50%",
      background:color, opacity:0.4, animation:"pulseRing 1.5s ease-out infinite"
    }}/>
    <span style={{ width:8, height:8, borderRadius:"50%", background:color, position:"relative" }}/>
  </span>
);

const StatCard = ({ label, value, icon, accent }: { label: string; value: string | number; icon: JSX.Element | string; accent: string }) => (
  <div style={{
    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:16, padding:"20px 24px", position:"relative", overflow:"hidden"
  }}>
    <div style={{ fontSize:28, marginBottom:4 }}>{icon}</div>
    <div style={{ fontSize:32, fontWeight:800, color:accent, fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:12, color:"#aaa", marginTop:4, letterSpacing:0.5 }}>{label}</div>
    <div style={{
      position:"absolute", top:-20, right:-20, width:80, height:80,
      borderRadius:"50%", background:accent, opacity:0.08
    }}/>
  </div>
);

// ─── SCREENS ──────────────────────────────────────────────────────────────────

// AUTH SCREEN
const AuthScreen = ({ onLogin }: { onLogin: (role: string) => void }) => {
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("donor");
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"" });
  const [step, setStep] = useState(1); // 1=form 2=otp
  const [otp, setOtp] = useState(["","","","","",""]);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleOtp = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const n = [...otp]; n[i] = val; setOtp(n);
    if (val && i < 5) refs[i+1].current?.focus();
  };

  const handleLogin = () => {
    if (tab === "register" && step === 1) { setStep(2); return; }
    onLogin(role);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080C10", display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", overflow:"hidden" }}>
      {/* BG blobs */}
      <div style={{ position:"absolute", top:-100, left:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, #FF3B3B22 0%, transparent 70%)" }}/>
      <div style={{ position:"absolute", bottom:-80, right:-80, width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, #C62A8822 0%, transparent 70%)" }}/>
      
      <div style={{ width:"100%", maxWidth:440, zIndex:2 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🩸</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#fff", margin:0, letterSpacing:-0.5 }}>LifeLink</h1>
          <p style={{ color:"#666", fontSize:13, margin:"4px 0 0", fontFamily:"'DM Mono',monospace" }}>SMART BLOOD BANK SYSTEM</p>
        </div>

        {/* Card */}
        <div style={{
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:24, padding:"32px 36px", backdropFilter:"blur(20px)"
        }}>
          {/* Tabs */}
          <div style={{ display:"flex", background:"rgba(255,255,255,0.05)", borderRadius:12, padding:4, marginBottom:28 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setStep(1); }} style={{
                flex:1, padding:"10px 0", border:"none", borderRadius:10, cursor:"pointer",
                fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700, letterSpacing:1,
                textTransform:"uppercase",
                background: tab===t ? "#FF3B3B" : "transparent",
                color: tab===t ? "#fff" : "#666",
                transition:"all 0.2s"
              }}>{t}</button>
            ))}
          </div>

          {step === 1 ? (<>
            {/* Role selector */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, color:"#666", fontFamily:"'DM Mono',monospace", letterSpacing:1 }}>SELECT ROLE</label>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                {[["donor","🤲 Donor"],["recipient","🏥 Recipient"],["admin","⚙️ Admin"]].map(([r,l]) => (
                  <button key={r} onClick={() => setRole(r)} style={{
                    flex:1, padding:"10px 4px", border:`1.5px solid ${role===r?"#FF3B3B":"rgba(255,255,255,0.1)"}`,
                    borderRadius:10, background: role===r?"rgba(255,59,59,0.1)":"transparent",
                    color: role===r?"#FF3B3B":"#666", cursor:"pointer", fontSize:11,
                    fontFamily:"'DM Mono',monospace", fontWeight:600, transition:"all 0.2s"
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {tab==="register" && (
              <input placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                style={inp} />
            )}
            <input placeholder="Email Address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
              style={inp} />
            <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
              style={inp} />
            {tab==="register" && (
              <input placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}
                style={{...inp, marginBottom:0}} />
            )}
            {tab==="login" && (
              <div style={{ textAlign:"right", marginBottom:8 }}>
                <span style={{ fontSize:12, color:"#FF3B3B", cursor:"pointer" }}>Forgot Password?</span>
              </div>
            )}
          </>) : (
            <div style={{ textAlign:"center" }}>
              <p style={{ color:"#aaa", fontSize:13, marginBottom:24 }}>Enter OTP sent to <span style={{color:"#fff"}}>{form.phone || form.email}</span></p>
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:24 }}>
                {otp.map((d, i) => (
                  <input key={i} ref={refs[i]} maxLength={1} value={d}
                    onChange={e => handleOtp(i, e.target.value)}
                    style={{
                      width:44, height:52, textAlign:"center", fontSize:22, fontWeight:700,
                      background:"rgba(255,255,255,0.06)", border:`1.5px solid ${d?"#FF3B3B":"rgba(255,255,255,0.12)"}`,
                      borderRadius:12, color:"#fff", outline:"none", fontFamily:"'DM Mono',monospace"
                    }}
                  />
                ))}
              </div>
              <p style={{ color:"#555", fontSize:12 }}>Didn't receive? <span style={{color:"#FF3B3B",cursor:"pointer"}}>Resend OTP</span></p>
            </div>
          )}

          <button onClick={handleLogin} style={{
            width:"100%", padding:"14px 0", marginTop:20,
            background:"linear-gradient(135deg, #FF3B3B, #C62A88)",
            border:"none", borderRadius:12, color:"#fff",
            fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700,
            letterSpacing:1, cursor:"pointer",
            boxShadow:"0 4px 24px rgba(255,59,59,0.35)",
            transition:"transform 0.15s, box-shadow 0.15s"
          }}>
            {tab==="register" && step===1 ? "SEND OTP" : tab==="register" ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
        </div>

        <p style={{ textAlign:"center", color:"#333", fontSize:11, marginTop:20, fontFamily:"'DM Mono',monospace" }}>
          Protected by end-to-end encryption · HIPAA compliant
        </p>
      </div>
    </div>
  );
};

// DONOR DASHBOARD
const DonorDashboard = () => {
  const [, setActiveReq] = useState<typeof MOCK_REQUESTS[0] | null>(null);

  return (
    <div style={{ padding:"0 0 40px" }}>
      {/* Hero bar */}
      <div style={{
        background:"linear-gradient(135deg, #1A0000 0%, #2D0808 50%, #1A0000 100%)",
        borderBottom:"1px solid rgba(255,59,59,0.2)",
        padding:"24px 28px", marginBottom:28
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ color:"#FF3B3B", fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:2, margin:0 }}>DONOR DASHBOARD</p>
            <h2 style={{ color:"#fff", margin:"4px 0 0", fontFamily:"'Playfair Display',serif", fontSize:24 }}>Welcome, Thousif 👋</h2>
          </div>
          <BloodBadge group="O+" size="lg" />
        </div>
        {/* Eligibility bar */}
        <div style={{ marginTop:16, background:"rgba(0,200,83,0.1)", border:"1px solid rgba(0,200,83,0.2)", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <Pulse color="#00C853"/>
          <span style={{ color:"#00C853", fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700 }}>ELIGIBLE TO DONATE</span>
          <span style={{ color:"#555", fontSize:12, marginLeft:"auto" }}>Next: Sep 15, 2025</span>
        </div>
      </div>

      <div style={{ padding:"0 24px" }}>
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:28 }}>
          <StatCard label="Donations" value="7" icon="💉" accent="#FF3B3B"/>
          <StatCard label="Lives Saved" value="21" icon="❤️" accent="#C62A88"/>
          <StatCard label="Days Since" value="64" icon="📅" accent="#FF6B35"/>
        </div>

        {/* Emergency requests */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <h3 style={{ color:"#fff", margin:0, fontFamily:"'Playfair Display',serif", fontSize:18 }}>Emergency Requests</h3>
            <span style={{ fontSize:11, color:"#FF3B3B", fontFamily:"'DM Mono',monospace" }}>NEAR YOU</span>
          </div>
          {MOCK_REQUESTS.map(r => (
            <div key={r.id} onClick={() => setActiveReq(r)} style={{
              background:"rgba(255,255,255,0.03)", border:`1px solid ${r.urgency==="Critical"?"rgba(255,23,68,0.3)":r.urgency==="Urgent"?"rgba(255,109,0,0.3)":"rgba(255,255,255,0.08)"}`,
              borderRadius:16, padding:"16px 18px", marginBottom:12, cursor:"pointer",
              transition:"all 0.2s"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <BloodBadge group={r.blood}/>
                    <UrgencyBadge level={r.urgency}/>
                  </div>
                  <p style={{ color:"#fff", margin:0, fontSize:14, fontWeight:600 }}>{r.patient}</p>
                  <p style={{ color:"#666", margin:"2px 0 0", fontSize:12 }}>{r.hospital} · {r.units} unit{r.units>1?"s":""}</p>
                </div>
                <span style={{ color:"#555", fontSize:11, fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap" }}>{r.time}</span>
              </div>
              {r.urgency === "Critical" && (
                <button style={{
                  marginTop:12, width:"100%", padding:"10px 0",
                  background:"linear-gradient(90deg,#FF1744,#C62A88)", border:"none",
                  borderRadius:10, color:"#fff", fontFamily:"'DM Mono',monospace",
                  fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:1
                }}>RESPOND NOW</button>
              )}
            </div>
          ))}
        </div>

        {/* Donation history */}
        <div>
          <h3 style={{ color:"#fff", margin:"0 0 14px", fontFamily:"'Playfair Display',serif", fontSize:18 }}>Donation History</h3>
          {[
            { date:"Mar 5, 2025", hospital:"Manipal Hospital", units:1, badge:"Verified" },
            { date:"Nov 15, 2024", hospital:"Apollo BGS", units:1, badge:"Verified" },
            { date:"Jul 2, 2024", hospital:"Fortis Hospital", units:1, badge:"Verified" },
          ].map((h,i) => (
            <div key={i} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
              borderRadius:12, padding:"14px 16px", marginBottom:8
            }}>
              <div>
                <p style={{ color:"#fff", margin:0, fontSize:13, fontWeight:600 }}>{h.hospital}</p>
                <p style={{ color:"#555", margin:"2px 0 0", fontSize:11, fontFamily:"'DM Mono',monospace" }}>{h.date}</p>
              </div>
              <span style={{ fontSize:10, color:"#00C853", fontFamily:"'DM Mono',monospace", border:"1px solid #00C85355", borderRadius:20, padding:"3px 10px" }}>✓ {h.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// RECIPIENT DASHBOARD
const RecipientDashboard = () => {
  const [bloodNeeded, setBloodNeeded] = useState<BloodGroup>("O+");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Urgent");
  const [searched, setSearched] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const compatible = MOCK_DONORS
    .filter(d => (RECEIVE_FROM[bloodNeeded] as BloodGroup[]).includes(d.blood))
    .sort((a,b)=>a.distance-b.distance);

  return (
    <div style={{ padding:"0 0 40px" }}>
      <div style={{ background:"linear-gradient(135deg,#000D1A,#001833)", borderBottom:"1px solid rgba(41,182,246,0.2)", padding:"24px 28px", marginBottom:28 }}>
        <p style={{ color:"#29B6F6", fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:2, margin:0 }}>RECIPIENT PORTAL</p>
        <h2 style={{ color:"#fff", margin:"4px 0 0", fontFamily:"'Playfair Display',serif", fontSize:24 }}>Find Blood Donors</h2>
      </div>

      <div style={{ padding:"0 24px" }}>
        {/* Search block */}
        <div style={{
          background:"rgba(41,182,246,0.05)", border:"1px solid rgba(41,182,246,0.15)",
          borderRadius:20, padding:"24px 20px", marginBottom:24
        }}>
          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 14px" }}>BLOOD REQUIRED</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
            {BLOOD_GROUPS.map(g => (
              <button key={g} onClick={() => setBloodNeeded(g as BloodGroup)} style={{
                padding:"10px 0", border:`1.5px solid ${bloodNeeded===g?"#29B6F6":"rgba(255,255,255,0.08)"}`,
                borderRadius:10, background: bloodNeeded===g?"rgba(41,182,246,0.15)":"transparent",
                color: bloodNeeded===g?"#29B6F6":"#555", cursor:"pointer",
                fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, transition:"all 0.2s"
              }}>{g}</button>
            ))}
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 10px" }}>URGENCY LEVEL</p>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {["Normal","Urgent","Critical"].map(u => (
              <button key={u} onClick={() => setUrgency(u as UrgencyLevel)} style={{
                flex:1, padding:"10px 0",
                border:`1.5px solid ${urgency===u?(u==="Critical"?"#FF1744":u==="Urgent"?"#FF6D00":"#00C853"):"rgba(255,255,255,0.08)"}`,
                borderRadius:10,
                background: urgency===u?(u==="Critical"?"rgba(255,23,68,0.12)":u==="Urgent"?"rgba(255,109,0,0.12)":"rgba(0,200,83,0.12)"):"transparent",
                color: urgency===u?(u==="Critical"?"#FF1744":u==="Urgent"?"#FF6D00":"#00C853"):"#555",
                cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700, transition:"all 0.2s"
              }}>{u}</button>
            ))}
          </div>

          <button onClick={() => setSearched(true)} style={{
            width:"100%", padding:"14px 0",
            background:"linear-gradient(90deg,#0D47A1,#29B6F6)", border:"none",
            borderRadius:12, color:"#fff", fontFamily:"'DM Mono',monospace",
            fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:1,
            boxShadow:"0 4px 20px rgba(41,182,246,0.3)"
          }}>🔍 FIND NEARBY DONORS</button>
        </div>

        {/* Results */}
        {searched && (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <h3 style={{ color:"#fff", margin:0, fontFamily:"'Playfair Display',serif", fontSize:18 }}>
              {compatible.length} Compatible Donors
            </h3>
            <span style={{ fontSize:11, color:"#29B6F6", fontFamily:"'DM Mono',monospace" }}>SORTED BY DISTANCE</span>
          </div>

          {compatible.map(d => (
            <div key={d.id} style={{
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:16, padding:"16px 18px", marginBottom:12
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{
                    width:44, height:44, borderRadius:"50%",
                    background:"linear-gradient(135deg,#1E1E2E,#2A2A3E)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:20, border:"2px solid rgba(255,255,255,0.1)"
                  }}>{d.gender==="male"?"👨":"👩"}</div>
                  <div>
                    <p style={{ color:"#fff", margin:0, fontSize:14, fontWeight:600 }}>{d.name}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                      <BloodBadge group={d.blood}/>
                      <span style={{ color:"#555", fontSize:11 }}>Age {d.age}</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                    {d.available ? <Pulse color="#00C853"/> : <span style={{ width:8,height:8,borderRadius:"50%",background:"#555",display:"inline-block" }}/>}
                    <span style={{ fontSize:11, color:d.available?"#00C853":"#555", fontFamily:"'DM Mono',monospace" }}>
                      {d.available?"Available":"Unavailable"}
                    </span>
                  </div>
                  <p style={{ color:"#29B6F6", fontSize:12, margin:"4px 0 0", fontFamily:"'DM Mono',monospace" }}>📍 {d.distance} km · {d.time}</p>
                </div>
              </div>
              {d.available && (
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button style={{
                    flex:1, padding:"10px 0", background:"rgba(41,182,246,0.1)",
                    border:"1px solid rgba(41,182,246,0.3)", borderRadius:10,
                    color:"#29B6F6", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700
                  }}>📞 CALL</button>
                  <button style={{
                    flex:2, padding:"10px 0", background:"linear-gradient(90deg,#0D47A1,#29B6F6)",
                    border:"none", borderRadius:10, color:"#fff",
                    cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700
                  }}>✉️ SEND REQUEST</button>
                </div>
              )}
            </div>
          ))}

          <button onClick={() => setShowRequest(true)} style={{
            width:"100%", padding:"14px 0", marginTop:8,
            background:"linear-gradient(135deg,#FF1744,#C62A88)", border:"none",
            borderRadius:12, color:"#fff", fontFamily:"'DM Mono',monospace",
            fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:1,
            boxShadow:"0 4px 20px rgba(255,23,68,0.3)"
          }}>🚨 BROADCAST EMERGENCY REQUEST</button>
        </>)}
      </div>

      {/* Emergency modal */}
      {showRequest && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:100, padding:24
        }}>
          <div style={{
            background:"#0D0D0D", border:"1px solid rgba(255,23,68,0.4)",
            borderRadius:24, padding:"32px 28px", maxWidth:400, width:"100%",
            boxShadow:"0 0 60px rgba(255,23,68,0.2)"
          }}>
            <h3 style={{ color:"#FF1744", fontFamily:"'Playfair Display',serif", fontSize:22, margin:"0 0 8px" }}>🚨 Emergency Broadcast</h3>
            <p style={{ color:"#666", fontSize:13, margin:"0 0 20px" }}>Notify all compatible donors within 20km instantly via SMS + App</p>
            <div style={{ background:"rgba(255,23,68,0.08)", border:"1px solid rgba(255,23,68,0.2)", borderRadius:12, padding:16, marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ color:"#666", fontSize:12 }}>Blood Required</span>
                <BloodBadge group={bloodNeeded as BloodGroup}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ color:"#666", fontSize:12 }}>Urgency</span>
                <UrgencyBadge level={urgency as UrgencyLevel}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#666", fontSize:12 }}>Notifying</span>
                <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>{compatible.length} donors</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowRequest(false)} style={{
                flex:1, padding:"12px 0", background:"transparent",
                border:"1px solid rgba(255,255,255,0.1)", borderRadius:12,
                color:"#666", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:12
              }}>CANCEL</button>
              <button onClick={() => setShowRequest(false)} style={{
                flex:2, padding:"12px 0", background:"linear-gradient(90deg,#FF1744,#C62A88)",
                border:"none", borderRadius:12, color:"#fff",
                cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:700
              }}>🚨 SEND NOW</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// REGISTRATION SCREEN
const RegisterDonor = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", age:"", gender:"male" as "male"|"female"|"other", blood:"O+" as BloodGroup, city:"Bengaluru", weight:"", lastDonated:"" });
  const [health, setHealth] = useState<Record<string, string>>({});
  const [eligible, setEligible] = useState<{ ok: boolean; reasons?: string[] } | null>(null);

  const conditions = ["HIV/AIDS","Hepatitis B","Hepatitis C","Malaria (last 3 yrs)","Syphilis","Tuberculosis","Cancer","Diabetes","Heart Disease","Kidney Disease","Blood Disorders","Asthma","Recent Surgery","Pregnancy","Recent Tattoo/Piercing (6mo)","COVID-19 Recovery"];

  const checkEligibility = () => {
    const blocked = Object.entries(health).filter(([,v]) => v === "yes").map(([k]) => k);
    const age = parseInt(form.age);
    const weight = parseInt(form.weight);
    if (blocked.length > 0) { setEligible({ ok:false, reasons:blocked as string[] }); }
    else if (age < 18 || age > 65) { setEligible({ ok:false, reasons:["Age must be 18–65"] }); }
    else if (weight < 50) { setEligible({ ok:false, reasons:["Weight must be above 50 kg"] }); }
    else { setEligible({ ok:true, reasons: [] }); }
    setStep(3);
  };

  const f = (field: string, val: string) => setForm(p => ({...p,[field]:val}));
  const inpS = { ...inp, marginBottom:14 };

  return (
    <div style={{ padding:"0 0 40px" }}>
      <div style={{ background:"linear-gradient(135deg,#0A001A,#1A0028)", borderBottom:"1px solid rgba(198,42,136,0.2)", padding:"24px 28px", marginBottom:28, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#C62A88", cursor:"pointer", fontSize:20 }}>←</button>
        <div>
          <p style={{ color:"#C62A88", fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:2, margin:0 }}>DONOR REGISTRATION</p>
          <h2 style={{ color:"#fff", margin:"2px 0 0", fontFamily:"'Playfair Display',serif", fontSize:22 }}>Health Screening</h2>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display:"flex", padding:"0 24px", gap:8, marginBottom:24 }}>
        {["Personal Details","Health Screening","Eligibility Result"].map((s,i) => (
          <div key={i} style={{ flex:1, textAlign:"center" }}>
            <div style={{ height:4, borderRadius:2, background: step>i?"#C62A88":"rgba(255,255,255,0.1)", marginBottom:6, transition:"background 0.3s" }}/>
            <span style={{ fontSize:10, color: step>i?"#C62A88":"#444", fontFamily:"'DM Mono',monospace" }}>
              {i+1}. {s.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding:"0 24px" }}>
        {step === 1 && (<>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <input placeholder="Full Name" value={form.name} onChange={e=>f("name",e.target.value)} style={inpS}/>
            </div>
            <input placeholder="Age" value={form.age} onChange={e=>f("age",e.target.value)} style={inpS}/>
            <input placeholder="Weight (kg)" value={form.weight} onChange={e=>f("weight",e.target.value)} style={inpS}/>
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 10px" }}>GENDER</p>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {["male","female","other"].map(g => (
              <button key={g} onClick={() => f("gender",g)} style={{
                flex:1, padding:"10px 0",
                border:`1.5px solid ${form.gender===g?"#C62A88":"rgba(255,255,255,0.1)"}`,
                borderRadius:10, background:form.gender===g?"rgba(198,42,136,0.1)":"transparent",
                color:form.gender===g?"#C62A88":"#555", cursor:"pointer",
                fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700, textTransform:"capitalize"
              }}>{g}</button>
            ))}
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 10px" }}>BLOOD GROUP</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
            {BLOOD_GROUPS.map(g => (
              <button key={g} onClick={() => f("blood",g)} style={{
                padding:"10px 0", border:`1.5px solid ${form.blood===g?"#FF3B3B":"rgba(255,255,255,0.08)"}`,
                borderRadius:10, background:form.blood===g?"rgba(255,59,59,0.12)":"transparent",
                color:form.blood===g?"#FF3B3B":"#555", cursor:"pointer",
                fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700
              }}>{g}</button>
            ))}
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 10px" }}>CITY</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:24 }}>
            {CITIES.map(c => (
              <button key={c} onClick={() => f("city",c)} style={{
                padding:"10px 0", border:`1.5px solid ${form.city===c?"#C62A88":"rgba(255,255,255,0.08)"}`,
                borderRadius:10, background:form.city===c?"rgba(198,42,136,0.1)":"transparent",
                color:form.city===c?"#C62A88":"#555", cursor:"pointer",
                fontFamily:"'DM Mono',monospace", fontSize:11
              }}>{c}</button>
            ))}
          </div>

          <button onClick={() => setStep(2)} style={{
            width:"100%", padding:"14px 0",
            background:"linear-gradient(90deg,#6A0DAD,#C62A88)", border:"none",
            borderRadius:12, color:"#fff", fontFamily:"'DM Mono',monospace",
            fontSize:13, fontWeight:700, cursor:"pointer"
          }}>NEXT → HEALTH SCREENING</button>
        </>)}

        {step === 2 && (<>
          <div style={{
            background:"rgba(255,109,0,0.08)", border:"1px solid rgba(255,109,0,0.2)",
            borderRadius:14, padding:"14px 16px", marginBottom:20
          }}>
            <p style={{ color:"#FF6D00", margin:0, fontSize:12, fontFamily:"'DM Mono',monospace" }}>
              ⚕️ Honest answers protect both you and the recipient. All data is encrypted.
            </p>
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 14px" }}>
            Have you ever been diagnosed with any of the following?
          </p>

          {conditions.map(c => (
            <div key={c} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)"
            }}>
              <span style={{ color:"#ccc", fontSize:13 }}>{c}</span>
              <div style={{ display:"flex", gap:8 }}>
                {["yes","no"].map(v => (
                  <button key={v} onClick={() => setHealth(p=>({...p,[c]:v}))} style={{
                    width:44, padding:"6px 0", border:`1px solid ${health[c]===v?(v==="yes"?"#FF1744":"#00C853"):"rgba(255,255,255,0.1)"}`,
                    borderRadius:8, background:health[c]===v?(v==="yes"?"rgba(255,23,68,0.15)":"rgba(0,200,83,0.15)"):"transparent",
                    color:health[c]===v?(v==="yes"?"#FF1744":"#00C853"):"#555",
                    cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:700, textTransform:"uppercase"
                  }}>{v}</button>
                ))}
              </div>
            </div>
          ))}

          <button onClick={checkEligibility} style={{
            width:"100%", padding:"14px 0", marginTop:24,
            background:"linear-gradient(90deg,#6A0DAD,#C62A88)", border:"none",
            borderRadius:12, color:"#fff", fontFamily:"'DM Mono',monospace",
            fontSize:13, fontWeight:700, cursor:"pointer"
          }}>CHECK ELIGIBILITY</button>
        </>)}

        {step === 3 && eligible && (<>
          <div style={{
            background: eligible.ok ? "rgba(0,200,83,0.08)" : "rgba(255,23,68,0.08)",
            border: `1px solid ${eligible.ok?"rgba(0,200,83,0.3)":"rgba(255,23,68,0.3)"}`,
            borderRadius:20, padding:"32px 24px", textAlign:"center", marginBottom:24
          }}>
            <div style={{ fontSize:64, marginBottom:16 }}>{eligible.ok ? "✅" : "❌"}</div>
            <h3 style={{
              fontFamily:"'Playfair Display',serif", fontSize:24, margin:"0 0 8px",
              color: eligible.ok ? "#00C853" : "#FF1744"
            }}>
              {eligible.ok ? "You're Eligible!" : "Not Eligible to Donate"}
            </h3>
            {eligible.ok ? (
              <p style={{ color:"#aaa", fontSize:13, margin:0 }}>Your health screening is complete. You can now register as a donor.</p>
            ) : (
              <>
                <p style={{ color:"#aaa", fontSize:13, margin:"0 0 16px" }}>Registration blocked due to the following reason(s):</p>
                {eligible.reasons?.map((r: string,i: number) => (
                  <div key={i} style={{
                    background:"rgba(255,23,68,0.1)", border:"1px solid rgba(255,23,68,0.2)",
                    borderRadius:8, padding:"8px 14px", marginBottom:6, fontSize:13, color:"#FF6B6B"
                  }}>⚠️ {r}</div>
                ))}
              </>
            )}
          </div>

          {eligible.ok && (
            <button onClick={onBack} style={{
              width:"100%", padding:"14px 0",
              background:"linear-gradient(90deg,#00695C,#00C853)", border:"none",
              borderRadius:12, color:"#fff", fontFamily:"'DM Mono',monospace",
              fontSize:13, fontWeight:700, cursor:"pointer"
            }}>✅ COMPLETE REGISTRATION</button>
          )}
          <button onClick={() => setStep(1)} style={{
            width:"100%", padding:"12px 0", marginTop:10,
            background:"transparent", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:12, color:"#666", cursor:"pointer",
            fontFamily:"'DM Mono',monospace", fontSize:12
          }}>← START OVER</button>
        </>)}
      </div>
    </div>
  );
};

// ADMIN DASHBOARD
const AdminDashboard = () => (
  <div style={{ padding:"0 0 40px" }}>
    <div style={{
      background:"linear-gradient(135deg,#001A00,#002800)",
      borderBottom:"1px solid rgba(0,200,83,0.2)",
      padding:"24px 28px", marginBottom:28
    }}>
      <p style={{ color:"#00C853", fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:2, margin:0 }}>ADMIN CONTROL CENTER</p>
      <h2 style={{ color:"#fff", margin:"4px 0 0", fontFamily:"'Playfair Display',serif", fontSize:24 }}>Blood Bank Admin</h2>
    </div>

    <div style={{ padding:"0 24px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
        <StatCard label="Total Donors" value="1,284" icon="🤲" accent="#00C853"/>
        <StatCard label="Recipients" value="467" icon="🏥" accent="#29B6F6"/>
        <StatCard label="Emergency Req" value="12" icon="🚨" accent="#FF1744"/>
        <StatCard label="Units Available" value="843" icon="🩸" accent="#FF3B3B"/>
      </div>

      {/* Blood inventory */}
      <h3 style={{ color:"#fff", margin:"0 0 14px", fontFamily:"'Playfair Display',serif", fontSize:18 }}>Blood Inventory</h3>
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"4px 0", marginBottom:24 }}>
        {[
          { group:"O+", units:210, max:300 },
          { group:"O-", units:45, max:100 },
          { group:"A+", units:180, max:250 },
          { group:"A-", units:30, max:80 },
          { group:"B+", units:160, max:200 },
          { group:"B-", units:25, max:60 },
          { group:"AB+", units:100, max:120 },
          { group:"AB-", units:93, max:80 },
        ].map(item => {
          const pct = Math.min(100, Math.round(item.units/item.max*100));
          const color = pct<30?"#FF1744":pct<60?"#FF6D00":"#00C853";
          return (
            <div key={item.group} style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <BloodBadge group={item.group as BloodGroup}/>
                <span style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace" }}>{item.units} / {item.max} units</span>
              </div>
              <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width 1s ease" }}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending approvals */}
      <h3 style={{ color:"#fff", margin:"0 0 14px", fontFamily:"'Playfair Display',serif", fontSize:18 }}>Pending Approvals</h3>
      {[
        { name:"Rahul Verma", role:"Donor", blood:"B+", time:"2 min ago" },
        { name:"Meena Iyer", role:"Recipient", blood:"O-", time:"15 min ago" },
        { name:"Aditya Das", role:"Donor", blood:"A+", time:"1 hr ago" },
      ].map((u,i) => (
        <div key={i} style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:14, padding:"14px 16px", marginBottom:10
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:38, height:38, borderRadius:"50%",
              background:"linear-gradient(135deg,#1A1A2E,#2D2D44)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:16
            }}>👤</div>
            <div>
              <p style={{ color:"#fff", margin:0, fontSize:13, fontWeight:600 }}>{u.name}</p>
              <div style={{ display:"flex", gap:6, marginTop:3 }}>
                <span style={{ fontSize:10, color:"#00C853", fontFamily:"'DM Mono',monospace" }}>{u.role}</span>
                <BloodBadge group={u.blood as BloodGroup}/>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button style={{
              padding:"8px 12px", background:"rgba(0,200,83,0.1)", border:"1px solid rgba(0,200,83,0.3)",
              borderRadius:8, color:"#00C853", cursor:"pointer", fontSize:12, fontFamily:"'DM Mono',monospace"
            }}>✓</button>
            <button style={{
              padding:"8px 12px", background:"rgba(255,23,68,0.1)", border:"1px solid rgba(255,23,68,0.3)",
              borderRadius:8, color:"#FF1744", cursor:"pointer", fontSize:12, fontFamily:"'DM Mono',monospace"
            }}>✗</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// COMPATIBILITY ENGINE VIEW
const CompatibilityView = () => {
  const [selected, setSelected] = useState("O+");
  return (
    <div style={{ padding:"0 0 40px" }}>
      <div style={{ background:"linear-gradient(135deg,#1A0A00,#2D1500)", borderBottom:"1px solid rgba(255,107,53,0.2)", padding:"24px 28px", marginBottom:28 }}>
        <p style={{ color:"#FF6B35", fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:2, margin:0 }}>COMPATIBILITY ENGINE</p>
        <h2 style={{ color:"#fff", margin:"4px 0 0", fontFamily:"'Playfair Display',serif", fontSize:24 }}>Blood Type Matcher</h2>
      </div>

      <div style={{ padding:"0 24px" }}>
        <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 12px" }}>SELECT DONOR BLOOD GROUP</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:28 }}>
          {BLOOD_GROUPS.map(g => (
            <button key={g} onClick={() => setSelected(g)} style={{
              padding:"16px 0", border:`2px solid ${selected===g?"#FF6B35":"rgba(255,255,255,0.08)"}`,
              borderRadius:14, background:selected===g?"rgba(255,107,53,0.12)":"transparent",
              cursor:"pointer", transition:"all 0.2s"
            }}>
              <BloodBadge group={g as BloodGroup} size={selected===g?"lg":"sm"}/>
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ background:"rgba(0,200,83,0.06)", border:"1px solid rgba(0,200,83,0.2)", borderRadius:18, padding:"20px 16px" }}>
            <p style={{ color:"#00C853", fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:1, margin:"0 0 14px" }}>CAN DONATE TO</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {(COMPATIBILITY[selected as BloodGroup]||[]).map(g => <BloodBadge key={g} group={g as BloodGroup}/>)}
            </div>
          </div>
          <div style={{ background:"rgba(41,182,246,0.06)", border:"1px solid rgba(41,182,246,0.2)", borderRadius:18, padding:"20px 16px" }}>
            <p style={{ color:"#29B6F6", fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:1, margin:"0 0 14px" }}>CAN RECEIVE FROM</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {(RECEIVE_FROM[selected as BloodGroup]||[]).map(g => <BloodBadge key={g} group={g as BloodGroup}/>)}
            </div>
          </div>
        </div>

        {/* Universal donor/recipient callouts */}
        {selected === "O-" && (
          <div style={{ marginTop:16, background:"rgba(255,215,0,0.08)", border:"1px solid rgba(255,215,0,0.25)", borderRadius:14, padding:"14px 16px" }}>
            <p style={{ color:"#FFD700", margin:0, fontSize:13 }}>⭐ <strong>Universal Donor</strong> — O- blood can be given to anyone in an emergency.</p>
          </div>
        )}
        {selected === "AB+" && (
          <div style={{ marginTop:16, background:"rgba(255,215,0,0.08)", border:"1px solid rgba(255,215,0,0.25)", borderRadius:14, padding:"14px 16px" }}>
            <p style={{ color:"#FFD700", margin:0, fontSize:13 }}>⭐ <strong>Universal Recipient</strong> — AB+ can receive blood from any blood type.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SHARED STYLE ─────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  display:"block", width:"100%", padding:"13px 16px",
  background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:12, color:"#fff", fontSize:14, outline:"none",
  fontFamily:"'DM Sans',sans-serif", marginBottom:14, boxSizing:"border-box",
  WebkitAppearance:"none"
};

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"donor",   label:"Donor",    icon:"🤲" },
  { id:"search",  label:"Find",     icon:"🔍" },
  { id:"compat",  label:"Compat",   icon:"🩸" },
  { id:"admin",   label:"Admin",    icon:"⚙️" },
  { id:"register",label:"Register", icon:"📋" },
];

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState("donor");

  const handleLogin = (r: string) => { setAuthed(true); setScreen(r==="admin"?"admin":r==="recipient"?"search":"donor"); };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@500;700&display=swap');
      * { box-sizing: border-box; }
      body { margin:0; background:#080C10; }
      @keyframes pulseRing {
        0% { transform:scale(1); opacity:0.5; }
        100% { transform:scale(2.5); opacity:0; }
      }
      input::placeholder { color:#444; }
      ::-webkit-scrollbar { width:4px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:#222; border-radius:2px; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (!authed) return <AuthScreen onLogin={handleLogin}/>;

  return (
    <div style={{ minHeight:"100vh", background:"#080C10", fontFamily:"'DM Sans',sans-serif", paddingBottom:80, maxWidth:430, margin:"0 auto", position:"relative" }}>
      {/* Scrollable content */}
      <div style={{ overflowY:"auto", height:"calc(100vh - 72px)" }}>
        {screen === "donor"    && <DonorDashboard/>}
        {screen === "search"   && <RecipientDashboard/>}
        {screen === "compat"   && <CompatibilityView/>}
        {screen === "admin"    && <AdminDashboard/>}
        {screen === "register" && <RegisterDonor onBack={() => setScreen("donor")}/>}
      </div>

      {/* Bottom nav */}
      <div style={{
        position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:430,
        background:"rgba(8,12,16,0.95)", borderTop:"1px solid rgba(255,255,255,0.08)",
        backdropFilter:"blur(20px)", display:"flex", height:72, zIndex:50
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setScreen(n.id)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:4, border:"none", background:"transparent",
            cursor:"pointer", transition:"all 0.2s",
            opacity: screen===n.id ? 1 : 0.4
          }}>
            <span style={{ fontSize:20 }}>{n.icon}</span>
            <span style={{
              fontSize:9, fontFamily:"'DM Mono',monospace", letterSpacing:0.5,
              color: screen===n.id ? "#FF3B3B" : "#666",
              fontWeight: screen===n.id ? 700 : 400,
              textTransform:"uppercase"
            }}>{n.label}</span>
            {screen===n.id && <div style={{ position:"absolute", bottom:0, width:24, height:2, background:"#FF3B3B", borderRadius:1 }}/>}
          </button>
        ))}
      </div>
    </div>
  );
}