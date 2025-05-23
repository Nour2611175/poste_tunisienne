const mysql = require('mysql2');
require('dotenv').config(); // Pour charger les variables d'environnement

const connection = mysql.createConnection({
  host:sql.freedb.tech,     
  user:freedb_nour12,       
  password:9twXWC$C3n&tvj$,
  database:freedb_poste12E,  
  port:3306      
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données :', err.message);
  } else {
    console.log('✅ Connecté à la base de données MySQL');
  }
});

module.exports = connection;
