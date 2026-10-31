console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "profile/", title: "Profile" },
  { url: "https://github.com/Waxicoar", title: "GitHub" },
];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;

  if (!url.startsWith("http")) {
    url = BASE_PATH + url;
  }

  let a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  if (
    a.host === location.host &&
    a.pathname === location.pathname
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

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      'Error fetching or parsing JSON data:',
      error
    );
    throw error;
  }
}

export function renderProjects(
  projects,
  containerElement,
  headingLevel = 'h2'
) {
  if (!containerElement) {
    console.error('Projects container not found.');
    return;
  }

  containerElement.innerHTML = '';

  const validHeading = /^h[1-6]$/i.test(headingLevel)
    ? headingLevel.toLowerCase()
    : 'h2';

  const titleElement = document.querySelector('.projects-title');

  if (titleElement) {
    titleElement.textContent = `Projects (${projects.length})`;
  }

  for (const project of projects) {
    const article = document.createElement('article');

    const heading = document.createElement(validHeading);
    heading.textContent = project.title;

    const image = document.createElement('img');
    image.src = project.image;
    image.alt = project.title;

    const details = document.createElement('div');
    details.className = 'project-details';

    const description = document.createElement('p');
    description.textContent = project.description;

    const year = document.createElement('p');
    year.className = 'project-year';
    year.textContent = project.year;

    details.append(description, year);
    article.append(heading, image, details);

    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(
    `https://api.github.com/users/${encodeURIComponent(username)}`
  );
}