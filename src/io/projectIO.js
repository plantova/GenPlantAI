import { openDB } from 'idb';

const DB_NAME = 'plantova-3d-db';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
      }
    },
  });
}

export async function saveToIndexedDB(projectData) {
  const db = await getDB();
  await db.put(STORE_NAME, { ...projectData, savedAt: new Date().toISOString() });
}

export async function loadFromIndexedDB(projectId) {
  const db = await getDB();
  return db.get(STORE_NAME, projectId);
}

export async function listProjects() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.map(({ projectId, projectName, savedAt }) => ({ projectId, projectName, savedAt }));
}

export async function deleteProject(projectId) {
  const db = await getDB();
  await db.delete(STORE_NAME, projectId);
}

export function exportProjectFile(projectData) {
  const json = JSON.stringify(projectData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectData.projectName ?? 'project'}.plantdesign.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importProjectFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

/**
 * Set up auto-save. Returns a cleanup function (call on unmount).
 */
export function setupAutoSave(getProjectData, intervalMs = 60000) {
  const id = setInterval(async () => {
    try {
      await saveToIndexedDB(getProjectData());
    } catch (err) {
      console.warn('Auto-save failed:', err);
    }
  }, intervalMs);
  return () => clearInterval(id);
}
