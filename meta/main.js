import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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
    });
}
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats')
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

  svg.append('g')
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
    .data(sortedCommits)
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
      ? commits.filter(d => isCommitSelected(selection, d))
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
      ? commits.filter(d => isCommitSelected(selection, d))
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
}

const data = await loadData();

const commits = processCommits(data);

renderCommitInfo(data, commits);

renderScatterPlot(data, commits);