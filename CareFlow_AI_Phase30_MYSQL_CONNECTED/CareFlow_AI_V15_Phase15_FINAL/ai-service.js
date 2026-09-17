/* CareFlow AI — safe clinical decision-support demo service. */
const AIService = {
  analyzeLocally(input) {
    const text = String(input.symptoms || '').toLowerCase();
    const spo2 = Number(input.spo2 || 0), hr = Number(input.hr || 0), temp = Number(input.temp || 0);
    let triage = 'ROUTINE', specialty = 'General Medicine', conditions = [], flags = [], recommendedTests = [];
    const emergencyTerms = ['chest pain','crushing chest','severe breathlessness','one-sided weakness','slurred speech','fainting','unconscious','seizure','severe bleeding','heavy bleeding'];
    if (spo2 > 0 && spo2 < 92) { triage='EMERGENCY'; flags.push(`Low SpO2 recorded: ${spo2}%`); }
    if (hr > 0 && (hr > 130 || hr < 45)) { if (triage !== 'EMERGENCY') triage='URGENT'; flags.push(`Abnormal heart rate recorded: ${hr} bpm`); }
    if (temp >= 39) { if (triage === 'ROUTINE') triage='URGENT'; flags.push(`High temperature recorded: ${temp}°C`); }
    if (emergencyTerms.some(x=>text.includes(x))) triage='EMERGENCY';
    if (text.includes('chest pain') || text.includes('palpitation') || text.includes('heart')) { specialty='Cardiology'; conditions=[{name:'Cardiovascular cause requires assessment',confidence:72,description:'Symptoms may warrant cardiovascular evaluation; several clinical differentials remain possible.'}]; recommendedTests=['12-lead ECG','Troponin when clinically indicated','Blood pressure review']; }
    else if (text.includes('speech') || text.includes('face droop') || text.includes('weakness on one side') || text.includes('seizure')) { specialty='Neurology'; conditions=[{name:'Acute neurological event requires assessment',confidence:78,description:'Focal neurological symptoms should be assessed urgently and in context.'}]; recommendedTests=['Urgent neurological examination','Brain imaging as clinically indicated','Point-of-care glucose']; }
    else if (text.includes('rash') || text.includes('itch') || text.includes('skin')) { specialty='Dermatology'; conditions=[{name:'Dermatologic condition requiring assessment',confidence:74,description:'Skin symptoms fit a dermatology review pathway; morphology and history are important.'}]; }
    else if (text.includes('cough') || text.includes('wheez') || text.includes('breath')) { specialty='Pulmonology'; conditions=[{name:'Respiratory condition requires assessment',confidence:75,description:'Respiratory symptoms may need examination and oxygenation review.'}]; recommendedTests=['Pulse oximetry','Chest imaging if indicated']; }
    else if (text.includes('urination') || text.includes('dysuria') || text.includes('kidney')) { specialty='Urology / Nephrology'; conditions=[{name:'Urinary or renal condition requires assessment',confidence:70,description:'Urinary symptoms may require urinalysis and renal review.'}]; recommendedTests=['Urinalysis','Renal function tests if indicated']; }
    if (input.labs) flags.push('Laboratory/imaging notes supplied for clinician review.');
    const summary = `AI pre-screening identified a ${triage.toLowerCase()} priority case routed toward ${specialty}. The output is a decision-support summary based on the supplied information and should be clinically verified.`;
    const recommendations = triage==='EMERGENCY' ? 'Escalate for immediate in-person clinical assessment; telemedicine may be inappropriate for emergencies.' : 'Review the patient history, examination findings and supplied reports before making any diagnosis or treatment decision.';
    return {triage,specialty,summary,conditions,flags,recommendedTests,recommendations,prescriptionDraft:[]};
  },
  async analyzeWithGemini(apiKey, model, systemPrompt, input) {
    const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const prompt=`Patient symptoms:\n${input.symptoms}\nVitals: BP ${input.bp||'not recorded'}, HR ${input.hr||'not recorded'}, Temp ${input.temp||'not recorded'}, SpO2 ${input.spo2||'not recorded'}\nReports:\n${input.labs||'none'}\nReturn JSON with triage, specialty, summary, conditions[{name,confidence,description}], flags[], recommendedTests[], recommendations, prescriptionDraft:[{item,note}] . PrescriptionDraft must be a clinician-review draft only.`;
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],systemInstruction:{parts:[{text:systemPrompt||'You are clinical decision-support software, not an autonomous prescriber.'}]},generationConfig:{responseMimeType:'application/json'}})});
    if(!res.ok) throw new Error(`AI API error ${res.status}`); const data=await res.json(); const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text; if(!raw) throw new Error('AI returned no content.'); return JSON.parse(raw);
  }
};
