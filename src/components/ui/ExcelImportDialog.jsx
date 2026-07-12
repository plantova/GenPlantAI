import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import useUIStore from '../../stores/useUIStore.js';
import useProjectStore from '../../stores/useProjectStore.js';
import { parseEquipmentExcel, getSchemaDescription } from '../../io/excelImport.js';

export default function ExcelImportDialog() {
  const open = useUIStore((s) => s.excelImportOpen);
  const closeExcelImport = useUIStore((s) => s.closeExcelImport);
  const addNotification = useUIStore((s) => s.addNotification);
  const addEquipmentBatch = useProjectStore((s) => s.addEquipmentBatch);

  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  if (!open) return null;

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setParsing(true);
    setResult(null);
    try {
      const res = await parseEquipmentExcel(f);
      setResult(res);
    } catch (err) {
      setResult({ items: [], errors: [{ row: '-', column: '-', message: err.message }], warnings: [] });
    }
    setParsing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = () => {
    if (!result || result.errors.length > 0 || result.items.length === 0) return;
    addEquipmentBatch(result.items);
    addNotification(`Imported ${result.items.length} equipment items`, 'success');
    closeExcelImport();
    setFile(null);
    setResult(null);
  };

  const handleClose = () => {
    closeExcelImport();
    setFile(null);
    setResult(null);
  };

  const schema = getSchemaDescription();

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span className="dialog-title">Import Equipment from Excel</span>
          <button className="btn btn-ghost btn-sm" onClick={handleClose}><X size={16} /></button>
        </div>

        <div className="dialog-body">
          {/* Schema reference */}
          <div className="schema-info">
            <p className="form-label" style={{ marginBottom: 6 }}>Expected column schema:</p>
            <div className="schema-cols">
              {schema.map((s) => (
                <span key={s.column} className={`schema-col ${s.required ? 'required' : ''}`} title={s.description}>
                  {s.column}
                </span>
              ))}
            </div>
          </div>

          {/* Upload zone */}
          <div
            className={`upload-zone ${dragging ? 'upload-zone--drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={28} className="upload-icon" />
            <p className="upload-text">
              {file ? file.name : 'Drag & drop an .xlsx file or click to browse'}
            </p>
            {file && <p className="upload-size">{(file.size / 1024).toFixed(1)} KB</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {parsing && <p className="parsing-msg">Parsing file…</p>}

          {/* Errors */}
          {result?.errors?.length > 0 && (
            <div className="validation-errors">
              <div className="validation-header"><AlertCircle size={14} /> {result.errors.length} validation error(s)</div>
              {result.errors.map((err, i) => (
                <div key={i} className="error-row">Row {err.row} · <strong>{err.column}</strong>: {err.message}</div>
              ))}
            </div>
          )}

          {/* Preview */}
          {result?.items?.length > 0 && (
            <div>
              <div className="validation-header" style={{ color: 'var(--success)' }}>
                <CheckCircle size={14} /> {result.items.length} items ready to import
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>{['Tag', 'Type', 'X', 'Y', 'Z', 'Rotation'].map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.items.slice(0, 10).map((item, i) => (
                      <tr key={i}>
                        <td>{item.tag}</td>
                        <td>{item.type}</td>
                        <td>{item.position[0].toFixed(1)}</td>
                        <td>{item.position[1].toFixed(1)}</td>
                        <td>{item.position[2].toFixed(1)}</td>
                        <td>{((item.rotation?.[1] || 0) * 180 / Math.PI).toFixed(0)}°</td>
                      </tr>
                    ))}
                    {result.items.length > 10 && (
                      <tr><td colSpan={6} className="table-more">…and {result.items.length - 10} more</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={!result || result.errors.length > 0 || result.items.length === 0}
          >
            Import {result?.items?.length > 0 ? `(${result.items.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
