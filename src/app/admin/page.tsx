"use client";

import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { cmsSections } from "@/data/cms-sections";
import { projectImages } from "@/data/project-images";

const API = (process.env.NEXT_PUBLIC_CMS_API_URL || "").replace(/\/$/, "");
type MediaItem = { id: number; filename: string; original_name: string; media_type: "image" | "video"; title: string; alt_text: string; url?: string };
type Values = Record<string, string | string[]>;
const tabs = ["home", "about", "services", "projects", "contact", "media"] as const;
type Tab = (typeof tabs)[number];

function mergedPageValues(stored: Record<string, unknown>): Record<string, Values> {
  return Object.fromEntries(Object.entries(cmsSections).map(([key, section]) => {
    const saved = stored[key] && typeof stored[key] === "object" ? stored[key] as Record<string, unknown> : {};
    return [key, { ...section.defaults, ...saved } as Values];
  }));
}

export default function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [csrf, setCsrf] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [values, setValues] = useState<Record<string, Values>>(() => mergedPageValues({}));
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!API) throw new Error("Set NEXT_PUBLIC_CMS_API_URL to the hosted PHP API base URL (ending in /api)." );
    const response = await fetch(`${API}${path}`, { ...init, credentials: "include", headers: { ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(init.headers || {}) } });
    const type = response.headers.get("content-type") || "";
    const result = type.includes("application/json") ? await response.json() : null;
    if (!response.ok) throw new Error(result?.error || `Request failed (${response.status}).`);
    return result;
  }, []);

  async function refresh() {
    const [contentResult, mediaResult] = await Promise.all([request("/content"), request("/admin/media")]);
    setValues(mergedPageValues(contentResult.sections || {}));
    setMedia(mediaResult.media || []);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await request("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setCsrf(result.csrfToken); await refresh(); setLoggedIn(true); setPassword(""); setNotice("You are signed in. Content saves will appear on the public pages when the CMS API is connected.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not sign in."); }
    finally { setBusy(false); }
  }

  function editField(key: string, value: string) {
    setValues((current) => ({ ...current, [activeTab]: { ...current[activeTab], [key]: value } }));
  }

  function toggleImage(src: string) {
    const current = Array.isArray(values.projects?.images) ? values.projects.images as string[] : projectImages.map((image) => image.src);
    const next = current.includes(src) ? current.filter((item) => item !== src) : [...current, src];
    setValues((existing) => ({ ...existing, projects: { ...existing.projects, images: next } }));
  }

  async function saveSection() {
    setBusy(true); setNotice("");
    try {
      await request("/admin/content", { method: "PUT", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify({ key: activeTab, content: values[activeTab] }) });
      setNotice(`${cmsSections[activeTab as keyof typeof cmsSections]?.label || "Content"} saved. The connected public page will use the updated text.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save content."); }
    finally { setBusy(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); const form = event.currentTarget; const data = new FormData(form);
    try { await request("/admin/media", { method: "POST", headers: { "X-CSRF-Token": csrf }, body: data }); form.reset(); await refresh(); setNotice("Media uploaded to the backend library."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  async function removeMedia(id: number) {
    if (!window.confirm("Delete this uploaded media item and its stored file? This cannot be undone.")) return;
    setBusy(true); setNotice("");
    try { await request(`/admin/media/${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrf } }); await refresh(); setNotice("Uploaded media deleted."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not delete media."); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await request("/admin/logout", { method: "POST", headers: { "X-CSRF-Token": csrf } }); setLoggedIn(false); setCsrf(""); setMedia([]); setNotice("Signed out."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not sign out."); }
    finally { setBusy(false); }
  }

  const currentValues = values[activeTab] || {};
  const currentSection = activeTab !== "media" ? cmsSections[activeTab] : null;
  const selectedImages = Array.isArray(values.projects?.images) ? values.projects.images as string[] : projectImages.map((image) => image.src);
  const tabLabel = (tab: Tab) => tab === "projects" ? "Projects & images" : tab === "media" ? "Uploads" : cmsSections[tab].label;

  return <main id="main-content" className="admin-page"><section className="admin-shell">
    <div className="admin-heading"><div><p className="eyebrow">OVC website management</p><h1>Content studio</h1><p>Edit page copy, choose the client-supplied gallery images, and upload new media.</p></div>{loggedIn && <button className="button button-outline-dark" onClick={logout} disabled={busy}>Sign out</button>}</div>
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    {!loggedIn ? <form className="admin-login" onSubmit={login}><div className="admin-login-mark">OVC <span>CONTENT STUDIO</span></div><h2>Administrator sign in</h2><p>Sign in with the admin account configured on your PHP hosting.</p><label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button button-gold" disabled={busy}>{busy ? "Please wait…" : "Sign in"}</button></form> : <div className="admin-workspace">
      <nav className="admin-tab-bar" role="tablist" aria-label="Content sections">{tabs.map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={`admin-tab${activeTab === tab ? " is-active" : ""}`} onClick={() => setActiveTab(tab)}>{tabLabel(tab)}{tab === "projects" && <span className="admin-tab-count">{projectImages.length}</span>}</button>)}</nav>
      {currentSection ? <div className="admin-editor-layout"><section className="admin-panel admin-editor-panel" role="tabpanel"><div className="admin-panel-heading"><div><p className="eyebrow">{currentSection.eyebrow}</p><h2>{currentSection.label}</h2><p>Changes are stored in your MySQL content database.</p></div><button className="button button-navy" onClick={saveSection} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
        <div className="admin-form-fields">{currentSection.fields.map((field) => <label className="admin-field" key={field.key}><span>{field.label}</span>{field.multiline ? <textarea rows={4} maxLength={1500} value={typeof currentValues[field.key] === "string" ? currentValues[field.key] as string : ""} onChange={(event) => editField(field.key, event.target.value)} /> : <input maxLength={300} value={typeof currentValues[field.key] === "string" ? currentValues[field.key] as string : ""} onChange={(event) => editField(field.key, event.target.value)} />}<small>{field.help}</small></label>)}</div>
        {activeTab === "projects" && <section className="admin-image-selector"><div className="admin-selector-heading"><div><h3>Choose gallery images</h3><p>Only images supplied in the client archive are listed. Select the images to display publicly.</p></div><span>{selectedImages.length} selected</span></div><div className="admin-asset-grid">{projectImages.map((image) => <label key={image.src} className={`admin-asset-card${selectedImages.includes(image.src) ? " selected" : ""}`}><input type="checkbox" checked={selectedImages.includes(image.src)} onChange={() => toggleImage(image.src)} /><Image src={image.src} alt={image.alt} width={240} height={160} /><span className="admin-asset-title">{image.title}</span><small>{image.category}</small></label>)}</div></section>}
      </section><aside className="admin-side-panel"><div className="admin-side-card"><span className="admin-side-number">{activeTab === "projects" ? String(selectedImages.length).padStart(2, "0") : "01"}</span><h3>{activeTab === "projects" ? "Selected images" : "Page editing"}</h3><p>{activeTab === "projects" ? "Use the checkboxes to control which client-supplied images appear on the portfolio page. No project names or completion claims are added." : "Use the labelled fields to update visible page copy. Keep wording factual and confirm any new business details before publishing."}</p></div><div className="admin-side-card admin-side-card-muted"><h3>Saved content</h3><p>Backend: PHP + MySQL</p><p>Site: Next.js on Vercel</p><p>Assets: client-provided WebP files</p></div></aside></div> : <div className="admin-media-layout"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Media library</p><h2>Upload images &amp; videos</h2><p>Upload new approved assets to the PHP backend storage.</p></div></div><form className="admin-upload" onSubmit={upload}><label>Choose image or video<input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" required /></label><label>Title<input name="title" maxLength={180} /></label><label>Alt text / description<input name="alt_text" maxLength={300} /></label><button className="button button-gold" disabled={busy}>{busy ? "Uploading…" : "Upload media"}</button></form><div className="admin-media-list"><h3>Uploaded media ({media.length})</h3>{media.length ? media.map((item) => <article className="admin-media-item" key={item.id}><div><strong>{item.title || item.original_name}</strong><span>{item.media_type} · {item.alt_text || "No description"}</span></div><button type="button" className="admin-delete" disabled={busy} onClick={() => removeMedia(item.id)}>Delete</button></article>) : <p>No uploads yet. Static client assets are in the Projects &amp; images tab.</p>}</div></section><aside className="admin-side-panel"><div className="admin-side-card"><span className="admin-side-number">{projectImages.length}</span><h3>Optimized site images</h3><p>The supplied project visuals have already been converted to WebP and are selectable on the Projects &amp; images tab.</p><button className="button button-outline-dark" onClick={() => setActiveTab("projects")}>Edit gallery selection</button></div></aside></div>}
    </div>}
  </section></main>;
}
