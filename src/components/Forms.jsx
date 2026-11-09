import React, {useContext, createContext, useEffect, useRef, useState} from 'react';
import {validContactEmail, validContactPhone} from '../lib/validation.mjs';

const FormLanguage=createContext('fr');

export function ContactForm({lang, children, ...props}) {
  return <FormLanguage.Provider value={lang}><form {...props}>{children}</form></FormLanguage.Provider>;
}

export function SourceUrl({initialValue}) {
  const [url,setUrl]=useState(initialValue);
  useEffect(()=>{
    const source=new URL(window.location.href);
    source.hash='';source.search='';setUrl(source.href);
  },[]);
  return <input type="hidden" name="_url" value={url}/>;
}

export function ValidatedInput(props) {
  const lang=useContext(FormLanguage);
  const [error,setError]=useState('');
  const ref=useRef(null);
  const touched=useRef(false);
  const en=lang==='en';
  const messages=en?{
    required:'Please enter your email address.',
    email:'Enter a valid email address, for example name@example.ca.',
    phone:'Enter a 10-digit Canadian or US number, or an international number starting with +. Example: 514 555-0123.'
  }:{
    required:'Veuillez saisir votre adresse courriel.',
    email:'Entrez une adresse courriel valide, par exemple nom@exemple.ca.',
    phone:'Entrez un numéro canadien ou américain à 10 chiffres, ou un numéro international commençant par +. Exemple : 514 555-0123.'
  };
  function validate(field, show) {
    const value=field.value.trim();
    let message='';
    if(!value&&field.required)message=messages.required;
    else if(props.type==='email'&&!validContactEmail(value))message=messages.email;
    else if(props.type==='tel'&&!validContactPhone(value))message=messages.phone;
    field.setCustomValidity(message);
    if(show)setError(message);
  }
  useEffect(()=>{
    const field=ref.current;
    const reset=()=>{field.setCustomValidity('');touched.current=false;setError('');};
    const form=field.form;
    form.addEventListener('reset',reset);
    return ()=>form.removeEventListener('reset',reset);
  },[]);
  const errorId=props.id+'-validation';
  return <>
    <input {...props} ref={ref} aria-invalid={error?'true':undefined}
      aria-describedby={[props['aria-describedby'],errorId].filter(Boolean).join(' ')}
      onChange={event=>validate(event.currentTarget,touched.current)}
      onBlur={event=>{event.currentTarget.value=event.currentTarget.value.trim();touched.current=true;validate(event.currentTarget,true);}}
      onInvalid={event=>{touched.current=true;validate(event.currentTarget,true);}}/>
    <span id={errorId} className="contact-validation" hidden={!error} aria-live="polite">{error}</span>
  </>;
}
