import re
import codecs

path = r'c:\Users\SWARIT ROY\Desktop\leadpe\src\pages\DevDashboard.tsx'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

# Fix exhaustive deps at line ~133
content = re.sub(r'}, \[user\]\);\s*const handleAcceptRequest =', r'// eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user]);\n\n  const handleAcceptRequest =', content)

# Fix exhaustive deps at line ~216
content = re.sub(r'return \(\) => { supabase.removeChannel\(earnSub\); };\n  }, \[user\]\);', r'return () => { supabase.removeChannel(earnSub); };\n  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [user]);', content)

# Fix 'any = {} // eslint-disable-line;'
content = content.replace('const updates: any = {} // eslint-disable-line;', '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n    const updates: any = {};')

# Update active builds selection to include change_requests
selection_old = r'\.select\("\*"\)\s*\.eq\("assigned_coder_id"'
selection_new = r'.select("*, change_requests(*)" as any)\n      .eq("assigned_coder_id"'
content = re.sub(selection_old, selection_new, content)

# Add hasRevisionAlert calculation
calc = '''  const hasRevisionAlert = activeBuilds.some(b => (b as any).change_requests && (b as any).change_requests.some((cr: any) => cr.status === 'pending'));\n'''
if 'hasRevisionAlert' not in content:
    content = content.replace('const eligiblePayout =', calc + '\n  const eligiblePayout =')

# Update active builds card to render revision requests
card_old = r'<span className="text-xs font-semibold px-2 py-1 rounded bg-green-50 text-\[#00C853\] border border-green-200">\s*ACCEPTED ✓\s*</span>\s*</div>'
card_new = '''<span className="text-xs font-semibold px-2 py-1 rounded bg-green-50 text-[#00C853] border border-green-200">
                            ACCEPTED ✓
                          </span>
                        </div>
                        
                        {(request as any).change_requests && (request as any).change_requests.filter((cr: any) => cr.status === 'pending').map((cr: any) => (
                           <div key={cr.id} style={{ backgroundColor: "#FEF2F2", color: "#EF4444", padding: "12px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #FECACA" }}>
                              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🚨 Client ne changes manga hai</div>
                              <div style={{ fontSize: 13, color: "#991B1B" }}>"{cr.revision_text}"</div>
                           </div>
                        ))}'''
if 'Client ne changes manga hai' not in content:
    content = re.sub(card_old, card_new, content)

# Update navigation icon for Builds to have red badge
icon_old = r'<Icon size=\{22\} color=\{isActive \? "#00C853" : "#999999"\} strokeWidth=\{isActive \? 2\.5 : 2\} />'
icon_new = '''<div className="relative">
                  <Icon size={22} color={isActive ? "#00C853" : "#999999"} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.id === "builds" && hasRevisionAlert && (
                     <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>'''
if 'hasRevisionAlert &&' not in content:
    content = re.sub(icon_old, icon_new, content)

with codecs.open(path, 'w', 'utf-8') as f:
    f.write(content)
