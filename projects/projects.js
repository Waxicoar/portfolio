import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');


let query = '';
let selectedYear = null;

function filterProjects() {
  return projects.filter((project) => {
    const values = Object.values(project)
      .join('\n')
      .toLowerCase();

    return values.includes(query.toLowerCase());
  });
}


function renderPieChart(projectsGiven) {

  svg.selectAll('*').remove();
  legend.selectAll('*').remove();
  const rolledData = d3.rollups(
    projectsGiven,
    (group) => group.length,
    (project) => String(project.year)
  );

  rolledData.sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  const colors = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(data.map((d) => d.label));

  const sliceGenerator = d3.pie()
    .value((d) => d.value)
    .sort(null);

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  const arcs = sliceGenerator(data);
  svg.selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d) => colors(d.data.label))
    .classed('selected', (d) =>
      d.data.label === selectedYear
    )
    .on('click', (event, d) => {
      toggleYear(d.data.label);
    });
  legend.selectAll('li')
    .data(data)
    .join('li')
    .attr('class', (d) =>
      d.label === selectedYear
        ? 'legend-item selected'
        : 'legend-item'
    )
    .style('--color', (d) => colors(d.label))
    .html((d) => `
      <span class="swatch"></span>
      ${d.label} <em>(${d.value})</em>
    `)
    .on('click', (event, d) => {
      toggleYear(d.label);
    });
}


function toggleYear(year) {
  selectedYear = selectedYear === year ? null : year;
  updatePage();
}


function updatePage() {

  const searchFiltered = filterProjects();

  const visibleProjects = selectedYear === null
    ? searchFiltered
    : searchFiltered.filter(
        (project) => String(project.year) === selectedYear
      );
  renderProjects(visibleProjects, projectsContainer, 'h2');

  renderPieChart(visibleProjects);
}


searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  updatePage();
});
updatePage();