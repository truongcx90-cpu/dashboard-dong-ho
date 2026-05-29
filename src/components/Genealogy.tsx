import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, ShieldAlert, User, UserCheck, Award, Heart, Edit3, Plus, ArrowRight, X, Calendar, MapPin, Eye, Database, Copy, Check } from "lucide-react";
import { FamilyMember } from "../types";

interface GenealogyProps {
  members: FamilyMember[];
  onAddMember: (member: FamilyMember) => void;
}

export default function Genealogy({ members, onAddMember }: GenealogyProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Tất cả chi");
  const [selectedGen, setSelectedGen] = useState<number | "Tất cả đời">("Tất cả đời");
  const [activeBioMemberId, setActiveBioMemberId] = useState<string | null>("m1"); // Default to Progenitor
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);

  // Bulk parser spreadsheet states
  const [bulkText, setBulkText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [excelActiveTab, setExcelActiveTab] = useState<"paste" | "script">("paste");

  // Form states
  const [newName, setNewName] = useState("");
  const [newGen, setNewGen] = useState(8);
  const [newBranch, setNewBranch] = useState("Chi Trưởng (Trường Yên)");
  const [newGender, setNewGender] = useState<"Nghị" | "Nữ">("Nghị");
  const [newIsDeceased, setNewIsDeceased] = useState(false);
  const [newBirthYear, setNewBirthYear] = useState("");
  const [newDeathYear, setNewDeathYear] = useState("");
  const [newDeathLunar, setNewDeathLunar] = useState("");
  const [newGrave, setNewGrave] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [newSpouse, setNewSpouse] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newAchievement, setNewAchievement] = useState("");
  const branches = ["Tất cả chi", "Chi Trưởng (Trường Yên)", "Chi Thứ Hai (Yên Khánh)", "Thủy Tổ Gia Tộc"];
  const generations = ["Tất cả đời", 1, 2, 3, 4, 5, 6, 7, 8];

  // Active bio ancestor item
  const bioAncestor = useMemo(() => {
    return members.find(m => m.id === activeBioMemberId) || members[0];
  }, [members, activeBioMemberId]);

  // Handle addition of member
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: FamilyMember = {
      id: "m_custom_" + Date.now(),
      name: newName,
      generation: Number(newGen),
      branch: newBranch,
      gender: newGender,
      isDeceased: newIsDeceased,
      birthYear: newBirthYear || undefined,
      deathYear: newIsDeceased ? (newDeathYear || undefined) : undefined,
      deathAnniversaryLunar: newIsDeceased ? (newDeathLunar || undefined) : undefined,
      graveLocation: newGrave || undefined,
      spouse: newSpouse || undefined,
      parentId: newParentId || undefined,
      bio: newBio || undefined,
      achievements: newAchievement ? [newAchievement] : [],
      children: []
    };

    onAddMember(newMember);
    
    // Auto inspect the newly added member
    setActiveBioMemberId(newMember.id);
    
    // Reset form & Close
    setNewName("");
    setNewBirthYear("");
    setNewDeathYear("");
    setNewDeathLunar("");
    setNewGrave("");
    setNewSpouse("");
    setNewParentId("");
    setNewBio("");
    setNewAchievement("");
    setIsAddOpen(false);
  };

  // Excel parsed copy paste bulk handlers
  const handleParseBulk = () => {
    if (!bulkText.trim()) return;
    try {
      const lines = bulkText.split("\n");
      const parsed: any[] = [];
      
      lines.forEach((line) => {
        if (!line.trim()) return;
        const tokens = line.split("\t");
        
        if (tokens.length >= 2) {
          if (tokens[0].toLowerCase().includes("họ tên") || tokens[0].toLowerCase().includes("name")) {
            return; // skip headers
          }
          const pName = tokens[0].trim();
          const pGen = parseInt(tokens[1]) || 8;
          const pBranch = tokens[2] ? tokens[2].trim() : "Chi Trưởng (Trường Yên)";
          const pGenderStr = tokens[3] ? tokens[3].trim().toLowerCase() : "nam";
          const pIsDecStr = tokens[4] ? tokens[4].trim().toLowerCase() : "không";
          const pBirthY = tokens[5] ? tokens[5].trim() : "";
          const pDeathY = tokens[6] ? tokens[6].trim() : "";
          const pAnniversary = tokens[7] ? tokens[7].trim() : "";
          const pGrave = tokens[8] ? tokens[8].trim() : "";
          
          parsed.push({
            name: pName,
            generation: pGen,
            branch: pBranch,
            gender: (pGenderStr === "nữ" || pGenderStr === "female") ? "Nữ" : "Nghị",
            isDeceased: (pIsDecStr === "có" || pIsDecStr === "đã mất" || pIsDecStr === "yes" || pIsDecStr === "true"),
            birthYear: pBirthY || undefined,
            deathYear: pDeathY || undefined,
            deathAnniversaryLunar: pAnniversary || undefined,
            graveLocation: pGrave || undefined
          });
        }
      });
      
      if (parsed.length === 0) {
        throw new Error("Không phát hiện hàng dữ liệu hợp lệ. Hãy đảm bảo copy dán dòng tab từ excel hoặc google sheets.");
      }
      setParsedPreview(parsed);
      setImportError(null);
    } catch (err: any) {
      setImportError(err.message || "Lỗi kiểm chứng định dạng.");
    }
  };

  const handleCommitBulkImport = () => {
    if (parsedPreview.length === 0) return;
    parsedPreview.forEach((p, idx) => {
      const bMember: FamilyMember = {
        id: "m_bulk_" + Date.now() + "_" + idx,
        name: p.name,
        generation: p.generation,
        branch: p.branch,
        gender: p.gender,
        isDeceased: p.isDeceased,
        birthYear: p.birthYear,
        deathYear: p.deathYear,
        deathAnniversaryLunar: p.deathAnniversaryLunar,
        graveLocation: p.graveLocation,
        achievements: [],
        children: []
      };
      onAddMember(bMember);
    });
    setBulkText("");
    setParsedPreview([]);
    setIsExcelOpen(false);
  };


  // Filter members based on user choice
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (member.bio && member.bio.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchBranch = selectedBranch === "Tất cả chi" || member.branch === selectedBranch;
      const matchGen = selectedGen === "Tất cả đời" || member.generation === Number(selectedGen);

      return matchSearch && matchBranch && matchGen;
    });
  }, [members, searchTerm, selectedBranch, selectedGen]);

  // Parent names resolver helper
  const getParentName = (parentId?: string) => {
    if (!parentId) return null;
    const parent = members.find(m => m.id === parentId);
    return parent ? parent.name : null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* List / Selection filters (8 columns) */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-stone-150 shadow-sm p-4.5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-lg font-serif font-semibold text-stone-850">
              Biên Chép & Tra Cứu Gia Phả Bản Việt
            </h2>
            <p className="text-xs text-stone-500">
              Tổng số nhân đinh lưu trữ: <span className="font-semibold text-stone-800">{members.length} thành viên</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 self-start sm:self-center">
            <button 
              onClick={() => setIsExcelOpen(true)}
              className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer shadow transition-all"
            >
              <Database className="h-3.5 w-3.5" /> Nhập từ Excel / Google Sheets
            </button>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1 bg-red-800 hover:bg-red-950 text-white rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer shadow transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Ghi phả thành viên mới
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Tìm theo quý danh..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 placeholder-stone-400 focus:outline-none focus:border-amber-400 text-stone-800"
            />
          </div>

          {/* Selector branch */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-stone-400"><Filter className="h-3.5 w-3.5" /></span>
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-stone-800 focus:outline-none focus:border-amber-400"
            >
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Selector Generations */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-stone-400"><Eye className="h-3.5 w-3.5" /></span>
            <select 
              value={selectedGen}
              onChange={(e) => setSelectedGen(e.target.value === "Tất cả đời" ? "Tất cả đời" : Number(e.target.value))}
              className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3.5 py-2 text-stone-800 focus:outline-none focus:border-amber-400"
            >
              {generations.map(g => (
                <option key={g} value={g}>{g === "Tất cả đời" ? g : `Thế hệ Gia tộc - Đời ${g}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List Grid sorted grouped by generations */}
        <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-10 bg-stone-50 rounded-lg border border-dashed border-stone-200">
              <ShieldAlert className="h-8 w-8 text-stone-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">Không tìm thấy tộc phả nhân đinh phù hợp</p>
              <p className="text-xs text-stone-400 mt-1">Xin vui lòng kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            // Group by generation
            Array.from(new Set(filteredMembers.map(m => m.generation)))
              .sort((a, b) => (a as number) - (b as number))
              .map(gen => {
                const membersInGen = filteredMembers.filter(m => m.generation === gen);
                return (
                  <div key={gen} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-100 text-amber-900 border border-amber-200 font-serif font-bold text-xs px-2.5 py-1">
                        ĐỜI THỨ {gen}
                      </span>
                      <span className="h-[1px] bg-stone-200 grow" />
                      <span className="text-[10px] text-stone-400 uppercase font-bold select-none">{membersInGen.length} Người</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {membersInGen.map(m => (
                        <div 
                          key={m.id}
                          onClick={() => setActiveBioMemberId(m.id)}
                          className={`flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer transition-all ${
                            m.id === activeBioMemberId 
                              ? "bg-red-50 border-red-300 ring-1 ring-red-300" 
                              : "bg-stone-50 border-stone-150 hover:bg-stone-100/70"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                              m.gender === "Nghị" 
                                ? "bg-red-100 text-red-800"
                                : "bg-teal-100 text-teal-800"
                            }`}>
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                                {m.name}
                                {m.isDeceased && (
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-stone-400" title="Đã tạ thế" />
                                )}
                              </p>
                              <span className="text-[10px] text-stone-500 block truncate max-w-[170px] sm:max-w-xs">{m.branch}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                            {m.birthYear && (
                              <span>{m.birthYear} - {m.isDeceased ? (m.deathYear || "khuyết") : "Nay"}</span>
                            )}
                            <ArrowRight className="h-3 w-3 text-stone-300 shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Profile details / Visual card (4 columns) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Profile Card view */}
        <div className="bg-white rounded-xl border border-stone-150 shadow-sm overflow-hidden relative">
          <div className="h-20 bg-gradient-to-r from-red-900 to-red-950 px-5 flex items-end pb-3 text-white">
            <div>
              <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Đại Tộc Gia Chiêu</span>
              <h3 className="font-serif font-bold text-base text-amber-100 line-clamp-1">{bioAncestor?.name}</h3>
            </div>
          </div>

          <div className="p-5.5 space-y-4.5 text-xs text-stone-700 relative z-10">
            {/* Round Avatar badge */}
            <div className="absolute right-5 top-[-30px] h-14 w-14 rounded-full bg-[#fbfaf6] border-2 border-amber-400 shadow-md flex items-center justify-center text-red-900">
              <span className="font-serif text-lg font-bold">Cao</span>
            </div>

            {/* Quick Metadata */}
            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-100 text-[11px]">
              <div>
                <span className="text-stone-400 block font-medium">Thế hệ triều</span>
                <p className="font-bold text-stone-800">Đời thứ {bioAncestor?.generation}</p>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Quản phận môn</span>
                <p className="font-bold text-stone-800 line-clamp-1">{bioAncestor?.branch}</p>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Giới sắc định</span>
                <p className="font-bold text-stone-800">{bioAncestor?.gender === "Nghị" ? "Nam tử" : "Nữ sinh"}</p>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Trạng sinh tế</span>
                <p className={`font-bold ${bioAncestor?.isDeceased ? "text-stone-500" : "text-emerald-700"}`}>
                  {bioAncestor?.isDeceased ? "Cụ Đã mất" : "Con cháu Đang sống"}
                </p>
              </div>
            </div>

            {/* Biological Timeline text */}
            <div className="space-y-4">
              <div className="space-y-1 bg-amber-500/5 p-3 rounded-md border border-amber-500/10/40">
                <p className="font-semibold text-stone-800 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  Sinh thần & Quy tiên
                </p>
                <div className="pl-4.5 text-stone-600 block leading-relaxed space-y-0.5 text-[11px]">
                  {bioAncestor?.birthYear && <p>Năm sinh dương lịch: <strong className="text-stone-800">{bioAncestor.birthYear}</strong></p>}
                  {bioAncestor?.isDeceased && bioAncestor.deathYear && (
                    <p>Năm tạ thế dương lịch: <strong className="text-stone-800">{bioAncestor.deathYear}</strong></p>
                  )}
                  {bioAncestor?.isDeceased && bioAncestor.deathAnniversaryLunar && (
                    <p>Giỗ Tổ Âm lịch hàng năm: <strong className="text-amber-800 font-extrabold">{bioAncestor.deathAnniversaryLunar}</strong></p>
                  )}
                </div>
              </div>

              {/* Grave Location */}
              {bioAncestor?.isDeceased && bioAncestor.graveLocation && (
                <div className="space-y-1 bg-stone-50 p-2.5 rounded-md border border-stone-150">
                  <p className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                    Bia chí phần mộ tọa lạc
                  </p>
                  <p className="pl-5 text-stone-600 text-[11px] leading-relaxed">{bioAncestor.graveLocation}</p>
                </div>
              )}

              {/* Parents & Spouses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {bioAncestor?.parentId && (
                  <div className="p-2 border border-stone-100 rounded bg-stone-50/50">
                    <span className="text-stone-400 block font-medium">Bố thượng phụ</span>
                    <p className="font-semibold text-stone-700 line-clamp-1">{getParentName(bioAncestor.parentId)}</p>
                  </div>
                )}
                {bioAncestor?.spouse && (
                  <div className="p-2 border border-stone-100 rounded bg-stone-50/50">
                    <span className="text-stone-400 block font-medium">Tộc phối phối thất</span>
                    <p className="font-semibold text-stone-700 line-clamp-1">{bioAncestor.spouse}</p>
                  </div>
                )}
              </div>

              {/* Biography historical narratives */}
              {bioAncestor?.bio && (
                <div className="space-y-1">
                  <span className="text-stone-400 font-medium block">Sự nghiệp, tích trạng & công lao di sản:</span>
                  <p className="text-stone-600 leading-relaxed text-[11px] italic pr-1 bg-stone-50 p-2.5 rounded border border-stone-100">
                    "{bioAncestor.bio}"
                  </p>
                </div>
              )}

              {/* Achievements vinh danh */}
              {bioAncestor?.achievements && bioAncestor.achievements.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-stone-400 font-medium block">Khen thưởng tích lục vinh danh:</span>
                  <div className="flex flex-wrap gap-1">
                    {bioAncestor.achievements.map((ach, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-medium scale-95 origin-left">
                        <Award className="h-3 w-3 shrink-0" /> {ach}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Member Modal Overlay */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-lg w-full border border-stone-200 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-red-950 px-5 py-4 text-white flex items-center justify-between border-b border-amber-900/40">
                <h3 className="font-serif font-bold text-base text-amber-100">
                  Ghi chép Tộc nhân Gia Phả mới
                </h3>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-full hover:bg-white/10 p-1 text-stone-300 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Name & Generation */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Quý danh thành viên (Tên húy/tôn): *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ví dụ: Cao Xuân Hùng" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-800 text-stone-800 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Thế hệ đời: *</label>
                    <select 
                      value={newGen}
                      onChange={(e) => setNewGen(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-800 text-stone-800 text-xs"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>Đời thứ {n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Branch & Gender */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Chi họ sở thuộc: *</label>
                    <select 
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-800 text-stone-800 text-xs"
                    >
                      <option value="Chi Trưởng (Trường Yên)">Chi Trưởng (Trường Yên)</option>
                      <option value="Chi Thứ Hai (Yên Khánh)">Chi Thứ Hai (Yên Khánh)</option>
                      <option value="Chi Thứ Ba (Gia Sinh)">Chi Thứ Ba (Gia Sinh)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Giới tính: *</label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="gender" 
                          checked={newGender === "Nghị"}
                          onChange={() => setNewGender("Nghị")}
                          className="accent-red-800"
                        /> Nam
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="gender" 
                          checked={newGender === "Nữ"}
                          onChange={() => setNewGender("Nữ")}
                          className="accent-red-800"
                        /> Nữ
                      </label>
                    </div>
                  </div>
                </div>

                {/* Parent & Wife */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Bố đẻ (Thừa phụ phụ hệ):</label>
                    <select 
                      value={newParentId}
                      onChange={(e) => setNewParentId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-800 text-stone-800 text-xs"
                    >
                      <option value="">-- Không rõ / Khuyết --</option>
                      {members.filter(m => m.gender === "Nghị").map(m => (
                        <option key={m.id} value={m.id}>{m.name} (Đời {m.generation})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Phối thất (Vợ / Chồng):</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Lê Thị Hiên" 
                      value={newSpouse}
                      onChange={(e) => setNewSpouse(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-800 text-stone-800 text-xs"
                    />
                  </div>
                </div>

                {/* Status Deceased */}
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-150 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
                    <input 
                      type="checkbox" 
                      checked={newIsDeceased}
                      onChange={(e) => setNewIsDeceased(e.target.checked)}
                      className="accent-red-800"
                    /> Thành viên đã tạ thế (Mất hành lễ cúng giỗ)
                  </label>

                  {newIsDeceased && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-stone-600 block">Năm tạ thế (Dương lịch):</label>
                        <input 
                          type="text" 
                          placeholder="Ví dụ: 1985" 
                          value={newDeathYear}
                          onChange={(e) => setNewDeathYear(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded px-2.5 py-1 focus:outline-none focus:border-red-800 text-stone-850"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-stone-600 block">Lễ kỵ ngày ngày (Âm lịch):</label>
                        <input 
                          type="text" 
                          placeholder="Ví dụ: mùng 5 tháng Giêng" 
                          value={newDeathLunar}
                          onChange={(e) => setNewDeathLunar(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded px-2.5 py-1 focus:outline-none focus:border-red-800 text-stone-850"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-stone-600 block">{newIsDeceased ? "Mộ phần đặt tại cát địa:" : "Năm sinh (Dương lịch):"}</label>
                    {newIsDeceased ? (
                      <input 
                        type="text" 
                        placeholder="Nghĩa trang Trường Yên, Hoa Lư" 
                        value={newGrave}
                        onChange={(e) => setNewGrave(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1 focus:outline-none focus:border-red-800 text-stone-850"
                      />
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Ví dụ: 1994" 
                        value={newBirthYear}
                        onChange={(e) => setNewBirthYear(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1 focus:outline-none focus:border-red-800 text-stone-850"
                      />
                    )}
                  </div>
                </div>

                {/* Achievements */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Vinh danh sự nghiệp, học vị (Khuyến học):</label>
                  <input 
                    type="text" 
                    placeholder="Bắc Cực phong tặng Giáo sư Đại học Quốc gia, Thượng Tá..." 
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-800 text-stone-800 text-xs"
                  />
                </div>

                {/* Biography */}
                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Tích trạng & Lược lịch cổ nhân tự truyện:</label>
                  <textarea 
                    rows={3}
                    placeholder="Lược sử cuộc đời, tấm lòng vì dòng họ, gia tông rèn luyện đạo đức..." 
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-red-800 text-stone-800 text-xs resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
                  <button 
                    type="button" 
                    onClick={() => setIsAddOpen(false)}
                    className="bg-stone-100 border border-stone-200 hover:bg-stone-200 rounded-lg px-4 py-2 font-semibold transition-all cursor-pointer text-stone-800"
                  >
                    Hạ sớ Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="bg-red-800 hover:bg-red-950 text-white rounded-lg px-4 py-2 font-semibold transition-all cursor-pointer flex items-center gap-1"
                  >
                    Kính lập Biên phả
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excel / Google Sheets Importer Modal Drawer */}
      <AnimatePresence>
        {isExcelOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full border border-stone-200 flex flex-col max-h-[90vh]"
            >
              <div className="bg-emerald-900 px-5 py-4 text-white flex items-center justify-between border-b border-stone-150">
                <h3 className="font-serif font-bold text-base text-amber-100 flex items-center gap-1.5">
                  <Database className="h-5 w-5" />
                  Đồng Bộ & Nhập Gia Phả Tiên Linh Từ Bảng Tính
                </h3>
                <button 
                  onClick={() => {
                    setIsExcelOpen(false);
                    setBulkText("");
                    setParsedPreview([]);
                    setImportError(null);
                  }}
                  className="rounded-full hover:bg-white/10 p-1 text-stone-200 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Subtabs for xls */}
              <div className="flex bg-stone-100 border-b border-stone-200 text-xs shrink-0 font-bold select-none">
                <button 
                  onClick={() => setExcelActiveTab("paste")}
                  className={`flex-1 py-3 text-center cursor-pointer transition-all ${
                    excelActiveTab === "paste" ? "bg-white border-b-2 border-emerald-700 text-emerald-800" : "text-stone-550 hover:bg-stone-50"
                  }`}
                >
                  Dán Dữ Liệu Từ Excel / Sheet
                </button>
                <button 
                  onClick={() => setExcelActiveTab("script")}
                  className={`flex-1 py-3 text-center cursor-pointer transition-all ${
                    excelActiveTab === "script" ? "bg-white border-b-2 border-emerald-700 text-emerald-800" : "text-stone-550 hover:bg-stone-50"
                  }`}
                >
                  Google Sheets App Script & Google APIs
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs grow">
                
                {excelActiveTab === "paste" && (
                  <div className="space-y-4 text-left">
                    <div>
                      <h4 className="font-bold text-stone-800">1. Định dạng cột chuẩn trên Bảng Tính:</h4>
                      <p className="text-[11px] text-stone-500 leading-normal mt-0.5">
                        Xếp các cột trên Excel / Google Sheet theo thứ tự sau (Không bắt buộc hàng tiêu đề, chỉ cần copy các hàng giá trị):
                      </p>
                      <pre className="bg-stone-100 border border-stone-200 rounded p-2 text-[10px] font-mono text-stone-750 block mt-1 overflow-x-auto whitespace-pre">
                        Họ tên | Đời | Chi phái | Giới tính | Còn sống | Năm sinh | Năm mất | Ngày giỗ | Nơi an táng
                      </pre>
                      <button 
                        type="button"
                        onClick={() => {
                          setBulkText(
                            "Cao Văn Hưng\t5\tChi Trưởng (Trường Yên)\tNam\tĐã mất\t1864\t1938\t12 tháng Giêng\tNghĩa trang Trường Yên\n" +
                            "Cao Thị Huyền\t6\tChi Thứ Hai (Yên Khánh)\tNữ\tCó\t1942\t\t\t\n" +
                            "Cao Tiến Thành\t7\tChi Trưởng (Trường Yên)\tNam\tCó\t1981\t\t\t"
                          );
                        }}
                        className="text-[10px] mt-1.5 font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        [📎 Nhập dán dữ liệu mẫu nhanh để thử nghiệm]
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-stone-700 block">2. Dán các dòng dữ liệu sao chép từ Excel/Google Sheets vào đây:*</label>
                      <textarea 
                        rows={5}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="Hãy copy vùng dữ liệu trên Google Sheets rồi Ctrl+V dán vào đây..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 font-mono text-[11px] focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={handleParseBulk}
                        disabled={!bulkText.trim()}
                        className="bg-emerald-800 hover:bg-emerald-950 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded px-4 py-2 font-bold cursor-pointer transition-all"
                      >
                        Kiểm chứng định dạng nhập liệu
                      </button>
                    </div>

                    {importError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                        {importError}
                      </div>
                    )}

                    {/* Parsed entries visualizer */}
                    {parsedPreview.length > 0 && (
                      <div className="space-y-2 border border-stone-200 rounded-lg p-3 bg-stone-50">
                        <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                          <p className="font-bold text-stone-800">✓ Phát hiện hợp lệ {parsedPreview.length} bản ghi chép:</p>
                        </div>
                        <div className="max-h-36 overflow-y-auto border border-stone-150 rounded bg-white text-[10px]">
                          <table className="w-full text-left">
                            <thead className="bg-stone-100 text-stone-500 border-b border-stone-150">
                              <tr>
                                <th className="p-1.5 font-semibold">Quý danh</th>
                                <th className="p-1.5 font-semibold">Đời</th>
                                <th className="p-1.5 font-semibold">Chi phái</th>
                                <th className="p-1.5 font-semibold">Giới tính</th>
                                <th className="p-1.5 font-semibold">Còn sống</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-700">
                              {parsedPreview.map((p, i) => (
                                <tr key={i} className="hover:bg-stone-50/50">
                                  <td className="p-1.5 font-bold text-stone-850">{p.name}</td>
                                  <td className="p-1.5 font-mono font-bold">{p.generation}</td>
                                  <td className="p-1.5 text-stone-500">{p.branch}</td>
                                  <td className="p-1.5">{p.gender}</td>
                                  <td className="p-1.5">{p.isDeceased ? "Đã mất" : "Còn sống"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="pt-2 text-right">
                          <button 
                            type="button"
                            onClick={handleCommitBulkImport}
                            className="bg-emerald-700 hover:bg-emerald-950 text-white font-black px-4.5 py-2.5 rounded-lg text-xs cursor-pointer shadow-md transition-all"
                          >
                            Đồng bộ và Thêm dâng {parsedPreview.length} tộc nhân vào Gia Phả
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {excelActiveTab === "script" && (
                  <div className="space-y-3 text-left">
                    <div>
                      <h4 className="font-bold text-emerald-900 border-b border-stone-150 pb-1">Đồng Bộ Bằng Google Apps Script</h4>
                      <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                        Bạn có thể kết hợp tự động hóa qua Google Sheets. Tạo một nút bấm trên Google Sheet của bạn, liên kết với Google Apps Script để đẩy dữ liệu thẳng về REST API dòng họ Cao Ninh Bình:
                      </p>
                    </div>

                    <div className="space-y-1.5 relative">
                      <div className="flex justify-between items-center text-stone-400 font-bold uppercase text-[9px]">
                        <span>Mã nguồn Google Apps Script (Javascript):</span>
                      </div>
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[9.5px] block overflow-x-auto select-all max-h-56 leading-relaxed">
{`function syncGenealogyToClanPortal() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var membersList = [];
  
  // Vòng lặp từ hàng 2 bỏ qua tiêu đề
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if(!row[0]) continue;
    membersList.push({
      name: row[0],
      generation: parseInt(row[1]) || 8,
      branch: row[2] || "Chi Trưởng (Trường Yên)",
      gender: row[3] === "Nữ" ? "Nữ" : "Nghị",
      isDeceased: row[4] === "Có" || row[4] === "Đã mất",
      birthYear: row[5] ? String(row[5]) : undefined,
      deathYear: row[6] ? String(row[6]) : undefined,
      deathAnniversaryLunar: row[7] ? String(row[7]) : undefined,
      graveLocation: row[8] ? String(row[8]) : undefined
    });
  }
  
  var url = "https://hocaoninhbinh.vn/api/genealogy/bulk-import";
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ members: membersList })
  };
  UrlFetchApp.fetch(url, options);
  SpreadsheetApp.getUi().alert("Đồng bộ dữ liệu dòng họ Cao Ninh Bình hoàn kỵ cát tường!");
}`}
                      </pre>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-250 select-none text-[10px] text-stone-600 leading-normal">
                      📢 <strong>Khuyên dùng:</strong> Sử dụng phương pháp này giúp các chi phái ở xa tự quản lý bảng tính nhang đèn của chi mình riêng lẻ, khi nào xong chỉ cần click nút đồng bộ để tải nạp dữ liệu lập tức lên hệ thống trung tâm phả đồ.
                    </div>
                  </div>
                )}

              </div>
              
              <div className="px-5 py-3 border-t border-stone-150 bg-stone-50 text-right shrink-0">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsExcelOpen(false);
                    setBulkText("");
                    setParsedPreview([]);
                    setImportError(null);
                  }}
                  className="bg-stone-100 hover:bg-stone-250 border border-stone-200 rounded px-4 py-1.5 transition-all cursor-pointer font-bold select-none text-stone-850"
                >
                  Đóng Hộp thoại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

