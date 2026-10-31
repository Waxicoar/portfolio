import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';
import {fetchJSON, renderProjects } from '../global.js';

let arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI
});

d3.select('#projects-pie-plot')
  .append('path')
  .attr('d', arc)
  .attr('fill', 'red');

const projectsContainer = document.querySelector('.projects');

try {
  const projects = await fetchJSON('../lib/projects.json');

  renderProjects(projects, projectsContainer, 'h2');
} catch (error) {
  if (projectsContainer) {
    projectsContainer.textContent =
      'Unable to load projects. Please try again later.';
  }

  console.error(error);
}