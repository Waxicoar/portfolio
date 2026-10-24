import {fetchJSON, renderProjects } from '../global.js';

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