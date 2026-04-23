#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USER || 'vauugnn';

const query = `query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { 'Authorization': `bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { username } }),
});

const { data } = await res.json();
const weeks = data.user.contributionsCollection.contributionCalendar.weeks;

const COLORS = ['#161b22', '#1f6feb', '#388bfd', '#58a6ff', '#79c0ff'];

function color(count) {
  if (count === 0) return COLORS[0];
  if (count <= 2)  return COLORS[1];
  if (count <= 5)  return COLORS[2];
  if (count <= 10) return COLORS[3];
  return COLORS[4];
}

const CELL = 13;
const GAP  = 3;
const STEP = CELL + GAP;
const PAD  = 10;
const svgH = 7 * STEP + PAD * 2;

function buildCells(offsetX = 0) {
  return weeks.map((week, wi) =>
    week.contributionDays.map((day, di) => {
      const x = offsetX + wi * STEP;
      const y = PAD + di * STEP;
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${color(day.contributionCount)}"/>`;
    }).join('')
  ).join('');
}

const gridW   = weeks.length * STEP;
const totalW  = gridW + STEP;
const viewW   = 900;
const dur     = Math.round(weeks.length * 0.55);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${svgH}" width="${viewW}" height="${svgH}">
  <rect width="${viewW}" height="${svgH}" fill="#0d1117"/>
  <defs>
    <clipPath id="clip"><rect width="${viewW}" height="${svgH}"/></clipPath>
    <style>
      .ticker { animation: scroll ${dur}s linear infinite; }
      @keyframes scroll {
        from { transform: translateX(0px); }
        to   { transform: translateX(-${totalW}px); }
      }
    </style>
  </defs>
  <g clip-path="url(#clip)">
    <g class="ticker">
      ${buildCells(0)}
      ${buildCells(totalW)}
    </g>
  </g>
</svg>`;

mkdirSync('dist', { recursive: true });
writeFileSync('dist/contrib-scroll.svg', svg);
console.log(`Generated contrib-scroll.svg (${weeks.length} weeks, ${dur}s scroll)`);
