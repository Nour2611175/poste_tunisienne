const tf = require('@tensorflow/tfjs');

// Entraîne un modèle simple de détection d’activité inhabituelle
async function trainModel(data) {
  const xs = tf.tensor2d(data.map(d => [d.hour / 24, d.requestVolume / 1000]));
  const ys = tf.tensor2d(data.map(d => [d.label])); // 1: anomalie, 0: normal

  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [2], units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

  await model.fit(xs, ys, { epochs: 30 });
  return model;
}

module.exports = { trainModel };
