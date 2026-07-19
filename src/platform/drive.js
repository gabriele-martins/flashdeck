// Sincronização com o Google Drive (pasta visível "FlashDeck").
// Também isolável no wrapper nativo.
import { DRIVE_FILE, DRIVE_FOLDER } from "../config.js";
import { state } from "../core/state.js";
import { migrate, saveLocal } from "../core/storage.js";
import { getToken } from "./auth.js";
import { toast } from "../ui/components.js";
import { applyTheme } from "../ui/theme.js";
import { ingestImport } from "../core/importer.js";

let driveFileId = null, driveFolderId = null, saveTimer = null;
let renderRef = () => {};
export function setDriveRender(fn) { renderRef = fn; }
export function resetDriveCache() { driveFileId = null; driveFolderId = null; }

export function setSync(s) {
  state.sync = s;
  const el = document.getElementById("sync-indicator");
  if (el) el.outerHTML = syncIndicatorHtml();
}
export function syncIndicatorHtml() {
  const map = {
    local: ["local", "Local"], syncing: ["syncing", "Sincronizando…"],
    synced: ["synced", "Salvo no Drive"], error: ["error", "Erro de sync"],
  };
  const [cls, label] = map[state.sync];
  return '<div id="sync-indicator" class="fd-sync ' + cls + '"><span class="dot"></span>' + label + "</div>";
}

async function driveFetch(url, opts = {}) {
  const token = await getToken();
  const resp = await fetch(url, {
    ...opts, headers: { Authorization: "Bearer " + token, ...(opts.headers || {}) },
  });
  if (resp.status === 401) throw new Error("unauthorized");
  if (resp.status === 403) throw new Error("forbidden");
  return resp;
}

async function ensureFolder() {
  if (driveFolderId) return driveFolderId;
  const q = encodeURIComponent(
    "name='" + DRIVE_FOLDER + "' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  let resp = await driveFetch("https://www.googleapis.com/drive/v3/files?fields=files(id)&q=" + q);
  let json = await resp.json();
  if (json.files && json.files[0]) { driveFolderId = json.files[0].id; return driveFolderId; }
  resp = await driveFetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: DRIVE_FOLDER, mimeType: "application/vnd.google-apps.folder" }),
  });
  json = await resp.json();
  driveFolderId = json.id;
  return driveFolderId;
}

async function findDriveFile() {
  if (driveFileId) return driveFileId;
  const folder = await ensureFolder();
  const q = encodeURIComponent(
    "name='" + DRIVE_FILE + "' and '" + folder + "' in parents and trashed=false");
  const resp = await driveFetch("https://www.googleapis.com/drive/v3/files?fields=files(id)&q=" + q);
  const json = await resp.json();
  driveFileId = json.files && json.files[0] ? json.files[0].id : null;
  return driveFileId;
}

export async function pullFromDrive() {
  const id = await findDriveFile();
  if (id) {
    const resp = await driveFetch("https://www.googleapis.com/drive/v3/files/" + id + "?alt=media");
    const remote = migrate(await resp.json());
    if ((remote.updatedAt || 0) > (state.data.updatedAt || 0)) {
      state.data = remote; saveLocal(state.data); applyTheme();
    }
  }
  const added = await processImports();
  await pushToDrive();
  if (added) toast(added + " cards importados do Drive");
}

async function processImports() {
  const q = encodeURIComponent(
    "name contains 'flashdeck-import' and trashed=false and mimeType != 'application/vnd.google-apps.folder'");
  const resp = await driveFetch("https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=" + q);
  const json = await resp.json();
  let added = 0;
  for (const f of json.files || []) {
    try {
      const r = await driveFetch("https://www.googleapis.com/drive/v3/files/" + f.id + "?alt=media");
      added += ingestImport(await r.json());
      await driveFetch("https://www.googleapis.com/drive/v3/files/" + f.id, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashed: true }),
      });
    } catch (e) { console.error("Falha ao importar", f.name, e); }
  }
  if (added) { state.data.updatedAt = Date.now(); saveLocal(state.data); renderRef(); }
  return added;
}

export async function pushToDrive() {
  const body = JSON.stringify(state.data);
  const id = await findDriveFile();
  if (id) {
    await driveFetch(
      "https://www.googleapis.com/upload/drive/v3/files/" + id + "?uploadType=media",
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
  } else {
    const folder = await ensureFolder();
    const boundary = "flashdeck" + Date.now();
    const multipart =
      "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify({ name: DRIVE_FILE, parents: [folder] }) +
      "\r\n--" + boundary + "\r\nContent-Type: application/json\r\n\r\n" +
      body + "\r\n--" + boundary + "--";
    const resp = await driveFetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      { method: "POST",
        headers: { "Content-Type": "multipart/related; boundary=" + boundary },
        body: multipart });
    const j = await resp.json();
    driveFileId = j.id;
  }
}

export async function syncNow() {
  if (!state.loggedIn) { toast("Entre com o Google para sincronizar."); return; }
  setSync("syncing");
  try { await pullFromDrive(); setSync("synced"); toast("Sincronizado"); renderRef(); }
  catch (e) { console.error(e); handleSyncError(e); }
}

export function handleSyncError(e) {
  setSync("error");
  if (e && e.message === "forbidden") {
    localStorage.removeItem("flashdeck-scopev");
    state.loggedIn = false;
    toast("Permissões desatualizadas: entre com o Google e aceite de novo.");
    renderRef();
  } else toast("Erro ao sincronizar com o Drive.");
}

export function scheduleDriveSync() {
  if (!state.loggedIn) return;
  setSync("syncing");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await pushToDrive(); setSync("synced"); }
    catch (e) { console.error(e); handleSyncError(e); }
  }, 1500);
}
