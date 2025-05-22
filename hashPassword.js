const bcrypt = require('bcrypt');

// Fonction pour générer le hachage d'un mot de passe
async function hashPassword(password) {
    const saltRounds = 10;  // Nombre de rounds de salage
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`Hachage généré : ${hashedPassword}`);
    return hashedPassword;
}

// Utilisateurs à ajouter et leurs mots de passe
const users = [
    { username: 'guichetier', password: 'guichetier123' },
    { username: 'arriereguichet', password: 'arriereguichet123' },
    { username: 'chefagence', password: 'chefagence123' }
];

// Hachage des mots de passe et affichage des résultats
async function generateHashes() {
    for (const user of users) {
        const hashedPassword = await hashPassword(user.password);
        console.log(`Utilisateur: ${user.username}`);
        console.log(`Mot de passe haché: ${hashedPassword}\n`);
    }
}

// Exécution de la génération des hachages
generateHashes();
