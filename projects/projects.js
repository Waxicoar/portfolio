
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

let query = '';
let selectedIndex = -1;
let chartData = [];
function filterProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}
function displayProjects(projectsGiven) {
  renderProjects(projectsGiven, projectsContainer, 'h2');

  document.querySelector('.projects-title').textContent =
    `Projects (${projects.length})`;
}

function renderPieChart(projectsGiven) {

  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => String(d.year)
  );

  let data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  chartData = data;

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let sliceGenerator = d3.pie()
    .value((d) => d.value)
    .sort(null);

  let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  let arcs = sliceGenerator(data);
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();
  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arcGenerator(arc))
      .attr('fill', colors(i))
      .on('click', () => selectSlice(i));
  });

  data.forEach((d, i) => {
    legend.append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(i)}`)
      .html(`
        <span class="swatch"></span>
        ${d.label} <em>(${d.value})</em>
      `)
      .on('click', () => selectSlice(i));
  });
}

function selectSlice(i) {

  selectedIndex = selectedIndex === i ? -1 : i;

  svg.selectAll('path')
    .classed('selected', (_, index) =>
      index === selectedIndex
    );

  legend.selectAll('li')
    .classed('selected', (_, index) =>
      index === selectedIndex
    );

  let filteredProjects = filterProjects();

  if (selectedIndex !== -1) {
    let selectedYear = chartData[selectedIndex].label;

    filteredProjects = filteredProjects.filter(
      (project) => String(project.year) === selectedYear
    );
  }

  displayProjects(filteredProjects);
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  selectedIndex = -1;

  let filteredProjects = filterProjects();

  displayProjects(filteredProjects);
  renderPieChart(filteredProjects);
});

displayProjects(projects);
renderPieChart(projects);
