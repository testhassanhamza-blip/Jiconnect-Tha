import React, { useEffect, useMemo, useState } from "react";
import api from "./api";

/**
 * Dashboard 100% réel (MongoDB)
 * - lit /ventes et /status
 * - calcule totaux et revenus/jour
 * - bouton "Actualiser" force un refetch
 * - bandeau debug (temporaire) pour vérifier ce que reçoit le composant
 */

function Dashboard() {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routerOnline, setRouterOnline] = useState(null);
  const [filtre, setFiltre] = useState("all"); // today | month | all
  const [err, setErr] = useState("");
  const [lastFetch, setLastFetch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setErr("");
      const [vRes, sRes] = await Promise.allSettled([
        api.get("/ventes", { headers: { "Cache-Control": "no-cache" } }),
        api.get("/status", { headers: { "Cache-Control": "no-cache" } }),
      ]);

      if (vRes.status === "fulfilled") {
        const arr = Array.isArray(vRes.value.data) ? vRes.value.data : [];
        setVentes(arr);
      } else {
        console.error("Erreur /ventes:", vRes.reason);
        setErr("Erreur lors du chargement des ventes.");
        setVentes([]);
      }

      if (sRes.status === "fulfilled") {
        const d = sRes.value.data || {};
        setRouterOnline(Boolean(d.online ?? d.routerOnline));
      } else {
        setRouterOnline(false);
      }

      setLastFetch(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayISO = new Date().toISOString().slice(0, 10);
  const monthPrefix = todayISO.slice(0, 7);

  const ventesFiltrees = useMemo(() => {
    return ventes.filter((v) => {
      const d = new Date(v.date);
      if (Number.isNaN(d.getTime())) return false;
      const iso = d.toISOString().slice(0, 10);
      if (filtre === "today") return iso === todayISO;
      if (filtre === "month") return iso.startsWith(monthPrefix);
      return true;
    });
  }, [ventes, filtre, monthPrefix, todayISO]);

  const totalVentes = ventesFiltrees.length;
  const totalMontant = ventesFiltrees.reduce(
    (sum, v) => sum + Number(v.amount ?? v.montant ?? 0),
    0
  );

  const chartData = useMemo(() => {
    const byDay = new Map();
    for (const v of ventesFiltrees) {
      const d = new Date(v.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      const amt = Number(v.amount ?? v.montant ?? 0);
      byDay.set(key, (byDay.get(key) || 0) + amt);
    }
    const rows = Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, montant]) => ({ date, montant }));
    return rows.length ? rows : [{ date: todayISO, montant: 0 }];
  }, [ventesFiltrees, todayISO]);

  const maxY = Math.max(...chartData.map((r) => r.montant || 0), 0) || 1;

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Dashibodi ya77PZ Jiconnect</h1>
      <p style={s.sub}>Muhtasari wa mauzo na hali ya router</p>

      {/* Bandeau debug temporaire */}
      <div style={s.debug}>
        <div>DEBUG • ventes reçues: <b>{ventes.length}</b> • filtre: <b>{filtre}</b> • dernier fetch: <b>{lastFetch || "—"}</b></div>
        <div>API: <code>{import.meta?.env?.VITE_API_BASE_URL || "non défini (fallback axios)"}</code></div>
      </div>

      {/* Barre d’état + filtres + bouton Actualiser */}
      <div style={s.toolbar}>
        <div style={s.statusWrap}>
          <span style={s.statusLabel}>Statut du routeur :</span>
          <span
            style={{
              ...s.statusPill,
              backgroundColor:
                routerOnline === null
                  ? "#6b7280"
                  : routerOnline
                  ? "#16a34a"
                  : "#b91c1c",
            }}
          >
            {routerOnline === null
              ? "Chargement…"
              : routerOnline
              ? "En ligne"
              : "Hors ligne"}
          </span>
        </div>

        <div style={s.filters}>
          <button onClick={() => setFiltre("today")} style={{ ...s.filterBtn, ...(filtre === "today" ? s.filterActive : {}) }}>Leo</button>
          <button onClick={() => setFiltre("month")} style={{ ...s.filterBtn, ...(filtre === "month" ? s.filterActive : {}) }}>Mwezi huu</button>
          <button onClick={() => setFiltre("all")} style={{ ...s.filterBtn, ...(filtre === "all" ? s.filterActive : {}) }}>Zote</button>
          <button onClick={fetchData} style={s.refreshBtn}>🔄 Actualiser</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={s.kpiRow}>
        <div style={s.kpiCard}>
          <div style={s.kpiTitle}>Forfaits zilizouzwa</div>
          <div style={s.kpiValue}>{loading ? "…" : totalVentes}</div>
        </div>
        <div style={s.kpiCard}>
          <div style={s.kpiTitle}>Mapato (TZS)</div>
          <div style={s.kpiValue}>{loading ? "…" : totalMontant}</div>
        </div>
      </div>

      {/* Graphique */}
      <div style={s.panel}>
        <div style={s.panelHeader}>Revenus quotidiens</div>
        <div style={s.chartWrap}>
          {chartData.map((row) => {
            const h = (row.montant / maxY) * 180;
            return (
              <div key={row.date} style={s.barItem}>
                <div style={{ ...s.bar, height: `${h}px` }} />
                <div style={s.barLabelDate}>{row.date}</div>
                <div style={s.barLabelVal}>{row.montant}</div>
              </div>
            );
          })}
        </div>
        {!loading && totalVentes === 0 && (
          <div style={s.empty}>Hakuna data ya kuonyesha kwenye kipindi hiki.</div>
        )}
      </div>

      {err && <div style={s.error}>{err}</div>}

      <div style={{ height: 24 }} />
      <a href="/ventes" style={s.cta}>Tazama historia yote ya mauzo</a>
    </div>
  );
}

const s = {
  page: { padding: 24, background: "#0b0f1a", minHeight: "100vh", color: "#fff", fontFamily: "Segoe UI, sans-serif" },
  h1: { margin: "0 0 6px", color: "#f5d042" },
  sub: { marginTop: 0, color: "#cbd5e1" },
  debug: { background: "#0d1324", border: "1px dashed #334155", padding: "8px 10px", borderRadius: 10, marginBottom: 10, fontSize: 12, color: "#cbd5e1" },
  toolbar: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  statusWrap: { display: "flex", alignItems: "center", gap: 8, background: "#111827", borderRadius: 8, padding: "8px 10px" },
  statusLabel: { color: "#d1d5db", fontSize: 14 },
  statusPill: { color: "#fff", borderRadius: 999, padding: "4px 10px", fontSize: 13, fontWeight: "bold" },
  filters: { display: "flex", gap: 8, marginLeft: "auto" },
  filterBtn: { background: "#111827", color: "#e5e7eb", border: "1px solid #374151", borderRadius: 8, padding: "8px 10px", cursor: "pointer" },
  filterActive: { background: "#f5d042", color: "#0a174e", borderColor: "#f5d042", fontWeight: "bold" },
  refreshBtn: { background: "#f5d042", color: "#0a174e", border: "1px solid #f5d042", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontWeight: "bold" },
  kpiRow: { display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, marginBottom: 18 },
  kpiCard: { background: "#111827", borderRadius: 12, padding: 18, minWidth: 240, flex: "0 0 auto", boxShadow: "0 2px 6px rgba(0,0,0,.3)" },
  kpiTitle: { color: "#d1d5db", fontSize: 14, marginBottom: 6 },
  kpiValue: { color: "#f5d042", fontSize: 28, fontWeight: "bold" },
  panel: { background: "#0d1324", borderRadius: 12, padding: 16, boxShadow: "0 2px 6px rgba(0,0,0,.35)", marginTop: 8 },
  panelHeader: { color: "#e5e7eb", fontWeight: 600, marginBottom: 8 },
  chartWrap: { display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(70px, 1fr)", alignItems: "end", gap: 12, height: 220, padding: "12px 8px", overflowX: "auto", background: "#111827", borderRadius: 10 },
  barItem: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  bar: { width: 44, background: "#f5d042", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,.3)" },
  barLabelDate: { color: "#cbd5e1", fontSize: 12 },
  barLabelVal: { color: "#f5d042", fontSize: 12, fontWeight: 600 },
  empty: { color: "#9ca3af", textAlign: "center", padding: "12px 0" },
  error: { background: "#4b1d1d", color: "#ffb4b4", padding: "10px 12px", borderRadius: 8, marginTop: 12, fontSize: 14 },
  cta: { display: "inline-block", background: "#f5d042", color: "#0a174e", padding: "10px 14px", borderRadius: 8, fontWeight: "bold", textDecoration: "none" },
};

export default Dashboard;
