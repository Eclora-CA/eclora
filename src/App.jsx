import React from 'react';
import {Header, Footer} from './components/Layout.jsx';
import HomeFr from './pages/HomeFr.jsx';
import HomeEn from './pages/HomeEn.jsx';
import ProjectFr from './pages/ProjectFr.jsx';
import ProjectEn from './pages/ProjectEn.jsx';
import ThanksFr from './pages/ThanksFr.jsx';
import ThanksEn from './pages/ThanksEn.jsx';
import metadata from './pages/metadata.json';

const pages={'index.html':HomeFr,'en.html':HomeEn,'projet.html':ProjectFr,'project.html':ProjectEn,'merci.html':ThanksFr,'thanks.html':ThanksEn};
export function App({page='index.html',year}) {
  const Page=pages[page]||HomeFr;
  const {lang}=metadata[page]||metadata['index.html'];
  return <><Header lang={lang} page={page}/><Page/><Footer lang={lang} page={page} year={year}/></>;
}
