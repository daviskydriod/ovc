"use client";

import { FormEvent, useCallback, useState } from "react";

const API = (process.env.NEXT_PUBLIC_CMS_API_URL || "https://api.ovcconstructions.com/api").replace(/\/$/, "");
type Enquiry = { id: number; full_name: string; phone: string; email: string; service: string; location: string; description: string; status: "new" | "contacted" | "closed"; created_at: string };
type ProjectRecord = { id: number; slug: string; title: string; summary: string; description: string; category: string; cover_url: string | null; status: "draft" | "published"; sort_order: number };
type Tab = "projects" | "enquiries";
const emptyProject = { slug: "", title: "", summary: "", description: "", category: "", status: "draft", sort_order: "0" };

export default function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [csrf, setCsrf] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [projectDraft, setProjectDraft] = useState({ ...emptyProject });
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...init,
      credentials: "include",
      headers: { ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(init.headers || {}) },
    });
    const type = response.headers.get("content-type") || "";
    const result = type.includes("application/json") ? await response.json() : null;
    if (!response.ok) throw new Error(result?.error || `Request failed (${response.status}).`);
    return result;
  }, []);

  async function refresh() {
    const [enquiryResult, projectsResult] = await Promise.all([
      request("/admin/enquiries?limit=100"),
      request("/admin/projects?limit=100"),
    ]);
    setEnquiries(enquiryResult.enquiries || []);
    setProjectRecords(projectsResult.projects || []);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await request("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setCsrf(result.csrfToken); await refresh(); setLoggedIn(true); setPassword(""); setNotice("Signed in. You can manage projects, project images, and submitted enquiries.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not sign in."); }
    finally { setBusy(false); }
  }

  function startProjectEdit(project: ProjectRecord) {
    setEditingProjectId(project.id);
    setProjectDraft({ slug: project.slug, title: project.title, summary: project.summary, description: project.description, category: project.category, status: project.status, sort_order: String(project.sort_order) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetProjectDraft() { setEditingProjectId(null); setProjectDraft({ ...emptyProject }); }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const payload = { ...projectDraft, sort_order: Number(projectDraft.sort_order) };
    try {
      if (editingProjectId) await request(`/admin/projects/${editingProjectId}`, { method: "PATCH", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify(payload) });
      else await request("/admin/projects", { method: "POST", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify(payload) });
      await refresh(); resetProjectDraft(); setNotice(editingProjectId ? "Project updated." : "Project added.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save project."); }
    finally { setBusy(false); }
  }

  async function removeProject(id: number) {
    if (!window.confirm("Permanently delete this project record?")) return;
    setBusy(true); setNotice("");
    try { await request(`/admin/projects/${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrf } }); await refresh(); if (editingProjectId === id) resetProjectDraft(); setNotice("Project deleted."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not delete project."); }
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
    try { await request("/admin/logout", { method: "POST", headers: { "X-CSRF-Token": csrf } }); setLoggedIn(false); setCsrf(""); setEnquiries([]); setProjectRecords([]); setNotice("Signed out."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not sign out."); }
    finally { setBusy(false); }
  }

  return <main id="main-content" className="admin-page"><section className="admin-shell">
    <div className="admin-heading"><div><p className="eyebrow">OVC project desk</p><h1>Projects &amp; enquiries</h1><p>Manage project listings and photos, and review submitted customer enquiries.</p></div>{loggedIn && <button className="button button-outline-dark" onClick={logout} disabled={busy}>Sign out</button>}</div>
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    {!loggedIn ? <form className="admin-login" onSubmit={login}><div className="admin-login-mark">OVC <span>PROJECT DESK</span></div><h2>Sign in</h2><p>Sign in with the administrator account configured for the PHP API.</p><label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button button-gold" disabled={busy}>{busy ? "Please wait…" : "Sign in"}</button></form> : <div className="admin-workspace">
      <nav className="admin-tab-bar admin-sidebar" role="tablist" aria-label="Project desk sections">
        <button role="tab" aria-selected={activeTab === "projects"} className={`admin-tab${activeTab === "projects" ? " is-active" : ""}`} onClick={() => setActiveTab("projects")}>Projects &amp; images<span className="admin-tab-count">{projectRecords.length}</span></button>
        <button role="tab" aria-selected={activeTab === "enquiries"} className={`admin-tab${activeTab === "enquiries" ? " is-active" : ""}`} onClick={() => setActiveTab("enquiries")}>Enquiries<span className="admin-tab-count">{enquiries.length}</span></button>
      </nav>
      {activeTab === "projects" ? <section className="admin-panel admin-inbox-panel" role="tabpanel">
        <div className="admin-panel-heading"><div><p className="eyebrow">Portfolio</p><h2>{editingProjectId ? "Edit project" : "Add a project"}</h2><p>Create project listings and attach uploaded images. Published projects appear on the public projects pages.</p></div></div>
        <div className="admin-upload admin-project-image-upload"><h3>Project images come from the database</h3><p>Add an approved image URL from the public GitHub repository to the project row using the provided SQL template. The dashboard does not upload or edit project images.</p></div>
        <form className="admin-project-form" onSubmit={saveProject}><div className="admin-form-fields">
          <label className="admin-field"><span>Project title *</span><input required maxLength={180} value={projectDraft.title} onChange={(event) => setProjectDraft((item) => ({ ...item, title: event.target.value, slug: item.slug || event.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))}/></label>
          <label className="admin-field"><span>URL slug *</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={projectDraft.slug} onChange={(event) => setProjectDraft((item) => ({ ...item, slug: event.target.value }))}/></label>
          <label className="admin-field"><span>Category</span><input maxLength={120} value={projectDraft.category} onChange={(event) => setProjectDraft((item) => ({ ...item, category: event.target.value }))}/></label>
          <label className="admin-field"><span>Short summary</span><textarea rows={2} maxLength={500} value={projectDraft.summary} onChange={(event) => setProjectDraft((item) => ({ ...item, summary: event.target.value }))}/></label>
          <label className="admin-field"><span>Project description *</span><textarea required rows={5} maxLength={12000} value={projectDraft.description} onChange={(event) => setProjectDraft((item) => ({ ...item, description: event.target.value }))}/></label>
          <label className="admin-field"><span>Publication status</span><select value={projectDraft.status} onChange={(event) => setProjectDraft((item) => ({ ...item, status: event.target.value }))}><option value="draft">Draft (private)</option><option value="published">Published</option></select></label>
        </div><div className="form-submit-row"><button className="button button-navy" disabled={busy}>{busy ? "Saving…" : editingProjectId ? "Save project" : "Add project"}</button>{editingProjectId && <button className="button button-outline-dark" type="button" onClick={resetProjectDraft}>Cancel edit</button>}</div></form>
        <div className="admin-media-list"><h3>Projects ({projectRecords.length})</h3>{projectRecords.length ? projectRecords.map((item) => <article className="admin-media-item" key={item.id}><div><strong>{item.title}</strong><span>/{item.slug} · {item.category || "Uncategorized"} · {item.status}{item.cover_url ? " · GitHub image linked" : " · no image linked"}</span></div><button className="button button-outline-dark" type="button" disabled={busy} onClick={() => startProjectEdit(item)}>Edit project details</button><button type="button" className="admin-delete" disabled={busy} onClick={() => removeProject(item.id)}>Delete</button></article>) : <p>No projects have been added yet.</p>}</div>
      </section> : <section className="admin-panel admin-inbox-panel" role="tabpanel"><div className="admin-panel-heading"><div><p className="eyebrow">Submitted contact forms</p><h2>Project enquiries</h2><p>Each card shows the complete information submitted by the customer.</p></div><span className="admin-tab-count">{enquiries.length}</span></div>
        {enquiries.length ? <div className="admin-enquiry-list">{enquiries.map((item) => <article className="admin-enquiry-card" key={item.id}><div className="admin-enquiry-top"><span className={`admin-enquiry-status status-${item.status}`}>{item.status}</span><time dateTime={item.created_at}>{new Date(`${item.created_at.replace(" ", "T")}Z`).toLocaleString()}</time></div><h3>{item.full_name}</h3><div className="admin-enquiry-details"><p><strong>Phone:</strong> <a href={`tel:${item.phone}`}>{item.phone}</a></p><p><strong>Email:</strong> <a href={`mailto:${item.email}`}>{item.email}</a></p><p><strong>Service:</strong> {item.service}</p><p><strong>Location:</strong> {item.location}</p><div><strong>Project details:</strong><p className="admin-enquiry-description">{item.description}</p></div></div><label className="admin-field">Follow-up status<select value={item.status} disabled={busy} onChange={(event) => updateEnquiry(item, event.target.value as Enquiry["status"])}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></label></article>)}</div> : <p className="admin-inbox-empty">No enquiries have been received yet.</p>}
      </section>}
    </div>}
  </section></main>;
}
