const express = require("express");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "64kb" }));

const PORT = Number(process.env.PORT || 3000);
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "CHANGE_THIS_NOW";
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_NOW";
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || "https://www.instagram.com/zi.wr/";

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

function loadDb() {
  if (!fs.existsSync(DB_FILE)) return { keys: [] };
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { keys: [] }; }
}
function saveDb(db) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
function nowIso() { return new Date().toISOString(); }
function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString();
}
function randomPart(n=5) {
  return crypto.randomBytes(Math.ceil(n*0.8)).toString("hex").slice(0,n).toUpperCase();
}
function makeKey() {
  return `ABDOUUU-BANEL-VIP-${randomPart(4)}-${randomPart(6)}-${randomPart(6)}`;
}
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verify(token) {
  try {
    const [body, sig] = String(token || "").split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(body).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}
function auth(req,res,next) {
  const p = verify((req.headers.authorization || "").replace(/^Bearer\s+/i,""));
  if (!p || p.role !== "admin") return res.status(401).json({error:"Unauthorized"});
  next();
}

app.get("/api/config", (req,res) => res.json({ instagramUrl: INSTAGRAM_URL }));

app.post("/api/login", (req,res) => {
  const { key, deviceId } = req.body || {};
  if (!key || !deviceId) return res.status(400).json({error:"Key and device ID are required"});
  const db = loadDb();
  const rec = db.keys.find(k => k.key === String(key).trim());
  if (!rec) return res.status(401).json({error:"Invalid license key"});
  if (rec.revoked) return res.status(403).json({error:"This key was revoked"});
  if (new Date(rec.expiresAt) <= new Date()) return res.status(403).json({error:"This key has expired"});

  rec.devices = rec.devices || [];
  if (!rec.devices.includes(deviceId)) {
    if (rec.devices.length >= rec.maxUsers) {
      return res.status(403).json({error:"Maximum users/devices reached"});
    }
    rec.devices.push(deviceId);
  }
  rec.lastUsedAt = nowIso();
  saveDb(db);
  res.json({
    ok:true,
    key:rec.key,
    expiresAt:rec.expiresAt,
    maxUsers:rec.maxUsers,
    usedUsers:rec.devices.length
  });
});

app.post("/api/admin/login", (req,res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD)
    return res.status(401).json({error:"Invalid admin credentials"});
  res.json({token:sign({role:"admin",exp:Date.now()+8*60*60*1000})});
});

app.get("/api/admin/keys", auth, (req,res) => {
  const db = loadDb();
  const keys = db.keys.map(k => ({
    ...k,
    usedUsers:(k.devices||[]).length,
    status:k.revoked ? "Revoked" : (new Date(k.expiresAt)<=new Date() ? "Expired" : "Active")
  })).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  res.json(keys);
});

app.post("/api/admin/keys", auth, (req,res) => {
  const durationDays = Math.max(1, Math.min(3650, Number(req.body?.durationDays || 30)));
  const maxUsers = Math.max(1, Math.min(10000, Number(req.body?.maxUsers || 1)));
  const db = loadDb();
  let key = makeKey();
  while (db.keys.some(k=>k.key===key)) key = makeKey();
  const rec = {
    key, durationDays, maxUsers,
    createdAt:nowIso(),
    expiresAt:addDays(new Date(), durationDays),
    devices:[], revoked:false
  };
  db.keys.push(rec); saveDb(db);
  res.json(rec);
});

app.post("/api/admin/keys/:key/revoke", auth, (req,res) => {
  const db=loadDb(); const rec=db.keys.find(k=>k.key===req.params.key);
  if(!rec) return res.status(404).json({error:"Key not found"});
  rec.revoked=true; rec.revokedAt=nowIso(); saveDb(db);
  res.json({ok:true});
});

app.delete("/api/admin/keys/:key", auth, (req,res) => {
  const db=loadDb(); const before=db.keys.length;
  db.keys=db.keys.filter(k=>k.key!==req.params.key); saveDb(db);
  if(db.keys.length===before) return res.status(404).json({error:"Key not found"});
  res.json({ok:true});
});

app.use(express.static(path.join(__dirname, "..", "public")));
app.get("*", (req,res) => res.sendFile(path.join(__dirname, "..", "public", "index.html")));

app.listen(PORT, ()=>console.log(`ABDOUUU BANEL VIP server running on port ${PORT}`));
