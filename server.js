const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(__dirname));

const commandesFile = path.join(__dirname, 'commandes.json');
const produitsAutorises = new Set(['Le Rafiki', 'Le Classique', 'Le Végétal']);

function nettoyer(value, max = 80) {
    return typeof value === 'string' ? value.trim().replace(/[<>]/g, '').slice(0, max) : '';
}

app.get('/api/sante', (_req, res) => res.json({ ok: true }));

app.post('/commander', (req, res) => {
    const commande = req.body || {};
    const nom = nettoyer(commande.nom);
    const telephone = nettoyer(commande.telephone, 30);
    const produit = nettoyer(commande.produit, 30);
    const quantite = Number.parseInt(commande.quantite, 10);

    if (!nom || !telephone || !produitsAutorises.has(produit) || !Number.isInteger(quantite) || quantite < 1 || quantite > 20) {
        return res.status(400).json({ message: 'Commande invalide. Vérifiez les champs saisis.' });
    }

    const nouvelleCommande = { nom, telephone, produit, quantite, recueLe: new Date().toISOString() };
    let commandes = [];
    try {
        if (fs.existsSync(commandesFile)) commandes = JSON.parse(fs.readFileSync(commandesFile, 'utf8'));
        if (!Array.isArray(commandes)) commandes = [];
        commandes.push(nouvelleCommande);
        fs.writeFileSync(commandesFile, JSON.stringify(commandes, null, 2));
    } catch (error) {
        console.error('Impossible de sauvegarder la commande:', error.message);
        return res.status(500).json({ message: 'La commande ne peut pas être sauvegardée pour le moment.' });
    }

    console.log('Nouvelle commande reçue:', nouvelleCommande);
    res.status(201).json({ message: 'Commande reçue avec succès.' });
});

app.listen(port, () => console.log(`Rafiki'Ndwich écoute sur http://localhost:${port}`));
