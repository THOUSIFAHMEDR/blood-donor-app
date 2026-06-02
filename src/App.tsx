import { useState, useEffect, useRef, type JSX } from "react";
import DonorMap from "./components/DonorMap";
import "./App.css";

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

const CITY_COORDS: Record<string, [number, number]> = {
  "Bengaluru": [12.9716, 77.5946],
  "Mumbai": [19.0760, 72.8777],
  "Delhi": [28.6139, 77.2090],
  "Hyderabad": [17.3850, 78.4867],
  "Chennai": [13.0827, 80.2707],
  "Pune": [18.5204, 73.8567],
  "Kolkata": [22.5726, 88.3639],
  "Ahmedabad": [23.0225, 72.5714]
};

export interface Donor {
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
  lat: number;
  lng: number;
}

const MOCK_DONORS: Array<Donor> = [
  { id:1, name:"Arjun Sharma", blood:"O+", city:"Bengaluru", distance:2.3, time:"8 min", available:true, lastDonated:"2025-01-10", gender:"male", age:26, lat:12.9850, lng:77.6050 },
  { id:2, name:"Priya Nair", blood:"A+", city:"Bengaluru", distance:4.1, time:"14 min", available:true, lastDonated:"2025-02-20", gender:"female", age:24, lat:12.9550, lng:77.6250 },
  { id:3, name:"Mohammed Rafi", blood:"O-", city:"Bengaluru", distance:1.8, time:"6 min", available:true, lastDonated:"2025-03-05", gender:"male", age:30, lat:12.9800, lng:77.5820 },
  { id:4, name:"Sneha Kulkarni", blood:"B+", city:"Bengaluru", distance:6.2, time:"20 min", available:false, lastDonated:"2025-01-28", gender:"female", age:22, lat:12.9200, lng:77.5750 },
  { id:5, name:"Vikram Singh", blood:"AB+", city:"Bengaluru", distance:3.5, time:"12 min", available:true, lastDonated:"2024-12-15", gender:"male", age:35, lat:12.9650, lng:77.5620 },
  { id:6, name:"Lakshmi Devi", blood:"O+", city:"Bengaluru", distance:5.0, time:"17 min", available:true, lastDonated:"2025-02-01", gender:"female", age:28, lat:12.9320, lng:77.6120 },
];

const getCityDonors = (cityName: string, donorList: Donor[]): Donor[] => {
  const [lat, lng] = CITY_COORDS[cityName] || [12.9716, 77.5946];
  const cityDonors = donorList.filter(d => d.city === cityName);
  return cityDonors.map((d, index) => {
    const latOffset = ((index % 3) - 1) * 0.015 + 0.005;
    const lngOffset = (((index + 1) % 3) - 1) * 0.015 - 0.005;
    return {
      ...d,
      lat: d.lat || (lat + latOffset),
      lng: d.lng || (lng + lngOffset),
    };
  });
};

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

const DEFAULT_USERS = [
  {
    name: "Admin Center",
    email: "admin@lifelink.com",
    password: "admin123",
    phone: "9876543210",
    role: "admin",
    eligible: false,
    donations: []
  },
  {
    name: "Arjun Sharma",
    email: "donor@lifelink.com",
    password: "donor123",
    phone: "9876543211",
    role: "donor",
    blood: "O+" as const,
    city: "Bengaluru",
    age: 26,
    gender: "male" as const,
    weight: 75,
    eligible: true,
    donations: [
      { date: "Mar 5, 2025", hospital: "Manipal Hospital", units: 1, badge: "Verified" },
      { date: "Nov 15, 2024", hospital: "Apollo BGS", units: 1, badge: "Verified" },
      { date: "Jul 2, 2024", hospital: "Fortis Hospital", units: 1, badge: "Verified" }
    ]
  },
  {
    name: "Rahul Mehta",
    email: "recipient@lifelink.com",
    password: "recipient123",
    phone: "9876543212",
    role: "recipient",
    eligible: false,
    donations: []
  }
];

export type BloodGroup = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
type BadgeSize = "sm" | "lg";
export type UrgencyLevel = "Critical" | "Urgent" | "Normal";

// ─── ATOMS & UTILITIES ────────────────────────────────────────────────────────
const BloodBadge = ({ group, size = "sm" }: { group: BloodGroup; size?: BadgeSize }) => {
  const colors = {
    "O-":"#FF3B3B","O+":"#FF6B35","A-":"#C62A88","A+":"#E040FB",
    "B-":"#1565C0","B+":"#29B6F6","AB-":"#2E7D32","AB+":"#66BB6A",
  };
  const color = colors[group] || "#555";
  return (
    <span
      className={`blood-badge blood-badge-${size}`}
      style={{ "--badge-color": color } as React.CSSProperties}
    >
      {group}
    </span>
  );
};

const UrgencyBadge = ({ level }: { level: UrgencyLevel }) => {
  const map = { Critical:["#FF1744","#FFF"], Urgent:["#FF6D00","#FFF"], Normal:["#00C853","#FFF"] };
  const [bg, fg] = map[level] || ["#555","#fff"];
  return (
    <span
      className="urgency-badge"
      style={{ "--urgency-bg": bg, "--urgency-fg": fg } as React.CSSProperties}
    >
      {level}
    </span>
  );
};

const Pulse = ({ color = "#FF3B3B" }) => (
  <span className="pulse-container" style={{ "--pulse-color": color } as React.CSSProperties}>
    <span className="pulse-ring" />
    <span className="pulse-dot" />
  </span>
);

const StatCard = ({ label, value, icon, accent }: { label: string; value: string | number; icon: JSX.Element | string; accent: string }) => (
  <div className="stat-card" style={{ "--accent-color": accent } as React.CSSProperties}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
    <div className="stat-card-glow" />
  </div>
);

// ─── SCREENS ──────────────────────────────────────────────────────────────────

// AUTH SCREEN
const AuthScreen = ({
  users,
  onRegister,
  onLogin,
}: {
  users: Array<any>;
  onRegister: (newUser: any) => void;
  onLogin: (user: any) => void;
}) => {
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("donor");
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"" });
  const [step, setStep] = useState(1); // 1=form 2=otp
  const [otp, setOtp] = useState(["","","","","",""]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [smsToast, setSmsToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [error, setError] = useState("");
  
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

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      refs[i-1].current?.focus();
    }
  };

  const handleLogin = () => {
    setError("");
    
    if (tab === "register") {
      if (step === 1) {
        if (!form.name.trim()) { setError("Full Name is required."); return; }
        if (!form.email.trim()) { setError("Email Address is required."); return; }
        if (!/\S+@\S+\.\S+/.test(form.email)) { setError("Invalid email address format."); return; }
        if (!form.password || form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (!form.phone.trim()) { setError("Phone Number is required."); return; }
        if (!/^\d{10}$/.test(form.phone.replace(/[\s-]/g, ""))) { setError("Please enter a valid 10-digit phone number."); return; }

        const exists = users.find(u => u.email.toLowerCase() === form.email.toLowerCase());
        if (exists) {
          setError("An account with this email already exists.");
          return;
        }

        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedOtp(code);
          setSmsToast({
            message: `🔑 LifeLink Security:\nYour verification code is ${code}. Enter this code to complete registration.`,
            visible: true
          });
          setStep(2);
        }, 600);
      } else {
        const enteredOtp = otp.join("");
        if (enteredOtp.length < 6) {
          setError("Please enter the 6-digit verification code.");
          return;
        }
        if (enteredOtp !== generatedOtp) {
          setError("Incorrect OTP code. Please check the code and try again.");
          return;
        }

        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          const newUser = {
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
            role: role,
            eligible: false,
            donations: []
          };
          onRegister(newUser);
        }, 800);
      }
    } else {
      if (!form.email.trim()) { setError("Email Address is required."); return; }
      if (!form.password) { setError("Password is required."); return; }

      const user = users.find(
        u => u.email.toLowerCase() === form.email.toLowerCase()
      );

      if (!user) {
        setError("No account found with this email.");
        return;
      }
      if (user.password !== form.password) {
        setError("Incorrect password.");
        return;
      }
      if (user.role !== role) {
        setError(`This account is registered for the ${user.role} portal. Please select the correct portal tiles above.`);
        return;
      }

      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onLogin(user);
      }, 800);
    }
  };

  return (
    <div className="auth-container">
      {/* BG blobs */}
      <div className="auth-blob-1" />
      <div className="auth-blob-2" />

      {/* Floating SMS Toast Overlay */}
      {smsToast.visible && (
        <div className="sms-toast-overlay" onClick={() => setSmsToast(p => ({ ...p, visible: false }))}>
          <div className="sms-toast-card">
            <div className="sms-toast-header">
              <span className="sms-toast-icon">💬</span>
              <span className="sms-toast-title">MESSAGES · NOW</span>
            </div>
            <p className="sms-toast-body">{smsToast.message}</p>
            <div className="sms-toast-dismiss">Tap to dismiss</div>
          </div>
        </div>
      )}
      
      <div className="auth-wrapper">
        {/* Logo */}
        <div className="auth-logo-area">
          <div className="auth-logo">🩸</div>
          <h1 className="auth-title">LifeLink</h1>
          <p className="auth-subtitle">SMART BLOOD BANK SYSTEM</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            {["login","register"].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setStep(1); setError(""); }}
                className={`auth-tab-btn ${tab === t ? "auth-tab-btn-active" : ""}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Error Alert Display */}
          {error && (
            <div style={{
              background: "rgba(255, 23, 68, 0.1)",
              border: "1px solid rgba(255, 23, 68, 0.2)",
              borderRadius: "10px",
              padding: "10px 14px",
              color: "#FF1744",
              fontSize: "12px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "'DM Sans', sans-serif"
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (<>
            {/* Role Selector Grid */}
            <div className="auth-role-section">
              <label className="auth-role-label">SELECT SYSTEM PORTAL</label>
              <div className="auth-role-tiles">
                {[
                  { id: "donor", title: "Donor Portal", desc: "Donate blood, check local request urgencies", icon: "🤲" },
                  { id: "recipient", title: "Recipient Portal", desc: "Search matching blood banks & hospitals", icon: "🏥" },
                  { id: "admin", title: "Admin Center", desc: "Monitor stock balances & approvals", icon: "⚙️" },
                ].map(tile => (
                  <div
                    key={tile.id}
                    onClick={() => { setRole(tile.id); setError(""); }}
                    className={`role-tile ${role === tile.id ? "role-tile-active" : ""}`}
                  >
                    <span className="role-tile-icon">{tile.icon}</span>
                    <div className="role-tile-content">
                      <h4 className="role-tile-title">{tile.title}</h4>
                      <p className="role-tile-desc">{tile.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {tab === "register" && (
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input
                  placeholder="Full Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="auth-form-input"
                />
              </div>
            )}
            
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">✉️</span>
              <input
                placeholder="Email Address"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="auth-form-input"
              />
            </div>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="auth-form-input auth-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="auth-password-toggle"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {tab === "register" && (
              <div className="auth-input-wrapper" style={{ marginBottom: 0 }}>
                <span className="auth-input-icon">📞</span>
                <input
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="auth-form-input"
                />
              </div>
            )}
            
            {tab === "login" && (
              <div className="auth-forgot-pwd">
                <span className="auth-forgot-link" onClick={() => alert("Please use the default credentials for testing:\n- Donor: donor@lifelink.com / donor123\n- Recipient: recipient@lifelink.com / recipient123\n- Admin: admin@lifelink.com / admin123")}>Forgot Password?</span>
              </div>
            )}
          </>) : (
            <div className="otp-container">
              <p className="otp-info">Enter OTP sent to <span style={{color:"#fff"}}>{form.phone || form.email}</span></p>
              <p style={{ color: "#FF3B3B", fontSize: "11px", margin: "-16px 0 16px 0", fontFamily: "'DM Mono', monospace" }}>
                For testing: check message at top or use <strong>{generatedOtp}</strong>
              </p>
              <div className="otp-inputs">
                {otp.map((d, i) => (
                  <input key={i} ref={refs[i]} maxLength={1} value={d}
                    onChange={e => handleOtp(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`otp-input ${d ? "otp-input-filled" : ""}`}
                  />
                ))}
              </div>
              <p className="otp-resend">Didn't receive? <span className="otp-resend-link" onClick={() => {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                setGeneratedOtp(code);
                setSmsToast({
                  message: `🔑 LifeLink Security:\nYour new verification code is ${code}. Enter this code to complete registration.`,
                  visible: true
                });
              }}>Resend OTP</span></p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} className={`auth-submit-btn ${loading ? "btn-loading" : ""}`}>
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              tab === "register" && step === 1 ? "SEND OTP" : tab === "register" ? "CREATE ACCOUNT" : "SIGN IN"
            )}
          </button>
        </div>

        <p className="auth-footer-notice">
          Protected by end-to-end encryption · HIPAA compliant
        </p>
      </div>
    </div>
  );
};

// DONOR DASHBOARD
// DONOR DASHBOARD
const DonorDashboard = ({ 
  currentUser, 
  requests, 
  onRespond 
}: { 
  currentUser: any; 
  requests: Array<any>; 
  onRespond: (req: any) => void; 
}) => {
  const [activeReq, setActiveReq] = useState<any | null>(null);
  
  const donationCount = currentUser?.donations?.length || 0;
  const livesSaved = donationCount * 3;
  const eligible = currentUser?.eligible !== false;
  
  const userCity = currentUser?.city || "Bengaluru";
  const cityRequests = requests.filter(r => r.city === userCity);

  return (
    <div style={{ padding:"0 0 40px" }} className="section-container">
      {/* Hero bar */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-title-area">
          <div>
            <p className="dashboard-hero-subtitle" style={{ color:"#FF3B3B" }}>DONOR DASHBOARD</p>
            <h2 className="dashboard-hero-title">Welcome, {currentUser?.name || "Donor"} 👋</h2>
          </div>
          <BloodBadge group={currentUser?.blood || "O+"} size="lg" />
        </div>
        {/* Eligibility bar */}
        <div className="eligibility-banner" style={{ 
          background: eligible ? "rgba(0, 200, 83, 0.1)" : "rgba(255, 23, 68, 0.1)", 
          borderColor: eligible ? "rgba(0, 200, 83, 0.2)" : "rgba(255, 23, 68, 0.2)" 
        }}>
          <Pulse color={eligible ? "#00C853" : "#FF1744"}/>
          <span className="eligibility-status-label" style={{ color: eligible ? "#00C853" : "#FF1744" }}>
            {eligible ? "ELIGIBLE TO DONATE" : "INELIGIBLE TO DONATE"}
          </span>
          <span className="eligibility-date" style={{ color: "#888" }}>
            {eligible ? "Ready Now" : "Check health screening"}
          </span>
        </div>
      </div>

      <div style={{ padding:"0 24px" }}>
        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Donations" value={donationCount} icon="💉" accent="#FF3B3B"/>
          <StatCard label="Lives Saved" value={livesSaved} icon="❤️" accent="#C62A88"/>
          <StatCard label="City portal" value={userCity} icon="📍" accent="#FF6B35"/>
        </div>

        {/* Emergency requests */}
        <div style={{ marginBottom:24 }}>
          <div className="section-title-row">
            <h3 className="section-title">Emergency Requests</h3>
            <span className="section-label" style={{ color:"#FF3B3B" }}>IN {userCity.toUpperCase()}</span>
          </div>
          {cityRequests.length === 0 ? (
            <p style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>No active emergency requests in your area.</p>
          ) : (
            cityRequests.map(r => (
              <div
                key={r.id}
                onClick={() => eligible && setActiveReq(r)}
                className={`request-card ${r.urgency === "Critical" ? "request-card-critical" : r.urgency === "Urgent" ? "request-card-urgent" : ""}`}
                style={{ cursor: eligible ? "pointer" : "default" }}
              >
                <div className="request-card-header">
                  <div>
                    <div className="request-card-badges">
                      <BloodBadge group={r.blood}/>
                      <UrgencyBadge level={r.urgency}/>
                    </div>
                    <p className="request-card-patient">{r.patient}</p>
                    <p className="request-card-details">{r.hospital} · {r.units} unit{r.units>1?"s":""}</p>
                  </div>
                  <span className="request-card-time">{r.time}</span>
                </div>
                {eligible && (
                  <button className="respond-now-btn" style={{ marginTop: 12 }}>RESPOND NOW</button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Donation history */}
        <div>
          <h3 className="section-title" style={{ margin:"0 0 14px" }}>Donation History</h3>
          {currentUser?.donations && currentUser.donations.length > 0 ? (
            currentUser.donations.map((h: any, i: number) => (
              <div key={i} className="history-item">
                <div>
                  <p className="history-item-hospital">{h.hospital}</p>
                  <p className="history-item-date">{h.date}</p>
                </div>
                <span className="history-item-status-badge">✓ {h.badge || "Verified"}</span>
              </div>
            ))
          ) : (
            <p style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>No donation history yet.</p>
          )}
        </div>
      </div>

      {/* Donor Response Modal */}
      {activeReq && (
        <div className="modal-overlay">
          <div className="modal-card modal-card-donor">
            <h3 className="modal-title modal-title-donor">💉 Confirm Donation Response</h3>
            <p className="modal-subtitle">Confirm your response to help this patient in need.</p>
            
            <div className="modal-summary-box modal-summary-box-donor">
              <div className="modal-summary-row">
                <span className="modal-summary-label">Patient</span>
                <span className="modal-summary-value">{activeReq.patient}</span>
              </div>
              <div className="modal-summary-row">
                <span className="modal-summary-label">Hospital</span>
                <span className="modal-summary-value">{activeReq.hospital}</span>
              </div>
              <div className="modal-summary-row">
                <span className="modal-summary-label">Blood Group</span>
                <div className="modal-summary-val-badge">
                  <BloodBadge group={activeReq.blood}/>
                </div>
              </div>
              <div className="modal-summary-row">
                <span className="modal-summary-label">Urgency</span>
                <div className="modal-summary-val-badge">
                  <UrgencyBadge level={activeReq.urgency}/>
                </div>
              </div>
              <div className="modal-summary-row">
                <span className="modal-summary-label">Units Required</span>
                <span className="modal-summary-value">{activeReq.units} units</span>
              </div>
            </div>
            
            <p className="modal-notice-text">
              ⚕️ <strong>Notice:</strong> By responding, you agree to share your name, phone number, and blood group eligibility status with the recipient hospital for coordination purposes.
            </p>

            <div className="modal-buttons">
              <button onClick={() => setActiveReq(null)} className="modal-btn-cancel">
                CANCEL
              </button>
              <button
                onClick={() => {
                  alert(`Thank you! Your response for ${activeReq.patient} has been registered. The hospital will contact you shortly.`);
                  onRespond(activeReq);
                  setActiveReq(null);
                }}
                className="modal-btn-confirm modal-btn-confirm-donor"
              >
                RESPOND NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// RECIPIENT DASHBOARD
const RecipientDashboard = ({
  currentUser,
  donors,
  onBroadcast
}: {
  currentUser: any;
  donors: Array<Donor>;
  onBroadcast: (newReq: any) => void;
}) => {
  const [bloodNeeded, setBloodNeeded] = useState<BloodGroup>("O+");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Urgent");
  const [searched, setSearched] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null);
  const [city, setCity] = useState(currentUser?.city || "Bengaluru");

  const compatible = getCityDonors(city, donors)
    .filter(d => (RECEIVE_FROM[bloodNeeded] as BloodGroup[]).includes(d.blood))
    .sort((a,b)=>a.distance-b.distance);

  return (
    <div style={{ padding:"0 0 40px" }} className="section-container">
      <div className="dashboard-hero dashboard-hero-recipient">
        <p className="dashboard-hero-subtitle" style={{ color:"#29B6F6" }}>RECIPIENT PORTAL</p>
        <h2 className="dashboard-hero-title">Find Blood Donors</h2>
      </div>

      <div style={{ padding:"0 24px" }}>
        {/* Search block */}
        <div className="search-card">
          <p className="search-card-label">LOCATION / CITY</p>
          <select
            value={city}
            onChange={e => {
              setCity(e.target.value);
              setSearched(false); // Reset results when city changes
            }}
            className="form-input"
            style={{ marginBottom: 20, cursor: "pointer" }}
          >
            {CITIES.map(c => <option key={c} value={c} style={{ background: "#0D0D0D", color: "#fff" }}>{c}</option>)}
          </select>

          <p className="search-card-label search-card-label-large">BLOOD REQUIRED</p>
          <div className="blood-select-grid">
            {BLOOD_GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setBloodNeeded(g as BloodGroup)}
                className={`blood-select-btn ${bloodNeeded === g ? "blood-select-btn-active" : ""}`}
              >
                {g}
              </button>
            ))}
          </div>

          <p className="search-card-label">URGENCY LEVEL</p>
          <div className="urgency-select-group">
            {["Normal","Urgent","Critical"].map(u => (
              <button
                key={u}
                onClick={() => setUrgency(u as UrgencyLevel)}
                className={`urgency-select-btn ${urgency === u ? `urgency-select-btn-${u.toLowerCase()}` : ""}`}
              >
                {u}
              </button>
            ))}
          </div>

          <button onClick={() => setSearched(true)} className="find-donors-btn">
            🔍 FIND NEARBY DONORS
          </button>
        </div>

        {/* Results */}
        {searched && (<>
          <DonorMap
            donors={compatible}
            center={CITY_COORDS[city] || [12.9716, 77.5946]}
            selectedDonorId={selectedDonorId}
            onSelectDonor={setSelectedDonorId}
          />

          <div className="section-title-row">
            <h3 className="section-title">
              {compatible.length} Compatible Donors
            </h3>
            <span className="section-label" style={{ color:"#29B6F6" }}>SORTED BY DISTANCE</span>
          </div>

          {compatible.map(d => (
            <div
              key={d.id}
              onClick={() => setSelectedDonorId(d.id)}
              className={`donor-card ${selectedDonorId === d.id ? "donor-card-selected" : ""}`}
            >
              <div className="donor-card-row">
                <div className="donor-info-left">
                  <div className="donor-avatar">{d.gender==="male"?"👨":"👩"}</div>
                  <div className="donor-name-details">
                    <p className="donor-name">{d.name}</p>
                    <div className="donor-meta">
                      <BloodBadge group={d.blood}/>
                      <span className="donor-age">Age {d.age}</span>
                    </div>
                  </div>
                </div>
                <div className="donor-status-right">
                  <div className="donor-status-indicator">
                    {d.available ? <Pulse color="#00C853"/> : <span style={{ width:8,height:8,borderRadius:"50%",background:"#555",display:"inline-block" }}/>}
                    <span className="donor-status-text" style={{ color: d.available ? "#00C853" : "#555" }}>
                      {d.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <p className="donor-distance">📍 {d.distance} km · {d.time}</p>
                </div>
              </div>
              {d.available && (
                <div className="donor-action-buttons">
                  <button onClick={(e) => { e.stopPropagation(); alert(`Calling ${d.name} at ${d.id > 10 ? currentUser?.phone || "+91 XXXXX XXXXX" : "+91 XXXXX XXXXX"}...`); }} className="donor-action-call">
                    📞 CALL
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); alert(`Request sent to ${d.name}!`); }} className="donor-action-request">
                    ✉️ SEND REQUEST
                  </button>
                </div>
              )}
            </div>
          ))}

          <button onClick={() => setShowRequest(true)} className="broadcast-btn">
            🚨 BROADCAST EMERGENCY REQUEST
          </button>
        </>)}
      </div>

      {/* Emergency modal */}
      {showRequest && (
        <div className="modal-overlay">
          <div className="modal-card modal-card-recipient">
            <h3 className="modal-title modal-title-recipient">🚨 Emergency Broadcast</h3>
            <p className="modal-subtitle">Notify all compatible donors within 20km instantly via SMS + App</p>
            <div className="modal-summary-box modal-summary-box-recipient">
              <div className="modal-summary-row">
                <span className="modal-summary-label">Blood Required</span>
                <div className="modal-summary-val-badge">
                  <BloodBadge group={bloodNeeded as BloodGroup}/>
                </div>
              </div>
              <div className="modal-summary-row">
                <span className="modal-summary-label">Urgency</span>
                <div className="modal-summary-val-badge">
                  <UrgencyBadge level={urgency as UrgencyLevel}/>
                </div>
              </div>
              <div className="modal-summary-row">
                <span className="modal-summary-label">Notifying</span>
                <span className="modal-summary-value">{compatible.length} donors</span>
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowRequest(false)} className="modal-btn-cancel">
                CANCEL
              </button>
              <button
                onClick={() => {
                  const newReq = {
                    id: Date.now(),
                    patient: currentUser?.name || "Recipient User",
                    blood: bloodNeeded,
                    hospital: "City General Hospital",
                    units: Math.floor(Math.random() * 2) + 2,
                    urgency: urgency,
                    time: "Just now",
                    city: city
                  };
                  onBroadcast(newReq);
                  alert(`Emergency broadcast sent successfully to ${compatible.length} compatible donors in ${city}!`);
                  setShowRequest(false);
                }}
                className="modal-btn-confirm modal-btn-confirm-recipient"
              >
                🚨 SEND NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// REGISTRATION SCREEN
const RegisterDonor = ({ 
  currentUser, 
  onCompleteScreening, 
  onBack 
}: { 
  currentUser: any; 
  onCompleteScreening: (details: any) => void; 
  onBack: () => void; 
}) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => ({ 
    name: currentUser?.name || "", 
    age: currentUser?.age?.toString() || "", 
    gender: (currentUser?.gender || "male") as "male"|"female"|"other", 
    blood: (currentUser?.blood || "O+") as BloodGroup, 
    city: currentUser?.city || "Bengaluru", 
    weight: currentUser?.weight?.toString() || "", 
    lastDonated: "" 
  }));
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

  return (
    <div style={{ padding:"0 0 40px" }} className="section-container">
      <div className="register-header">
        <button onClick={onBack} className="register-back-btn">←</button>
        <div>
          <p className="register-header-subtitle">DONOR REGISTRATION</p>
          <h2 className="register-header-title">Health Screening</h2>
        </div>
      </div>

      {/* Step indicator */}
      <div className="register-steps">
        {["Personal Details","Health Screening","Eligibility Result"].map((s,i) => (
          <div key={i} className="register-step-item">
            <div
              className="register-step-bar"
              style={{ background: step>i?"#C62A88":"rgba(255,255,255,0.1)" }}
            />
            <span
              className="register-step-label"
              style={{ color: step>i?"#C62A88":"#444" }}
            >
              {i+1}. {s.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding:"0 24px" }}>
        {step === 1 && (<>
          {currentUser?.eligible && (
            <div style={{
              background: "rgba(0, 200, 83, 0.1)",
              border: "1px solid rgba(0, 200, 83, 0.2)",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#00C853"
            }}>
              ⭐ You are currently registered as an eligible active donor. You can modify your screening details below if needed.
            </div>
          )}

          <div className="register-details-grid">
            <div className="register-details-grid-full">
              <input placeholder="Full Name" value={form.name} onChange={e=>f("name",e.target.value)} className="form-input"/>
            </div>
            <input placeholder="Age" value={form.age} onChange={e=>f("age",e.target.value)} className="form-input"/>
            <input placeholder="Weight (kg)" value={form.weight} onChange={e=>f("weight",e.target.value)} className="form-input"/>
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 10px" }}>GENDER</p>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {["male","female","other"].map(g => (
              <button key={g} onClick={() => f("gender",g)} className={`register-city-btn ${form.gender===g ? "register-city-btn-active" : ""}`} style={{ flex: 1, textTransform: "capitalize", fontWeight: 700 }}>
                {g}
              </button>
            ))}
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 10px" }}>BLOOD GROUP</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
            {BLOOD_GROUPS.map(g => (
              <button key={g} onClick={() => f("blood",g)} className={`register-city-btn ${form.blood===g ? "register-city-btn-active" : ""}`} style={{ fontWeight: 700 }}>
                {g}
              </button>
            ))}
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 10px" }}>CITY</p>
          <div className="register-city-grid">
            {CITIES.map(c => (
              <button key={c} onClick={() => f("city",c)} className={`register-city-btn ${form.city===c ? "register-city-btn-active" : ""}`}>
                {c}
              </button>
            ))}
          </div>

          <button onClick={() => setStep(2)} className="register-next-btn">NEXT → HEALTH SCREENING</button>
        </>)}

        {step === 2 && (<>
          <div className="screening-alert">
            <p className="screening-alert-text">
              ⚕️ Honest answers protect both you and the recipient. All data is encrypted.
            </p>
          </div>

          <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 14px" }}>
            Have you ever been diagnosed with any of the following?
          </p>

          <div className="screening-questions-container">
            {conditions.map(c => (
              <div key={c} className="screening-item">
                <span className="screening-item-label">{c}</span>
                <div className="screening-btn-group">
                  {["yes","no"].map(v => (
                    <button
                      key={v}
                      onClick={() => setHealth(p=>({...p,[c]:v}))}
                      className={`screening-btn ${health[c]===v ? (v==="yes" ? "screening-btn-yes-active" : "screening-btn-no-active") : ""}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={checkEligibility} className="register-next-btn" style={{ marginTop: 24 }}>CHECK ELIGIBILITY</button>
        </>)}

        {step === 3 && eligible && (<>
          <div className={`eligibility-result-card ${eligible.ok ? "eligibility-result-card-ok" : "eligibility-result-card-blocked"}`}>
            <div className="eligibility-icon">{eligible.ok ? "✅" : "❌"}</div>
            <h3 className={`eligibility-title ${eligible.ok ? "eligibility-title-ok" : "eligibility-title-blocked"}`}>
              {eligible.ok ? "You're Eligible!" : "Not Eligible to Donate"}
            </h3>
            {eligible.ok ? (
              <p className="eligibility-desc">Your health screening is complete. You can now register as a donor.</p>
            ) : (
              <>
                <p className="eligibility-desc eligibility-desc-blocked">Registration blocked due to the following reason(s):</p>
                {eligible.reasons?.map((r: string,i: number) => (
                  <div key={i} className="eligibility-reason-item">⚠️ {r}</div>
                ))}
              </>
            )}
          </div>

          {eligible.ok && (
            <button 
              onClick={() => {
                onCompleteScreening({
                  name: form.name,
                  age: parseInt(form.age) || 25,
                  gender: form.gender,
                  blood: form.blood,
                  city: form.city,
                  weight: parseInt(form.weight) || 60
                });
              }} 
              className="eligibility-btn eligibility-btn-ok"
            >
              ✅ COMPLETE REGISTRATION
            </button>
          )}
          <button onClick={() => setStep(1)} className="start-over-btn">
            ← START OVER
          </button>
        </>)}
      </div>
    </div>
  );
};

// ADMIN DASHBOARD
const AdminDashboard = ({
  users,
  donors,
  requests,
  approvals,
  inventory,
  onApprove,
  onReject
}: {
  users: Array<any>;
  donors: Array<Donor>;
  requests: Array<any>;
  approvals: Array<any>;
  inventory: Record<BloodGroup, number>;
  onApprove: (name: string) => void;
  onReject: (name: string) => void;
}) => {
  return (
    <div style={{ padding:"0 0 40px" }} className="section-container">
      <div className="dashboard-hero dashboard-hero-admin">
        <p className="dashboard-hero-subtitle" style={{ color:"#00C853" }}>ADMIN CONTROL CENTER</p>
        <h2 className="dashboard-hero-title">Blood Bank Admin</h2>
      </div>

      <div style={{ padding:"0 24px" }}>
        <div className="stats-grid stats-grid-admin">
          <StatCard label="Total Donors" value={1284 + (donors.length - 6)} icon="🤲" accent="#00C853"/>
          <StatCard label="Recipients" value={467 + (users.filter(u => u.role === "recipient").length - 1)} icon="🏥" accent="#29B6F6"/>
          <StatCard label="Emergency Req" value={12 + (requests.length - 3)} icon="🚨" accent="#FF1744"/>
          <StatCard label="Units Available" value={Object.values(inventory).reduce((a,b)=>a+b, 0)} icon="🩸" accent="#FF3B3B"/>
        </div>

        {/* Blood inventory */}
        <h3 className="section-title" style={{ margin:"0 0 14px" }}>Blood Inventory</h3>
        <div className="admin-inventory-card">
          {[
            { group:"O+", units: inventory["O+"] || 0, max:300 },
            { group:"O-", units: inventory["O-"] || 0, max:100 },
            { group:"A+", units: inventory["A+"] || 0, max:250 },
            { group:"A-", units: inventory["A-"] || 0, max:80 },
            { group:"B+", units: inventory["B+"] || 0, max:200 },
            { group:"B-", units: inventory["B-"] || 0, max:60 },
            { group:"AB+", units: inventory["AB+"] || 0, max:120 },
            { group:"AB-", units: inventory["AB-"] || 0, max:80 },
          ].map(item => {
            const pct = Math.min(100, Math.round(item.units/item.max*100));
            const color = pct<30?"#FF1744":pct<60?"#FF6D00":"#00C853";
            return (
              <div key={item.group} className="admin-inventory-item">
                <div className="admin-inventory-header">
                  <BloodBadge group={item.group as BloodGroup}/>
                  <span className="admin-inventory-units">{item.units} / {item.max} units</span>
                </div>
                <div className="admin-progress-bg">
                  <div className="admin-progress-fill" style={{ width:`${pct}%`, background:color }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending approvals */}
        <h3 className="section-title" style={{ margin:"0 0 14px" }}>Pending Approvals</h3>
        {approvals.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic", fontSize: 14 }}>No pending approvals.</p>
        ) : (
          approvals.map((u) => (
            <div key={u.name} className="approval-card">
              <div className="approval-card-left">
                <div className="approval-avatar">👤</div>
                <div className="approval-details">
                  <p className="approval-name">{u.name}</p>
                  <div className="approval-meta">
                    <span className="approval-role">{u.role}</span>
                    <BloodBadge group={u.blood}/>
                  </div>
                </div>
              </div>
              <div className="approval-actions">
                <button className="approval-btn-approve" onClick={() => onApprove(u.name)}>✓</button>
                <button className="approval-btn-reject" onClick={() => onReject(u.name)}>✗</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// COMPATIBILITY ENGINE VIEW
const CompatibilityView = () => {
  const [selected, setSelected] = useState("O+");
  return (
    <div style={{ padding:"0 0 40px" }} className="section-container">
      <div className="dashboard-hero dashboard-hero-compat">
        <p className="dashboard-hero-subtitle" style={{ color:"#FF6B35" }}>COMPATIBILITY ENGINE</p>
        <h2 className="dashboard-hero-title">Blood Type Matcher</h2>
      </div>

      <div style={{ padding:"0 24px" }}>
        <p style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:1, margin:"0 0 12px" }}>SELECT DONOR BLOOD GROUP</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:28 }}>
          {BLOOD_GROUPS.map(g => (
            <button key={g} onClick={() => setSelected(g)} className={`register-city-btn ${selected===g ? "register-city-btn-active" : ""}`} style={{ padding:"16px 0" }}>
              <BloodBadge group={g as BloodGroup} size={selected===g?"lg":"sm"}/>
            </button>
          ))}
        </div>

        <div className="compat-layout">
          <div className="compat-column-donate">
            <p className="compat-column-label">CAN DONATE TO</p>
            <div className="compat-badge-list">
              {(COMPATIBILITY[selected as BloodGroup]||[]).map(g => <BloodBadge key={g} group={g as BloodGroup}/>)}
            </div>
          </div>
          <div className="compat-column-receive">
            <p className="compat-column-label compat-column-label-receive">CAN RECEIVE FROM</p>
            <div className="compat-badge-list">
              {(RECEIVE_FROM[selected as BloodGroup]||[]).map(g => <BloodBadge key={g} group={g as BloodGroup}/>)}
            </div>
          </div>
        </div>

        {/* Universal donor/recipient callouts */}
        {selected === "O-" && (
          <div className="compat-special-callout">
            <p className="compat-special-callout-text">⭐ <strong>Universal Donor</strong> — O- blood can be given to anyone in an emergency.</p>
          </div>
        )}
        {selected === "AB+" && (
          <div className="compat-special-callout">
            <p className="compat-special-callout-text">⭐ <strong>Universal Recipient</strong> — AB+ can receive blood from any blood type.</p>
          </div>
        )}
      </div>
    </div>
  );
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
  const [users, setUsers] = useState<Array<any>>(() => {
    const saved = localStorage.getItem("lifelink_users");
    if (saved) return JSON.parse(saved);
    localStorage.setItem("lifelink_users", JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  const [donors, setDonors] = useState<Array<Donor>>(() => {
    const saved = localStorage.getItem("lifelink_donors");
    if (saved) return JSON.parse(saved);
    localStorage.setItem("lifelink_donors", JSON.stringify(MOCK_DONORS));
    return MOCK_DONORS;
  });

  const [requests, setRequests] = useState<Array<any>>(() => {
    const saved = localStorage.getItem("lifelink_requests");
    if (saved) return JSON.parse(saved);
    localStorage.setItem("lifelink_requests", JSON.stringify(MOCK_REQUESTS));
    return MOCK_REQUESTS;
  });

  const [approvals, setApprovals] = useState<Array<any>>(() => {
    const saved = localStorage.getItem("lifelink_approvals");
    const defaultApprovals = [
      { name: "Rahul Verma", role: "Donor", blood: "B+" as BloodGroup, time: "2 min ago" },
      { name: "Meena Iyer", role: "Recipient", blood: "O-" as BloodGroup, time: "15 min ago" },
      { name: "Aditya Das", role: "Donor", blood: "A+" as BloodGroup, time: "1 hr ago" },
    ];
    if (saved) return JSON.parse(saved);
    localStorage.setItem("lifelink_approvals", JSON.stringify(defaultApprovals));
    return defaultApprovals;
  });

  const [inventory, setInventory] = useState<Record<BloodGroup, number>>(() => {
    const saved = localStorage.getItem("lifelink_inventory");
    const defaultInventory = {
      "O+": 210, "O-": 45, "A+": 180, "A-": 30,
      "B+": 160, "B-": 25, "AB+": 100, "AB-": 93
    };
    if (saved) return JSON.parse(saved);
    localStorage.setItem("lifelink_inventory", JSON.stringify(defaultInventory));
    return defaultInventory as Record<BloodGroup, number>;
  });

  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const saved = localStorage.getItem("lifelink_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authed, setAuthed] = useState(() => {
    return localStorage.getItem("lifelink_current_user") !== null;
  });

  const [userRole, setUserRole] = useState<string | null>(() => {
    const saved = localStorage.getItem("lifelink_current_user");
    return saved ? JSON.parse(saved).role : null;
  });

  const [screen, setScreen] = useState(() => {
    const saved = localStorage.getItem("lifelink_current_user");
    if (saved) {
      const r = JSON.parse(saved).role;
      return r === "admin" ? "admin" : r === "recipient" ? "search" : "donor";
    }
    return "donor";
  });

  const handleRegister = (newUser: any) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem("lifelink_users", JSON.stringify(updatedUsers));
    
    setCurrentUser(newUser);
    setAuthed(true);
    setUserRole(newUser.role);
    localStorage.setItem("lifelink_current_user", JSON.stringify(newUser));
    setScreen(newUser.role === "admin" ? "admin" : newUser.role === "recipient" ? "search" : "donor");

    if (newUser.role !== "admin") {
      const newApproval = {
        name: newUser.name,
        role: newUser.role === "donor" ? "Donor" : "Recipient",
        blood: "O+",
        time: "Just now"
      };
      const updatedApprovals = [newApproval, ...approvals];
      setApprovals(updatedApprovals);
      localStorage.setItem("lifelink_approvals", JSON.stringify(updatedApprovals));
    }
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setAuthed(true);
    setUserRole(user.role);
    localStorage.setItem("lifelink_current_user", JSON.stringify(user));
    setScreen(user.role === "admin" ? "admin" : user.role === "recipient" ? "search" : "donor");
  };

  const handleLogout = () => {
    setAuthed(false);
    setUserRole(null);
    setCurrentUser(null);
    localStorage.removeItem("lifelink_current_user");
    setScreen("donor");
  };

  const updateCurrentUser = (updates: Partial<any>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem("lifelink_current_user", JSON.stringify(updatedUser));
    
    const updatedUsers = users.map(u => u.email.toLowerCase() === currentUser.email.toLowerCase() ? { ...u, ...updates } : u);
    setUsers(updatedUsers);
    localStorage.setItem("lifelink_users", JSON.stringify(updatedUsers));
  };

  const handleRespond = (req: any) => {
    if (!currentUser) return;
    
    const newDonation = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      hospital: req.hospital,
      units: req.units,
      badge: "Pending Verification"
    };
    
    const updatedDonations = [newDonation, ...(currentUser.donations || [])];
    updateCurrentUser({
      donations: updatedDonations
    });

    const updatedInventory = {
      ...inventory,
      [req.blood]: Math.min(300, (inventory[req.blood as BloodGroup] || 0) + req.units)
    };
    setInventory(updatedInventory);
    localStorage.setItem("lifelink_inventory", JSON.stringify(updatedInventory));
  };

  const handleBroadcast = (newReq: any) => {
    const updatedRequests = [newReq, ...requests];
    setRequests(updatedRequests);
    localStorage.setItem("lifelink_requests", JSON.stringify(updatedRequests));
  };

  const handleCompleteScreening = (details: any) => {
    updateCurrentUser({
      blood: details.blood,
      city: details.city,
      age: details.age,
      gender: details.gender,
      weight: details.weight,
      eligible: true
    });

    const exists = donors.find(d => d.name === details.name);
    if (!exists) {
      const newDonor: Donor = {
        id: Date.now(),
        name: details.name,
        blood: details.blood,
        city: details.city,
        distance: 1.2,
        time: "4 min",
        available: true,
        lastDonated: "Never",
        gender: details.gender,
        age: details.age,
        lat: 0,
        lng: 0
      };
      const updatedDonors = [newDonor, ...donors];
      setDonors(updatedDonors);
      localStorage.setItem("lifelink_donors", JSON.stringify(updatedDonors));
    }

    alert("Donor screening registration completed successfully!");
    setScreen("donor");
  };

  const handleApproveUser = (name: string) => {
    alert(`${name}'s registration has been approved.`);
    const updated = approvals.filter(u => u.name !== name);
    setApprovals(updated);
    localStorage.setItem("lifelink_approvals", JSON.stringify(updated));
  };

  const handleRejectUser = (name: string) => {
    alert(`${name}'s registration has been rejected.`);
    const updated = approvals.filter(u => u.name !== name);
    setApprovals(updated);
    localStorage.setItem("lifelink_approvals", JSON.stringify(updated));
  };

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

      /* Floating SMS toast styling */
      .sms-toast-overlay {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 380px;
        z-index: 1000;
        cursor: pointer;
        animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes slideDown {
        from { transform: translate(-50%, -40px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      .sms-toast-card {
        background: rgba(20, 24, 30, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-left: 4px solid #FF3B3B;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
      }
      .sms-toast-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        justify-content: flex-start;
      }
      .sms-toast-icon {
        font-size: 16px;
      }
      .sms-toast-title {
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        color: #888;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .sms-toast-body {
        color: #fff;
        font-size: 13px;
        margin: 0;
        line-height: 1.4;
        white-space: pre-line;
      }
      .sms-toast-dismiss {
        color: #555;
        font-size: 9px;
        text-align: right;
        margin-top: 8px;
        font-family: 'DM Mono', monospace;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (!authed) {
    return (
      <AuthScreen 
        users={users} 
        onRegister={handleRegister} 
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Header Bar with Logout */}
      <div className="app-header">
        <div className="app-header-logo">
          <span style={{ fontSize: 20 }}>🩸</span>
          <span className="app-header-title">LifeLink</span>
        </div>
        <button onClick={handleLogout} className="app-header-logout">
          LOGOUT
        </button>
      </div>

      {/* Scrollable content */}
      <div className="app-content">
        {screen === "donor"    && (
          <DonorDashboard 
            currentUser={currentUser} 
            requests={requests} 
            onRespond={handleRespond}
          />
        )}
        {screen === "search"   && (
          <RecipientDashboard 
            currentUser={currentUser} 
            donors={donors} 
            onBroadcast={handleBroadcast}
          />
        )}
        {screen === "compat"   && <CompatibilityView/>}
        {screen === "admin"    && userRole === "admin" && (
          <AdminDashboard 
            users={users}
            donors={donors}
            requests={requests}
            approvals={approvals}
            inventory={inventory}
            onApprove={handleApproveUser}
            onReject={handleRejectUser}
          />
        )}
        {screen === "register" && (
          <RegisterDonor 
            currentUser={currentUser} 
            onCompleteScreening={handleCompleteScreening} 
            onBack={() => setScreen("donor")}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div className="bottom-nav">
        {NAV.filter(n => n.id !== "admin" || userRole === "admin").map(n => (
          <button key={n.id} onClick={() => setScreen(n.id)} className="nav-btn" style={{ opacity: screen===n.id ? 1 : 0.4 }}>
            <span className="nav-btn-icon">{n.icon}</span>
            <span
              className="nav-btn-label"
              style={{
                color: screen===n.id ? "#FF3B3B" : "#666",
                fontWeight: screen===n.id ? 700 : 400
              }}
            >
              {n.label}
            </span>
            {screen===n.id && <div className="nav-btn-active-indicator" />}
          </button>
        ))}
      </div>
    </div>
  );
}