"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

const API = (process.env.NEXT_PUBLIC_CMS_API_URL || "https://api.ovcconstructions.com/api").replace(/\/$/, "");
type MediaItem = { id: number; filename: string; original_name: string; media_type: "image" | "video"; title: string; alt_text: string; is_published: boolean; url?: string };
type Enquiry = { id: number; full_name: string; phone: string; email: string; service: string; location: string; description: string; status: "new" | "contacted" | "closed"; created_at: string };
type ProjectRecord = { id: number; slug: string; title: string; summary: string; description: string; category: string; cover_media_id: number | null; cover_url: string | null; status: "draft" | "published"; sort_order: number };
type Tab = "projects" | "enquiries";
type ProjectDraft = { slug: string; title: string; summary: string; description: string; category: string; cover_media_id: string; cover_url: string; status: "draft" | "published"; sort_order: string };
const emptyProject: ProjectDraft = { slug: "", title: "", summary: "", description: "", category: "", cover_media_id: "", cover_url: "", status: "draft", sort_order: "0" };

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export default function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [csrf, setCsrf] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>({ ...emptyProject });
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [modalNotice, setModalNotice] = useState("");
  const [showSlugField, setShowSlugField] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<"all" | "published" | "draft">("all");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const addProjectButtonRef = useRef<HTMLButtonElement>(null);
  const projectTitleRef = useRef<HTMLInputElement>(null);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    let response: Response;
    try {
      response = await fetch(`${API}${path}`, {
        ...init,
        credentials: "include",
        headers: { ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(init.headers || {}) },
      });
    } catch {
      throw new Error("The browser could not reach the PHP API. Check the API URL and allow this site's exact origin in CORS_ALLOWED_ORIGINS.");
    }
    const type = response.headers.get("content-type") || "";
    const result = type.includes("application/json") ? await response.json() : null;
    if (!response.ok) throw new Error(result?.error || `Request failed (${response.status}).`);
    return result;
  }, []);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      request("/admin/media?limit=100&type=image"),
      request("/admin/enquiries?limit=100"),
      request("/admin/projects?limit=100"),
    ]);
    const labels = ["images", "enquiries", "projects"];
    const errors: string[] = [];
    results.forEach((result, index) => {
      if (result.status === "rejected") { errors.push(`${labels[index]}: ${messageFrom(result.reason)}`); return; }
      if (index === 0) setMedia(result.value.media || []);
      if (index === 1) setEnquiries(result.value.enquiries || []);
      if (index === 2) setProjectRecords(result.value.projects || []);
    });
    if (errors.length) throw new Error(errors.join(" · "));
  }, [request]);

  useEffect(() => {
    if (!showProjectModal) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => projectTitleRef.current?.focus(), 0);
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setShowProjectModal(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showProjectModal]);

  function closeProjectModal() {
    setShowProjectModal(false);
    setModalNotice("");
    window.setTimeout(() => addProjectButtonRef.current?.focus(), 0);
  }

  function openNewProject() {
    setEditingProjectId(null);
    setProjectDraft({ ...emptyProject });
    setSlugTouched(false);
    setShowSlugField(false);
    setModalNotice("");
    setShowProjectModal(true);
  }

  function openEditProject(project: ProjectRecord) {
    setEditingProjectId(project.id);
    setProjectDraft({
      slug: project.slug,
      title: project.title,
      summary: project.summary || "",
      description: project.description || "",
      category: project.category || "",
      cover_media_id: project.cover_media_id ? String(project.cover_media_id) : "",
      cover_url: project.cover_url || "",
      status: project.status,
      sort_order: String(project.sort_order ?? 0),
    });
    setSlugTouched(true);
    setShowSlugField(false);
    setModalNotice("");
    setShowProjectModal(true);
  }

  async function refreshAfterSignIn() {
    try {
      await refresh();
      setNotice("You’re signed in. Choose Projects or Enquiries to continue.");
    } catch (error) {
      setNotice(`You’re signed in, but some dashboard data did not load. ${messageFrom(error)}`);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const result = await request("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setCsrf(result.csrfToken);
      setLoggedIn(true);
      setPassword("");
      await refreshAfterSignIn();
    } catch (error) {
      setNotice(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  function closeLogin() {
    setLoggedIn(false);
    setCsrf("");
    setMedia([]);
    setEnquiries([]);
    setProjectRecords([]);
  }

  async function uploadImage(file: File, input: HTMLInputElement) {
    setBusy(true);
    setModalNotice("");
    const imageLabel = projectDraft.title.trim() || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    const form = new FormData();
    form.append("file", file);
    form.append("title", imageLabel);
    form.append("alt_text", projectDraft.title.trim() || imageLabel);
    try {
      const result = await request("/admin/media", { method: "POST", headers: { "X-CSRF-Token": csrf }, body: form });
      const id = Number(result.media?.id);
      if (!id) throw new Error("The upload completed, but the API did not return an image ID.");
      await request(`/admin/media/${id}`, { method: "PATCH", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify({ title: imageLabel, alt_text: projectDraft.title.trim() || imageLabel, is_published: true }) });
      setProjectDraft((current) => ({ ...current, cover_media_id: String(id), cover_url: "" }));
      const mediaResult = await request("/admin/media?limit=100&type=image");
      setMedia(mediaResult.media || []);
      setModalNotice("Image uploaded and selected. Save the project to attach it.");
    } catch (error) {
      setModalNotice(messageFrom(error));
    } finally {
      input.value = "";
      setBusy(false);
    }
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setModalNotice("");
    const wasEditing = editingProjectId !== null;
    const slug = projectDraft.slug.trim() || slugify(projectDraft.title);
    if (!slug) {
      setModalNotice("Add a title with at least one letter or number so the project URL can be created.");
      setBusy(false);
      return;
    }
    const description = projectDraft.description.trim();
    const payload = {
      ...projectDraft,
      slug,
      title: projectDraft.title.trim(),
      summary: projectDraft.summary.trim() || description.replace(/\s+/g, " ").slice(0, 220),
      description,
      category: projectDraft.category.trim(),
      cover_media_id: projectDraft.cover_media_id ? Number(projectDraft.cover_media_id) : null,
      cover_url: projectDraft.cover_media_id ? null : (projectDraft.cover_url || null),
      sort_order: Number(projectDraft.sort_order) || 0,
    };
    try {
      if (wasEditing) await request(`/admin/projects/${editingProjectId}`, { method: "PATCH", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify(payload) });
      else await request("/admin/projects", { method: "POST", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify(payload) });
      closeProjectModal();
      setEditingProjectId(null);
      setProjectDraft({ ...emptyProject });
      setNotice(wasEditing ? "Project updated." : "Project added.");
      try { await refresh(); }
      catch (error) { setNotice(`Project saved, but the list could not refresh. ${messageFrom(error)}`); }
    } catch (error) {
      setModalNotice(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeProject(project: ProjectRecord) {
    if (!window.confirm(`Delete “${project.title}”? An uploaded cover is removed only if no other project uses it.`)) return;
    setBusy(true);
    setNotice("");
    try {
      await request(`/admin/projects/${project.id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrf } });
      setProjectRecords((current) => current.filter((item) => item.id !== project.id));
      setNotice("Project deleted.");
      try { await refresh(); } catch (error) { setNotice(`Project deleted, but the list could not refresh. ${messageFrom(error)}`); }
    } catch (error) {
      setNotice(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function updateEnquiry(enquiry: Enquiry, status: Enquiry["status"]) {
    setBusy(true);
    setNotice("");
    try {
      await request(`/admin/enquiries/${enquiry.id}`, { method: "PATCH", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify({ status }) });
      setEnquiries((current) => current.map((item) => item.id === enquiry.id ? { ...item, status } : item));
      setNotice("Enquiry status updated.");
    } catch (error) {
      setNotice(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function reloadDashboard() {
    setBusy(true);
    setNotice("");
    try { await refresh(); setNotice("Dashboard refreshed."); }
    catch (error) { setNotice(messageFrom(error)); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    setNotice("");
    try {
      await request("/admin/logout", { method: "POST", headers: { "X-CSRF-Token": csrf } });
      closeLogin();
      setNotice("You’ve signed out.");
    } catch (error) {
      setNotice(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  const publishedCount = projectRecords.filter((item) => item.status === "published").length;
  const draftCount = projectRecords.length - publishedCount;
  const newEnquiryCount = enquiries.filter((item) => item.status === "new").length;
  const visibleProjects = projectRecords.filter((project) => {
    const matchesFilter = projectFilter === "all" || project.status === projectFilter;
    const text = `${project.title} ${project.category} ${project.slug}`.toLowerCase();
    return matchesFilter && text.includes(projectSearch.trim().toLowerCase());
  });

  if (!loggedIn) {
    return (
      <main id="main-content" className="admin-page admin-page-unauthenticated">
        <section className="admin-shell">
          <div className="admin-login-split">
            <div className="admin-login-photo">
              <Image src="/projects/client-building-construction-photo.webp" alt="" fill priority sizes="(max-width: 760px) 100vw, 55vw" />
              <div className="admin-login-photo-overlay">
                <Image className="admin-login-photo-logo" src="/brand/ovc-reverse-white-transparent.png" alt="OVC" width={369} height={220} priority />
                <div className="admin-login-photo-copy">
                  <p className="eyebrow">OVC PROJECT DESK</p>
                  <h1>Keep every project moving.</h1>
                  <p>One simple place to update project photos and follow up on new enquiries.</p>
                </div>
                <p className="admin-login-photo-caption">SECURE ADMIN ACCESS</p>
              </div>
            </div>
            <form className="admin-login-panel" onSubmit={login}>
              <Image className="admin-login-brand" src="/brand/ovc-primary-transparent.png" alt="Okechukwu Venatius Chibuike Ltd." width={636} height={266} priority />
              <p className="eyebrow">PROJECTS &amp; ENQUIRIES</p>
              <h2>Welcome back</h2>
              <p>Sign in to update project listings and review customer enquiries.</p>
              {notice && <p className="admin-login-notice" role="alert">{notice}</p>}
              <label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
              <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
              <button className="button button-gold" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
              <p className="admin-login-footnote">Authorized OVC staff only. Contact your site administrator if you cannot sign in.</p>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" className="admin-page admin-page-dashboard">
      <section className="admin-shell admin-shell-dashboard">
        <header className="admin-dashboard-header">
          <div className="admin-dashboard-brand">
            <Image src="/brand/ovc-primary-transparent.png" alt="OVC" width={636} height={266} />
            <span>PROJECT DESK</span>
          </div>
          <div className="admin-dashboard-heading">
            <div><p className="eyebrow">OVC ADMIN</p><h1>Good to see you.</h1><p>Keep projects up to date and stay on top of customer enquiries.</p></div>
            <div className="admin-header-actions"><button className="button button-outline-dark" type="button" onClick={reloadDashboard} disabled={busy}>{busy ? "Loading…" : "Refresh"}</button><button className="button button-outline-dark" type="button" onClick={logout} disabled={busy}>Sign out</button></div>
          </div>
        </header>

        {notice && <p className="admin-notice" role="status">{notice}</p>}

        <nav className="admin-tabs" role="tablist" aria-label="Admin sections">
          <button role="tab" aria-selected={activeTab === "projects"} aria-controls="admin-projects-panel" className={`admin-tab${activeTab === "projects" ? " is-active" : ""}`} onClick={() => setActiveTab("projects")}>Projects <span>{projectRecords.length}</span></button>
          <button role="tab" aria-selected={activeTab === "enquiries"} aria-controls="admin-enquiries-panel" className={`admin-tab${activeTab === "enquiries" ? " is-active" : ""}`} onClick={() => setActiveTab("enquiries")}>Enquiries <span>{newEnquiryCount ? `${newEnquiryCount} new` : enquiries.length}</span></button>
        </nav>

        {activeTab === "projects" ? (
          <section id="admin-projects-panel" className="admin-dashboard-panel" role="tabpanel">
            <div className="admin-stats-row">
              <article><span>All projects</span><strong>{projectRecords.length}</strong></article>
              <article><span>Published</span><strong>{publishedCount}</strong></article>
              <article><span>Drafts</span><strong>{draftCount}</strong></article>
            </div>
            <div className="admin-project-toolbar">
              <div><p className="eyebrow">YOUR PORTFOLIO</p><h2>Projects</h2><p>Manage each project and its main image from one place.</p></div>
              <button ref={addProjectButtonRef} className="button button-gold admin-add-project" type="button" onClick={openNewProject}>+ Add project</button>
            </div>
            <div className="admin-project-controls">
              <label className="admin-search-box"><span className="sr-only">Search projects</span><span aria-hidden="true">⌕</span><input value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search projects…" /></label>
              <div className="admin-filter-group" aria-label="Filter projects">
                {(["all", "published", "draft"] as const).map((filter) => <button type="button" key={filter} className={projectFilter === filter ? "is-selected" : ""} aria-pressed={projectFilter === filter} onClick={() => setProjectFilter(filter)}>{filter === "all" ? "All" : filter === "published" ? "Published" : "Drafts"}</button>)}
              </div>
            </div>
            {visibleProjects.length ? (
              <div className="admin-project-grid">
                {visibleProjects.map((project) => {
                  const image = project.cover_url || (project.cover_media_id ? media.find((item) => item.id === project.cover_media_id)?.url || "" : "");
                  return <article className="admin-project-card" key={project.id}>
                    <div className="admin-project-card-image">{image ? <img src={image} alt={project.title} loading="lazy" /> : <span>No cover image</span>}<span className={`admin-project-status status-${project.status}`}>{project.status === "published" ? "Published" : "Draft"}</span></div>
                    <div className="admin-project-card-body"><p className="admin-project-category">{project.category || "Uncategorized"}</p><h3>{project.title}</h3><p className="admin-project-card-summary">{project.summary || project.description}</p><div className="admin-project-card-actions"><button className="button button-navy" type="button" disabled={busy} onClick={() => openEditProject(project)}>Edit</button>{project.status === "published" && <a className="admin-project-view-link" href={`/projects/${project.slug}`} target="_blank" rel="noreferrer">View project ↗</a>}<button className="admin-delete" type="button" disabled={busy} onClick={() => removeProject(project)}>Delete</button></div></div>
                  </article>;
                })}
              </div>
            ) : <div className="admin-project-empty"><span className="admin-empty-mark">+</span><h3>{projectSearch || projectFilter !== "all" ? "No matching projects" : "No projects yet"}</h3><p>{projectSearch || projectFilter !== "all" ? "Try a different search or filter." : "Add your first project and attach a photo. You can keep it as a draft until it’s ready."}</p>{!projectSearch && projectFilter === "all" && <button className="button button-gold" type="button" onClick={openNewProject}>Add your first project</button>}</div>}
          </section>
        ) : (
          <section id="admin-enquiries-panel" className="admin-dashboard-panel" role="tabpanel">
            <div className="admin-project-toolbar"><div><p className="eyebrow">CUSTOMER MESSAGES</p><h2>Enquiries</h2><p>Review the details customers sent and update the follow-up status.</p></div><span className="admin-enquiry-total">{newEnquiryCount} new · {enquiries.length} total</span></div>
            {enquiries.length ? <div className="admin-enquiry-list">{enquiries.map((item) => <article className="admin-enquiry-card" key={item.id}><div className="admin-enquiry-top"><span className={`admin-enquiry-status status-${item.status}`}>{item.status}</span><time dateTime={item.created_at}>{new Date(`${item.created_at.replace(" ", "T")}Z`).toLocaleString()}</time></div><h3>{item.full_name}</h3><div className="admin-enquiry-details"><p><strong>Phone</strong><a href={`tel:${item.phone}`}>{item.phone}</a></p><p><strong>Email</strong><a href={`mailto:${item.email}`}>{item.email}</a></p><p><strong>Service</strong><span>{item.service}</span></p><p><strong>Location</strong><span>{item.location}</span></p><div className="admin-enquiry-project-details"><strong>Project details</strong><p>{item.description}</p></div></div><label className="admin-enquiry-status-field">Follow-up status<select value={item.status} disabled={busy} onChange={(event) => updateEnquiry(item, event.target.value as Enquiry["status"])}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></label></article>)}</div> : <div className="admin-project-empty"><span className="admin-empty-mark">✓</span><h3>No enquiries yet</h3><p>New website enquiries will appear here with the details submitted by the customer.</p></div>}
          </section>
        )}
      </section>

      {showProjectModal && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeProjectModal(); }}>
        <section className="admin-project-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-project-modal-title" aria-describedby="admin-project-modal-help">
          <header className="admin-modal-header"><div><p className="eyebrow">PROJECT DETAILS</p><h2 id="admin-project-modal-title">{editingProjectId ? "Edit project" : "Add a project"}</h2><p id="admin-project-modal-help">Add the main details and image. The project URL and summary can be created for you.</p></div><button className="admin-modal-close" type="button" aria-label="Close project form" onClick={closeProjectModal}>×</button></header>
          {modalNotice && <p className="admin-modal-notice" role="status">{modalNotice}</p>}
          <form className="admin-modal-form" onSubmit={saveProject}>
            <label className="admin-modal-field admin-modal-field-wide"><span>Project title <b>*</b></span><input ref={projectTitleRef} required maxLength={180} value={projectDraft.title} onChange={(event) => setProjectDraft((current) => ({ ...current, title: event.target.value, slug: slugTouched ? current.slug : slugify(event.target.value) }))} placeholder="For example: Residential exterior finish" /><small>The web address is generated from this title automatically.</small></label>
            <div className="admin-generated-slug"><span>Project link preview</span><code>/projects/{projectDraft.slug || "your-project-name"}</code><button type="button" onClick={() => { setShowSlugField((value) => !value); setSlugTouched(true); }}>{showSlugField ? "Hide URL edit" : "Change URL"}</button></div>
            {showSlugField && <label className="admin-modal-field admin-modal-field-wide"><span>Project URL slug</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={projectDraft.slug} onChange={(event) => { setSlugTouched(true); setProjectDraft((current) => ({ ...current, slug: slugify(event.target.value) })); }} /><small>Lowercase letters, numbers and hyphens only.</small></label>}
            <label className="admin-modal-field"><span>Category <em>optional</em></span><select value={projectDraft.category} onChange={(event) => setProjectDraft((current) => ({ ...current, category: event.target.value }))}><option value="">Choose a category</option><option>Construction</option><option>Renovation</option><option>Architectural finishing</option><option>Interior finishing</option><option>Design &amp; plans</option><option>Maintenance</option><option>Other</option></select></label>
            <label className="admin-modal-field"><span>Short summary <em>optional</em></span><textarea rows={3} maxLength={500} value={projectDraft.summary} onChange={(event) => setProjectDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="Leave blank to create one from the project details below." /><small>If left empty, the first part of the description is used.</small></label>
            <label className="admin-modal-field admin-modal-field-wide"><span>Project details <b>*</b></span><textarea required rows={5} maxLength={12000} value={projectDraft.description} onChange={(event) => setProjectDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the work accurately. You can keep a draft private until the details are ready." /></label>
            <div className="admin-image-field admin-modal-field-wide"><div className="admin-image-field-heading"><span>Main project image <em>optional</em></span><small>Upload a new image or select one already uploaded.</small></div>
              {(projectDraft.cover_url || projectDraft.cover_media_id) && <div className="admin-modal-image-preview">{projectDraft.cover_url ? <img src={projectDraft.cover_url} alt="Current project cover" /> : <img src={media.find((item) => item.id === Number(projectDraft.cover_media_id))?.url || ""} alt="Selected project cover" />}<span>Current cover image</span></div>}
              <label className="admin-modal-field"><span>Select an uploaded image</span><select value={projectDraft.cover_media_id} onChange={(event) => setProjectDraft((current) => ({ ...current, cover_media_id: event.target.value, cover_url: event.target.value ? "" : current.cover_url }))}><option value="">{projectDraft.cover_url ? "Keep current image" : "No image selected"}</option>{media.filter((item) => item.media_type === "image" && item.is_published).map((item) => <option value={item.id} key={item.id}>{item.title || item.original_name}</option>)}</select></label>
              <label className="admin-upload-image-control"><span>Or upload a new image</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.currentTarget.files?.[0]; if (file) void uploadImage(file, event.currentTarget); }} /><small>JPG, PNG, WebP or GIF. Uploaded images are automatically published and selected for this project.</small></label>
            </div>
            <label className="admin-modal-field admin-modal-status"><span>Visibility</span><select value={projectDraft.status} onChange={(event) => setProjectDraft((current) => ({ ...current, status: event.target.value as ProjectDraft["status"] }))}><option value="draft">Save as draft — not public</option><option value="published">Publish on the website</option></select></label>
            <footer className="admin-modal-actions"><button className="button button-outline-dark" type="button" onClick={closeProjectModal} disabled={busy}>Cancel</button><button className="button button-gold" type="submit" disabled={busy}>{busy ? "Saving…" : projectDraft.status === "published" ? "Save & publish" : editingProjectId ? "Save draft" : "Add project"}</button></footer>
          </form>
        </section>
      </div>}
    </main>
  );
}
