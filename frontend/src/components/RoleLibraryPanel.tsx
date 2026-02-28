import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import api from "../lib/api";

export type RoleProfile = {
  id: number;
  title: string;
  level?: string | null;
  department?: string | null;
  location?: string | null;
  employment_type?: string | null;
  jd_text: string;
  jd_source_filename?: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  currentJdText: string;
  onSelectRole: (role: RoleProfile) => void;
  onRolesChanged?: (roles: RoleProfile[]) => void;
};

export default function RoleLibraryPanel({ currentJdText, onSelectRole, onRolesChanged }: Props) {
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [jdText, setJdText] = useState("");

  const sortedRoles = useMemo(
    () => [...roles].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
    [roles]
  );

  const loadRoles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/roles");
      setRoles(data || []);
      onRolesChanged?.(data || []);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load role profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const createRole = async () => {
    if (!title.trim()) {
      setError("Role title is required.");
      return;
    }
    if (!jdText.trim()) {
      setError("JD text is required.");
      return;
    }
    const form = new FormData();
    form.append("title", title.trim());
    form.append("jd_text", jdText.trim());
    if (level.trim()) form.append("level", level.trim());
    if (department.trim()) form.append("department", department.trim());
    if (location.trim()) form.append("location", location.trim());
    if (employmentType.trim()) form.append("employment_type", employmentType.trim());

    try {
      await api.post("/roles", form);
      setOpen(false);
      setTitle("");
      setLevel("");
      setDepartment("");
      setLocation("");
      setEmploymentType("");
      setJdText("");
      setError("");
      await loadRoles();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create role profile.");
    }
  };

  const deleteRole = async (id: number) => {
    try {
      await api.delete(`/roles/${id}`);
      await loadRoles();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete role.");
    }
  };

  return (
    <div className="glass rounded-card p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Role Library</h3>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold"
            onClick={() => {
              setJdText(currentJdText || "");
              setOpen(true);
            }}
          >
            Save current JD as Role Profile
          </button>
          <button
            className="rounded-lg bg-skyline px-3 py-1.5 text-xs font-semibold text-white"
            onClick={() => setOpen(true)}
          >
            New Role Profile
          </button>
        </div>
      </div>

      {error && <p className="mb-3 rounded-lg bg-rose-500/10 p-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading roles...</p>
      ) : sortedRoles.length ? (
        <div className="space-y-2">
          {sortedRoles.map((role) => (
            <motion.div key={role.id} whileHover={{ y: -2 }} className="surface flex items-start justify-between rounded-xl p-3">
              <div>
                <p className="font-semibold">{role.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {role.level || "-"} | {role.department || "-"} | {role.location || "-"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs"
                  onClick={() => onSelectRole(role)}
                >
                  Use JD
                </button>
                <button
                  className="rounded-md border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-700 dark:text-rose-300"
                  onClick={() => deleteRole(role.id)}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No role profiles yet.</p>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="glass w-full max-w-2xl rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="mb-3 text-lg font-bold">Create Role Profile</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input-field" placeholder="Title*" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input className="input-field" placeholder="Level" value={level} onChange={(e) => setLevel(e.target.value)} />
                <input className="input-field" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
                <input className="input-field" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                <input className="input-field md:col-span-2" placeholder="Employment Type" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} />
                <textarea className="input-field md:col-span-2" rows={8} placeholder="Job Description*" value={jdText} onChange={(e) => setJdText(e.target.value)} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button className="rounded-lg bg-skyline px-3 py-2 text-sm font-semibold text-white" onClick={createRole}>
                  Save Role
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
