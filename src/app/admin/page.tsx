"use client";

import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { cmsSections } from "@/data/cms-sections";
import { projectImages } from "@/data/project-images";

const API = (process.env.NEXT_PUBLIC_CMS_API_URL || "https://ovcconstructions.com/api").replace(/\/$/, "");
type MediaItem = { id: number; filename: string; original_name: string; media_type: "image" | "video"; title: string; alt_text: string; is_published: boolean; url?: string };
type Enquiry = { id: number; full_name: string; phone: string; email: string; service: string; location: string; description: string; status: "new" | "contacted" | "closed"; internal_note?: string; created_at: string };
type ProjectRecord = { id: number; slug: string; title: string; summary: string; description: string; category: string; cover_media_id: number | null; cover_url: string | null; status: "draft" | "published"; sort_order: number };
type Values = Record<string, string | string[]>;
type Tab = "home" | "about" | "services" | "projects" | "projectRecords" | "contact" | "enquiries" | "media";
const tabs: Tab[] = ["home", "about", "services", "projects", "projectRecords", "contact", "enquiries", "media"];
const emptyProject = { slug: "", title: "", summary: "", description: "", category: "", cover_media_id: "", status: "draft", sort_order: "0" };

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
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [projectDraft, setProjectDraft] = useState({ ...emptyProject });
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!API) throw new Error("Set NEXT_PUBLIC_CMS_API_URL to the hosted PHP API base URL (ending in /api).");
    const response = await fetch(`${API}${path}`, { ...init, credentials: "include", headers: { ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(init.headers || {}) } });
    const type = response.headers.get("content-type") || "";
    const result = type.includes("application/json") ? await response.json() : null;
    if (!response.ok) throw new Error(result?.error || `Request failed (${response.status}).`);
    return result;
  }, []);

  async function refresh() {
    const [contentResult, mediaResult, enquiryResult, projectsResult] = await Promise.all([
      request("/content"), request("/admin/media?limit=100"), request("/admin/enquiries?limit=100"), request("/admin/projects?limit=100"),
    ]);
    setValues(mergedPageValues(contentResult.sections || {}));
    setMedia(mediaResult.media || []);
    setEnquiries(enquiryResult.enquiries || []);
    setProjectRecords(projectsResult.projects || []);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await request("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setCsrf(result.csrfToken); await refresh(); setLoggedIn(true); setPassword(""); setNotice("Signed in. You can manage page copy, project records, media and enquiries.");
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
      setNotice(`${cmsSections[activeTab as keyof typeof cmsSections]?.label || "Content"} saved.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save content."); }
    finally { setBusy(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); const form = event.currentTarget; const data = new FormData(form);
    try { await request("/admin/media", { method: "POST", headers: { "X-CSRF-Token": csrf }, body: data }); form.reset(); await refresh(); setNotice("Media uploaded to the backend library."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  async function updateMediaPublished(item: MediaItem) {
    setBusy(true); setNotice("");
    try { await request(`/admin/media/${item.id}`, { method: "PATCH", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify({ is_published: !item.is_published }) }); await refresh(); setNotice("Media publication status updated."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not update media."); }
    finally { setBusy(false); }
  }

  async function removeMedia(id: number) {
    if (!window.confirm("Permanently delete this uploaded media item and stored file?")) return;
    setBusy(true); setNotice("");
    try { await request(`/admin/media/${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrf } }); await refresh(); setNotice("Uploaded media deleted."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not delete media."); }
    finally { setBusy(false); }
  }

  function startProjectEdit(project: ProjectRecord) {
    setEditingProjectId(project.id);
    setProjectDraft({ slug: project.slug, title: project.title, summary: project.summary, description: project.description, category: project.category, cover_media_id: project.cover_media_id ? String(project.cover_media_id) : "", status: project.status, sort_order: String(project.sort_order) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetProjectDraft() { setEditingProjectId(null); setProjectDraft({ ...emptyProject }); }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const payload = { ...projectDraft, cover_media_id: projectDraft.cover_media_id ? Number(projectDraft.cover_media_id) : null, sort_order: Number(projectDraft.sort_order) };
    try {
      if (editingProjectId) await request(`/admin/projects/${editingProjectId}`, { method: "PATCH", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify(payload) });
      else await request("/admin/projects", { method: "POST", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify(payload) });
      await refresh(); resetProjectDraft(); setNotice(editingProjectId ? "Project record updated." : "Project record created.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save project record."); }
    finally { setBusy(false); }
  }

  async function removeProject(id: number) {
    if (!window.confirm("Permanently delete this project record?")) return;
    setBusy(true); setNotice("");
    try { await request(`/admin/projects/${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrf } }); await refresh(); if (editingProjectId === id) resetProjectDraft(); setNotice("Project record deleted."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not delete project record."); }
    finally { setBusy(false); }
  }

  async function updateEnquiry(enquiry: Enquiry, status: Enquiry["status"]) {
    setBusy(true); setNotice("");
    try { await request(`/admin/enquiries/${enquiry.id}`, { method: "PATCH", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify({ status }) }); await refresh(); setNotice("Enquiry status updated."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not update enquiry."); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await request("/admin/logout", { method: "POST", headers: { "X-CSRF-Token": csrf } }); setLoggedIn(false); setCsrf(""); setMedia([]); setEnquiries([]); setProjectRecords([]); setNotice("Signed out."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not sign out."); }
    finally { setBusy(false); }
  }

  const currentValues = values[activeTab] || {};
  const currentSection = activeTab !== "media" && activeTab !== "enquiries" && activeTab !== "projectRecords" ? cmsSections[activeTab] : null;
  const selectedImages = Array.isArray(values.projects?.images) ? values.projects.images as string[] : projectImages.map((image) => image.src);
  const tabLabel = (tab: Tab) => tab === "projects" ? "Projects & images" : tab === "projectRecords" ? "Project records" : tab === "media" ? "Uploads" : tab === "enquiries" ? "Enquiries" : cmsSections[tab].label;

  return <main id="main-content" className={`admin-page${loggedIn ? " admin-page-authenticated" : " admin-page-unauthenticated"}`}><section className="admin-shell">
    {loggedIn && <div className="admin-heading"><div><p className="eyebrow">OVC website management</p><h1>Content studio</h1><p>Edit website sections, create project records, manage uploads and follow up on enquiries.</p></div><button className="button button-outline-dark" onClick={logout} disabled={busy}>Sign out</button></div>}
    {loggedIn && notice && <p className="admin-notice" role="status">{notice}</p>}
    {!loggedIn ? <form className="admin-login admin-login-split" onSubmit={login}>
      <div className="admin-login-photo">
        <Image src="/projects/client-building-construction-photo.webp" alt="Client-provided construction photograph" fill priority sizes="(max-width: 680px) 100vw, 52vw" />
        <div className="admin-login-photo-overlay">
          <Image src="/brand/ovc-reverse-white-transparent.png" alt="Okechukwu Venatius Chibuike Ltd." width={369} height={220} className="admin-login-photo-logo" />
          <div className="admin-login-photo-copy"><p className="eyebrow">OVC CONTENT STUDIO</p><h1>Manage your digital presence.</h1><p>One secure workspace for your website content, projects, media and customer enquiries.</p></div>
          <p className="admin-login-photo-caption">Client-provided construction photograph</p>
        </div>
      </div>
      <div className="admin-login-panel">
        <Image src="/brand/ovc-primary-transparent.png" alt="OVC" width={636} height={266} className="admin-login-brand" />
        <p className="eyebrow">ADMINISTRATOR PORTAL</p><h2>Welcome back</h2><p>Sign in with the admin account configured on your PHP hosting.</p>
        {notice && <p className="admin-login-notice" role="alert">{notice}</p>}
        <label>Username<input name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="button button-gold" disabled={busy}>{busy ? "Please wait…" : "Sign in"}</button>
        <p className="admin-login-footnote">Secure access for authorized OVC administrators.</p>
      </div>
    </form> : <div className="admin-workspace">
      <nav className="admin-tab-bar" role="tablist" aria-label="Content sections">{tabs.map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={`admin-tab${activeTab === tab ? " is-active" : ""}`} onClick={() => setActiveTab(tab)}>{tabLabel(tab)}{tab === "projects" && <span className="admin-tab-count">{projectImages.length}</span>}{tab === "projectRecords" && <span className="admin-tab-count">{projectRecords.length}</span>}{tab === "enquiries" && <span className="admin-tab-count">{enquiries.length}</span>}</button>)}</nav>
      {currentSection ? <div className="admin-editor-layout"><section className="admin-panel admin-editor-panel" role="tabpanel"><div className="admin-panel-heading"><div><p className="eyebrow">{currentSection.eyebrow}</p><h2>{currentSection.label}</h2><p>Changes are stored in your MySQL content database.</p></div><button className="button button-navy" onClick={saveSection} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
        <div className="admin-form-fields">{currentSection.fields.map((field) => <label className="admin-field" key={field.key}><span>{field.label}</span>{field.multiline ? <textarea rows={4} maxLength={1500} value={typeof currentValues[field.key] === "string" ? currentValues[field.key] as string : ""} onChange={(event) => editField(field.key, event.target.value)} /> : <input maxLength={300} value={typeof currentValues[field.key] === "string" ? currentValues[field.key] as string : ""} onChange={(event) => editField(field.key, event.target.value)} />}<small>{field.help}</small></label>)}</div>
        {activeTab === "projects" && <section className="admin-image-selector"><div className="admin-selector-heading"><div><h3>Choose gallery images</h3><p>Only images supplied in the client archive are listed. Select the images to display publicly.</p></div><span>{selectedImages.length} selected</span></div><div className="admin-asset-grid">{projectImages.map((image) => <label key={image.src} className={`admin-asset-card${selectedImages.includes(image.src) ? " selected" : ""}`}><input type="checkbox" checked={selectedImages.includes(image.src)} onChange={() => toggleImage(image.src)} /><Image src={image.src} alt={image.alt} width={240} height={160} /><span className="admin-asset-title">{image.title}</span><small>{image.category}</small></label>)}</div></section>}
      </section><aside className="admin-side-panel"><div className="admin-side-card"><span className="admin-side-number">{activeTab === "projects" ? String(selectedImages.length).padStart(2, "0") : "01"}</span><h3>{activeTab === "projects" ? "Selected images" : "Page editing"}</h3><p>{activeTab === "projects" ? "Select client-supplied images for the static portfolio gallery." : "Use the labelled fields to update visible page copy. Confirm new business details before publishing."}</p></div><div className="admin-side-card admin-side-card-muted"><h3>Saved content</h3><p>Backend: PHP + MySQL</p><p>Site: Next.js with revalidation</p><p>Assets: client-provided WebP files</p></div></aside></div>
      : activeTab === "projectRecords" ? <section className="admin-panel admin-inbox-panel" role="tabpanel"><div className="admin-panel-heading"><div><p className="eyebrow">Portfolio management</p><h2>{editingProjectId ? "Edit project record" : "Add a project record"}</h2><p>Drafts stay private. Published records appear in the pre-rendered portfolio after its revalidation window.</p></div></div><form className="admin-project-form" onSubmit={saveProject}><div className="admin-form-fields"><label className="admin-field"><span>Project title *</span><input required maxLength={180} value={projectDraft.title} onChange={(event) => setProjectDraft((item) => ({ ...item, title: event.target.value, slug: item.slug || event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))}/></label><label className="admin-field"><span>URL slug *</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={projectDraft.slug} onChange={(event) => setProjectDraft((item) => ({ ...item, slug: event.target.value }))}/></label><label className="admin-field"><span>Category</span><input maxLength={120} value={projectDraft.category} onChange={(event) => setProjectDraft((item) => ({ ...item, category: event.target.value }))}/></label><label className="admin-field"><span>Sort order</span><input type="number" value={projectDraft.sort_order} onChange={(event) => setProjectDraft((item) => ({ ...item, sort_order: event.target.value }))}/></label><label className="admin-field"><span>Short summary</span><textarea rows={2} maxLength={500} value={projectDraft.summary} onChange={(event) => setProjectDraft((item) => ({ ...item, summary: event.target.value }))}/></label><label className="admin-field"><span>Project description *</span><textarea required rows={5} maxLength={12000} value={projectDraft.description} onChange={(event) => setProjectDraft((item) => ({ ...item, description: event.target.value }))}/></label><label className="admin-field"><span>Cover image</span><select value={projectDraft.cover_media_id} onChange={(event) => setProjectDraft((item) => ({ ...item, cover_media_id: event.target.value }))}><option value="">No uploaded cover image</option>{media.filter((item) => item.media_type === "image").map((item) => <option value={item.id} key={item.id}>{item.title || item.original_name}{item.is_published ? "" : " (unpublished)"}</option>)}</select><small>Upload an approved photo first in the Uploads tab. Client gallery selection remains available separately.</small></label><label className="admin-field"><span>Publication status</span><select value={projectDraft.status} onChange={(event) => setProjectDraft((item) => ({ ...item, status: event.target.value }))}><option value="draft">Draft (private)</option><option value="published">Published</option></select></label></div><div className="form-submit-row"><button className="button button-navy" disabled={busy}>{busy ? "Saving…" : editingProjectId ? "Save project" : "Create project"}</button>{editingProjectId && <button className="button button-outline-dark" type="button" onClick={resetProjectDraft}>Cancel edit</button>}</div></form><div className="admin-media-list"><h3>Project records ({projectRecords.length})</h3>{projectRecords.length ? projectRecords.map((item) => <article className="admin-media-item" key={item.id}><div><strong>{item.title}</strong><span>/{item.slug} · {item.category || "Uncategorized"} · {item.status}</span></div><button className="button button-outline-dark" type="button" disabled={busy} onClick={() => startProjectEdit(item)}>Edit</button><button type="button" className="admin-delete" disabled={busy} onClick={() => removeProject(item.id)}>Delete</button></article>) : <p>No project records yet. Published client-supplied gallery images remain visible separately.</p>}</div></section>
      : activeTab === "enquiries" ? <section className="admin-panel admin-inbox-panel" role="tabpanel"><div className="admin-panel-heading"><div><p className="eyebrow">Customer enquiries</p><h2>Project inbox</h2><p>Requests submitted through the public contact form. Contact details are private; handle them only for follow-up.</p></div><span className="admin-tab-count">{enquiries.length}</span></div>{enquiries.length ? <div className="admin-enquiry-list">{enquiries.map((item) => <article className="admin-enquiry-card" key={item.id}><div className="admin-enquiry-top"><span className={`admin-enquiry-status status-${item.status}`}>{item.status}</span><time dateTime={item.created_at}>{new Date(`${item.created_at.replace(" ", "T")}Z`).toLocaleString()}</time></div><h3>{item.full_name}</h3><p className="admin-enquiry-service">{item.service} <span>·</span> {item.location}</p><p className="admin-enquiry-description">{item.description}</p><div className="admin-enquiry-contacts"><a href={`tel:${item.phone}`}>{item.phone}</a><a href={`mailto:${item.email}`}>{item.email}</a></div><label className="admin-field">Status<select value={item.status} disabled={busy} onChange={(event) => updateEnquiry(item, event.target.value as Enquiry["status"])}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></label></article>)}</div> : <p className="admin-inbox-empty">No enquiries have been received yet.</p>}</section>
      : <div className="admin-media-layout"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Media library</p><h2>Upload images &amp; videos</h2><p>Upload approved assets to private PHP backend storage.</p></div></div><form className="admin-upload" onSubmit={upload}><label>Choose image or video<input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" required /></label><label>Title<input name="title" maxLength={180} /></label><label>Alt text / description<input name="alt_text" maxLength={300} /></label><button className="button button-gold" disabled={busy}>{busy ? "Uploading…" : "Upload media"}</button></form><div className="admin-media-list"><h3>Uploaded media ({media.length})</h3>{media.length ? media.map((item) => <article className="admin-media-item" key={item.id}><div><strong>{item.title || item.original_name}</strong><span>{item.media_type} · {item.is_published ? "Published" : "Private draft"} · {item.alt_text || "No description"}</span></div><button type="button" className="button button-outline-dark" disabled={busy} onClick={() => updateMediaPublished(item)}>{item.is_published ? "Unpublish" : "Publish"}</button><button type="button" className="admin-delete" disabled={busy} onClick={() => removeMedia(item.id)}>Delete</button></article>) : <p>No uploads yet. Static client assets are in the Projects &amp; images tab.</p>}</div></section><aside className="admin-side-panel"><div className="admin-side-card"><span className="admin-side-number">{projectImages.length}</span><h3>Optimized site images</h3><p>The supplied project visuals have been converted to WebP and can be selected separately.</p><button className="button button-outline-dark" onClick={() => setActiveTab("projects")}>Edit gallery selection</button></div></aside></div>}
    </div>}
  </section></main>;
}
