import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus, Search, LayoutDashboard, Columns3, ChevronLeft, X, Calendar,
  ChevronDown, LogOut, Trash2, Check, AlertTriangle, Clock, User as UserIcon,
  Building2, Flag, Filter, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

/* ============================================================
   GRUPO EXCELLENCE — KANBAN INTERNO
   Protótipo funcional em React com persistência compartilhada
   (window.storage). Ver README para instruções de migração
   para produção (Next.js + Supabase).
   ============================================================ */

const COLORS = {
  black: "#111111",
  black2: "#1A1A1A",
  gold: "#D5A23F",
  goldLight: "#F2C76D",
  goldDark: "#A97720",
  white: "#FFFFFF",
  bgLight: "#F7F7F5",
  gray: "#8C8C8C",
};

const PRIORITIES = [
  { id: "alta", label: "Alta", color: "#C0503A", dot: "#C0503A" },
  { id: "media", label: "Média", color: "#A97720", dot: "#D5A23F" },
  { id: "baixa", label: "Baixa", color: "#6B7A6F", dot: "#8C8C8C" },
];

const STATUSES = [
  { id: "todo", label: "A Fazer" },
  { id: "doing", label: "Em andamento" },
  { id: "done", label: "Concluídas" },
];

const CATEGORIES = [
  "Grupo Excellence", "Excellence Contabilidade", "MS Soluções", "Água Sarah",
  "Aliança", "Veras Vidros", "MC Promotora", "Zetta", "Oriental",
  "Administrativo", "Financeiro", "Marketing", "Outro",
];

const TEAM = [
  { id: "ruy", name: "Ruy", role: "Administrador" },
  { id: "karol", name: "Karol", role: "Colaborador" },
  { id: "bruna", name: "Bruna", role: "Colaborador" },
  { id: "isael", name: "Isael", role: "Colaborador" },
  { id: "nelio", name: "Nélio", role: "Colaborador" },
];

const STORAGE_KEY_TASKS = "excellence-kanban:tasks";
const STORAGE_KEY_SEED = "excellence-kanban:seeded";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysDiff(iso) {
  const d = new Date(iso + "T00:00:00");
  const t = new Date(todayISO() + "T00:00:00");
  return Math.round((t - d) / 86400000);
}

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function seedTasks() {
  const base = todayISO();
  const shift = (n) => {
    const d = new Date(base + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  return [
    { id: uid(), title: "Criar apresentação mensal", description: "Slides com indicadores do mês para reunião de diretoria.", responsible: "ruy", priority: "alta", status: "todo", category: "Marketing", dueDate: shift(5), createdBy: "ruy", createdAt: base, completedAt: null },
    { id: uid(), title: "Conferir folha de pagamento", description: "Revisar horas extras antes do fechamento.", responsible: "karol", priority: "alta", status: "todo", category: "Administrativo", dueDate: shift(-3), createdBy: "ruy", createdAt: base, completedAt: null },
    { id: uid(), title: "Atualizar planilha de clientes", description: "", responsible: "bruna", priority: "media", status: "doing", category: "Excellence Contabilidade", dueDate: shift(2), createdBy: "bruna", createdAt: base, completedAt: null },
    { id: uid(), title: "Enviar relatório financeiro", description: "Relatório trimestral para Oriental.", responsible: "isael", priority: "alta", status: "doing", category: "Oriental", dueDate: shift(-1), createdBy: "ruy", createdAt: base, completedAt: null },
    { id: uid(), title: "Postagens da semana — Água Sarah", description: "Produzir 4 artes para redes sociais.", responsible: "nelio", priority: "baixa", status: "doing", category: "Água Sarah", dueDate: shift(4), createdBy: "nelio", createdAt: base, completedAt: null },
    { id: uid(), title: "Cadastrar novo colaborador", description: "Documentação de admissão completa.", responsible: "karol", priority: "media", status: "done", category: "Administrativo", dueDate: shift(-6), createdBy: "karol", createdAt: shift(-10), completedAt: shift(-5) },
    { id: uid(), title: "Emitir boletos do mês", description: "", responsible: "bruna", priority: "media", status: "done", category: "Financeiro", dueDate: shift(-8), createdBy: "bruna", createdAt: shift(-12), completedAt: shift(-7) },
  ];
}

/* ---------------- Storage hook ---------------- */
function useTasks() {
  const [tasks, setTasksState] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let seeded = null;
        try { seeded = await window.storage.get(STORAGE_KEY_SEED, true); } catch (e) { seeded = null; }
        if (!seeded) {
          const initial = seedTasks();
          await window.storage.set(STORAGE_KEY_TASKS, JSON.stringify(initial), true);
          await window.storage.set(STORAGE_KEY_SEED, "1", true);
          setTasksState(initial);
        } else {
          const res = await window.storage.get(STORAGE_KEY_TASKS, true);
          setTasksState(res ? JSON.parse(res.value) : []);
        }
      } catch (e) {
        setTasksState(seedTasks());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setTasksState(next);
    try { await window.storage.set(STORAGE_KEY_TASKS, JSON.stringify(next), true); } catch (e) { /* best effort */ }
  }, []);

  return { tasks, setTasks: persist, loading };
}

/* ---------------- Small UI atoms ---------------- */

function PriorityTag({ priority, compact }) {
  const p = PRIORITIES.find((x) => x.id === priority) || PRIORITIES[2];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${p.color}1A`, color: p.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.dot }} />
      {compact ? null : `Prioridade ${p.label.toLowerCase()}`}
      {compact ? p.label : null}
    </span>
  );
}

function Avatar({ name, size = 28 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.38,
        backgroundColor: COLORS.black, color: COLORS.gold,
        border: `1px solid ${COLORS.gold}55`,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-[fadein_0.2s_ease]"
      style={{ backgroundColor: COLORS.black, color: COLORS.white, border: `1px solid ${COLORS.gold}` }}
    >
      <Check size={15} style={{ color: COLORS.gold }} />
      {message}
    </div>
  );
}

/* ---------------- Login ---------------- */

function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: COLORS.black }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: COLORS.black2, color: COLORS.gold, border: `1px solid ${COLORS.gold}55` }}
          >
            GE
          </div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: COLORS.white }}>
            Grupo Excellence
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.gray }}>Acesso interno</p>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: COLORS.black2, border: "1px solid #2A2A2A" }}>
          <label className="block text-xs font-medium mb-2" style={{ color: COLORS.gray }}>
            Selecione seu usuário
          </label>
          <div className="space-y-2 mb-5">
            {TEAM.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left"
                style={{
                  backgroundColor: selected === m.id ? `${COLORS.gold}1A` : "transparent",
                  border: `1px solid ${selected === m.id ? COLORS.gold : "#2E2E2E"}`,
                }}
              >
                <Avatar name={m.name} size={30} />
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: COLORS.white }}>{m.name}</div>
                  <div className="text-[11px]" style={{ color: COLORS.gray }}>{m.role}</div>
                </div>
                {selected === m.id && <Check size={16} style={{ color: COLORS.gold }} />}
              </button>
            ))}
          </div>
          <button
            disabled={!selected}
            onClick={() => onLogin(TEAM.find((m) => m.id === selected))}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-40"
            style={{ backgroundColor: COLORS.gold, color: COLORS.black }}
          >
            Entrar
          </button>
          <p className="text-[11px] text-center mt-4" style={{ color: "#5C5C5C" }}>
            Protótipo — autenticação por seleção de usuário.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Task Modal ---------------- */

function TaskModal({ task, currentUser, onSave, onDelete, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState(
    task || {
      title: "", description: "", responsible: currentUser.id, dueDate: "",
      priority: "media", status: "todo", category: CATEGORIES[0],
    }
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
        style={{ backgroundColor: COLORS.white }}
      >
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ backgroundColor: COLORS.white, borderBottom: "1px solid #EEEDE9" }}>
          <h2 className="text-base font-semibold" style={{ color: COLORS.black }}>
            {isEdit ? "Detalhes da tarefa" : "Nova tarefa"}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5">
            <X size={18} style={{ color: COLORS.gray }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.gray }}>Título *</label>
            <input
              ref={titleRef}
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex.: Criar apresentação mensal"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
              onFocus={(e) => (e.target.style.borderColor = COLORS.gold)}
              onBlur={(e) => (e.target.style.borderColor = "#E2E1DC")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.gray }}>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Opcional"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.gray }}>Responsável</label>
              <select
                value={form.responsible}
                onChange={(e) => set("responsible", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none bg-white"
                style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
              >
                {TEAM.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.gray }}>Prazo</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.gray }}>Prioridade</label>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none bg-white"
                style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
              >
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.gray }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none bg-white"
                style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
              >
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.gray }}>Empresa / Categoria</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none bg-white"
              style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {isEdit && (
            <div className="flex gap-4 pt-1 text-[11px]" style={{ color: COLORS.gray }}>
              <span>Criada em: {fmtDate(form.createdAt)}</span>
              {form.completedAt && <span>Concluída em: {fmtDate(form.completedAt)}</span>}
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-3 sticky bottom-0" style={{ backgroundColor: COLORS.white, borderTop: "1px solid #EEEDE9" }}>
          {isEdit ? (
            confirmDelete ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.black }}>
                <span>Excluir esta tarefa?</span>
                <button type="button" onClick={() => onDelete(form.id)} className="font-semibold px-2 py-1 rounded" style={{ color: "#C0503A" }}>Sim</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded" style={{ color: COLORS.gray }}>Não</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg hover:bg-black/5" style={{ color: "#C0503A" }}>
                <Trash2 size={14} /> Excluir
              </button>
            )
          ) : <span />}

          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg font-medium" style={{ color: COLORS.gray }}>
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg font-semibold" style={{ backgroundColor: COLORS.gold, color: COLORS.black }}>
              {isEdit ? "Salvar" : "Criar tarefa"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Task Card ---------------- */

function TaskCard({ task, onOpen, onDragStart, onQuickStatus }) {
  const responsible = TEAM.find((m) => m.id === task.responsible);
  const overdue = task.status !== "done" && task.dueDate && daysDiff(task.dueDate) > 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onOpen(task)}
      className="rounded-xl p-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md active:opacity-80"
      style={{
        backgroundColor: COLORS.white,
        border: `1px solid ${overdue ? "#C0503A44" : "#EAE9E4"}`,
        borderLeft: `3px solid ${PRIORITIES.find((p) => p.id === task.priority)?.dot}`,
        boxShadow: "0 1px 2px rgba(17,17,17,0.04)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold leading-snug" style={{ color: COLORS.black }}>{task.title}</h4>
      </div>
      {task.description && (
        <p className="text-xs mb-2 line-clamp-2" style={{ color: COLORS.gray }}>{task.description}</p>
      )}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: COLORS.bgLight, color: "#5C5C5C" }}>
          {task.category}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar name={responsible?.name || "?"} size={20} />
          <span className="text-[11px] font-medium" style={{ color: "#4A4A4A" }}>{responsible?.name}</span>
        </div>
        <PriorityTag priority={task.priority} compact />
      </div>
      {task.dueDate && (
        <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: overdue ? "#C0503A" : COLORS.gray }}>
          <Calendar size={12} />
          {fmtDate(task.dueDate)}
          {overdue && <span className="font-semibold">· {daysDiff(task.dueDate)}d em atraso</span>}
        </div>
      )}

      {/* Mobile quick status control */}
      <div className="mt-3 flex sm:hidden gap-1" onClick={(e) => e.stopPropagation()}>
        {STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => onQuickStatus(task.id, s.id)}
            className="flex-1 text-[10px] py-1.5 rounded-md font-medium transition"
            style={{
              backgroundColor: task.status === s.id ? COLORS.black : COLORS.bgLight,
              color: task.status === s.id ? COLORS.gold : "#8C8C8C",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Empty state ---------------- */
function EmptyColumn({ onAdd }) {
  return (
    <div className="text-center py-8 px-3 rounded-xl" style={{ border: "1px dashed #DDDCD6" }}>
      <p className="text-xs mb-2" style={{ color: COLORS.gray }}>Nenhuma tarefa por aqui.</p>
      <button onClick={onAdd} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: COLORS.goldDark }}>
        <Plus size={13} /> Adicionar tarefa
      </button>
    </div>
  );
}

/* ---------------- Kanban Column ---------------- */

function Column({ status, tasks, onOpen, onDragStart, onDrop, onQuickStatus, onAdd }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className="flex flex-col rounded-2xl p-3 min-h-[200px]"
      style={{ backgroundColor: over ? "#EFEDE6" : COLORS.bgLight, transition: "background-color .15s" }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { setOver(false); onDrop(e, status.id); }}
    >
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-wide" style={{ color: COLORS.black }}>{status.label}</h3>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: COLORS.black, color: COLORS.gold }}>
            {String(tasks.length).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {tasks.length === 0 ? (
          <EmptyColumn onAdd={() => onAdd(status.id)} />
        ) : (
          tasks.map((t) => (
            <TaskCard key={t.id} task={t} onOpen={onOpen} onDragStart={onDragStart} onQuickStatus={onQuickStatus} />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- Filters bar ---------------- */

function FiltersBar({ filters, setFilters, currentUser }) {
  const responsibles = TEAM;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[180px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.gray }} />
        <input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Buscar tarefa..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded-xl outline-none"
          style={{ border: "1px solid #E2E1DC", backgroundColor: COLORS.white, color: COLORS.black }}
        />
      </div>

      <select
        value={filters.responsible}
        onChange={(e) => setFilters((f) => ({ ...f, responsible: e.target.value }))}
        className="text-xs px-3 py-2 rounded-xl outline-none bg-white"
        style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
      >
        <option value="">Responsável: Todos</option>
        {responsibles.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>

      <select
        value={filters.category}
        onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
        className="text-xs px-3 py-2 rounded-xl outline-none bg-white"
        style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
      >
        <option value="">Empresa: Todas</option>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
        className="text-xs px-3 py-2 rounded-xl outline-none bg-white"
        style={{ border: "1px solid #E2E1DC", color: COLORS.black }}
      >
        <option value="">Prioridade: Todas</option>
        {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>

      <button
        onClick={() => setFilters((f) => ({ ...f, onlyMine: !f.onlyMine }))}
        className="text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
        style={{
          border: `1px solid ${filters.onlyMine ? COLORS.gold : "#E2E1DC"}`,
          backgroundColor: filters.onlyMine ? `${COLORS.gold}1A` : COLORS.white,
          color: filters.onlyMine ? COLORS.goldDark : COLORS.black,
        }}
      >
        <Filter size={12} /> Somente minhas tarefas
      </button>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.white, border: "1px solid #EAE9E4" }}>
      <div className="text-2xl font-bold" style={{ color: accent || COLORS.black }}>{value}</div>
      <div className="text-xs font-medium mt-1" style={{ color: COLORS.black }}>{label}</div>
      <div className="text-[11px]" style={{ color: COLORS.gray }}>{sub}</div>
    </div>
  );
}

const PIE_COLORS = [COLORS.black, COLORS.gold, "#C7C6C0"];

function Dashboard({ tasks, currentUser, period, setPeriod }) {
  const filtered = useMemo(() => {
    if (period === "all") return tasks;
    const days = period === "7" ? 7 : period === "30" ? 30 : 9999;
    return tasks.filter((t) => Math.abs(daysDiff(t.createdAt)) <= days || t.status !== "done");
  }, [tasks, period]);

  const total = filtered.length;
  const todo = filtered.filter((t) => t.status === "todo").length;
  const doing = filtered.filter((t) => t.status === "doing").length;
  const done = filtered.filter((t) => t.status === "done").length;
  const overdue = filtered.filter((t) => t.status !== "done" && t.dueDate && daysDiff(t.dueDate) > 0);
  const productivity = total ? Math.round((done / total) * 100) : 0;

  const upcoming = filtered
    .filter((t) => t.status !== "done" && t.dueDate && daysDiff(t.dueDate) <= 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const byStatus = STATUSES.map((s) => ({ name: s.label, value: filtered.filter((t) => t.status === s.id).length }));
  const byPriority = PRIORITIES.map((p) => ({ name: p.label, value: filtered.filter((t) => t.priority === p.id).length }));
  const byResponsible = TEAM.map((m) => ({ name: m.name, value: filtered.filter((t) => t.responsible === m.id).length })).filter((x) => x.value > 0);
  const byCategory = CATEGORIES
    .map((c) => ({ name: c, value: filtered.filter((t) => t.category === c).length }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: COLORS.black }}>Painel executivo</h2>
          <p className="text-xs" style={{ color: COLORS.gray }}>Indicadores calculados a partir das tarefas cadastradas.</p>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: COLORS.bgLight }}>
          {[["7", "7 dias"], ["30", "30 dias"], ["all", "Geral"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition"
              style={{ backgroundColor: period === v ? COLORS.black : "transparent", color: period === v ? COLORS.gold : COLORS.gray }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatCard label="Total de tarefas" value={total} sub="Cadastradas" />
        <StatCard label="A fazer" value={String(todo).padStart(2, "0")} sub="Aguardando início" />
        <StatCard label="Em andamento" value={String(doing).padStart(2, "0")} sub="Em execução" />
        <StatCard label="Concluídas" value={String(done).padStart(2, "0")} sub="Finalizadas" accent={COLORS.goldDark} />
        <StatCard label="Atrasadas" value={String(overdue.length).padStart(2, "0")} sub="Prazo vencido" accent="#C0503A" />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <div className="md:col-span-1 rounded-2xl p-5 flex flex-col justify-center items-center" style={{ backgroundColor: COLORS.black }}>
          <div className="text-4xl font-bold" style={{ color: COLORS.gold }}>{productivity}%</div>
          <div className="text-xs mt-1" style={{ color: "#C9C9C9" }}>das tarefas concluídas</div>
          <div className="w-full h-2 rounded-full mt-4" style={{ backgroundColor: "#2A2A2A" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${productivity}%`, backgroundColor: COLORS.gold }} />
          </div>
          <div className="text-[11px] mt-2" style={{ color: "#8C8C8C" }}>Produtividade</div>
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.white, border: "1px solid #EAE9E4" }}>
          <h4 className="text-xs font-semibold mb-2" style={{ color: COLORS.black }}>Tarefas por status</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={2}>
                {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.white, border: "1px solid #EAE9E4" }}>
          <h4 className="text-xs font-semibold mb-2" style={{ color: COLORS.black }}>Tarefas por prioridade</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEDE9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.gray }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.gold} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.white, border: "1px solid #EAE9E4" }}>
          <h4 className="text-xs font-semibold mb-2" style={{ color: COLORS.black }}>Tarefas por responsável</h4>
          <ResponsiveContainer width="100%" height={Math.max(120, byResponsible.length * 34)}>
            <BarChart data={byResponsible} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEDE9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: COLORS.black }} axisLine={false} tickLine={false} width={60} />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.black} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.white, border: "1px solid #EAE9E4" }}>
          <h4 className="text-xs font-semibold mb-2" style={{ color: COLORS.black }}>Tarefas por empresa/categoria</h4>
          <ResponsiveContainer width="100%" height={Math.max(120, byCategory.length * 28)}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEDE9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.gray }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: COLORS.black }} axisLine={false} tickLine={false} width={110} />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.goldDark} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.white, border: "1px solid #EAE9E4" }}>
          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#C0503A" }}>
            <AlertTriangle size={14} /> Atenção aos prazos
          </h4>
          {overdue.length === 0 ? (
            <p className="text-xs" style={{ color: COLORS.gray }}>Nenhuma tarefa em atraso. 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {overdue.slice(0, 6).map((t) => {
                const r = TEAM.find((m) => m.id === t.responsible);
                return (
                  <div key={t.id} className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: "1px solid #F2F1ED" }}>
                    <div>
                      <div className="font-medium" style={{ color: COLORS.black }}>{t.title}</div>
                      <div style={{ color: COLORS.gray }}>Prazo: {fmtDate(t.dueDate)} · {r?.name}</div>
                    </div>
                    <span className="font-semibold whitespace-nowrap ml-2" style={{ color: "#C0503A" }}>
                      {daysDiff(t.dueDate)}d em atraso
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.white, border: "1px solid #EAE9E4" }}>
          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: COLORS.black }}>
            <Clock size={14} style={{ color: COLORS.gold }} /> Próximos prazos
          </h4>
          {upcoming.length === 0 ? (
            <p className="text-xs" style={{ color: COLORS.gray }}>Nenhum prazo próximo.</p>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((t) => {
                const r = TEAM.find((m) => m.id === t.responsible);
                const d = -daysDiff(t.dueDate);
                return (
                  <div key={t.id} className="flex items-center justify-between text-xs pb-2" style={{ borderBottom: "1px solid #F2F1ED" }}>
                    <div>
                      <div className="font-medium" style={{ color: COLORS.black }}>{t.title}</div>
                      <div style={{ color: COLORS.gray }}>Prazo: {fmtDate(t.dueDate)} · {r?.name}</div>
                    </div>
                    <span className="font-semibold whitespace-nowrap ml-2" style={{ color: COLORS.goldDark }}>
                      {d === 0 ? "hoje" : `em ${d}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- App shell ---------------- */

export default function App() {
  const { tasks, setTasks, loading } = useTasks();
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("kanban");
  const [modalTask, setModalTask] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [toast, setToast] = useState("");
  const [period, setPeriod] = useState("all");
  const [mobileTab, setMobileTab] = useState("todo");
  const [filters, setFilters] = useState({ search: "", responsible: "", category: "", priority: "", onlyMine: false });
  const [dragTaskId, setDragTaskId] = useState(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.search && !(`${t.title} ${t.description}`.toLowerCase().includes(filters.search.toLowerCase()))) return false;
      if (filters.responsible && t.responsible !== filters.responsible) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.onlyMine && t.responsible !== currentUser?.id) return false;
      return true;
    });
  }, [tasks, filters, currentUser]);

  const byStatus = (id) => filteredTasks.filter((t) => t.status === id);

  const handleSave = async (form) => {
    if (form.id) {
      const next = tasks.map((t) => (t.id === form.id ? { ...form, completedAt: form.status === "done" ? (t.completedAt || todayISO()) : null } : t));
      await setTasks(next);
      setToast("✓ Tarefa atualizada");
    } else {
      const newTask = { ...form, id: uid(), createdBy: currentUser.id, createdAt: todayISO(), completedAt: form.status === "done" ? todayISO() : null };
      await setTasks([newTask, ...tasks]);
      setToast("✓ Tarefa criada com sucesso");
    }
    setModalTask(undefined);
  };

  const handleDelete = async (id) => {
    await setTasks(tasks.filter((t) => t.id !== id));
    setModalTask(undefined);
    setToast("✓ Tarefa excluída");
  };

  const handleQuickStatus = async (id, status) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, status, completedAt: status === "done" ? (t.completedAt || todayISO()) : null } : t));
    await setTasks(next);
    if (status === "done") setToast("✓ Tarefa concluída");
  };

  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragTaskId;
    if (!id) return;
    await handleQuickStatus(id, statusId);
  };

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bgLight }}>
      <style>{`
        @keyframes fadein { from { opacity:0; transform: translate(-50%,8px);} to {opacity:1; transform: translate(-50%,0);} }
        ::selection { background: ${COLORS.goldLight}; }
        button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid ${COLORS.gold}; outline-offset: 1px; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-30" style={{ backgroundColor: COLORS.black }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.black2, color: COLORS.gold, border: `1px solid ${COLORS.gold}55` }}>GE</div>
            <span className="text-sm font-semibold hidden sm:inline" style={{ color: COLORS.white }}>Grupo Excellence</span>
          </div>

          <nav className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: COLORS.black2 }}>
            <button
              onClick={() => setView("kanban")}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
              style={{ backgroundColor: view === "kanban" ? COLORS.gold : "transparent", color: view === "kanban" ? COLORS.black : "#B8B8B8" }}
            >
              <Columns3 size={13} /> Kanban
            </button>
            <button
              onClick={() => setView("dashboard")}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
              style={{ backgroundColor: view === "dashboard" ? COLORS.gold : "transparent", color: view === "dashboard" ? COLORS.black : "#B8B8B8" }}
            >
              <LayoutDashboard size={13} /> Dashboard
            </button>
          </nav>

          <div className="flex-1" />

          {view === "kanban" && (
            <button
              onClick={() => setModalTask(null)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ backgroundColor: COLORS.gold, color: COLORS.black }}
            >
              <Plus size={14} /> <span className="hidden sm:inline">Nova tarefa</span>
            </button>
          )}

          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: "1px solid #2A2A2A" }}>
            <Avatar name={currentUser.name} size={28} />
            <span className="text-xs font-medium hidden md:inline" style={{ color: COLORS.white }}>{currentUser.name}</span>
            <button onClick={() => setCurrentUser(null)} title="Sair" className="p-1.5 rounded-lg hover:bg-white/5">
              <LogOut size={14} style={{ color: "#B8B8B8" }} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === "dashboard" ? (
          <>
            <button
              onClick={() => setView("kanban")}
              className="flex items-center gap-1 text-xs font-medium mb-4"
              style={{ color: COLORS.goldDark }}
            >
              <ChevronLeft size={14} /> Voltar ao Kanban
            </button>
            <Dashboard tasks={tasks} currentUser={currentUser} period={period} setPeriod={setPeriod} />
          </>
        ) : (
          <>
            <div className="mb-5">
              <h1 className="text-lg font-semibold" style={{ color: COLORS.black }}>Olá, {currentUser.name} 👋</h1>
              <p className="text-xs" style={{ color: COLORS.gray }}>Organize suas demandas e acompanhe o andamento da equipe.</p>
            </div>

            <FiltersBar filters={filters} setFilters={setFilters} currentUser={currentUser} />

            {loading ? (
              <div className="flex items-center justify-center py-20" style={{ color: COLORS.gray }}>
                <Loader2 size={18} className="animate-spin mr-2" /> Carregando tarefas...
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:grid md:grid-cols-3 gap-4">
                  {STATUSES.map((s) => (
                    <Column
                      key={s.id}
                      status={s}
                      tasks={byStatus(s.id)}
                      onOpen={setModalTask}
                      onDragStart={(e, id) => { e.dataTransfer.setData("text/plain", id); setDragTaskId(id); }}
                      onDrop={handleDrop}
                      onQuickStatus={handleQuickStatus}
                      onAdd={() => setModalTask(null)}
                    />
                  ))}
                </div>

                {/* Mobile */}
                <div className="md:hidden">
                  <div className="flex gap-1 rounded-xl p-1 mb-3" style={{ backgroundColor: "#EFEDE6" }}>
                    {STATUSES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setMobileTab(s.id)}
                        className="flex-1 text-[11px] font-medium py-2 rounded-lg transition"
                        style={{ backgroundColor: mobileTab === s.id ? COLORS.black : "transparent", color: mobileTab === s.id ? COLORS.gold : "#6B6B6B" }}
                      >
                        {s.label} {String(byStatus(s.id).length).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                  <Column
                    status={STATUSES.find((s) => s.id === mobileTab)}
                    tasks={byStatus(mobileTab)}
                    onOpen={setModalTask}
                    onDragStart={(e, id) => { e.dataTransfer.setData("text/plain", id); setDragTaskId(id); }}
                    onDrop={handleDrop}
                    onQuickStatus={handleQuickStatus}
                    onAdd={() => setModalTask(null)}
                  />
                </div>
              </>
            )}
          </>
        )}
      </main>

      {modalTask !== undefined && (
        <TaskModal
          task={modalTask}
          currentUser={currentUser}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModalTask(undefined)}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
