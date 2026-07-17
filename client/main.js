async function runAnalysis() {
    const query = document.getElementById('queryInput').value;
    const btn = document.getElementById('submitBtn');
    const wrapper = document.getElementById('resultsWrapper');

    btn.disabled = true;
    btn.innerText = "Processing Data...";

    try {
        const response = await fetch(`https://new-project-60078355625.development.catalystserverless.in/server/detective_bot/?question=${encodeURIComponent(query)}`);
        const result = await response.json();

        document.getElementById('debugZcql').innerText = result.generated_zcql;
        document.getElementById('debugSource').innerText = result.data_source;
        document.getElementById('recordCount').innerText = `${result.data.length} records structuralized`;

        wrapper.innerHTML = '';

        if (result.data && result.data.length > 0) {
            result.data.forEach(item => {
                const record = item.CaseMaster;

                wrapper.innerHTML += `
                    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-4">
                        <div class="flex justify-between items-start gap-4">
                            <div class="space-y-1">
                                <div class="flex items-center space-x-2">
                                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 rounded text-blue-400 tracking-wider uppercase">FIR ID: ${record.CaseMasterID}</span>
                                    <span class="text-[11px] font-mono text-slate-400 font-semibold">${record.CrimeNo}</span>
                                </div>
                                <h4 class="text-sm font-bold text-slate-100 pt-1">${record.CaseNo}</h4>
                            </div>
                            <span class="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full bg-blue-500/10 text-blue-400 border-blue-500/20">
                                ${record.CaseStatusName}
                            </span>
                        </div>
                        
                        <div class="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-xs text-slate-400 leading-relaxed font-sans">
                            <strong class="text-slate-300 block text-[10px] uppercase font-bold tracking-wider mb-1">Brief Facts of Case:</strong>
                            ${record.BriefFacts}
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-[11px] border-t border-slate-800/80">
                            <div>
                                <span class="block text-slate-500 font-medium">Station/Unit</span>
                                <span class="font-semibold text-slate-300">${record.UnitName}</span>
                            </div>
                            <div>
                                <span class="block text-slate-500 font-medium">Crime Head</span>
                                <span class="font-semibold text-amber-400">${record.CrimeHeadName}</span>
                            </div>
                            <div>
                                <span class="block text-slate-500 font-medium">Registered Date</span>
                                <span class="font-semibold text-slate-300">${record.CrimeRegisteredDate}</span>
                            </div>
                            <div>
                                <span class="block text-slate-500 font-medium">Geo Location Coordinates</span>
                                <span class="font-mono text-slate-400">${record.latitude}, ${record.longitude}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            wrapper.innerHTML = `<div class="text-center py-12 text-slate-500 text-xs">No matching structural criminal profiles detected.</div>`;
        }

    } catch (error) {
        console.error(error);
        wrapper.innerHTML = `<div class="text-center py-12 text-red-400 text-xs">System routing fault detected. Check engine logs.</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = "Execute Engine";
    }
}
