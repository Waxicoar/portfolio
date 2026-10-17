console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "profile/", title: "Profile" },
  { url: "https://github.com/Waxicoar", title: "GitHub" },
];

let nav = document.createElement("nav");
document.body.prepend(nav);

// Resolve URLs relative to the directory containing global.js
const SITE_ROOT = new URL("./", import.meta.url);

for (let p of pages) {
  let a = document.createElement("a");
  a.href = new URL(p.url, SITE_ROOT).href;
  a.textContent = p.title;

  if (
    a.host === location.host &&
    a.pathname.replace(/\/$/, "") ===
      location.pathname.replace(/\/$/, "")
  ) {
    a.classList.add("current");
  }

  if (a.host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  `
);

let select = document.querySelector(".color-scheme select");

function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty(
    "color-scheme",
    colorScheme
  );

  select.value = colorScheme;
}

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

select.addEventListener("input", function (event) {
  setColorScheme(event.target.value);
  localStorage.colorScheme = event.target.value;
});