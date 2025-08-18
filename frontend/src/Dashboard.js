import React, { useEffect, useMemo, useState } from "react";
import api from "./api";

/**
 * Dashboard 100% réel :
 * - charge /ventes depuis le backend (MongoDB)
 * - calcule les totaux (nombre ventes, montant)
 * - calcule les revenus par jour pour le graphique
 * - interroge /status pour l’état du routeur (en prod cloud = false si Mikrotik désactivé)
 */

function Dashboard() {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routerOnline, setRouterOnline] = useState(null);
  const [filtre, setFiltre] = useState("all"); // today | month | all
  const [err, setErr] = useState("");

  // 1) Charger les ventes réelles
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        setLoading(true);
        setErr("");

        const [vRes, sRes] = await Promise.allSettled([
          api.get("/ventes"),
          api.get("/status"), // selon ton routeur: {online:true} ou {routerOnline:true}
        ]);

        if (!cancelled) {
          if (vRes.status === "fulfilled") setVentes(Array.isArray(vRes.value.data) ? vRes.value.data : []);
          else {
            console.error("Erreur /ventes:", vRes.reason);
            setErr("Erreur lors du chargement des ventes.");
          }

          if (sRes.status === "fulfilled") {
            const d = sRes.value.data || {};
            setRouterOnline(Boolean(d.online ?? d.routerOnline));
          } else {
            // pas bloquant
            setRouterOnline(false);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Filtrer les ventes selon l’onglet (today / month / all)
  const ventesFiltrees = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const monthPrefix = todayISO.slice(0, 7); // YYYY-MM

    return ventes.filter((v) => {
      const d = new Date(v.date);
      if (Number.isNaN(d.getTime())) return false;
      const iso = d.toISOString().slice(0, 10);
      if (filtre === "today") return iso === todayISO;
      if (filtre === "month") return iso.startsWith(monthPrefix);
      return true; // all
    });
  }, [ventes, filtre]);

  // 3) KPIs
  const totalVentes = ventesFiltrees.length;
  const totalMontant = ventesFiltrees.reduce(
    (sum, v) => sum + Number(v.amount ?? v.montant ?? 0),
    0
  );

  // 4) Données du graphique (revenus par jour sur la période visible)
  const chartData = useMemo(() => {
    // groupe par YYYY-MM-DD
    const byDay = new Map();
    for (const v of ventesFiltrees) {
      const d = new Date(v.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      const amt = Number(v.amount ?? v.montant ?? 0);
      byDay.set(key, (byDay.get(key) || 0) + amt);
    }

    // ordre chronologique
    const rows = Array.from(byDay.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, montant]) => ({ date, montant }));

    // si aucun point → on affiche un seul 0 pour garder l’échelle
    return rows.length ? rows : [{ date: new Date().toISOString().slice(0, 10), montant: 0 }];
  }, [ventesFiltrees]);

  const maxY = Math.max(...chartData.map((r) => r.montant || 0), 0) || 1;

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Dashibodi ya Jiconnect</h1>
      <p style={s.sub}>Muhtasari wa mauzo na hali ya router</p>

      {/* Barre d’état + filtres */}
      <div style={s.toolbar}>
        <div style={s.statusWrap}>
          <span style={s.statusLabel}>Statut du routeur :</span>
          <span
            style={{
              ...s.statusPill,
              backgroundColor:
                routerOnline === null
                  ? "#6b7280" // chargement
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
          <button
            onClick={() => setFiltre("today")}
            style={{ ...s.filterBtn, ...(filtre === "today" ? s.filterActive : {}) }}
          >
            Leo
          </button>
          <button
            onClick={() => setFiltre("month")}
            style={{ ...s.filterBtn, ...(filtre === "month" ? s.filterActive : {}) }}
          >
            Mwezi huu
          </button>
          <button
            onClick={() => setFiltre("all")}
            style={{ ...s.filterBtn, ...(filtre === "all" ? s.filterActive : {}) }}
          >
            Zote
          </button>
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

      {/* Graphique simple (sans lib) */}
      <div style={s.panel}>
        <div style={s.panelHeader}>Revenus quotidiens</div>
        <div style={s.chartWrap}>
          {chartData.map((row) => {
            const h = (row.montant / maxY) * 180; // 180px max
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

      {/* Erreur éventuelle */}
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
  toolbar: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  statusWrap: { display: "flex", alignItems: "center", gap: 8, background: "#111827", borderRadius: 8, padding: "8px 10px" },
  statusLabel: { color: "#d1d5db", fontSize: 14 },
  statusPill: { color: "#fff", borderRadius: 999, padding: "4px 10px", fontSize: 13, fontWeight: "bold" },
  filters: { display: "flex", gap: 8, marginLeft: "auto" },
  filterBtn: { background: "#111827", color: "#e5e7eb", border: "1px solid #374151", borderRadius: 8, padding: "8px 10px", cursor: "pointer" },
  filterActive: { background: "#f5d042", color: "#0a174e", borderColor: "#f5d042", fontWeight: "bold" },
  kpiRow: { display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, marginBottom: 18 },
  kpiCard: { background: "#111827", borderRadius: 12, padding: 18, minWidth: 240, flex: "0 0 auto", boxShadow: "0 2px 6px rgba(0,0,0,.3)" },
  kpiTitle: { color: "#d1d5db", fontSize: 14, marginBottom: 6 },
  kpiValue: { color: "#f5d042", fontSize: 28, fontWeight: "bold" },
  panel: { background: "#0d1324", borderRadius: 12, padding: 16, boxShadow: "0 2px 6px rgba(0,0,0,.35)", marginTop: 8 },
  panelHeader: { color: "#e5e7eb", fontWeight: "600", marginBottom: 8 },
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
