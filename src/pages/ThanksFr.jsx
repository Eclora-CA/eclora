import React from 'react';
import {ContactForm, SourceUrl, ValidatedInput} from '../components/Forms.jsx';
import {PortfolioPreview} from '../components/PortfolioPreview.jsx';

export default function ThanksFr(){
 return <><main className={"wrap confirmation-page"}><div className={"confirmation-card"}><p className={"eyebrow"}>{"LA SUITE SE PRÉPARE"}</p><h1>{"Merci pour votre demande."}</h1><p className={"intro"}>{"Nous allons examiner vos renseignements et revenir vers vous pour discuter des prochaines étapes."}</p><p>{"L’accusé de réception est envoyé à l’adresse courriel indiquée. Pensez à vérifier vos courriels indésirables."}</p><div className={"confirmation-actions"}><a className={"button"} href={"index.html"}>{"Retour à l’accueil"}</a></div><p className={"confirmation-contact"}>{"Une précision à ajouter ? Écrivez-nous à "}<a href={"mailto:info@eclora.ca"}>{"info@eclora.ca"}</a>{"."}</p></div></main></>;
}
