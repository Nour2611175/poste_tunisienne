// anomalyDetector.js
const tf = require('@tensorflow/tfjs');
const moment = require('moment');

let recentAttempts = []; // On garde un historique simple

function normalizeHour(hour) {
  return hour / 24;
}

function normalizeCount(count) {
  return count / 100; // max 100 tentatives par IP
}

function buildInputFeatures(ip, hour, count) {
  return tf.tensor2d([[normalizeHour(hour), normalizeCount(count)]]);
}

function isAnomalous(hour, count) {
  // Seuils très simples à des fins de démo
  return (hour < 7 || hour > 19) || count > 10;
}

function logAndAnalyze(ip) {
  const now = moment();
  const hour = now.hour();

  const attemptsFromIp = recentAttempts.filter(a => a.ip === ip);
  const count = attemptsFromIp.length;

  const isAnomaly = isAnomalous(hour, count);

  // Mémorisation
  recentAttempts.push({ ip, timestamp: now.toISOString() });

  // Limiter la taille de l'historique
  if (recentAttempts.length > 500) recentAttempts.shift();

  return isAnomaly;
}

module.exports = { logAndAnalyze };
