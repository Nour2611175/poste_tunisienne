const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',  // Adresse de ton serveur MySQL
  user: 'ton_utilisateur',  // Ton nom d'utilisateur MySQL
  password: 'ton_mot_de_passe',  // Ton mot de passe MySQL
  database: 'la_poste_kantaoui'  // Ton nom de base de données
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données: ', err.message);
  } else {
    console.log('Connecté à la base de données MySQL');
  }
});

module.exports = connection;  // Exporte la connexion pour l'utiliser ailleurs
