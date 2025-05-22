const bcrypt = require('bcrypt');

// Fonction pour vérifier le mot de passe
function verifyPassword(storedHash, userInputPassword) {
    return bcrypt.compare(userInputPassword, storedHash);  // Comparer les mots de passe
}

// Hachages des mots de passe stockés pour les utilisateurs
const storedGuichetierPasswordHash = '$2b$10$hDl69xKZTHCqdOLxu86Xbea8SxnPJB5CTYjwFBdqwMBi5d4O00QlO'; // guichetier123
const storedArriereGuichetPasswordHash = '$2b$10$CNRAMroSecEkrf9KHRknXeaAxk1Z9BzpY6SThndys20xhjacHKvY.'; // arriereguichet123
const storedChefAgencePasswordHash = '$2b$10$AJjJeDhYPevHO.0MAQt7kuUH1DQAcsSsaB6CRvkjBvzjJ9LHyaYP6'; // chefagence123

// ⚠️ Chaque mot de passe doit correspondre à son rôle
const guichetierPassword = 'guichetier123';
const arriereGuichetPassword = 'arriereguichet123';
const chefAgencePassword = 'chefagence123';

// Vérification du mot de passe pour "Guichetier"
verifyPassword(storedGuichetierPasswordHash, guichetierPassword).then((isMatch) => {
    if (isMatch) {
        console.log('✅ Mot de passe correct pour Guichetier!');
    } else {
        console.log('❌ Mot de passe incorrect pour Guichetier.');
    }
});

// Vérification du mot de passe pour "Arrière Guichet"
verifyPassword(storedArriereGuichetPasswordHash, arriereGuichetPassword).then((isMatch) => {
    if (isMatch) {
        console.log('✅ Mot de passe correct pour Arrière Guichet!');
    } else {
        console.log('❌ Mot de passe incorrect pour Arrière Guichet.');
    }
});

// Vérification du mot de passe pour "Chef d\'Agence"
verifyPassword(storedChefAgencePasswordHash, chefAgencePassword).then((isMatch) => {
    console.log(`Mot de passe saisi: ${chefAgencePassword}`);
    console.log(`Hash stocké       : ${storedChefAgencePasswordHash}`);
    if (isMatch) {
        console.log('✅ Mot de passe correct pour Chef d\'Agence!');
    } else {
        console.log('❌ Mot de passe incorrect pour Chef d\'Agence.');
    }
});
