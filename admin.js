const $=id=>document.getElementById(id);let token=localStorage.getItem("adminToken");
async function api(path,opts={}){opts.headers={...(opts.headers||{}),"Content-Type":"application/json","Authorization":"Bearer "+token};const r=await fetch(path,opts);const d=await r.json();if(!r.ok)throw Error(d.error||"Request failed");return d}
function showDash(){ $("loginBox").hidden=true;$("dash").hidden=false;load();}
$("adminLogin").onclick=async()=>{try{const d=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:$("user").value,password:$("pass").value})}).then(r=>r.json());if(!d.token)throw Error(d.error);token=d.token;localStorage.setItem("adminToken",token);showDash()}catch(e){$("adminMsg").textContent=e.message}};
$("logout").onclick=()=>{localStorage.removeItem("adminToken");location.reload()};
$("generate").onclick=async()=>{try{const d=await api("/api/admin/keys",{method:"POST",body:JSON.stringify({durationDays:Number($("days").value),maxUsers:Number($("users").value)})});$("newKey").textContent=d.key;navigator.clipboard?.writeText(d.key);load()}catch(e){alert(e.message)}};
$("refresh").onclick=load;
async function load(){try{const rows=await api("/api/admin/keys");$("total").textContent=rows.length;$("active").textContent=rows.filter(x=>x.status==="Active").length;$("rows").innerHTML=rows.map(k=>`<tr><td>${k.key}</td><td>${k.durationDays}d</td><td>${k.usedUsers}/${k.maxUsers}</td><td>${k.status}</td><td>${new Date(k.expiresAt).toLocaleDateString()}</td><td>${k.revoked?"—":`<button class="danger" onclick="revoke('${encodeURIComponent(k.key)}')">Revoke</button>`}</td></tr>`).join("")}catch(e){if(String(e.message).includes("Unauthorized")){localStorage.removeItem("adminToken");location.reload()}else alert(e.message)}}
async function revoke(k){if(!confirm("Revoke this key?"))return;try{await api("/api/admin/keys/"+k+"/revoke",{method:"POST"});load()}catch(e){alert(e.message)}}
if(token)showDash();
