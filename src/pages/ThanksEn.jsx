import React from 'react';
import {ContactForm, SourceUrl, ValidatedInput} from '../components/Forms.jsx';
import {PortfolioPreview} from '../components/PortfolioPreview.jsx';

export default function ThanksEn(){
 return <><main className={"wrap confirmation-page"}><div className={"confirmation-card"}><p className={"eyebrow"}>{"HERE’S WHAT COMES NEXT"}</p><h1>{"Thank you for your enquiry."}</h1><p className={"intro"}>{"We will review your information and get back to you to discuss the next steps."}</p><p>{"A confirmation is sent to the email address you provided. Please check your spam folder as well."}</p><div className={"confirmation-actions"}><a className={"button"} href={"en.html"}>{"Back to home"}</a></div><p className={"confirmation-contact"}>{"Have something to add? Email us at "}<a href={"mailto:info@eclora.ca"}>{"info@eclora.ca"}</a>{"."}</p></div></main></>;
}
