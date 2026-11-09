export function validContactEmail(value){
 const email=value.trim();
 if(!email)return true;
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return false;
 const [local,domain]=email.split('@');
 return local.length<=64&&!local.startsWith('.')&&!local.endsWith('.')&&!local.includes('..')&&domain.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}
export function validContactPhone(value){
 const phone=value.trim();
 if(!phone)return true;
 const main=phone.replace(/\s*(?:ext\.?|extension|poste|x|#)\s*\d{1,6}\s*$/i,'').trim();
 if(!/^\+?[0-9().\s-]+$/.test(main))return false;
 const digits=main.replace(/\D/g,'');
 if(main.startsWith('+')&&!digits.startsWith('1'))return /^[2-9]\d{7,14}$/.test(digits);
 const national=digits.length===11&&digits.startsWith('1')?digits.slice(1):digits;
 return /^[2-9]\d{2}[2-9]\d{6}$/.test(national);
}
