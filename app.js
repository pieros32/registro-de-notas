const PASS = 11;
const MAX = 20;
const STORAGE_KEY = "notas-v1";

const COURSES = [
  { id: "aoe", name: "Administración y Organización de Empresas", items: [
    ["APF1", "Avance de Proyecto Final 1", 20],
    ["APF2", "Avance de Proyecto Final 2", 20],
    ["APF3", "Avance de Proyecto Final 3", 20],
    ["PROY", "Proyecto Final", 40],
  ]},
  { id: "adsi", name: "Análisis y Diseño de Sistemas de Información", items: [
    ["APF1", "Avance de Proyecto Final 1", 20],
    ["APF2", "Avance de Proyecto Final 2", 20],
    ["APF3", "Avance de Proyecto Final 3", 20],
    ["PA", "Participación en clase", 10],
    ["PROY", "Proyecto Final", 30],
  ]},
  { id: "calc2", name: "Cálculo II", items: [
    ["PC1", "Práctica Calificada 1", 20],
    ["PC2", "Práctica Calificada 2", 20],
    ["PA", "Participación en clase", 10],
    ["PC3", "Práctica Calificada 3", 20],
    ["PTF", "Portafolio Final", 30],
  ]},
  { id: "gp", name: "Gestión de Proyectos", items: [
    ["TA", "Tarea Académica", 20],
    ["APF1", "Avance de Proyecto Final 1", 20],
    ["APF2", "Avance de Proyecto Final 2", 20],
    ["PA", "Participación en clase", 10],
    ["PROY", "Proyecto Final", 30],
  ]},
  { id: "css", name: "Hojas de Estilo en Cascada Avanzado", items: [
    ["PC1", "Práctica Calificada 1", 20],
    ["PC2", "Práctica Calificada 2", 20],
    ["PC3", "Práctica Calificada 3", 30],
    ["EXFN", "Examen Final", 30],
  ]},
  { id: "js", name: "JavaScript Avanzado", items: [
    ["PC1", "Práctica Calificada 1", 20],
    ["PC2", "Práctica Calificada 2", 20],
    ["PC3", "Práctica Calificada 3", 20],
    ["EXFN", "Examen Final", 40],
  ]},
  { id: "lp", name: "Lenguajes de Programación", items: [
    ["PC1", "Práctica Calificada 1", 25],
    ["PC2", "Práctica Calificada 2", 25],
    ["PA", "Participación en clase", 10],
    ["PROY", "Proyecto Final", 40],
  ]},
  { id: "mdw", name: "Marcos de Desarrollo Web", items: [
    ["APF1", "Avance de Proyecto Final 1", 20],
    ["APF2", "Avance de Proyecto Final 2", 20],
    ["APF3", "Avance de Proyecto Final 3", 20],
    ["PROY", "Proyecto Final", 40],
  ]},
];

// state: { "courseId|index": { grade: "", weight: n } }
let state = {};
try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { state = {}; }

const key = (c, i) => `${c.id}|${i}`;
const weightOf = (c, i) => {
  const w = state[key(c, i)]?.weight;
  return w === undefined ? c.items[i][2] : w;
};
const gradeOf = (c, i) => state[key(c, i)]?.grade ?? "";
const fmt = n => n.toFixed(2);

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function courseStats(c) {
  let earned = 0, usedWeight = 0, totalWeight = 0;
  c.items.forEach((_, i) => {
    const w = weightOf(c, i);
    totalWeight += w;
    const g = gradeOf(c, i);
    if (g !== "") {
      earned += (parseFloat(g) * w) / 100;
      usedWeight += w;
    }
  });
  return {
    earned, usedWeight, totalWeight,
    avg: usedWeight > 0 ? (earned * 100) / usedWeight : null,
  };
}

function render() {
  const root = document.getElementById("courses");
  root.innerHTML = "";
  COURSES.forEach(c => {
    const card = document.createElement("article");
    card.className = "card";
    card.id = "card-" + c.id;
    card.innerHTML = `
      <div class="card-head">
        <h2>${c.name}</h2>
        <div class="avg"><div class="num">--</div><div class="small"></div></div>
      </div>
      <table>
        <thead><tr><th>Evaluación</th><th>Peso %</th><th>Nota</th><th style="text-align:right">Aporte</th></tr></thead>
        <tbody></tbody>
      </table>
      <div class="warn" hidden></div>`;
    const tbody = card.querySelector("tbody");
    c.items.forEach((it, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="name">${it[0]}<small>${it[1]}</small></td>
        <td><input type="number" min="0" max="100" step="any" data-k="weight" value="${weightOf(c, i)}"></td>
        <td><input type="number" min="0" max="${MAX}" step="any" data-k="grade" placeholder="--" value="${gradeOf(c, i)}"></td>
        <td class="pts" data-pts>0.00</td>`;
      tr.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("input", () => {
          const k = key(c, i);
          state[k] = state[k] || {};
          if (inp.dataset.k === "grade") {
            let v = inp.value;
            if (v !== "" && parseFloat(v) > MAX) { v = String(MAX); inp.value = v; }
            if (v !== "" && parseFloat(v) < 0) { v = "0"; inp.value = v; }
            state[k].grade = v;
          } else {
            state[k].weight = inp.value === "" ? 0 : parseFloat(inp.value);
          }
          save();
          update();
        });
      });
      tbody.appendChild(tr);
    });
    root.appendChild(card);
  });
  update();
}

function update() {
  const avgs = [];
  COURSES.forEach(c => {
    const card = document.getElementById("card-" + c.id);
    const s = courseStats(c);
    const num = card.querySelector(".num");
    num.textContent = s.avg === null ? "--" : fmt(s.avg);
    num.className = "num" + (s.avg === null ? "" : s.avg >= PASS ? " ok" : " bad");
    card.querySelector(".small").textContent =
      `Acumulado: ${fmt(s.earned)} / ${fmt(s.totalWeight * MAX / 100)}`;
    card.querySelectorAll("tbody tr").forEach((tr, i) => {
      const g = gradeOf(c, i);
      tr.querySelector("[data-pts]").textContent =
        g === "" ? "0.00" : fmt((parseFloat(g) * weightOf(c, i)) / 100);
    });
    const warn = card.querySelector(".warn");
    if (Math.abs(s.totalWeight - 100) > 0.001) {
      warn.hidden = false;
      warn.textContent = `Los pesos suman ${s.totalWeight}% (deberían sumar 100%).`;
    } else warn.hidden = true;
    if (s.avg !== null) avgs.push(s.avg);
  });
  const g = document.getElementById("general");
  const sub = document.getElementById("general-sub");
  if (avgs.length) {
    g.textContent = fmt(avgs.reduce((a, b) => a + b, 0) / avgs.length);
    sub.textContent = `${avgs.length} de ${COURSES.length} cursos con notas`;
  } else {
    g.textContent = "--";
    sub.textContent = "Ingresa tus notas";
  }
}

document.getElementById("reset").addEventListener("click", () => {
  if (!confirm("¿Borrar todas las notas y restablecer los pesos?")) return;
  state = {};
  save();
  render();
});

render();
