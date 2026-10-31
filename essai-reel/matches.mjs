const qs=[["Bonjour, comment vas-tu ?","fr|es"],["J'ai besoin d'un médecin","fr|ar"],["Bonjour, comment vas-tu ?","fr|es&mt=1"],["J'ai besoin d'un médecin","fr|ar&mt=1"]];
for (const [q,p] of qs){const d=await (await fetch("https://api.mymemory.translated.net/get?q="+encodeURIComponent(q)+"&langpair="+p)).json();
console.log("=== "+q+" "+p+" rd="+JSON.stringify(d.responseData));
for(const m of d.matches||[]) console.log("  ",m.match,m["created-by"],m.quality,m.reference,"|",m.segment,"→",m.translation);}
