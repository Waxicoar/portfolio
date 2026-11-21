import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

async function loadData() {
  return await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
}
const REPO_URL = 'https://github.com/Waxicoar/portfolio';

function processCommits(data) {
  return d3.groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];

      const { author, date, time, timezone, datetime } = first;

      const result = {
        id: commit,
        url: `${REPO_URL}/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(result, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return result;
    })
    .sort((a, b) => a.datetime - b.datetime);
}
function renderCommitInfo(data, commits) {
  const container = d3.select('#stats');
  container.selectAll('*').remove();
  const dl = container
    .append('dl')
    .attr('class', 'stats');

  const statistics = [
    ['Total LOC', data.length],
    ['Total commits', commits.length],
    ['Number of files', d3.group(data, d => d.file).size],
    ['Maximum file length', d3.max(data, d => d.line) ?? 0],
    ['Average line length', (d3.mean(data, d => d.length) ?? 0).toFixed(1)],
    ['Maximum depth', d3.max(data, d => d.depth) ?? 0],
  ];

  statistics.forEach(([label, value]) => {
    dl.append('dt').text(label);
    dl.append('dd').text(value);
  });
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const margin = {
    top: 20,
    right: 30,
    bottom: 45,
    left: 60,
  };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );

  const xAxisGroup = svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat(d => String(d % 24).padStart(2, '0') + ':00')
    );

      function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');

    link.href = commit.url;
    link.textContent = commit.id.slice(0, 7);

    document.getElementById('commit-date').textContent =
      commit.datetime.toLocaleDateString('en', {
        dateStyle: 'full',
      });

    document.getElementById('commit-time').textContent =
      commit.datetime.toLocaleTimeString('en', {
        timeStyle: 'short',
      });

    document.getElementById('commit-author').textContent =
      commit.author;

    document.getElementById('commit-lines').textContent =
      commit.totalLines;
  }

  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }

  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');

    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
  }

  const [minLines, maxLines] = d3.extent(
    commits,
    d => d.totalLines
  );

  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(
    commits,
    d => -d.totalLines
  );

  const dots = svg.append('g')
    .attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)

    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 1);

      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })

    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })

    .on('mouseleave', (event) => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 0.7);

      updateTooltipVisibility(false);
    });

  let activeCommits = commits;

  function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }

    const [[x0, y0], [x1, y1]] = selection;

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= x0 && x <= x1 &&
           y >= y0 && y <= y1;
  }
  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? activeCommits.filter(d => isCommitSelected(selection, d))
      : [];

    const countElement =
      document.getElementById('selection-count');

    countElement.textContent = selectedCommits.length
      ? `${selectedCommits.length} commits selected`
      : 'No commits selected';

    return selectedCommits;
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? activeCommits.filter(d => isCommitSelected(selection, d))
      : [];

    const container = d3.select('#language-breakdown');

    container.selectAll('*').remove();

    if (selectedCommits.length === 0) {
      return;
    }
    const lines = selectedCommits.flatMap(d => d.lines);
    const breakdown = d3.rollup(
      lines,
      v => v.length,
      d => d.type || 'Unknown'
    );

    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);

      container.append('dt')
        .text(language);

      container.append('dd')
        .text(`${count} lines (${formatted})`);
    }
  }
   function brushed(event) {
    const selection = event.selection;
    dots.selectAll('circle')
      .classed('selected', d =>
        isCommitSelected(selection, d)
      );

    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }

  const brush = d3.brush()
    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom]
    ])
    .on('start brush end', brushed);

  svg.call(brush);
  dots.raise();

  return function updateScatterPlot(filteredCommits) {
    activeCommits = filteredCommits;
    const [firstDate, lastDate] = d3.extent(filteredCommits, d => d.datetime);
    xScale.domain(firstDate && lastDate && +firstDate === +lastDate
      ? [new Date(+firstDate - 12 * 60 * 60 * 1000), new Date(+lastDate + 12 * 60 * 60 * 1000)]
      : [firstDate, lastDate]);
    xAxisGroup.call(d3.axisBottom(xScale));

    const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines ?? 0, maxLines ?? 1]).range([2, 30]);
    const sortedFilteredCommits = d3.sort(filteredCommits, d => -d.totalLines);

    dots.selectAll('circle')
      .data(sortedFilteredCommits, d => d.id)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mousemove', updateTooltipPosition)
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });

    dots.raise();
    svg.select('.brush').call(brush.move, null);
    renderSelectionCount(null);
    renderLanguageBreakdown(null);
  };
}

const data = await loadData();

const commits = processCommits(data);

const timeScale = d3.scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);

const slider = document.getElementById('commit-progress');
const commitTime = document.getElementById('commit-time');
let commitProgress = 100;
let commitMaxTime = timeScale.invert(commitProgress);
let filteredCommits = commits;
const updateScatterPlot = renderScatterPlot(data, commits);

function updateFileDisplay(commitsToShow) {
  const lines = commitsToShow.flatMap(commit => commit.lines);
  const files = d3.groups(lines, d => d.file)
    .map(([name, fileLines]) => ({
      name,
      lines: fileLines,
      type: fileLines[0]?.type || 'Unknown',
    }))
    .sort((a, b) => b.lines.length - a.lines.length);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const filesContainer = d3.select('#files')
    .selectAll('div.file-row')
    .data(files, d => d.name)
    .join(
      enter => {
        const row = enter.append('div').attr('class', 'file-row');
        row.append('dt');
        row.append('dd');
        return row;
      },
    )
    .order()
    .attr('style', d => `--color: ${colors(d.type)}`);

  filesContainer.select('dt')
    .html(d => `<code></code><small></small>`)
    .each(function (d) {
      d3.select(this).select('code').text(d.name);
      d3.select(this).select('small').text(`${d.lines.length} lines · ${d.type}`);
    });

  filesContainer.select('dd')
    .selectAll('div.loc')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('title', d => `${d.type} · line ${d.line}`);
}

function onTimeSliderChange() {
  commitProgress = Number(slider.value);
  commitMaxTime = timeScale.invert(commitProgress);
  commitTime.dateTime = commitMaxTime.toISOString();
  commitTime.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  renderCommitInfo(
    data.filter(d => d.datetime <= commitMaxTime),
    filteredCommits,
  );
  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);
}

slider.addEventListener('input', onTimeSliderChange);
onTimeSliderChange();

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits, d => d.id)
  .join('div')
  .attr('class', 'step')
  .html((d, i) => `
    <p>On <time datetime="${d.datetime.toISOString()}">${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })}</time>, I made <a href="${d.url}" target="_blank" rel="noopener noreferrer">${i > 0 ? 'another commit' : 'my first commit'}.</a></p>
    <p>I edited ${d.totalLines} lines across ${d3.rollups(
      d.lines,
      linesForFile => linesForFile.length,
      line => line.file,
    ).length} files.</p>
  `);

function onStepEnter(response) {
  const commit = response.element.__data__;
  d3.selectAll('#scatter-story .step')
    .classed('is-active', element => element === response.element);
  commitProgress = timeScale(commit.datetime);
  slider.value = commitProgress;
  onTimeSliderChange();
}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
    offset: 0.55,
  })
  .onStepEnter(onStepEnter);

window.addEventListener('resize', scroller.resize);
