import React, { useEffect, useState } from 'react';
import './Anomalies.css';

// Détection d'anomalie basée sur heure et mots-clés
function estAnomalie(activity) {
  const heure = new Date(activity.timestamp).getHours();
  const motsSuspects = ['tentative', 'non autorisée', 'erreur', 'inconnu'];

  return (
    heure < 6 || heure > 22 ||
    motsSuspects.some(mot => activity.description.toLowerCase().includes(mot))
  );
}

// Détection d'anomalie basée sur types et descriptions
function detectAnomalie(activity) {
  const redFlags = [
    "accès interdit", "page non autorisée",
    "échec de connexion", "tentative", "bruteforce", "intrusion"
  ];

  const combinedText = `${activity.type} ${activity.description}`.toLowerCase();
  return redFlags.some(flag => combinedText.includes(flag));
}

function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fakeAnomalies = [
      {
        type: "Connexion inhabituelle",
        username: "user1",
        description: "Page non autorisée",
        ip: "10.0.0.5",
        timestamp: new Date()
      },
      // Exemple non anormal :
      // {
      //   type: "Connexion normale",
      //   username: "user2",
      //   description: "Connexion à 10h",
      //   ip: "10.0.0.2",
      //   timestamp: new Date()
      // }
    ];

    const anomaliesDétectées = fakeAnomalies.filter(
      act => estAnomalie(act) || detectAnomalie(act)
    );

    console.log("🚨 Anomalies détectées :", anomaliesDétectées);
    setAnomalies(anomaliesDétectées);
  }, []);

  return (
    <div className="anomalies-container">
      <h2>🚨 Activités Anormales</h2>

      {anomalies.length === 0 ? (
        <p>Aucune activité anormale détectée.</p>
      ) : (
        <table className="anomalies-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Utilisateur</th>
              <th>Description</th>
              <th>Adresse IP</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((a, i) => (
              <tr
                key={i}
                onClick={() => setSelected(a)}
                className={`clickable-row ${
                  estAnomalie(a) || detectAnomalie(a) ? 'anomalie-suspecte' : ''
                }`}
                style={{ cursor: 'pointer' }}
              >
                <td>{a.type}</td>
                <td>{a.username || 'Inconnu'}</td>
                <td>{a.description}</td>
                <td>{a.ip || 'Non spécifiée'}</td>
                <td>{a.timestamp ? new Date(a.timestamp).toLocaleString() : 'Non précisée'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📌 Détails de l'Anomalie</h3>
            <p><strong>Type :</strong> {selected.type}</p>
            <p><strong>Utilisateur :</strong> {selected.username || 'Inconnu'}</p>
            <p><strong>Description :</strong> {selected.description}</p>
            <p><strong>Adresse IP :</strong> {selected.ip || 'Non spécifiée'}</p>
            <p><strong>Date :</strong> {selected.timestamp ? new Date(selected.timestamp).toLocaleString() : 'Non précisée'}</p>
            <button onClick={() => setSelected(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Anomalies;
