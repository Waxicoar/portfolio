import {
  fetchJSON,
  renderProjects,
  fetchGitHubData
} from './global.js';
try {
  const projects = await fetchJSON('./lib/projects.json');
  const latestProjects = projects.slice(0, 3);
  const projectsContainer = document.querySelector('.projects');
  renderProjects(latestProjects, projectsContainer, 'h2');
} catch (error) {
  console.error('Unable to load homepage projects:', error);
}
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
  try {
    const githubData = await fetchGitHubData('Waxicoar');
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos</dt>
        <dd>${githubData.public_repos}</dd>

        <dt>Public Gists</dt>
        <dd>${githubData.public_gists}</dd>

        <dt>Followers</dt>
        <dd>${githubData.followers}</dd>

        <dt>Following</dt>
        <dd>${githubData.following}</dd>
      </dl>`;
  } catch (error) {
    profileStats.textContent = 'GitHub statistics could not be loaded.';
    console.error('Unable to load GitHub statistics:', error);
  }
}