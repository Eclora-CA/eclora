const english=document.documentElement.lang==='en';const menuLabels=english?{open:'Open navigation',close:'Close navigation'}:{open:'Ouvrir la navigation',close:'Fermer la navigation'};const menu=document.querySelector('.menu');const navigation=document.querySelector('#navigation');menu.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?menuLabels.close:menuLabels.open);});navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{navigation.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label',menuLabels.open);}));document.addEventListener('keydown',event=>{if(event.key==='Escape'){navigation.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label',menuLabels.open);}});document.querySelector('#year').textContent=new Date().getFullYear();

document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{const preview=button.closest('.project-preview');const frame=preview.querySelector('.project-desktop');frame.classList.toggle('is-mobile',button.dataset.preview==='mobile');preview.querySelectorAll('[data-preview]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));

document.querySelectorAll('.language-switch a').forEach(link=>link.addEventListener('click',()=>{const url=new URL(link.getAttribute('href'),window.location.href);url.hash=window.location.hash;link.href=url.href;}));

// Provide the actual form page URL without relying on cross-site referrer headers.
document.querySelectorAll('form[action="https://formsubmit.co/info@eclora.ca"]').forEach(form=>{
 const source=form.querySelector('input[name="_url"]');
 if(source&&/^https?:$/.test(window.location.protocol)){
  const url=new URL(window.location.href);url.hash='';url.search='';source.value=url.href;
 }
});

// Check contact details before the browser sends the form.
function validContactEmail(value){
 const email=value.trim();
 if(!email)return true;
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return false;
 const [local,domain]=email.split('@');
 return local.length<=64&&!local.startsWith('.')&&!local.endsWith('.')&&!local.includes('..')&&domain.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}
function validContactPhone(value){
 const phone=value.trim();
 if(!phone)return true;
 const main=phone.replace(/\s*(?:ext\.?|extension|poste|x|#)\s*\d{1,6}\s*$/i,'').trim();
 if(!/^\+?[0-9().\s-]+$/.test(main))return false;
 const digits=main.replace(/\D/g,'');
 if(main.startsWith('+')&&!digits.startsWith('1'))return /^[2-9]\d{7,14}$/.test(digits);
 const national=digits.length===11&&digits.startsWith('1')?digits.slice(1):digits;
 return /^[2-9]\d{2}[2-9]\d{6}$/.test(national);
}
document.querySelectorAll('input[type="email"],input[type="tel"]').forEach(field=>{
 const isEmail=field.type==='email';
 const messages=english?{
  required:'Please enter your email address.',
  email:'Enter a valid email address, for example name@example.ca.',
  phone:'Enter a 10-digit Canadian or US number, or an international number starting with +. Example: 514 555-0123.'
 }:{
  required:'Veuillez saisir votre adresse courriel.',
  email:'Entrez une adresse courriel valide, par exemple nom@exemple.ca.',
  phone:'Entrez un numéro canadien ou américain à 10 chiffres, ou un numéro international commençant par +. Exemple : 514 555-0123.'
 };
 const error=document.createElement('span');
 error.id=field.id+'-validation';error.className='contact-validation';error.hidden=true;error.setAttribute('aria-live','polite');
 field.insertAdjacentElement('afterend',error);
 field.setAttribute('aria-describedby',[field.getAttribute('aria-describedby'),error.id].filter(Boolean).join(' '));
 let touched=false;
 function validate(show){
  const value=field.value.trim();
  let message='';
  if(!value&&field.required)message=messages.required;
  else if(isEmail&&!validContactEmail(value))message=messages.email;
  else if(!isEmail&&!validContactPhone(value))message=messages.phone;
  field.setCustomValidity(message);
  if(show){error.textContent=message;error.hidden=!message;field.setAttribute('aria-invalid',String(Boolean(message)));}
 }
 field.addEventListener('input',()=>validate(touched));
 field.addEventListener('blur',()=>{field.value=field.value.trim();touched=true;validate(true);});
 field.addEventListener('invalid',()=>{touched=true;validate(true);});
 field.addEventListener('change',()=>validate(touched));
 field.form.addEventListener('submit',event=>{validate(true);if(!field.checkValidity()){event.preventDefault();field.reportValidity();}});
 field.form.addEventListener('reset',()=>{touched=false;field.setCustomValidity('');field.removeAttribute('aria-invalid');error.textContent='';error.hidden=true;});
 validate(false);
});
