/* ============ Settings (edit these) ============ */
const GITHUB_USER = "tapelitejeancarl-stack";
const PROJECTS_FILE = "projects.json";

/* ============ Helpers ============ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ============ Theme (light / dark) ============ */
const themeBtn = $("#theme-toggle");
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.innerHTML = theme === "dark" ? "&#9728;" : "&#9790;";
  try { localStorage.setItem("theme", theme); } catch (e) {}
}
let savedTheme = null;
try { savedTheme = localStorage.getItem("theme"); } catch (e) {}
applyTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeBtn.addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

/* ============ Mobile menu ============ */
const menuBtn = $("#menu-toggle");
const navLinks = $("#nav-links");
menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
$$("#nav-links a").forEach(a => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
}));

/* ============ Typing tagline ============ */
const tagline = $("#tagline");
if (tagline) {
  const full = tagline.dataset.text;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    tagline.textContent = full;
  } else {
    tagline.textContent = "";
    tagline.classList.add("typing");
    let i = 0;
    const timer = setInterval(() => {
      tagline.textContent = full.slice(0, ++i);
      if (i >= full.length) { clearInterval(timer); tagline.classList.remove("typing"); }
    }, 35);
  }
}

/* ============ Reveal on scroll + skill bars ============ */
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    $$(".fill", entry.target).forEach(f => { f.style.width = f.dataset.width + "%"; });
    io.unobserve(entry.target);
  });
}, { threshold: 0.15 });
$$(".reveal").forEach(n => io.observe(n));

/* ============ Back to top + active nav link ============ */
const toTop = $("#to-top");
const sections = $$("main section[id]");
window.addEventListener("scroll", () => {
  toTop.classList.toggle("show", window.scrollY > 500);
  const y = window.scrollY + 120;
  let current = "home";
  sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
  $$("#nav-links a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
}, { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ============ Projects (projects.json + GitHub repos) ============ */
const projectList = $("#project-list");
const repoList = $("#repo-list");
const modal = $("#project-modal");
let lastFocused = null;

function renderProjects(projects) {
  projectList.innerHTML = "";
  projects.forEach(p => {
    const card = el("button", "project-card");
    card.type = "button";
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", "Open details for " + p.title);
    card.style.setProperty("--accent", p.color || "#2f6df6");

    const thumb = el("span", "project-thumb");
    thumb.setAttribute("aria-hidden", "true");
    thumb.textContent = p.icon || "";
    card.appendChild(thumb);

    card.appendChild(el("h3", "", p.title));
    card.appendChild(el("p", "project-tagline", p.tagline));

    const tags = el("ul", "tags small");
    (p.tech || []).forEach(t => tags.appendChild(el("li", "", t)));
    card.appendChild(tags);

    card.appendChild(el("span", "project-more", "View details"));
    card.addEventListener("click", () => openProject(p, card));
    projectList.appendChild(card);
  });
}

function openProject(p, opener) {
  lastFocused = opener;
  $("#modal-title").textContent = p.title;
  $("#modal-desc").textContent = p.description;
  modal.style.setProperty("--accent", p.color || "#2f6df6");

  const feats = $("#modal-features");
  feats.innerHTML = "";
  (p.features || []).forEach(f => feats.appendChild(el("li", "", f)));
  const hasFeats = (p.features || []).length > 0;
  feats.hidden = !hasFeats;
  $("#modal-features-title").hidden = !hasFeats;

  const tech = $("#modal-tech");
  tech.innerHTML = "";
  (p.tech || []).forEach(t => tech.appendChild(el("li", "", t)));

  const repo = $("#modal-repo");
  const demo = $("#modal-demo");
  repo.href = p.repo || "#";
  repo.hidden = !p.repo;
  demo.href = p.demo || "#";
  demo.hidden = !p.demo;

  modal.hidden = false;
  document.body.classList.add("no-scroll");
  $("#modal-close").focus();
}

function closeProject() {
  modal.hidden = true;
  document.body.classList.remove("no-scroll");
  if (lastFocused) lastFocused.focus();
}

$("#modal-close").addEventListener("click", closeProject);
modal.addEventListener("click", e => { if (e.target === modal) closeProject(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !modal.hidden) closeProject();
});

/* Auto-add: any public GitHub repo that is not already in projects.json
   gets its own project card automatically. To customise a repo's card
   (icon, features, description...), add an entry for it in projects.json. */
const LANG_STYLE = {
  HTML: { icon: "</>", color: "#e34c26" },
  CSS: { icon: "#", color: "#563d7c" },
  JavaScript: { icon: "JS", color: "#c9a800" },
  TypeScript: { icon: "TS", color: "#3178c6" },
  Python: { icon: "Py", color: "#3572a5" },
  Java: { icon: "J", color: "#b07219" },
  PHP: { icon: "PHP", color: "#4f5d95" },
  "C#": { icon: "C#", color: "#178600" },
  "C++": { icon: "C++", color: "#f34b7d" },
  C: { icon: "C", color: "#555555" }
};

const normUrl = u => (u || "").toLowerCase().replace(/\/+$/, "");

function prettyTitle(name) {
  return name
    .replace(/\.github\.io$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || name;
}

function repoToProject(r) {
  const style = LANG_STYLE[r.language] || { icon: "\u2605", color: "#2f6df6" };
  const tech = [];
  if (r.language) tech.push(r.language);
  (r.topics || []).forEach(t => { if (!tech.includes(t)) tech.push(t); });
  let demo = r.homepage || "";
  if (!demo && r.has_pages) {
    demo = /\.github\.io$/i.test(r.name)
      ? "https://" + r.name.toLowerCase() + "/"
      : `https://${r.owner.login.toLowerCase()}.github.io/${r.name}/`;
  }
  const desc = r.description || "A project I uploaded to GitHub. A full description is coming soon.";
  return {
    id: r.name,
    title: prettyTitle(r.name),
    tagline: desc,
    icon: style.icon,
    color: style.color,
    description: desc,
    features: [],
    tech: tech,
    repo: r.html_url,
    demo: demo || undefined
  };
}

const manualProjects = fetch(PROJECTS_FILE)
  .then(res => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .catch(err => {
    console.error("Could not load projects.json:", err);
    return [];
  });

const githubRepos = fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`)
  .then(res => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .catch(err => {
    console.error("Could not load repositories:", err);
    return null;
  });

Promise.all([manualProjects, githubRepos]).then(([manual, repos]) => {
  /* Projects: projects.json first, then every other public repo */
  const known = new Set(manual.map(p => normUrl(p.repo)));
  const auto = (repos || [])
    .filter(r => !r.fork && !known.has(normUrl(r.html_url)))
    .map(repoToProject);
  const all = manual.concat(auto);

  if (all.length) {
    renderProjects(all);
  } else {
    projectList.innerHTML = "";
    projectList.appendChild(el("p", "message error-msg",
      "Projects could not load. If you opened index.html by double-clicking it, use the Live Server extension in VS Code or open the GitHub Pages link instead."));
  }

  /* Latest GitHub repositories */
  repoList.innerHTML = "";
  if (!repos) {
    repoList.appendChild(el("li", "message error-msg", "Repositories could not load right now. Please try again later."));
    return;
  }
  if (!repos.length) {
    repoList.appendChild(el("li", "message", "No public repositories yet."));
    return;
  }
  repos.slice(0, 6).forEach(r => {
    const li = el("li", "repo-item");
    const a = el("a", "repo-name", r.name);
    a.href = r.html_url;
    a.target = "_blank";
    a.rel = "noopener";
    li.appendChild(a);
    li.appendChild(el("span", "repo-desc", r.description || "No description yet."));
    const meta = [];
    if (r.language) meta.push(r.language);
    meta.push("Updated " + new Date(r.updated_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }));
    li.appendChild(el("span", "repo-meta", meta.join("  |  ")));
    repoList.appendChild(li);
  });
});

/* ============ Contact form validation ============ */
const form = $("#contact-form");
const status = $("#form-status");
const fields = ["name", "email", "message"];

function setError(id, msg) {
  $("#" + id + "-error").textContent = msg;
  $("#" + id).classList.toggle("invalid", Boolean(msg));
}

function validate() {
  let ok = true;
  const name = $("#name").value.trim();
  const email = $("#email").value.trim();
  const message = $("#message").value.trim();

  if (name.length < 2) { setError("name", "Please enter your name."); ok = false; } else setError("name", "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("email", "Please enter a valid email address."); ok = false; } else setError("email", "");
  if (message.length < 10) { setError("message", "Your message should be at least 10 characters."); ok = false; } else setError("message", "");
  return ok;
}

fields.forEach(id => $("#" + id).addEventListener("input", () => { if (status.textContent) validate(); }));

form.addEventListener("submit", e => {
  e.preventDefault();
  status.className = "form-status";
  if (!validate()) {
    status.textContent = "Please fix the highlighted fields.";
    status.classList.add("bad");
    return;
  }
  const name = $("#name").value.trim();
  const email = $("#email").value.trim();
  const message = $("#message").value.trim();
  const subject = encodeURIComponent("Internship inquiry from " + name);
  const body = encodeURIComponent(message + "\n\nFrom: " + name + " (" + email + ")");
  status.textContent = "Thank you, " + name + "! Opening your email app to send the message.";
  status.classList.add("good");
  window.location.href = "mailto:tapelitejeancarl@gmail.com?subject=" + subject + "&body=" + body;
  form.reset();
});
