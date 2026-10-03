const $=id=>document.getElementById(id);
const stored=localStorage.getItem("licenseKey"); if(stored) $("key").value=stored;
let deviceId=localStorage.getItem("deviceId"); if(!deviceId){deviceId=crypto.randomUUID();localStorage.setItem("deviceId",deviceId);}
function msg(t){$("msg").textContent=t}
$("login").onclick=async()=>{const key=$("key").value.trim();if(!key)return msg("Enter your license key.");msg("Checking license…");try{const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,deviceId})});const d=await r.json();if(!r.ok)throw Error(d.error);if($("saveKey").checked)localStorage.setItem("licenseKey",key);msg(`Access granted • expires ${new Date(d.expiresAt).toLocaleDateString()}`);sessionStorage.setItem("licenseOk","1");}catch(e){msg(e.message)}};
$("buy").onclick=async()=>{try{const d=await (await fetch("/api/config")).json();location.href=d.instagramUrl||"https://www.instagram.com/zi.wr/"}catch{location.href="https://www.instagram.com/zi.wr/"}};
