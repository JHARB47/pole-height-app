import {
  formatFeetInches,
  DEFAULTS,
  getNESCClearances,
  getPoleBurialData,
  calculateSag,
  calculateDownGuy,
  analyzeMakeReadyImpact,
  recommendPoleReplacement,
} from "./calculations.js";

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function runOnce() {
  const poleH = Math.round(rand(30, 55));
  const pole = getPoleBurialData(poleH);
  const env = pick(["road", "residential", "pedestrian"]);
  const clear = getNESCClearances("communication", env);
  const cable = pick(DEFAULTS.cableTypes);
  const span = Math.round(rand(50, 350));
  const wind = Math.round(rand(60, 110));
  const attachFt = pole.aboveGround - clear.minimumPoleTopSpace;
  const sag = calculateSag(
    span,
    cable.weight,
    cable.tension,
    wind,
    cable.diameter,
    0,
  );
  const guy = calculateDownGuy(pole.aboveGround, attachFt, cable, span, wind);
  const makeReady = analyzeMakeReadyImpact(attachFt - 1, attachFt, 1.0);
  const repl = recommendPoleReplacement(poleH, attachFt + 4);

  return {
    pole,
    clear,
    cable: cable.label,
    span,
    wind,
    attachFt: formatFeetInches(attachFt),
    sagFt: formatFeetInches(sag),
    guy,
    makeReady,
    repl,
  };
}

const results = Array.from({ length: 5 }, runOnce);
console.log(JSON.stringify(results, null, 2));
