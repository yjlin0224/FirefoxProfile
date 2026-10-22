// Writes the generated parts of profile/chrome/selected-tab-border.css: the selected tab's
// turning gradient border repeats one formula per color stop, so they're written here, between
// `/* generated: <name> ... */` and `/* end generated: <name> */` comments; everything else in
// the file (the rules' other declarations, the comments explaining the math) is by hand.
// The regions: the conic gradient's stops, their projections (p), their places at rest on a
// stadium and on a circle (d), each point moved along the ring (s, q), and the @property
// registrations of all of these.
//
// Usage: node scripts/ring-generate.mjs [colors]
//   colors: how many evenly spaced colors make up the transition, 9 by default (8 steps).
//   Rewrites the file in place; run `task deploy` (or keep `task watch` running) after.
import fs from 'node:fs'
import path from 'node:path'
import { repoChromeDir } from './lib/config.mjs'

const file = path.join(repoChromeDir, 'selected-tab-border.css')
const colors = Number(process.argv[2] ?? 9)
if (!Number.isInteger(colors) || colors < 2) {
  console.error('usage: node scripts/ring-generate.mjs [colors (2 or more)]')
  process.exit(2)
}
const N = colors - 1
const ks = [...Array(N + 1).keys()]
const I = (n) => ' '.repeat(n)
const v = (name) => `var(--custom-ring-${name})`

// The point at distance s along the centerline: five stretches, each clamped to its length
const capRight = (s) => `clamp(0px, ${s} - ${v('c')}, pi * ${v('r')}) / ${v('r')}`
const capLeft = (s) =>
  `clamp(0px, ${s} - 3 * ${v('c')} - pi * ${v('r')}, pi * ${v('r')}) / ${v('r')}`
const pointX = (s) => [
  `clamp(0px, ${s}, ${v('c')})`,
  `+ ${v('r')} * sin(${capRight(s)})`,
  `- clamp(0px, ${s} - ${v('c')} - pi * ${v('r')}, 2 * ${v('c')})`,
  `- ${v('r')} * sin(${capLeft(s)})`,
  `+ clamp(0px, ${s} - 3 * ${v('c')} - 2 * pi * ${v('r')}, ${v('c')})`,
]
const pointY = (s) => `${v('r')} * (cos(${capLeft(s)}) - cos(${capRight(s)}) - 1)`

const color = (k) =>
  k === 0
    ? 'var(--tab-border-color-selected-leading)'
    : k === N
      ? 'var(--tab-border-color-selected-trailing)'
      : `color-mix(in srgb, var(--tab-border-color-selected-trailing) ${+((100 * k) / N).toFixed(4)}%, var(--tab-border-color-selected-leading))`
const relative = (q) => `mod(${v('q-' + q)} - ${v('q-ref')}, 360deg)`
const points = ['ref', ...ks.map((k) => 'a' + k), ...[...ks].reverse().map((k) => 'b' + k)]
// Registered in plain order (the gradient lists the bottom side backwards)
const registered = ['ref', ...ks.map((k) => 'a' + k), ...ks.map((k) => 'b' + k)]

const regions = {
  'stops': [
    `${color(0)} 0deg,`,
    ...ks.map((k) => `${color(k)} ${relative('a' + k)},`),
    ...[...ks].reverse().map((k) => `${color(k)} ${relative('b' + k)},`),
    `${color(0)} 360deg`,
  ].map((l) => I(6) + l),
  'projections': ks.map(
    (k) =>
      `${I(4)}--custom-ring-p${k}: calc((${v('violet-until')} + (${v('orange-from')} - ${v('violet-until')}) * ${k} / ${N} - 0.5) * ${v('length')});`,
  ),
  'stadium-places': [
    ...ks.map(
      (k) =>
        `${I(4)}--custom-ring-d-a${k}: calc((${v('p' + k)} - ${v('r')} * cos(${v('axis')})) / sin(${v('axis')}));`,
    ),
    ...ks.map(
      (k) =>
        `${I(4)}--custom-ring-d-b${k}: calc(2 * ${v('c')} + pi * ${v('r')} - (${v('p' + k)} + ${v('r')} * cos(${v('axis')})) / sin(${v('axis')}));`,
    ),
  ],
  'points': points.flatMap((q) => {
    const s = v('s-' + q)
    const x = pointX(s)
    return [
      `${I(4)}--custom-ring-s-${q}: mod(${v('d-' + q)} + ${v('shift')}, ${v('perimeter')});`,
      `${I(4)}--custom-ring-q-${q}: atan2(`,
      `${I(6)}${x[0]}`,
      ...x.slice(1).map((t, i, all) => `${I(8)}${t}${i === all.length - 1 ? ',' : ''}`),
      `${I(6)}-1 * ${pointY(s)}`,
      `${I(4)});`,
    ]
  }),
  'circle-places': [
    ...ks.map(
      (k) =>
        `${I(4)}--custom-ring-d-a${k}: calc(${v('r')} * (${v('axis')} - acos(${v('p' + k)} / ${v('r')})) / 1rad);`,
    ),
    ...ks.map(
      (k) =>
        `${I(4)}--custom-ring-d-b${k}: calc(${v('r')} * (${v('axis')} + acos(${v('p' + k)} / ${v('r')})) / 1rad);`,
    ),
  ],
  'registrations': [
    ...[
      'r',
      'c',
      'perimeter',
      'length',
      ...ks.map((k) => 'p' + k),
      'shift',
      'd-ref',
      ...ks.map((k) => 'd-a' + k),
      ...ks.map((k) => 'd-b' + k),
      ...registered.map((q) => 's-' + q),
    ].map(
      (n) =>
        `@property --custom-ring-${n} { syntax: '<length>'; inherits: false; initial-value: 0px; }`,
    ),
    ...registered.map(
      (q) =>
        `@property --custom-ring-q-${q} { syntax: '<angle>'; inherits: false; initial-value: 0deg; }`,
    ),
  ],
}

let css = fs.readFileSync(file, 'utf8')
for (const [name, lines] of Object.entries(regions)) {
  const re = new RegExp(
    `(/\\* generated: ${name} [^*]*\\*/\\n)[\\s\\S]*?(\\n[ ]*/\\* end generated: ${name} \\*/)`,
  )
  if (!re.test(css)) {
    console.error(`No "generated: ${name}" region in ${file}`)
    process.exit(3)
  }
  css = css.replace(re, (_, start, end) => start + lines.join('\n') + end)
}
fs.writeFileSync(file, css)
console.log(`${path.relative(process.cwd(), file)}: ${colors} colors, ${points.length} points`)
