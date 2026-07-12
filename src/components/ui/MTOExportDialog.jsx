import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import useUIStore from '../../stores/useUIStore.js';
import useProjectStore from '../../stores/useProjectStore.js';
import { generateMTO, exportMTOExcel, exportMTOCsv } from '../../io/mtoExport.js';

export default function MTOExportDialog() {
  const open = useUIStore((s) => s.mtoExportOpen);
  const closeMTOExport = useUIStore((s) => s.closeMTOExport);
  const addNotification = useUIStore((s) => s.addNotification);
  const pipes = useProjectStore((s) => s.pipes);

  const [selectedLines, setSelectedLines] = useState([]);
  const [format, setFormat] = useState('xlsx');

  if (!open) return null;

  const pipesWith = pipes.filter((p) => p.segments && p.segments.length > 0);
  const selected = pipesWith.filter((p) => selectedLines.includes(p.id));
  const mtoData = selected.length > 0 ? generateMTO(selected) : null;

  const toggleLine = (id) =>
    setSelectedLines((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectAll = () => setSelectedLines(pipesWith.map((p) => p.id));
  const deselectAll = () => setSelectedLines([]);

  const handleExport = async () => {
    if (!mtoData) return;
    try {
      if (format === 'xlsx') await exportMTOExcel(mtoData);
      else exportMTOCsv(mtoData);
      addNotification('MTO exported successfully', 'success');
    } catch (err) {
      addNotification(`Export failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="dialog-overlay" onClick={closeMTOExport}>
      <div className="dialog" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span className="dialog-title"><Download size={16} style={{ marginRight: 8 }} />Export Material Take-Off</span>
          <button className="btn btn-ghost btn-sm" onClick={closeMTOExport}><X size={16} /></button>
        </div>

        <div className="dialog-body">
          {pipesWith.length === 0 ? (
            <div className="empty-state">No routed pipe lines found. Route some pipes first.</div>
          ) : (
            <>
              {/* Line selection */}
              <div className="form-row" style={{ marginBottom: 8, gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={selectAll}>Select All</button>
                <button className="btn btn-secondary btn-sm" onClick={deselectAll}>Deselect All</button>
                <span className="form-label" style={{ marginLeft: 'auto' }}>{selectedLines.length} selected</span>
              </div>

              {pipesWith.map((pipe) => (
                <label key={pipe.id} className="line-select-row">
                  <input
                    type="checkbox"
                    checked={selectedLines.includes(pipe.id)}
                    onChange={() => toggleLine(pipe.id)}
                  />
                  <span className="line-number">{pipe.lineNumber}</span>
                  <span className="line-meta">{pipe.nominalSize}" {pipe.schedule} · {pipe.material}</span>
                </label>
              ))}

              {/* Preview table */}
              {mtoData && (
                <div className="table-wrap" style={{ marginTop: 16 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Line No.</th><th>Size</th><th>Material</th>
                        <th>Length (m)</th><th>90° Elbows</th><th>45° Elbows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mtoData.lines.map((line, i) => (
                        <tr key={i}>
                          <td>{line.lineNumber}</td>
                          <td>{line.nominalSize}"</td>
                          <td>{line.material}</td>
                          <td>{line.totalLength}</td>
                          <td>{line.elbows90}</td>
                          <td>{line.elbows45}</td>
                        </tr>
                      ))}
                      <tr className="table-total">
                        <td colSpan={3}><strong>TOTAL</strong></td>
                        <td><strong>{mtoData.grandTotal.totalLength}</strong></td>
                        <td><strong>{mtoData.grandTotal.elbows90}</strong></td>
                        <td><strong>{mtoData.grandTotal.elbows45}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Format */}
              <div className="form-row" style={{ marginTop: 16, gap: 16 }}>
                <label className="form-label">Export format:</label>
                {['xlsx', 'csv'].map((f) => (
                  <label key={f} style={{ display: 'flex', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="mto-format" value={f} checked={format === f} onChange={() => setFormat(f)} />
                    {f.toUpperCase()}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={closeMTOExport}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={!mtoData || selectedLines.length === 0}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}
