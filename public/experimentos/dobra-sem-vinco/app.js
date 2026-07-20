const NS = "http://www.w3.org/2000/svg";
const colors = ["#8b5cf6", "#34d399", "#22d3ee"];
const points = [
  { name: "A", p: [0, 0, -0.25], text: "(0, 0, −1/4)" },
  { name: "B", p: [1, -1.5, 6.5], text: "(1, −3/2, 13/2)" },
  { name: "C", p: [-1, 1.5, 6.5], text: "(−1, 3/2, 13/2)" },
];
const target = [-0.25, 0, 0];
const matrices = [
  [
    [0, 0, 1],
    [-0.75, 1, 0],
    [2, 0, 0],
  ],
  [
    [-9 / 16, -3 / 8, -1 / 8],
    [3 / 8, 25 / 4, 3 / 4],
    [-17 / 2, -3, -1],
  ],
  [
    [9 / 16, 3 / 8, -1 / 8],
    [3 / 8, 25 / 4, -3 / 4],
    [-17 / 2, -3, 1],
  ],
];

function el(name, attrs = {}, text = "") {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  if (text) node.textContent = text;
  return node;
}

function project([x, y, z], origin = [0, 0], scale = 1) {
  return [
    origin[0] + (x - y) * 0.78 * scale,
    origin[1] + (x + y) * 0.39 * scale - z * scale,
  ];
}

function addAxes(svg, origin, scale, opacity = 0.45) {
  const axes = [
    { vector: [1.4, 0, 0], label: "x" },
    { vector: [0, 1.4, 0], label: "y" },
    { vector: [0, 0, 1.4], label: "z" },
  ];
  axes.forEach(({ vector, label }) => {
    const end = project(vector, origin, scale);
    svg.append(
      el("line", {
        x1: origin[0],
        y1: origin[1],
        x2: end[0],
        y2: end[1],
        stroke: "#71717a",
        "stroke-width": 1,
        "stroke-opacity": opacity,
      }),
    );
    svg.append(
      el(
        "text",
        {
          x: end[0] + 7,
          y: end[1] + 3,
          fill: "#71717a",
          "font-size": 10,
        },
        label,
      ),
    );
  });
}

const collisionSvg = document.getElementById("collisionSvg");

function drawCollision() {
  collisionSvg.replaceChildren();
  collisionSvg.append(
    el(
      "text",
      {
        x: 190,
        y: 34,
        fill: "#a1a1aa",
        "font-size": 13,
        "text-anchor": "middle",
      },
      "DOMÍNIO  ℝ³",
    ),
  );
  collisionSvg.append(
    el(
      "text",
      {
        x: 590,
        y: 34,
        fill: "#a1a1aa",
        "font-size": 13,
        "text-anchor": "middle",
      },
      "IMAGEM  ℝ³",
    ),
  );
  collisionSvg.append(
    el("line", {
      x1: 380,
      y1: 20,
      x2: 380,
      y2: 405,
      stroke: "#2b2b31",
      "stroke-dasharray": "5 7",
    }),
  );

  const domainOrigin = [190, 345];
  const imageOrigin = [590, 245];
  const domainScale = 39;
  const imageScale = 95;
  addAxes(collisionSvg, domainOrigin, domainScale);
  addAxes(collisionSvg, imageOrigin, imageScale);

  const imagePoint = project(target, imageOrigin, imageScale);

  points.forEach((item, index) => {
    const domainPoint = project(item.p, domainOrigin, domainScale);
    const arrowEndX = imagePoint[0] - 18;
    const controlY = 92 + index * 66;
    collisionSvg.append(
      el("path", {
        d: `M ${domainPoint[0]} ${domainPoint[1]} C 330 ${controlY}, 440 ${controlY}, ${arrowEndX} ${imagePoint[1]}`,
        fill: "none",
        stroke: colors[index],
        "stroke-width": 1.8,
        "stroke-opacity": 0.5,
        "stroke-dasharray": "5 5",
        "marker-end": `url(#arrow-${index})`,
      }),
    );
    collisionSvg.append(
      el("circle", {
        cx: domainPoint[0],
        cy: domainPoint[1],
        r: 10,
        fill: colors[index],
      }),
    );
    collisionSvg.append(
      el(
        "text",
        {
          x: domainPoint[0],
          y: domainPoint[1] + 4,
          fill: "#09090b",
          "font-size": 11,
          "font-weight": 800,
          "text-anchor": "middle",
        },
        item.name,
      ),
    );
    collisionSvg.append(
      el(
        "text",
        {
          x: domainPoint[0],
          y: domainPoint[1] + 27,
          fill: colors[index],
          "font-size": 11,
          "text-anchor": "middle",
        },
        item.text,
      ),
    );
  });

  const defs = el("defs");
  colors.forEach((color, index) => {
    const marker = el("marker", {
      id: `arrow-${index}`,
      viewBox: "0 0 10 10",
      refX: 9,
      refY: 5,
      markerWidth: 5,
      markerHeight: 5,
      orient: "auto-start-reverse",
    });
    marker.append(el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color }));
    defs.append(marker);
  });
  collisionSvg.prepend(defs);

  collisionSvg.append(
    el("circle", {
      cx: imagePoint[0],
      cy: imagePoint[1],
      r: 18,
      fill: "#fbbf2422",
      stroke: "#fbbf24",
      "stroke-width": 2,
    }),
  );
  collisionSvg.append(
    el(
      "text",
      {
        x: imagePoint[0],
        y: imagePoint[1] + 4,
        fill: "#fbbf24",
        "font-size": 11,
        "font-weight": 800,
        "text-anchor": "middle",
      },
      "T",
    ),
  );
  collisionSvg.append(
    el(
      "text",
      {
        x: imagePoint[0],
        y: imagePoint[1] + 42,
        fill: "#fbbf24",
        "font-size": 13,
        "text-anchor": "middle",
      },
      "F(A)=F(B)=F(C)=(−1/4, 0, 0)",
    ),
  );
  collisionSvg.append(
    el(
      "text",
      {
        x: 380,
        y: 405,
        fill: "#71717a",
        "font-size": 11,
        "text-anchor": "middle",
      },
      "setas = relação F, não trajetória",
    ),
  );
}

drawCollision();

function mapCurve(t) {
  const x = t;
  const y = -1.5 * t;
  const z = -0.25 + 6.75 * t * t;
  const u = 1 + x * y;
  return [
    u * u * u * z + y * y * u * (4 + 3 * x * y),
    y + 3 * x * u * u * z + 3 * x * y * y * (4 + 3 * x * y),
    2 * x - 3 * x * x * y - x * x * x * z,
  ];
}

function expandedRange(values) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(maximum - minimum, 1);
  return [minimum - span * 0.08, maximum + span * 0.08];
}

function formatTick(value) {
  const absolute = Math.abs(value);
  if (absolute >= 10) return value.toFixed(0);
  if (absolute >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

const curveSvg = document.getElementById("curveSvg");

function drawCurve() {
  const width = 760;
  const height = 470;
  const pad = { left: 58, right: 24, top: 18, bottom: 32 };
  const panelGap = 16;
  const panelHeight = (height - pad.top - pad.bottom - panelGap * 2) / 3;
  const ts = Array.from(
    { length: 321 },
    (_, index) => -1.35 + (index * 2.7) / 320,
  );
  const values = ts.map(mapCurve);
  const names = ["P(γ(t))", "Q(γ(t))", "R(γ(t))"];
  const collisionValues = [-0.25, 0, 0];
  const scaleX = (t) =>
    pad.left + ((t + 1.35) / 2.7) * (width - pad.left - pad.right);

  curveSvg.replaceChildren();

  names.forEach((name, coordinate) => {
    const panelTop = pad.top + coordinate * (panelHeight + panelGap);
    const coordinateValues = values.map((value) => value[coordinate]);
    const [minimum, maximum] = expandedRange(coordinateValues);
    const scaleY = (value) =>
      panelTop + ((maximum - value) / (maximum - minimum)) * panelHeight;

    curveSvg.append(
      el("rect", {
        x: pad.left,
        y: panelTop,
        width: width - pad.left - pad.right,
        height: panelHeight,
        rx: 8,
        fill: "#09090b66",
        stroke: "#27272a",
      }),
    );

    const reference = collisionValues[coordinate];
    if (reference >= minimum && reference <= maximum) {
      curveSvg.append(
        el("line", {
          x1: pad.left,
          y1: scaleY(reference),
          x2: width - pad.right,
          y2: scaleY(reference),
          stroke: "#52525b",
          "stroke-width": 1,
        }),
      );
    }

    [-1, 0, 1].forEach((t) => {
      curveSvg.append(
        el("line", {
          x1: scaleX(t),
          y1: panelTop,
          x2: scaleX(t),
          y2: panelTop + panelHeight,
          stroke: "#fbbf24",
          "stroke-dasharray": "4 5",
          "stroke-opacity": 0.62,
        }),
      );
    });

    const polyline = values
      .map(
        (value, index) =>
          `${scaleX(ts[index]).toFixed(2)},${scaleY(value[coordinate]).toFixed(2)}`,
      )
      .join(" ");
    curveSvg.append(
      el("polyline", {
        points: polyline,
        fill: "none",
        stroke: colors[coordinate],
        "stroke-width": 2,
        "stroke-linejoin": "round",
      }),
    );

    [-1, 0, 1].forEach((t) => {
      const value = mapCurve(t)[coordinate];
      curveSvg.append(
        el("circle", {
          cx: scaleX(t),
          cy: scaleY(value),
          r: 4.4,
          fill: colors[coordinate],
          stroke: "#09090b",
          "stroke-width": 1.5,
        }),
      );
    });

    curveSvg.append(
      el(
        "text",
        {
          x: pad.left + 10,
          y: panelTop + 17,
          fill: colors[coordinate],
          "font-size": 12,
          "font-weight": 700,
        },
        name,
      ),
    );
    curveSvg.append(
      el(
        "text",
        {
          x: pad.left - 9,
          y: panelTop + 4,
          fill: "#71717a",
          "font-size": 9,
          "text-anchor": "end",
        },
        formatTick(maximum),
      ),
    );
    curveSvg.append(
      el(
        "text",
        {
          x: pad.left - 9,
          y: panelTop + panelHeight,
          fill: "#71717a",
          "font-size": 9,
          "text-anchor": "end",
        },
        formatTick(minimum),
      ),
    );
    curveSvg.append(
      el(
        "text",
        {
          x: width - pad.right - 8,
          y: scaleY(reference) - 6,
          fill: "#a1a1aa",
          "font-size": 9,
          "text-anchor": "end",
        },
        coordinate === 0 ? "−1/4" : "0",
      ),
    );
  });

  [-1, 0, 1].forEach((t) => {
    curveSvg.append(
      el(
        "text",
        {
          x: scaleX(t),
          y: height - 11,
          fill: "#fbbf24",
          "font-size": 11,
          "text-anchor": "middle",
        },
        `t=${t}`,
      ),
    );
  });
  curveSvg.append(
    el(
      "text",
      {
        x: width / 2,
        y: height - 1,
        fill: "#71717a",
        "font-size": 9,
        "text-anchor": "middle",
      },
      "cada painel tem escala vertical própria; nenhum valor foi truncado",
    ),
  );
}

drawCurve();

function matVec(matrix, vector) {
  return matrix.map(
    (row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2],
  );
}

function wireframe(svg, matrix, color) {
  const vertices = [];
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) vertices.push([x, y, z]);
    }
  }
  const mapped = vertices.map((vertex) => matVec(matrix, vertex));
  const maxAbs = Math.max(...mapped.flat().map(Math.abs), 1);
  const scale = 55 / maxAbs;
  const origin = [90, 95];
  const projected = mapped.map((vertex) => project(vertex, origin, scale));
  const edges = [];

  for (let first = 0; first < 8; first += 1) {
    for (let second = first + 1; second < 8; second += 1) {
      const distance = vertices[first].reduce(
        (sum, value, coordinate) =>
          sum + Math.abs(value - vertices[second][coordinate]),
        0,
      );
      if (distance === 2) edges.push([first, second]);
    }
  }

  edges.forEach(([first, second]) =>
    svg.append(
      el("line", {
        x1: projected[first][0],
        y1: projected[first][1],
        x2: projected[second][0],
        y2: projected[second][1],
        stroke: color,
        "stroke-width": 1.8,
        "stroke-opacity": 0.85,
      }),
    ),
  );
  svg.append(
    el("circle", {
      cx: origin[0],
      cy: origin[1],
      r: 3,
      fill: "#fbbf24",
    }),
  );
}

const cards = document.getElementById("jacobianCards");
const matrixText = [
  `[   0      0      1 ]\n[ −3/4     1      0 ]\n[   2      0      0 ]`,
  `[ −9/16  −3/8  −1/8 ]\n[  3/8   25/4   3/4 ]\n[ −17/2   −3     −1 ]`,
  `[  9/16   3/8  −1/8 ]\n[  3/8   25/4  −3/4 ]\n[ −17/2   −3      1 ]`,
];

points.forEach((point, index) => {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `<h3 style="color:${colors[index]}">Em ${point.name} ${point.text}</h3><svg class="mini" viewBox="0 0 180 180" aria-label="Paralelepípedo local não degenerado"></svg><div class="matrix">${matrixText[index]}</div><span class="det">det = −2</span>`;
  cards.append(card);
  wireframe(card.querySelector("svg"), matrices[index], colors[index]);
});

document.querySelectorAll(".tab").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((item) => item.classList.remove("active"));
    document
      .querySelectorAll(".view")
      .forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.view).classList.add("active");
  }),
);
