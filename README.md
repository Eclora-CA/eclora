# Éclora — site React

Le site est converti en composants React. Les six pages françaises et anglaises sont générées en HTML lors de la compilation, puis rendues interactives par React dans le navigateur. L'hébergement ne nécessite pas de serveur Node.js en production.

## Héberger le site immédiatement

Le dossier **dist/** contient la version prête à publier. Téléversez **tout le contenu de dist/** dans le dossier public de votre hébergeur, avec le dossier `assets/` et `style.css`. Le fichier `index.html` doit se trouver à la racine du site.

Sur un service avec déploiement par dépôt Git :

- Commande d'installation : `npm ci`
- Commande de compilation : `npm run build`
- Dossier de sortie : `dist`
- Node.js : version 22 ou plus récente

Sur Cloudflare Pages, utilisez un projet statique et le dossier de sortie `dist`. Pour un téléversement manuel, sélectionnez le contenu de ce dossier. Aucune réécriture de type SPA n'est nécessaire : les pages `.html` existent réellement.

Le nom de domaine et ses réglages DNS sont à configurer chez l'hébergeur choisi. Cette archive n'inclut aucun accès de compte ou secret.

## Modifier et compiler

Ouvrez un terminal dans ce dossier :

```sh
npm ci
npm test
npm run build
npm start
```

Ouvrez ensuite `http://localhost:4173`. Utilisez un serveur local ou un hébergement HTTP(S); n'ouvrez pas simplement les fichiers par double-clic. Après une modification du code ou des visuels, relancez `npm run build`, puis rechargez la page.

## Où modifier le site

- `src/pages/HomeFr.jsx` et `HomeEn.jsx` : accueil et offre.
- `src/pages/ProjectFr.jsx` et `ProjectEn.jsx` : questionnaire « Démarrer mon projet ».
- `src/pages/ThanksFr.jsx` et `ThanksEn.jsx` : pages de remerciement disponibles, non utilisées comme redirection actuellement.
- `src/pages/metadata.json` : titres, descriptions et liens entre les langues.
- `src/components/Layout.jsx` : menu, choix de langue et pied de page.
- `src/components/Forms.jsx` : champs validés et adresse de la page envoyée à FormSubmit.
- `src/components/PortfolioPreview.jsx` : aperçu ordinateur/mobile du portfolio.
- `src/lib/validation.mjs` : règles de validation courriel et téléphone.
- `public/style.css` : présentation et adaptation au mobile.
- `public/assets/` : logo et images.
- `scripts/build.mjs` : compilation et génération des pages statiques.

Le dossier `dist/` est généré : modifiez les sources et non les fichiers compilés.

## État conservé dans cette version

- Français et anglais; design et textes actuels conservés.
- Création du site : 250 $ après rabais; hébergement : 60 $ par an.
- Abela et Paméla retirés temporairement des réalisations.
- Invitations et liens Calendly retirés temporairement.
- Formulaires adressés à `info@eclora.ca`, avec CAPTCHA et réponse automatique FormSubmit.
- Validation du format des courriels et téléphones; téléphone facultatif. La validation ne prouve pas que le numéro ou l'adresse existe.

## FormSubmit : point à suivre

L'erreur 500 signalée après l'envoi sur `https://formsubmit.co/form/submission` reste à résoudre avec le service. La conversion React ne la corrige pas. Les formulaires conservent l'envoi POST classique, la protection CAPTCHA et les messages automatiques. Aucun faux message de réussite n'est ajouté, et aucun envoi réel de test n'a été fait lors de la conversion.

Après publication chez un nouvel hébergeur, effectuez un essai avec votre propre adresse pour vérifier la réception et la réponse automatique; FormSubmit peut demander une nouvelle activation selon le domaine.

## Dépendances

React et React DOM sont installés à partir de npm. Les versions exactes et les dépendances sont verrouillées dans `package-lock.json`. Leurs licences sont conservées dans les fichiers distribués et disponibles dans les paquets installés. Les fichiers `node_modules/`, les données internes de publication et les fichiers Git sont volontairement exclus de l'export.
