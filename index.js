import { html, PolymerElement } from '@polymer/polymer/polymer-element'

export default class MoeRecaptcha extends PolymerElement {

  static get properties() {
    return {
      version: {
        type: Number,
        reflectToAttribute: true
      },
      sitekey: {
        type: String,
        reflectToAttribute: true,
        notify: true
      },
      container: {
        type: Object,
        notify: true
      },
      recaptchaId: String,
      token: {
        type: String,
        notify: true
      },
      executionPromise: Object,
      executionPromiseResolve: Function,
      executionPromiseReject: Function,
      loadingPromise: Object,
      loadingPromiseResolve: Function,
      loadingPromiseReject: Function
    };
  }

  static get template() {
    return html`<style>:host{display:none;}</style>`;
  }

  ready() {
    if (this.version !== 2 && this.version !== 3) {
      console.error('moe-recaptcha version must be either 2 or 3');
    }
  }

  /**
   * @param sitekey
   * @returns {Promise<void>}
   */
  load(sitekey) {
    this.set('sitekey', sitekey);

    const FETCHING = `__fetchingGrecaptchaLibrary${this.version}__`;
    const CALLBACK = `__onloadGrecaptchaCallback${this.version}__`;
    if (!window[FETCHING] && !window.grecaptcha) {
      return new Promise((resolve, reject) => {
        window[FETCHING] = true;
        window[CALLBACK] = () => {
          window[FETCHING] = false;
          resolve();
        };

        const script = document.createElement('script');
        const apiUrl = this.version === 2 ?
          'https://www.google.com/recaptcha/api.js?onload=__onloadGrecaptchaCallback2__&render=explicit' :
          `https://www.google.com/recaptcha/api.js?onload=__onloadGrecaptchaCallback3__&render=${sitekey}`;
        script.setAttribute('async', '');
        script.setAttribute('id', 'grecaptchaLibrary');
        script.setAttribute('defer', '');
        script.setAttribute('src', apiUrl);
        script.onerror = function() {
          window[FETCHING] = false;
        };
        document.head.appendChild(script);
      });
    } else {
      return Promise.resolve();
    }
  }

  render(container, size, badge) {
    const id = grecaptcha.render(container, {
      sitekey: this.sitekey,
      callback: this._responseCallback.bind(this),
      'error-callback': this._errorCallback.bind(this),
      'expired-callback': this._expiredCallback.bind(this),
      isolated: true,
      size,
      badge,
    });
    this.set('recaptchaId', id);
    this.set('container', container);
    return id;
  }


  /**
   *
   * @returns {Promise<String>}
   */
  execute(...args) {
    if (this.version === 2) {
      return this._executev2();
    } else if (this.version === 3) {
      return this._executev3(...args);
    }
  }

  _executev2() {
    if (this.recaptchaId && grecaptcha.getResponse(this.recaptchaId)) {
      return Promise.resolve(grecaptcha.getResponse(this.recaptchaId));
    }

    this.set('executionPromise', new Promise((resolve, reject) => {
      this.set('executionPromiseResolve', resolve);
      this.set('executionPromiseReject', reject);
    }));
    grecaptcha.execute(this.recaptchaId);
    return this.executionPromise;
  }

  _executev3(action) {
    if (this.recaptchaId && grecaptcha.getResponse(this.recaptchaId)) {
      return Promise.resolve(grecaptcha.getResponse(this.recaptchaId));
    }

    return grecaptcha.execute(this.sitekey, {action});
  }

  reset() {
    if (this.recaptchaId) {
      grecaptcha.reset(this.recaptchaId);
    }
  }

  _responseCallback(token) {
    this.set('token', token);
    this.executionPromiseResolve(token);
  }

  _errorCallback(err) {
    console.error(err);
    this.executionPromiseReject(err);
  }

  _expiredCallback() {
    console.log('recaptcha expired');
    this.reset();
  }
}

window.customElements.define('moe-recaptcha', MoeRecaptcha);
