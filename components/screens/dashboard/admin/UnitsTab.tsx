"use client";

import { useState } from "react";
import { useAuth } from "@/context/authProvider/provider";
import { dbCreateUnit, dbCreateRoom, dbRenameUnit, dbDeleteUnit, dbRenameRoom, dbDeleteRoom, isDbProject } from "@/services/project.service";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Project } from "../admin";

interface UnitsTabProps {
  project: Project;
  onUnitAdded: (projectId: string, unitName: string) => void;
  onUnitRenamed: (projectId: string, oldName: string, newName: string) => void;
  onUnitDeleted: (projectId: string, unitName: string) => void;
  onRoomAdded: (projectId: string, unitName: string, roomName: string) => void;
  onRoomRenamed: (projectId: string, unitName: string, oldName: string, newName: string) => void;
  onRoomDeleted: (projectId: string, unitName: string, roomName: string) => void;
}

export default function UnitsTab({ project, onUnitAdded, onUnitRenamed, onUnitDeleted, onRoomAdded, onRoomRenamed, onRoomDeleted }: UnitsTabProps) {
  const { session } = useAuth();

  const [collapsedUnits, setCollapsedUnits] = useState<Set<string>>(new Set());

  const [editUnitTarget, setEditUnitTarget] = useState<string | null>(null);
  const [editUnitValue, setEditUnitValue] = useState("");
  const [savingUnit, setSavingUnit] = useState(false);

  const [deleteUnitTarget, setDeleteUnitTarget] = useState<string | null>(null);
  const [deletingUnit, setDeletingUnit] = useState(false);

  const [editRoomTarget, setEditRoomTarget] = useState<{ unit: string; room: string } | null>(null);
  const [editRoomValue, setEditRoomValue] = useState("");
  const [savingRoom, setSavingRoom] = useState(false);

  const [deleteRoomTarget, setDeleteRoomTarget] = useState<{ unit: string; room: string } | null>(null);
  const [deletingRoom, setDeletingRoom] = useState(false);

  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addUnitName, setAddUnitName] = useState("");
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [unitError, setUnitError] = useState("");

  const [roomInputs, setRoomInputs] = useState<Record<string, string>>({});
  const [addingRoom, setAddingRoom] = useState<Record<string, boolean>>({});

  async function handleRenameUnit() {
    if (!editUnitTarget || !editUnitValue.trim()) return;
    const newName = editUnitValue.trim();
    if (newName === editUnitTarget) { setEditUnitTarget(null); return; }
    setSavingUnit(true);
    try {
      if (isDbProject(project.id)) {
        const result = await dbRenameUnit(project.id, editUnitTarget, newName);
        if (result.error) return;
      }
      onUnitRenamed(project.id, editUnitTarget, newName);
      setEditUnitTarget(null);
    } finally {
      setSavingUnit(false);
    }
  }

  async function handleDeleteUnit() {
    if (!deleteUnitTarget) return;
    setDeletingUnit(true);
    try {
      if (isDbProject(project.id)) {
        const result = await dbDeleteUnit(project.id, deleteUnitTarget);
        if (result.error) return;
      }
      onUnitDeleted(project.id, deleteUnitTarget);
    } finally {
      setDeletingUnit(false);
      setDeleteUnitTarget(null);
    }
  }

  async function handleRenameRoom() {
    if (!editRoomTarget || !editRoomValue.trim()) return;
    const newName = editRoomValue.trim();
    if (newName === editRoomTarget.room) { setEditRoomTarget(null); return; }
    setSavingRoom(true);
    try {
      if (isDbProject(project.id)) {
        const result = await dbRenameRoom(project.id, editRoomTarget.unit, editRoomTarget.room, newName);
        if (result.error) return;
      }
      onRoomRenamed(project.id, editRoomTarget.unit, editRoomTarget.room, newName);
      setEditRoomTarget(null);
    } finally {
      setSavingRoom(false);
    }
  }

  async function handleDeleteRoom() {
    if (!deleteRoomTarget) return;
    setDeletingRoom(true);
    try {
      if (isDbProject(project.id)) {
        const result = await dbDeleteRoom(project.id, deleteRoomTarget.unit, deleteRoomTarget.room);
        if (result.error) return;
      }
      onRoomDeleted(project.id, deleteRoomTarget.unit, deleteRoomTarget.room);
    } finally {
      setDeletingRoom(false);
      setDeleteRoomTarget(null);
    }
  }

  async function handleAddUnit() {
    if (!addUnitName.trim()) return;
    setIsAddingUnit(true);
    setUnitError("");
    try {
      if (isDbProject(project.id)) {
        const result = await dbCreateUnit(project.id, addUnitName.trim());
        if (result.error) { setUnitError(result.error); return; }
      }
      onUnitAdded(project.id, addUnitName.trim());
      setShowAddUnit(false);
      setAddUnitName("");
    } catch (err: any) {
      setUnitError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsAddingUnit(false);
    }
  }

  async function handleAddRoom(unitName: string) {
    const name = (roomInputs[unitName] || "").trim();
    if (!name) return;
    setAddingRoom((prev) => ({ ...prev, [unitName]: true }));
    try {
      if (isDbProject(project.id)) {
        const result = await dbCreateRoom(project.id, unitName, name);
        if (result.error) {
          console.error("dbCreateRoom error:", result.error);
          return;
        }
      }
      onRoomAdded(project.id, unitName, name);
      setRoomInputs((prev) => ({ ...prev, [unitName]: "" }));
    } catch (err: any) {
      console.error("handleAddRoom exception:", err);
    } finally {
      setAddingRoom((prev) => ({ ...prev, [unitName]: false }));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
        <div>
          <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Units & Rooms</div>
          <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Add, rename or remove units and rooms for this project only</div>
        </div>
        <button
          onClick={() => { setAddUnitName(""); setUnitError(""); setShowAddUnit(true); }}
          className="bg-[#E8601C] text-white border-none rounded-lg px-4 py-2 text-[0.78rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12]"
        >
          + Add Unit
        </button>
      </div>

      {Object.keys(project.units).length === 0 && (
        <div className="px-5 py-10 text-center text-[0.82rem] text-[#9C8E86]">No units yet. Click <strong>+ Add Unit</strong> to get started.</div>
      )}

      <div className="divide-y divide-[#E2DAD1]">
        {Object.entries(project.units).map(([unit, rooms]) => {
          const isCollapsed = collapsedUnits.has(unit);
          const isEditingUnit = editUnitTarget === unit;

          return (
            <div key={unit}>
              <div className="flex items-center gap-3 px-5 py-3.5 bg-[#F7F5F2]">
                <button
                  onClick={() => setCollapsedUnits((prev) => {
                    const next = new Set(prev);
                    next.has(unit) ? next.delete(unit) : next.add(unit);
                    return next;
                  })}
                  className="w-6 h-6 rounded-[5px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center text-[0.65rem] transition-all hover:border-[#E8601C] hover:text-[#E8601C] flex-shrink-0 cursor-pointer"
                >
                  {isCollapsed ? "▶" : "▼"}
                </button>

                {isEditingUnit ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input autoFocus value={editUnitValue} onChange={(e) => setEditUnitValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRenameUnit(); if (e.key === "Escape") setEditUnitTarget(null); }} className="flex-1 px-3 py-1.5 text-[0.84rem] font-semibold bg-white border-[1.5px] border-[#E8601C] rounded-lg text-[#2C2420] outline-none" />
                    <button onClick={handleRenameUnit} disabled={savingUnit || !editUnitValue.trim()} className="px-3 py-1.5 text-[0.75rem] font-semibold text-white bg-[#E8601C] rounded-lg hover:bg-[#C04E12] disabled:opacity-50 cursor-pointer transition-all">{savingUnit ? "…" : "Save"}</button>
                    <button onClick={() => setEditUnitTarget(null)} className="px-3 py-1.5 text-[0.75rem] font-semibold text-[#9C8E86] bg-white border border-[#E2DAD1] rounded-lg hover:border-[#9C8E86] cursor-pointer transition-all">Cancel</button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <span className="font-semibold text-[0.9rem] text-[#2C2420] truncate">{unit}</span>
                    <span className="bg-[#FDE8DC] text-[#C04E12] text-[0.65rem] font-bold px-2 py-0.5 rounded-full flex-shrink-0">{rooms.length} rooms</span>
                  </div>
                )}

                {!isEditingUnit && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => { setEditUnitTarget(unit); setEditUnitValue(unit); }} title="Rename unit" className="w-7 h-7 rounded-[6px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.75rem] transition-all hover:border-[#E8601C] hover:bg-[#FEF4EF] hover:text-[#E8601C]">✎</button>
                    <button onClick={() => setDeleteUnitTarget(unit)} title="Delete unit" className="w-7 h-7 rounded-[6px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.8rem] transition-all hover:border-[#C0392B] hover:bg-[#FFF5F5] hover:text-[#C0392B]">🗑</button>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <>
                  <div className="px-5 py-1">
                    {rooms.length === 0 && <p className="py-3 text-[0.78rem] text-[#9C8E86] text-center">No rooms yet — add one below.</p>}
                    {rooms.map((room) => {
                      const isEditingRoom = editRoomTarget?.unit === unit && editRoomTarget?.room === room;
                      return (
                        <div key={room} className="flex items-center gap-2 py-2 px-2 rounded-[6px] transition-all hover:bg-[#FEF4EF] group">
                          <span className="text-[0.75rem] text-[#C8BDB7] flex-shrink-0">⠿</span>
                          {isEditingRoom ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input autoFocus value={editRoomValue} onChange={(e) => setEditRoomValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRenameRoom(); if (e.key === "Escape") setEditRoomTarget(null); }} className="flex-1 px-2.5 py-1 text-[0.8rem] bg-white border-[1.5px] border-[#E8601C] rounded-lg text-[#2C2420] outline-none" />
                              <button onClick={handleRenameRoom} disabled={savingRoom || !editRoomValue.trim()} className="px-2.5 py-1 text-[0.72rem] font-semibold text-white bg-[#E8601C] rounded-lg hover:bg-[#C04E12] disabled:opacity-50 cursor-pointer transition-all">{savingRoom ? "…" : "Save"}</button>
                              <button onClick={() => setEditRoomTarget(null)} className="px-2.5 py-1 text-[0.72rem] font-semibold text-[#9C8E86] bg-white border border-[#E2DAD1] rounded-lg hover:border-[#9C8E86] cursor-pointer transition-all">Cancel</button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-[0.82rem] text-[#5C4F48]">{room}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditRoomTarget({ unit, room }); setEditRoomValue(room); }} title="Rename room" className="w-6 h-6 rounded-[4px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.7rem] transition-all hover:border-[#E8601C] hover:bg-[#FEF4EF] hover:text-[#E8601C]">✎</button>
                                <button onClick={() => setDeleteRoomTarget({ unit, room })} title="Delete room" className="w-6 h-6 rounded-[4px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.75rem] transition-all hover:border-[#C0392B] hover:bg-[#FFF5F5] hover:text-[#C0392B]">🗑</button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 px-5 py-3 border-t border-[#E2DAD1] bg-[#FDFCFB]">
                    <input placeholder="Add new room…" value={roomInputs[unit] || ""} onChange={(e) => setRoomInputs((prev) => ({ ...prev, [unit]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleAddRoom(unit); }} className="flex-1 px-3 py-2 text-[0.8rem] bg-white border-[1.5px] border-[#E2DAD1] rounded-lg outline-none focus:border-[#E8601C] text-[#2C2420]" />
                    <button onClick={() => handleAddRoom(unit)} disabled={addingRoom[unit] || !(roomInputs[unit] || "").trim()} className="bg-[#E8601C] text-white border-none rounded-lg px-3 py-2 text-[0.78rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12] disabled:opacity-50 disabled:cursor-not-allowed">{addingRoom[unit] ? "…" : "+ Add"}</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── ADD UNIT MODAL ── */}
      {showAddUnit && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={() => setShowAddUnit(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
          <div className="relative bg-white rounded-2xl shadow-[0_32px_80px_rgba(44,36,32,0.28)] w-full max-w-[440px] overflow-hidden border border-[#E2DAD1]" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-[#E8601C] to-[#F4895A]" />
            <div className="px-7 pt-6 pb-2 flex items-start justify-between">
              <div>
                <h2 className="font-serif text-[1.5rem] font-semibold text-[#2C2420] leading-tight">Add New Unit</h2>
                <p className="text-[0.75rem] text-[#9C8E86] mt-1">Adding to <span className="font-medium text-[#5C4F48]">{project.name}</span></p>
              </div>
              <button onClick={() => setShowAddUnit(false)} className="w-8 h-8 rounded-full text-[#9C8E86] flex items-center justify-center hover:bg-[#F7F5F2] transition-all text-[1rem] cursor-pointer mt-1">✕</button>
            </div>
            <div className="px-7 py-5 space-y-5">
              <div>
                <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Unit Name <span className="text-[#E8601C]">*</span></label>
                <input autoFocus value={addUnitName} onChange={(e) => setAddUnitName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddUnit(); }} placeholder="e.g. Unit 1, Ground Floor, Master Suite" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
              </div>
              <div className="flex gap-3 bg-[#FEF4EF] border-l-[3px] border-[#E8601C] rounded-r-xl px-4 py-3">
                <span className="text-[1rem] flex-shrink-0 mt-0.5">💡</span>
                <p className="text-[0.78rem] text-[#6B5A52] leading-relaxed">Units represent floors, blocks, or distinct areas. You can add rooms to each unit after creating it.</p>
              </div>
              {unitError && <div className="text-[0.75rem] text-[#C0392B] bg-[#FFF5F5] border border-[#EDB9B9] rounded-lg px-3 py-2">{unitError}</div>}
            </div>
            <div className="px-7 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowAddUnit(false)} className="px-5 py-2.5 text-[0.84rem] font-semibold text-[#6B5A52] bg-white border-[1.5px] border-[#E2DAD1] rounded-xl hover:border-[#9C8E86] transition-all cursor-pointer">Cancel</button>
              <button onClick={handleAddUnit} disabled={isAddingUnit || !addUnitName.trim()} className="px-7 py-2.5 text-[0.84rem] font-semibold text-white bg-[#E8601C] rounded-xl hover:bg-[#C04E12] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(232,96,28,0.3)]">
                {isAddingUnit ? "Adding…" : "Add Unit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE UNIT CONFIRMATION ── */}
      <ConfirmDialog open={deleteUnitTarget !== null} variant="danger" title="Delete Unit" message={deleteUnitTarget ? `Delete "${deleteUnitTarget}" and all its rooms? This cannot be undone.` : ""} confirmLabel="Delete Unit" loading={deletingUnit} onConfirm={handleDeleteUnit} onCancel={() => setDeleteUnitTarget(null)} />

      {/* ── DELETE ROOM CONFIRMATION ── */}
      <ConfirmDialog open={deleteRoomTarget !== null} variant="danger" title="Delete Room" message={deleteRoomTarget ? `Delete "${deleteRoomTarget.room}" from ${deleteRoomTarget.unit}? This cannot be undone.` : ""} confirmLabel="Delete Room" loading={deletingRoom} onConfirm={handleDeleteRoom} onCancel={() => setDeleteRoomTarget(null)} />
    </div>
  );
}
