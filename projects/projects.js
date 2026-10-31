  
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

let projects = await fetchJSON('../lib/projects.json');

let projectsContainer = document.querySelector('.projects');

let query = '';
let searchInput = document.querySelector('.searchBar');

let selectedIndex = -1;


function setQuery(newQuery) {
  query = newQuery;

  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  return filteredProjects;
}

function renderPieChart(projectsGiven) {

  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => {
    return {
      value: count,
      label: year
    };
  });

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  let sliceGenerator = d3.pie()
    .value((d) => d.value);

  let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  let legend = d3.select('.legend');

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  function selectSlice(i) {

    selectedIndex = selectedIndex === i ? -1 : i;

    svg.selectAll('path')
      .attr('class', (_, idx) =>
        idx === selectedIndex ? 'selected' : null
      );

    legend.selectAll('li')
      .attr('class', (_, idx) =>
        idx === selectedIndex
          ? 'legend-item selected'
          : 'legend-item'
      );

    if (selectedIndex === -1) {
      renderProjects(projects, projectsContainer, 'h2');
    } else {
      let selectedYear = data[selectedIndex].label;

      let filteredProjects = projects.filter(
        (project) => String(project.year) === String(selectedYear)
      );

      renderProjects(filteredProjects, projectsContainer, 'h2');
    }
  }

  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', selectedIndex === i ? 'selected' : null)
      .on('click', () => {
        selectSlice(i);
      });
  });

  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr(
        'class',
        selectedIndex === idx
          ? 'legend-item selected'
          : 'legend-item'
      )
      .html(`
        <span class="swatch"></span>
        ${d.label} <em>(${d.value})</em>
      `)
      .on('click', () => {
        selectSlice(idx);
      });
  });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

searchInput.addEventListener('change', (event) => {

  let filteredProjects = setQuery(event.target.value);

  renderProjects(filteredProjects, projectsContainer, 'h2');

  renderPieChart(filteredProjects);
});
