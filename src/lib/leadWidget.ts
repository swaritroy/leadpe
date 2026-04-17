export function generateLeadWidgetCode(businessData: {
  id: string;
  name: string;
  whatsapp: string;
  category?: string;
  website?: string;
}): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const category = businessData.category || 'general';
  const website = businessData.website || '';

  return `<!-- LeadPe Conversion Suite v2 -->
<div id="leadpe-suite" style="font-family:sans-serif">
  <!-- ============ MODULE 1: CONTACT CARD + LEAD FORM ============ -->
  <div id="lp-card" style="background:#fff;border:2px solid #00C853;border-radius:16px;padding:24px;max-width:420px;margin:20px auto;box-shadow:0 4px 20px rgba(0,200,83,0.15)">
    <h3 style="color:#1A1A1A;margin:0 0 6px;font-size:20px">Get Free Consultation 📞</h3>
    <p style="color:#666;margin:0 0 16px;font-size:14px">Save our contact + we'll call you back!</p>
    <input id="lp-name" type="text" placeholder="Your Name" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:10px;box-sizing:border-box;outline:none"/>
    <input id="lp-phone" type="tel" placeholder="WhatsApp Number (10 digits)" maxlength="10" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:10px;box-sizing:border-box;outline:none"/>
    <input id="lp-interest" type="text" placeholder="What are you looking for?" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:14px;box-sizing:border-box;outline:none"/>
    <button id="lp-submit" onclick="lpSubmitLead()" style="width:100%;background:#00C853;color:white;border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:bold;cursor:pointer;margin-bottom:8px">Get Callback 📲</button>
    <button id="lp-vcf" onclick="lpDownloadVCF()" disabled style="width:100%;background:#E0E0E0;color:#999;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:600;cursor:not-allowed">📇 Save Contact Card (Enter phone first)</button>
    <p style="text-align:center;margin:12px 0 0;font-size:11px;color:#999">Built with LeadPe 🌱 — <a href="https://leadpe.tech" target="_blank" style="color:#00C853;text-decoration:none;font-weight:600">leadpe.tech</a></p>
  </div>

  <!-- ============ MODULE 3: SMART QUOTE CALCULATOR ============ -->
  <div id="lp-calc" style="background:#fff;border:2px solid #00C853;border-radius:16px;padding:24px;max-width:420px;margin:20px auto;box-shadow:0 4px 20px rgba(0,200,83,0.15)">
    <h3 style="color:#1A1A1A;margin:0 0 6px;font-size:20px">💰 Get Instant Quote</h3>
    <p style="color:#666;margin:0 0 16px;font-size:14px" id="lp-calc-sub">Get an exclusive 10% discount code!</p>
    <label style="display:block;color:#333;font-size:14px;margin-bottom:6px" id="lp-calc-label">Select Range</label>
    <select id="lp-calc-range" onchange="lpCalcEstimate()" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:14px;box-sizing:border-box;outline:none;background:#fff">
      <option value="">-- Choose --</option>
    </select>
    <div style="background:#F0FFF4;border-radius:10px;padding:16px;text-align:center;margin-bottom:14px">
      <p style="margin:0;color:#666;font-size:13px">Your Estimated Quote</p>
      <p id="lp-calc-result" style="margin:6px 0 0;color:#00C853;font-size:28px;font-weight:bold;filter:blur(8px)">₹ —</p>
    </div>
    <input id="lp-calc-phone" type="tel" placeholder="Enter mobile to unlock 🔓" maxlength="10" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:10px;box-sizing:border-box;outline:none"/>
    <button onclick="lpUnlockQuote()" style="width:100%;background:#00C853;color:white;border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:bold;cursor:pointer">Reveal Quote + 10% Off 🎁</button>
  </div>
</div>

<!-- ============ MODULE 2: WHATSAPP INTENT ROUTER ============ -->
<div id="lp-wa-bubble" onclick="lpOpenIntent()" style="position:fixed;bottom:24px;right:24px;width:60px;height:60px;background:#25D366;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:9998;font-size:30px">💬</div>
<div id="lp-wa-menu" style="display:none;position:fixed;bottom:96px;right:24px;background:#fff;border-radius:16px;padding:18px;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;width:280px;font-family:sans-serif">
  <p style="margin:0 0 12px;color:#1A1A1A;font-weight:600;font-size:15px">I want to:</p>
  <button onclick="lpPickIntent('Book Appointment')" style="width:100%;background:#F5FFF7;border:1px solid #00C853;color:#1A1A1A;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;font-size:14px;font-weight:500">📅 Book Appointment</button>
  <button onclick="lpPickIntent('Check Pricing')" style="width:100%;background:#F5FFF7;border:1px solid #00C853;color:#1A1A1A;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;font-size:14px;font-weight:500">💵 Check Pricing</button>
  <button onclick="lpPickIntent('Talk to Expert')" style="width:100%;background:#F5FFF7;border:1px solid #00C853;color:#1A1A1A;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;font-size:14px;font-weight:500">🎯 Talk to Expert</button>
  <div id="lp-wa-name-box" style="display:none;margin-top:8px">
    <input id="lp-wa-name" type="text" placeholder="Your Name" style="width:100%;padding:10px 14px;border:1px solid #E0E0E0;border-radius:10px;font-size:14px;margin-bottom:8px;box-sizing:border-box;outline:none"/>
    <button onclick="lpSendWA()" style="width:100%;background:#25D366;color:white;border:none;border-radius:10px;padding:12px;cursor:pointer;font-weight:bold">Continue to WhatsApp →</button>
  </div>
</div>

<!-- ============ MODULE 4: SOCIAL PROOF TOAST ============ -->
<div id="lp-toast" style="position:fixed;bottom:24px;left:24px;background:#fff;border-radius:12px;padding:12px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:9997;display:none;max-width:280px;font-family:sans-serif;font-size:13px;border-left:4px solid #00C853"></div>

<script>
(function(){
  var BIZ_ID='${businessData.id}';
  var BIZ_NAME=${JSON.stringify(businessData.name)};
  var BIZ_PHONE='${businessData.whatsapp}';
  var BIZ_WEB=${JSON.stringify(website)};
  var CAT='${category}'.toLowerCase();
  var SB_URL='${supabaseUrl}';
  var SB_KEY='${supabaseKey}';
  var selectedIntent='';

  // Calculator config by category
  var CALC={
    ca:{label:'Monthly Income',opts:[['Under 50K',5000],['50K-2L',15000],['2L-10L',35000],['10L+',75000]]},
    real_estate:{label:'Property Size (sqft)',opts:[['Under 500',2500000],['500-1000',5000000],['1000-2000',9000000],['2000+',15000000]]},
    coaching:{label:'Course Type',opts:[['Group',8000],['1-on-1',25000],['Premium',50000],['Corporate',100000]]},
    general:{label:'Service Budget',opts:[['Basic',5000],['Standard',15000],['Premium',35000],['Enterprise',75000]]}
  };

  function getCalc(){return CALC[CAT]||CALC.general;}

  // Init calculator
  var c=getCalc();
  document.getElementById('lp-calc-label').textContent=c.label;
  var sel=document.getElementById('lp-calc-range');
  c.opts.forEach(function(o){
    var op=document.createElement('option');op.value=o[1];op.textContent=o[0];sel.appendChild(op);
  });

  // Phone field gates VCF button
  var phoneInput=document.getElementById('lp-phone');
  var vcfBtn=document.getElementById('lp-vcf');
  phoneInput.addEventListener('input',function(){
    var v=phoneInput.value.replace(/\\D/g,'');
    if(v.length===10){
      vcfBtn.disabled=false;
      vcfBtn.style.background='#00C853';vcfBtn.style.color='#fff';vcfBtn.style.cursor='pointer';
      vcfBtn.textContent='📇 Save Contact Card';
    }else{
      vcfBtn.disabled=true;
      vcfBtn.style.background='#E0E0E0';vcfBtn.style.color='#999';vcfBtn.style.cursor='not-allowed';
      vcfBtn.textContent='📇 Save Contact Card (Enter phone first)';
    }
  });

  async function postLead(payload){
    return fetch(SB_URL+'/rest/v1/leads',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Prefer':'return=minimal'},
      body:JSON.stringify(Object.assign({business_id:BIZ_ID,status:'new',source:'website'},payload))
    });
  }

  function genVCF(){
    var v='BEGIN:VCARD\\nVERSION:3.0\\nFN:'+BIZ_NAME+'\\nORG:'+BIZ_NAME+'\\nTEL;TYPE=CELL:+91'+BIZ_PHONE+'\\n';
    if(BIZ_WEB)v+='URL:'+BIZ_WEB+'\\n';
    v+='END:VCARD';
    return new Blob([v],{type:'text/vcard'});
  }

  window.lpSubmitLead=async function(){
    var n=document.getElementById('lp-name').value.trim();
    var p=document.getElementById('lp-phone').value.replace(/\\D/g,'');
    var i=document.getElementById('lp-interest').value.trim();
    if(!n||!p){alert('Please fill name and phone');return}
    if(p.length!==10){alert('Enter valid 10 digit number');return}
    var btn=document.getElementById('lp-submit');
    btn.textContent='Sending...';btn.disabled=true;
    try{
      var res=await postLead({customer_name:n,phone:p,message:i});
      if(res.ok){
        var card=document.getElementById('lp-card');
        while(card.firstChild)card.removeChild(card.firstChild);
        var d=document.createElement('div');
        d.style.cssText='text-align:center;padding:40px 20px';
        var e1=document.createElement('div');e1.style.fontSize='48px';e1.textContent='✅';d.appendChild(e1);
        var e2=document.createElement('h3');e2.style.color='#1A1A1A';e2.textContent='Request Received!';d.appendChild(e2);
        var e3=document.createElement('p');e3.style.color='#666';e3.textContent='We will call you back within 2 hours.';d.appendChild(e3);
        card.appendChild(d);
      }else{btn.textContent='Get Callback 📲';btn.disabled=false;alert('Error. Please try again.')}
    }catch(e){btn.textContent='Get Callback 📲';btn.disabled=false;alert('Error. Please try again.')}
  };

  window.lpDownloadVCF=async function(){
    var n=document.getElementById('lp-name').value.trim()||'Visitor';
    var p=document.getElementById('lp-phone').value.replace(/\\D/g,'');
    if(p.length!==10){alert('Enter valid 10 digit number');return}
    try{await postLead({customer_name:n,phone:p,message:'Downloaded VCF',source:'vcf_download'});}catch(e){}
    var blob=genVCF();
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download=BIZ_NAME.replace(/[^a-z0-9]/gi,'_')+'.vcf';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  window.lpCalcEstimate=function(){
    var v=parseFloat(document.getElementById('lp-calc-range').value);
    if(!v)return;
    var est=Math.round(v*0.05);
    document.getElementById('lp-calc-result').textContent='₹ '+est.toLocaleString('en-IN');
  };

  window.lpUnlockQuote=async function(){
    var p=document.getElementById('lp-calc-phone').value.replace(/\\D/g,'');
    var v=document.getElementById('lp-calc-range').value;
    if(!v){alert('Select a range first');return}
    if(p.length!==10){alert('Enter valid 10 digit number');return}
    var est=document.getElementById('lp-calc-result').textContent;
    try{await postLead({customer_name:'Calculator Lead',phone:p,message:'Quote: '+est,source:'calculator_lead'});}catch(e){}
    document.getElementById('lp-calc-result').style.filter='none';
    document.getElementById('lp-calc-sub').innerHTML='🎉 Your discount code: <b style="color:#00C853">LEADPE10</b>';
  };

  window.lpOpenIntent=function(){
    var m=document.getElementById('lp-wa-menu');
    m.style.display=m.style.display==='none'?'block':'none';
  };

  window.lpPickIntent=function(intent){
    selectedIntent=intent;
    document.getElementById('lp-wa-name-box').style.display='block';
  };

  window.lpSendWA=async function(){
    var n=document.getElementById('lp-wa-name').value.trim();
    if(!n){alert('Enter your name');return}
    try{await postLead({customer_name:n,message:'Intent: '+selectedIntent,source:'whatsapp_intent'});}catch(e){}
    var msg='Hi '+BIZ_NAME+", I'm "+n+". I'm interested in "+selectedIntent+' via LeadPe.';
    window.open('https://wa.me/91'+BIZ_PHONE+'?text='+encodeURIComponent(msg),'_blank');
    document.getElementById('lp-wa-menu').style.display='none';
    document.getElementById('lp-wa-name-box').style.display='none';
    document.getElementById('lp-wa-name').value='';
  };

  // Module 4: Social proof toasts
  var toastEl=document.getElementById('lp-toast');
  var recentLeads=[];
  async function fetchRecent(){
    try{
      var r=await fetch(SB_URL+'/rest/v1/leads?business_id=eq.'+BIZ_ID+'&select=customer_name,source,created_at&order=created_at.desc&limit=5',{
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
      });
      if(r.ok)recentLeads=await r.json();
    }catch(e){}
  }
  function showToast(){
    if(!recentLeads.length)return;
    var l=recentLeads[Math.floor(Math.random()*recentLeads.length)];
    var act=l.source==='vcf_download'?'saved contact':l.source==='calculator_lead'?'got a quote':l.source==='whatsapp_intent'?'messaged on WhatsApp':'enquired';
    toastEl.textContent='🔥 '+(l.customer_name||'Someone')+' just '+act+'!';
    toastEl.style.display='block';
    toastEl.style.animation='lpSlideUp 0.4s ease-out';
    setTimeout(function(){toastEl.style.display='none';},4000);
  }
  var styleEl=document.createElement('style');
  styleEl.textContent='@keyframes lpSlideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}';
  document.head.appendChild(styleEl);
  fetchRecent();
  setInterval(function(){fetchRecent();showToast();},15000);
})();
</script>
<!-- End LeadPe Conversion Suite -->`;
}
