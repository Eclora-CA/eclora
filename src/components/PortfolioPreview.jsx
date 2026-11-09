import React, {useState} from 'react';

export function PortfolioPreview({lang, src, title}) {
  const [mobile,setMobile]=useState(false);
  return <div className="project-preview">
    <div className={'project-desktop'+(mobile?' is-mobile':'')}>
      <div className="project-bar"><span/><span/><span/></div>
      <iframe src={src} title={title} loading="lazy" referrerPolicy="no-referrer"/>
    </div>
    <div className="preview-controls">
      <button type="button" aria-pressed={!mobile} onClick={()=>setMobile(false)}>{lang==='en'?'Desktop':'Ordinateur'}</button>
      <button type="button" aria-pressed={mobile} onClick={()=>setMobile(true)}>Mobile</button>
    </div>
  </div>;
}
