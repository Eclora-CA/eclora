import React, {useEffect, useState} from 'react';

export function Header({lang, page}) {
  const en = lang === 'en';
  const home = en ? 'en.html' : 'index.html';
  const isHome = page === 'index.html' || page === 'en.html';
  const base = isHome ? '' : home;
  const project = en ? 'project.html' : 'projet.html';
  const pair = page === 'projet.html' || page === 'project.html'
    ? ['projet.html', 'project.html'] : page === 'merci.html' || page === 'thanks.html'
    ? ['merci.html', 'thanks.html'] : ['index.html', 'en.html'];
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const languageLink = event => {
    const url = new URL(event.currentTarget.href);
    url.hash = window.location.hash;
    event.currentTarget.href = url.href;
  };
  return <header>
    <a href={base+'#'} className="brand" aria-label={en?'Éclora home':'Éclora accueil'}><img src="assets/logo.png" alt="Éclora"/></a>
    <nav id="navigation" className={open?'open':undefined} onClick={()=>setOpen(false)}>
      <a href={base+'#offre'}>{en?'Our offer':'Notre offre'}</a>
      <a href={base+'#inspirations'}>{en?'Our work':'Nos réalisations'}</a>
      <a href={base+'#etapes'}>{en?'How it works':'Comment ça marche'}</a>
      <a href={project} className="small-cta">{en?'Start my project':'Démarrer mon projet'}</a>
    </nav>
    <div className="language-switch" role="group" aria-label={en?'Website language':'Langue du site'}>
      <a href={pair[0]} lang="fr" hrefLang="fr" aria-current={!en?'page':undefined} onClick={languageLink}>FR</a>
      <span aria-hidden="true">|</span>
      <a href={pair[1]} lang="en" hrefLang="en" aria-current={en?'page':undefined} onClick={languageLink}>EN</a>
    </div>
    <button className="menu" aria-label={en?(open?'Close navigation':'Open navigation'):(open?'Fermer la navigation':'Ouvrir la navigation')} aria-expanded={open} aria-controls="navigation" onClick={()=>setOpen(!open)}><span/><span/><span/></button>
  </header>;
}

export function Footer({lang, page, year}) {
  const en=lang==='en';
  const home=en?'en.html':'index.html';
  const isHome=page==='index.html'||page==='en.html';
  return <footer className="wrap">
    <a className="brand" href={(isHome?'':home)+'#'}><img src="assets/logo.png" alt="Éclora"/></a>
    <p>{en?'Your expertise deserves to be seen.':'Votre expertise mérite d’être vue.'}</p>
    <a href="mailto:info@eclora.ca" className="footer-email">info@eclora.ca</a>
    <span>© <span id="year">{year}</span> Éclora</span>
  </footer>;
}
