import React, { useState, useMemo } from 'react';
import { X, GitBranch, AlertCircle, CheckCircle } from 'lucide-react';
import useUIStore from '../../stores/useUIStore.js';
import useProjectStore from '../../stores/useProjectStore.js';
import { getNozzleWorldPosition } from '../../utils/snapEngine.js';
import { routeManual } from '../../routing/router.js';
import { NPS_TO_OD_MAP } from '../../data/pipeSpecs.js';

const NPS_OPTIONS = Object.keys(NPS_TO_OD_MAP).map(Number).sort((a, b) => a - b);
const SCHEDULES   = ['5S', '10S', 'STD', '40', '80', '120', '160'];
const MATERIALS   = [
  { value: 'CS-A106B',     label: 'Carbon Steel A106B' },
  { value: 'SS304-A312',   label: 'SS 304 A312' },
  { value: 'SS316-A312',   label: 'SS 316 A312' },
  { value: 'ALLOY-A335P11', label: 'Alloy A335 P11' },
];

function fmt(n) { return typeof n === 'number' ? n.toFixed(2) : '—'; }

export default function PipeRoutingDialog() {
  const open       = useUIStore((s) => s.pipeRoutingOpen);
  const closeDialog = useUIStore((s) => s.closePipeRouting);
  const addNotification = useUIStore((s) => s.addNotification);
  const equipment  = useProjectStore((s) => s.equipment);
  const structures = useProjectStore((s) => s.structures);
  const addPipe    = useProjectStore((s) => s.addPipe);

  /* ── Form state ── */
  const [fromTag,    setFromTag]    = useState('');
  const [fromNozzle, setFromNozzle] = useState('');
  const [toTag,      setToTag]      = useState('');
  const [toNozzle,   setToNozzle]   = useState('');
  const [lineNum,    setLineNum]    = useState('');
  const [nps,        setNps]        = useState(6);
  const [schedule,   setSchedule]   = useState('STD');
  const [material,   setMaterial]   = useState('CS-A106B');
  const [designTemp, setDesignTemp] = useState(80);
  const [designPres, setDesignPres] = useState(3.0);
  const [rackHeight, setRackHeight] = useState(4);
  const [result,     setResult]     = useState(null);
  const [routing,    setRouting]    = useState(false);

  /* Nozzle lists for selected equipment */
  const fromEq  = useMemo(() => equipment.find((e) => e.tag === fromTag), [equipment, fromTag]);
  const toEq    = useMemo(() => equipment.find((e) => e.tag === toTag),   [equipment, toTag]);
  const fromNozzles = fromEq?.nozzles ?? [];
  const toNozzles   = toEq?.nozzles   ?? [];

  /* World positions of selected nozzles */
  const fromPos = useMemo(() => {
    if (!fromEq || !fromNozzle) return null;
    const nz = fromEq.nozzles?.find((n) => n.id === fromNozzle);
    return nz ? getNozzleWorldPosition(fromEq, nz) : null;
  }, [fromEq, fromNozzle]);

  const toPos = useMemo(() => {
    if (!toEq || !toNozzle) return null;
    const nz = toEq.nozzles?.find((n) => n.id === toNozzle);
    return nz ? getNozzleWorldPosition(toEq, nz) : null;
  }, [toEq, toNozzle]);

  if (!open) return null;

  const canRoute = fromPos && toPos;

  const handleRoute = () => {
    if (!canRoute) return;
    setRouting(true);
    setResult(null);

    try {
      /* Build waypoints: nozzle → rise to rack → horizontal → drop to dest */
      const [fx, fy, fz] = fromPos;
      const [tx, ty, tz] = toPos;
      const rh = Math.max(rackHeight, fy + 0.5, ty + 0.5);

      const waypoints = [
        [fx, fy, fz],
        [fx, rh, fz],   // rise from source nozzle
        [tx, rh, tz],   // horizontal run at rack height
        [tx, ty, tz],   // drop to dest nozzle
      ];

      const pipeData = { nominalSize: nps, schedule, material, designTemperature: designTemp, designPressure: designPres };
      const res = routeManual(waypoints, pipeData);
      setResult(res);
    } catch (e) {
      setResult({ success: false, errors: [e.message] });
    } finally {
      setRouting(false);
    }
  };

  const handleAccept = () => {
    if (!result?.success) return;
    const ln = lineNum || `${nps}"-${material.split('-')[0]}-${String(useProjectStore.getState().pipes.length + 1).padStart(3, '0')}`;
    addPipe({
      lineNumber: ln,
      fromTag, fromNozzle,
      toTag,   toNozzle,
      segments: result.segments,
      nominalSize: nps, schedule, material,
      designTemperature: designTemp,
      designPressure:    designPres,
    });
    addNotification(`Pipe line ${ln} routed (${fmt(result.totalLength)} m)`, 'success', 3000);
    closeDialog();
  };

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && closeDialog()}>
      <div className="dialog" style={{ maxWidth: 520 }}>
        <div className="dialog-header">
          <span className="dialog-title"><GitBranch size={16} /> Route Pipe Line</span>
          <button className="btn btn-ghost btn-sm" onClick={closeDialog}><X size={14} /></button>
        </div>

        <div className="dialog-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

          {/* ── FROM ── */}
          <div>
            <div className="form-section-label">From</div>
            <div className="form-group">
              <label className="form-label">Equipment Tag</label>
              <select className="select" value={fromTag} onChange={(e) => { setFromTag(e.target.value); setFromNozzle(''); }}>
                <option value="">Select…</option>
                {equipment.map((eq) => <option key={eq.id} value={eq.tag}>{eq.tag} ({eq.type})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nozzle</label>
              <select className="select" value={fromNozzle} onChange={(e) => setFromNozzle(e.target.value)} disabled={!fromTag}>
                <option value="">Select…</option>
                {fromNozzles.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.label} {n.size}"</option>)}
              </select>
            </div>
            {fromPos && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              ↳ World: ({fmt(fromPos[0])}, {fmt(fromPos[1])}, {fmt(fromPos[2])})
            </div>}
          </div>

          {/* ── TO ── */}
          <div>
            <div className="form-section-label">To</div>
            <div className="form-group">
              <label className="form-label">Equipment Tag</label>
              <select className="select" value={toTag} onChange={(e) => { setToTag(e.target.value); setToNozzle(''); }}>
                <option value="">Select…</option>
                {equipment.filter((e) => e.tag !== fromTag).map((eq) => <option key={eq.id} value={eq.tag}>{eq.tag} ({eq.type})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nozzle</label>
              <select className="select" value={toNozzle} onChange={(e) => setToNozzle(e.target.value)} disabled={!toTag}>
                <option value="">Select…</option>
                {toNozzles.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.label} {n.size}"</option>)}
              </select>
            </div>
            {toPos && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              ↳ World: ({fmt(toPos[0])}, {fmt(toPos[1])}, {fmt(toPos[2])})
            </div>}
          </div>

          {/* ── Pipe Spec (full width) ── */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="form-section-label">Pipe Specification</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              <div className="form-group">
                <label className="form-label">Line No.</label>
                <input className="input" placeholder="auto" value={lineNum} onChange={(e) => setLineNum(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">NPS (in)</label>
                <select className="select" value={nps} onChange={(e) => setNps(Number(e.target.value))}>
                  {NPS_OPTIONS.map((s) => <option key={s} value={s}>{s}"</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Schedule</label>
                <select className="select" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                  {SCHEDULES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Material</label>
                <select className="select" value={material} onChange={(e) => setMaterial(e.target.value)}>
                  {MATERIALS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Design Temp (°C)</label>
                <input className="input" type="number" value={designTemp} onChange={(e) => setDesignTemp(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Design Press (barg)</label>
                <input className="input" type="number" step="0.1" value={designPres} onChange={(e) => setDesignPres(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Rack Height (m)</label>
                <input className="input" type="number" step="0.5" value={rackHeight}
                  onChange={(e) => setRackHeight(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* ── Result ── */}
          {result && (
            <div style={{ gridColumn: '1 / -1' }}>
              {result.success ? (
                <div className="route-result">
                  <div className="result-row"><span>Total Length</span><strong>{fmt(result.totalLength)} m</strong></div>
                  <div className="result-row"><span>90° Elbows</span><strong>{result.elbowCount90}</strong></div>
                  <div className="result-row"><span>45° Elbows</span><strong>{result.elbowCount45}</strong></div>
                  <div className="result-row"><span>Segments</span><strong>{result.segments.length}</strong></div>
                  {result.flexibilityStatus && (
                    <div className="flex-message" style={{
                      color: result.flexibilityStatus.status === 'fail' ? '#e74c3c'
                           : result.flexibilityStatus.status === 'warning' ? '#f39c12' : '#2ecc71',
                    }}>
                      {result.flexibilityStatus.status === 'pass' ? '✓' : '⚠'}{' '}
                      {result.flexibilityStatus.messages?.map((m, i) => (
                        <span key={i}>{m}{i < result.flexibilityStatus.messages.length - 1 ? ' ' : ''}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="route-error">
                  <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {result.errors?.join(' ')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={closeDialog}>Cancel</button>
          <button className="btn btn-secondary" onClick={handleRoute} disabled={!canRoute || routing}>
            {routing ? 'Routing…' : 'Preview Route'}
          </button>
          <button className="btn btn-primary" onClick={handleAccept} disabled={!result?.success}>
            <CheckCircle size={13} /> Accept & Add Pipe
          </button>
        </div>
      </div>
    </div>
  );
}
