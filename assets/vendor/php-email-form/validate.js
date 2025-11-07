/**
* PHP Email Form Validation - v3.11
* URL: https://bootstrapmade.com/php-email-form/
* 
*/
(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  forms.forEach( function(e) {
    e.addEventListener('submit', function(event) {
      event.preventDefault();

      let thisForm = this;

      let action = thisForm.getAttribute('action');
      let recaptcha = thisForm.getAttribute('data-recaptcha-site-key');
      
      if( ! action ) {
        displayError(thisForm, 'The form action property is not set!');
        return;
      }
      thisForm.querySelector('.loading').classList.add('d-block');
      thisForm.querySelector('.error-message').classList.remove('d-block');
      thisForm.querySelector('.sent-message').classList.remove('d-block');

      let formData = new FormData( thisForm );

      // Dev/test mode: if form has data-dev="true", simulate success without sending request
      if (thisForm.dataset.dev === 'true') {
        // keep loading indicator briefly then show success
        setTimeout(() => {
          thisForm.querySelector('.loading').classList.remove('d-block');
          const sent = thisForm.querySelector('.sent-message');
          sent.classList.add('d-block');
          thisForm.reset();
          // show same UI notifications as a real success
          try { showToast('Message sent (dev mode)', 'success'); } catch(e) {}
          try { showSystemNotification('Message sent', 'Dev mode: simulated success'); } catch(e) {}
        }, 800);
        return;
      }

      if ( recaptcha ) {
        if(typeof grecaptcha !== "undefined" ) {
          grecaptcha.ready(function() {
            try {
              grecaptcha.execute(recaptcha, {action: 'php_email_form_submit'})
              .then(token => {
                formData.set('recaptcha-response', token);
                php_email_form_submit(thisForm, action, formData);
              })
            } catch(error) {
              displayError(thisForm, error);
            }
          });
        } else {
          displayError(thisForm, 'The reCaptcha javascript API url is not loaded!')
        }
      } else {
        php_email_form_submit(thisForm, action, formData);
      }
    });
  });

  function php_email_form_submit(thisForm, action, formData) {
    fetch(action, {
      method: 'POST',
      body: formData,
      headers: {'X-Requested-With': 'XMLHttpRequest'}
    })
    .then(response => {
      if( response.ok ) {
        return response.text();
      } else {
        throw new Error(`${response.status} ${response.statusText} ${response.url}`); 
      }
    })
    .then(data => {
      // Treat any 2xx (response.ok) as success for external form endpoints
      thisForm.querySelector('.loading').classList.remove('d-block');
      const sent = thisForm.querySelector('.sent-message');
      sent.classList.add('d-block');
      // reset form
      thisForm.reset();
      // show a small on-page toast styled like W3 (green)
      showToast('Message sent — thank you!', 'success');
      // try to show a system notification if allowed
      showSystemNotification('Message sent', 'Thank you — I will get back to you soon.');
    })
    .catch((error) => {
      displayError(thisForm, error);
      showToast(String(error), 'error');
      showSystemNotification('Message failed', String(error));
    });
  }

  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    const errEl = thisForm.querySelector('.error-message');
    errEl.innerHTML = error;
    errEl.classList.add('d-block');
  }

  /*
   * Small helper: create a temporary toast notification on the page.
   * type: 'success' | 'error' (affects color)
   */
  function showToast(message, type) {
    try {
      const id = 'w3-toast-notification';
      // remove existing toast if present
      const prev = document.getElementById(id);
      if (prev) prev.remove();

      const toast = document.createElement('div');
      toast.id = id;
      // basic W3-like styles (inline to avoid changing CSS files)
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.zIndex = 9999;
      toast.style.padding = '12px 18px';
      toast.style.borderRadius = '4px';
      toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      toast.style.color = '#fff';
      toast.style.fontSize = '14px';
      toast.style.maxWidth = '320px';
      toast.style.lineHeight = '1.3';
      toast.style.cursor = 'default';
      if (type === 'success') {
        toast.style.backgroundColor = '#4CAF50'; // w3-green
      } else {
        toast.style.backgroundColor = '#f44336'; // w3-red
      }

      toast.textContent = message;
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.tabIndex = -1;

      document.body.appendChild(toast);

      // animate and remove after 5s
      setTimeout(() => {
        toast.style.transition = 'opacity 300ms ease-out, transform 300ms ease-out';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }, 4200);
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 4600);
    } catch (e) {
      // fail silently
      console.error(e);
    }
  }

  /*
   * Try to show a system notification (will request permission if needed).
   */
  function showSystemNotification(title, body) {
    if (!('Notification' in window)) return;
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function(permission) {
          if (permission === 'granted') {
            new Notification(title, { body: body });
          }
        });
      }
    } catch (e) {
      // ignore Notification errors (some browsers block in insecure contexts)
      console.warn('System notification failed:', e);
    }
  }

})();
