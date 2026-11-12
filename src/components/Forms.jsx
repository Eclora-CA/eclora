
import React, {
  useContext,
  createContext,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  validContactEmail,
  validContactPhone
} from '../lib/validation.mjs';

const FormLanguage = createContext('fr');

function getContactApiUrl() {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:8787/api/contact`;
  }

  return 'https://api.eclora.ca/api/contact';
}

export function ContactForm({
  lang = 'fr',
  children,
  ...props
}) {
  const [status, setStatus] = useState('idle');
  const busy = useRef(false);

  const en = lang === 'en';

  const messages = en
    ? {
        loading: 'Sending your message...',
        success: 'Thank you! Your message has been sent.',
        error: 'Unable to send your message. Please try again.'
      }
    : {
        loading: 'Envoi de votre message...',
        success: 'Merci ! Votre message a été envoyé.',
        error: 'Impossible d’envoyer votre message. Veuillez réessayer.'
      };

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.reportValidity() || busy.current) {
      return;
    }

    busy.current = true;
    setStatus('loading');

    const buttons = [
      ...form.querySelectorAll('button[type="submit"]')
    ];

    buttons.forEach(button => {
      button.disabled = true;
    });

    // Preserve repeated checkbox values such as pages[].
    const payload = {};

    for (const [key, value] of new FormData(form).entries()) {
      const existing = payload[key];

      if (existing === undefined) {
        payload[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        payload[key] = [existing, value];
      }
    }

    try {
      const response = await fetch(getContactApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error('Submission failed');
      }

      form.reset();
      setStatus('success');

    } catch (error) {
      console.error('Contact form submission failed:', error);
      setStatus('error');

    } finally {
      busy.current = false;

      buttons.forEach(button => {
        button.disabled = false;
      });
    }
  }

  return (
    <FormLanguage.Provider value={lang}>
      <form {...props} onSubmit={handleSubmit}>
        {children}

        <div aria-live="polite" role="status">
          {status !== 'idle' && (
            <p
              className={
                status === 'success'
                  ? 'contact-success'
                  : status === 'error'
                    ? 'contact-error'
                    : 'contact-status'
              }
            >
              {messages[status]}
            </p>
          )}
        </div>
      </form>
    </FormLanguage.Provider>
  );
}

export function SourceUrl() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const source = new URL(window.location.href);

    source.hash = '';
    source.search = '';

    setUrl(source.href);
  }, []);

  return (
    <input
      type="hidden"
      name="_url"
      value={url}
    />
  );
}

export function ValidatedInput(props) {
  const lang = useContext(FormLanguage);

  const [error, setError] = useState('');
  const ref = useRef(null);
  const touched = useRef(false);

  const en = lang === 'en';

  const messages = en
    ? {
        required: 'Please enter your email address.',
        email: 'Enter a valid email address, for example name@example.ca.',
        phone: 'Enter a 10-digit Canadian or US number, or an international number starting with +. Example: 514 555-0123.'
      }
    : {
        required: 'Veuillez saisir votre adresse courriel.',
        email: 'Entrez une adresse courriel valide, par exemple nom@exemple.ca.',
        phone: 'Entrez un numéro canadien ou américain à 10 chiffres, ou un numéro international commençant par +. Exemple : 514 555-0123.'
      };

  function validate(field, show) {
    const value = field.value.trim();
    let message = '';

    if (!value && field.required) {
      message = messages.required;
    } else if (
      value &&
      props.type === 'email' &&
      !validContactEmail(value)
    ) {
      message = messages.email;
    } else if (
      value &&
      props.type === 'tel' &&
      !validContactPhone(value)
    ) {
      message = messages.phone;
    }

    field.setCustomValidity(message);

    if (show) {
      setError(message);
    }
  }

  useEffect(() => {
    const field = ref.current;

    if (!field) return;

    const reset = () => {
      field.setCustomValidity('');
      touched.current = false;
      setError('');
    };

    const form = field.form;

    form?.addEventListener('reset', reset);

    return () => {
      form?.removeEventListener('reset', reset);
    };
  }, []);

  const errorId = props.id + '-validation';

  return (
    <>
      <input
        {...props}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[
          props['aria-describedby'],
          errorId
        ].filter(Boolean).join(' ')}
        onChange={event =>
          validate(event.currentTarget, touched.current)
        }
        onBlur={event => {
          event.currentTarget.value =
            event.currentTarget.value.trim();

          touched.current = true;

          validate(event.currentTarget, true);
        }}
        onInvalid={event => {
          touched.current = true;
          validate(event.currentTarget, true);
        }}
      />

      <span
        id={errorId}
        className="contact-validation"
        hidden={!error}
        aria-live="polite"
      >
        {error}
      </span>
    </>
  );
}
