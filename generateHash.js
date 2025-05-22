const bcrypt = require('bcrypt');

// Générer le hash pour chefagence123
bcrypt.hash('chefagence123', 10).then((hashedPassword) => {
    console.log('Hash généré pour chefagence123 :', hashedPassword);
});

// Générer le hash pour arriereguichet123
bcrypt.hash('arriereguichet123', 10).then((hashedPassword) => {
    console.log('Hash généré pour arriereguichet123 :', hashedPassword);
});
