const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const https = require('https');
const fs = require('fs');

const app = express();

// Liste des origines autorisées (URLs de ton frontend)
const allowedOrigins = [
  'https://kaleidoscopic-biscotti-29dfe1.netlify.app',
  'https://monfrontend.netlify.app',
  'http://localhost:3000' // si tu fais du dev local
];

app.use(cors({
  origin: function(origin, callback) {
    // Autorise les requêtes sans origin (ex: Postman, backend-to-backend)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `Le CORS policy ne permet pas cette origine : ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

let connection;

async function startServer() {
  try {
    connection = await mysql.createConnection({
      host: 'sql.freedb.tech',
      user: 'freedb_nour12',
      password: '9twXWC$C3n&tvj$',
      database: 'freedb_poste12',
      port: 3306
    });

    console.log('✅ Connecté à MySQL');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Serveur lancé sur le port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données :', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = { app, connection }; // exporte si besoin





// route anomalie avec ia
app.post('/api/anomalies', async (req, res) => {
  const { type, username, description, ip } = req.body;
  
  // Vérification si tous les champs sont fournis
  if (!type || !username || !description || !ip) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    // Requête SQL pour insérer l'anomalie dans la base de données
    const [result] = await db.execute(
      'INSERT INTO anomalies (type, username, description, ip) VALUES (?, ?, ?, ?)',
      [type, username, description, ip]
    );
    
    // Retourner une réponse confirmant l'ajout
    res.status(201).json({
      message: 'Anomalie ajoutée avec succès.',
      anomalyId: result.insertId // Retourner l'ID de l'anomalie insérée
    });
  } catch (error) {
    console.error('Erreur lors de l\'insertion de l\'anomalie:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});




//audit
async function logAuditAction(userId, action) {
  try {
    await db.execute('INSERT INTO audit_logs (user_id, action) VALUES (?, ?)', [userId, action]);
    console.log(`Action enregistrée dans l'audit : ${action}`);
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de l\'audit :', err);
  }
}


// 🔗 Route test
app.get('/', (req, res) => {
  res.send('🚀 Serveur HTTPS actif !');
});

// 🔐 Route de login avec OTP
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect.' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 5 * 60000); // 5 min

    // Ajout de la requête d'insertion avec gestion des erreurs
    const [insertResult] = await db.execute('INSERT INTO otp_codes (username, code, expiration) VALUES (?, ?, ?)', [username, otpCode, expiration]);
    console.log(`🔐 OTP pour ${username} : ${otpCode}`);

    if (insertResult.affectedRows > 0) {
      res.status(200).json({ message: 'Connexion valide, OTP requis.', role: user.role });
    } else {
      console.error('❌ Erreur insertion OTP.');
      res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement du code OTP.' });
      await logAudit(username, 'LOGIN_SUCCESS', 'Connexion avec mot de passe valide');
    }
  } catch (err) {
    console.error('❌ Erreur login :', err);
    res.status(500).json({ message: 'Erreur serveur.' });

  }
});


app.post('/verify-otp', async (req, res) => {
  const { username, code } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM otp_codes WHERE username = ? ORDER BY id DESC LIMIT 1', [username]);
    const otpRecord = rows[0];
    if (!otpRecord) return res.status(400).json({ message: 'Aucun code OTP trouvé.' });

    const now = new Date();
    if (otpRecord.code === code && now < new Date(otpRecord.expiration)) {
      await db.execute('DELETE FROM otp_codes WHERE id = ?', [otpRecord.id]);
      res.status(200).json({ message: '✅ OTP validé' });
    } else {
      res.status(400).json({ message: 'Code OTP invalide ou expiré.' });
      await logAudit(username, 'OTP_VERIFIED', `Code utilisé : ${code}`);

    }
  } catch (err) {
    console.error('❌ Erreur OTP :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// route audit 
app.post('/api/log-audit', async (req, res) => {
  // Vérification que l'utilisateur est authentifié
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  const { action } = req.body;

  if (!action) {
    return res.status(400).json({ message: 'Action non spécifiée.' });
  }

  try {
    await logAuditAction(req.user.id, action);
    res.status(200).json({ message: 'Audit enregistré avec succès.' });
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de l\'audit :', err);
    res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement de l\'audit.' });
  }
});





// Routes

// ➔ Envoi de colis
app.post('/api/envoi', async (req, res) => {
  const { expediteur, destinataire, numeroTel, adresseLivraison, poids } = req.body;
  const actionDetails = `Expéditeur: ${expediteur}, Destinataire: ${destinataire}, Numéro de téléphone: ${numeroTel}, Adresse: ${adresseLivraison}, Poids: ${poids}`;

  try {
    const sql = 'INSERT INTO colis_envoi (expediteur, destinataire, numeroTel, adresseLivraison, poids) VALUES (?, ?, ?, ?, ?)';
    await db.execute(sql, [expediteur, destinataire, numeroTel, adresseLivraison, poids]);

    // Enregistrement de l'audit
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Envoi de colis', actionDetails, req.user ? req.user.id : null]);

    res.status(200).json({ message: "Colis envoyé enregistré avec succès !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de l'enregistrement de l'envoi." });
  }
});


// ➔ Réception de colis
app.post('/api/reception', async (req, res) => {
  const { destinataire, expediteur, numeroTel, adresse, suivi } = req.body;
  const actionDetails = `Destinataire: ${destinataire}, Expéditeur: ${expediteur}, Numéro de téléphone: ${numeroTel}, Adresse: ${adresse}, Suivi: ${suivi}`;

  try {
    const sql = 'INSERT INTO colis_reception (destinataire, expediteur, numeroTel, adresse, suivi) VALUES (?, ?, ?, ?, ?)';
    await db.execute(sql, [destinataire, expediteur, numeroTel, adresse, suivi]);

    // Enregistrement de l'audit
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Réception de colis', actionDetails, req.user ? req.user.id : null]);

    res.status(200).json({ message: "Réception enregistrée avec succès !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de l'enregistrement de la réception." });
  }
});



// ➔ Création de réclamation
app.post('/api/reclamations', async (req, res) => {
  const { numeroReclamation, typeReclamation, description } = req.body;
  if (!numeroReclamation || !typeReclamation || !description) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  const actionDetails = `Numéro: ${numeroReclamation}, Type: ${typeReclamation}, Description: ${description}`;

  try {
    const sql = 'INSERT INTO reclamations (numeroReclamation, typeReclamation, description, status) VALUES (?, ?, ?, ?)';
    await db.execute(sql, [numeroReclamation, typeReclamation, description, 'Créée']);

    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Création de réclamation', actionDetails, req.user ? req.user.id : null]);

    res.status(200).json({ message: "Réclamation créée avec succès !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la création." });
  }
});

// ➔ Suivi d'une réclamation
app.get('/api/reclamations/:numeroReclamation', async (req, res) => {
  const { numeroReclamation } = req.params;
  try {
    const sql = 'SELECT * FROM reclamations WHERE numeroReclamation = ?';
    const [rows] = await db.execute(sql, [numeroReclamation]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Réclamation non trouvée.' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors du suivi." });
  }
});

// ➔ Clôture d'une réclamation
app.patch('/api/reclamations/:numeroReclamation', async (req, res) => {
  const { numeroReclamation } = req.params;
  const { status } = req.body;
  if (status !== 'Clôturée') {
    return res.status(400).json({ message: 'Statut invalide.' });
  }
  try {
    const sql = 'UPDATE reclamations SET status = ? WHERE numeroReclamation = ?';
    const [result] = await db.execute(sql, [status, numeroReclamation]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Réclamation non trouvée.' });
    }

    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    const details = `Clôture de la réclamation numéro ${numeroReclamation}`;
    await db.execute(auditSql, ['Clôture de réclamation', details, req.user ? req.user.id : null]);

    res.status(200).json({ message: "Réclamation clôturée avec succès !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la clôture." });
  }
});

// ➔ Suppression d'une réclamation
app.delete('/api/reclamations/:numeroReclamation', async (req, res) => {
  const { numeroReclamation } = req.params;
  console.log("Tentative de suppression de la réclamation numéro:", numeroReclamation); // Log pour le débogage
  try {
    const sql = 'DELETE FROM reclamations WHERE numeroReclamation = ?';
    const [result] = await db.execute(sql, [numeroReclamation]);

    if (result.affectedRows === 0) {
      console.log("Réclamation non trouvée pour suppression.");  // Log si aucune ligne n'est affectée
      return res.status(404).json({ message: 'Réclamation non trouvée.' });
    }

    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    const details = `Suppression de la réclamation numéro ${numeroReclamation}`;
    await db.execute(auditSql, ['Suppression de réclamation', details, req.user ? req.user.id : null]);

    res.status(200).json({ message: "Réclamation supprimée avec succès !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
});




// ➔ Ajouter un compte
app.post('/api/gerercomptes', async (req, res) => {
  const { nom, prenom, identifiant, motDePasse, role } = req.body;
  
  // Vérification des champs requis
  if (!nom || !prenom || !identifiant || !motDePasse || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    // Insertion du nouveau compte dans la table 'gerercomptes'
    const sql = 'INSERT INTO gerercomptes (nom, prenom, identifiant, motDePasse, role) VALUES (?, ?, ?, ?, ?)';
    await db.execute(sql, [nom, prenom, identifiant, motDePasse, role]);

    // Définition de l'action d'audit après la déclaration des variables
    const actionDetails = `Ajout du compte ${identifiant}`;

    // Enregistrement du log d'audit
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    const userId = req.user ? req.user.id : null; // Utilisation de l'ID de l'utilisateur, si disponible
    await db.execute(auditSql, ['Ajout compte', actionDetails, userId]);

    // Réponse succès
    res.status(200).json({ message: 'Compte ajouté avec succès.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de l'ajout du compte." });
  }
});




// ➔ Planification de congés
app.post('/api/planifierconges', async (req, res) => {
  const { employe, dateDebut, dateFin } = req.body;
  if (!employe || !dateDebut || !dateFin) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }
  try {
    const sql = 'INSERT INTO conges (employe, dateDebut, dateFin) VALUES (?, ?, ?)';
    await db.execute(sql, [employe, dateDebut, dateFin]);
    res.status(200).json({ message: 'Congé planifié avec succès.' });

    const actionDetails = `Planification de congé pour ${employe} du ${dateDebut} au ${dateFin}`;
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Planification congé', actionDetails, req.user ? req.user.id : null]);

  } catch (err) {
    console.error('Erreur lors de l\'insertion des congés :', err);
    res.status(500).json({ message: "Erreur serveur lors de l'enregistrement du congé." });
  }
});


// ➔ Envoi de mandat
app.post('/api/mandats/envoi', async (req, res) => {
  const { expediteur, beneficiaire, type, montant, numeroTel, dateEnvoi } = req.body;
  if (!expediteur || !beneficiaire || !type || !montant || !numeroTel || !dateEnvoi) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }
  try {
    const sql = 'INSERT INTO mandats_envoi (expediteur, beneficiaire, type, montant, numeroTel, date_envoi) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.execute(sql, [expediteur, beneficiaire, type, montant, numeroTel, dateEnvoi]);
    res.status(201).json({ message: 'Mandat envoyé avec succès.', mandatId: result.insertId });

    const actionDetails = `Mandat envoyé de ${expediteur} à ${beneficiaire}, Montant: ${montant}, Type: ${type}`;
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Envoi mandat', actionDetails, req.user ? req.user.id : null]);

  } catch (err) {
    console.error('Erreur serveur lors de l\'envoi du mandat:', err);
    res.status(500).json({ message: 'Erreur serveur lors de l\'envoi du mandat.' });
  }
});

// ➔ Réception de mandat
app.post('/api/mandats/reception', async (req, res) => {
  const { expediteur, beneficiaire, type, montant, numeroTel, cin } = req.body;
  if (!expediteur || !beneficiaire || !type || !montant || !numeroTel || !cin) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  }
  try {
    const sql = 'INSERT INTO mandats_reception (expediteur, beneficiaire, type, montant, numeroTel, cin) VALUES (?, ?, ?, ?, ?, ?)';
    await db.execute(sql, [expediteur, beneficiaire, type, montant, numeroTel, cin]);
    res.status(201).json({ message: 'Réception de mandat enregistrée avec succès.' });

    const actionDetails = `Réception mandat pour ${beneficiaire}, Montant: ${montant}, Type: ${type}, CIN: ${cin}`;
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Réception mandat', actionDetails, req.user ? req.user.id : null]);

  } catch (err) {
    console.error('Erreur serveur lors de la réception du mandat:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la réception du mandat.' });
  }
});



// Route gestion de paiement chef d'agence 

app.post('/paiement', async (req, res) => {
  const { montant, date } = req.body;
  if (!montant || !date) {
    return res.status(400).json({ message: 'Tous les champs doivent être remplis.' });
  }
  console.log('Reçu :', { montant, date });
  try {
    const sql = 'INSERT INTO paiements (montant, date) VALUES (?, ?)';
    await db.execute(sql, [montant, date]);
    res.status(200).json({ message: '✅ Paiement effectué avec succès !' });

    const actionDetails = `Paiement de ${montant} DT effectué le ${date}`;
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Paiement', actionDetails, req.user ? req.user.id : null]);

  } catch (err) {
    console.error('Erreur serveur lors du paiement:', err);
    res.status(500).json({ message: '❌ Erreur serveur lors du paiement.' });
  }
});




// ➔ Paiement de factures
app.post('/api/paiementfactures', async (req, res) => {
  const { nomClient, prenomClient, numeroTel, email, typeFacture, fournisseur, numeroFacture, montant, modePaiement } = req.body;

  console.log('Données reçues du front-end :', { nomClient, prenomClient, numeroTel, email, typeFacture, fournisseur, numeroFacture, montant, modePaiement });

  if (!nomClient || !prenomClient || !numeroTel || !email || !typeFacture || !fournisseur || !numeroFacture || !montant || !modePaiement) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  const actionDetails = `Client: ${nomClient} ${prenomClient}, Facture: ${numeroFacture}, Montant: ${montant}, Mode de paiement: ${modePaiement}`;

  try {
    const sql = 'INSERT INTO paiementfactures (nomClient, prenomClient, numeroTel, email, typeFacture, fournisseur, numeroFacture, montant, modePaiement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await db.execute(sql, [nomClient, prenomClient, numeroTel, email, typeFacture, fournisseur, numeroFacture, montant, modePaiement]);

    // Enregistrement de l'audit
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Paiement de facture', actionDetails, req.user ? req.user.id : null]);

    res.status(201).json({ message: 'Paiement ajouté avec succès.' });
  } catch (err) {
    console.error('Erreur lors de l\'insertion du paiement:', err);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du paiement.' });
  }
});



// ➔ Gestion du pointage
app.post('/api/gererpointage', async (req, res) => {
  const { employe, date, statut } = req.body;
  if (!employe || !date || !statut ) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }
  try {
    const sql = 'INSERT INTO gererpointage (employe, date, statut) VALUES (?, ?, ?)';
    await db.execute(sql, [employe, date, statut]);
    res.status(200).json({ message: 'Pointage enregistré avec succès.' });

    const actionDetails = `Pointage de ${employe} enregistré pour la date ${date} avec statut: ${statut}`;
    const auditSql = 'INSERT INTO audit_logs (action, details, user_id) VALUES (?, ?, ?)';
    await db.execute(auditSql, ['Pointage', actionDetails, req.user ? req.user.id : null]);

  } catch (err) {
    console.error('Erreur SQL :', err.message);
    res.status(500).json({ message: 'Erreur serveur : ' + err.message });
  }
});


app.get('/api/logs', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des logs:', err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des logs." });
  }
});





// ✅ Fonction pour démarrer le serveur (HTTP uniquement pour Render)
function startServer() {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur lancé sur http://0.0.0.0:${PORT}`);
  });
}

// Lancer le serveur
startServer();
