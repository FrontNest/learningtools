// Prototype name for this template:
export class CustomToggleWifi extends HTMLElement {
    constructor() {
      super();
  
      const shadow = this.attachShadow({ mode: 'open' });
  
      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.classList.add('switch');
  
      // Load CSS
      fetch(new URL('custom-toggle.css', import.meta.url))
        .then(res => res.text())
        .then(cssText => {
          const style = document.createElement('style');
          style.textContent = cssText;
          shadow.appendChild(style);
        });
  
      // Create toggle structure
      wrapper.innerHTML = `
        <div class="switch">
        <div class="icon">
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 18l.01 0" />
            <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
            <path d="M6.343 12.343a8 8 0 0 1 11.314 0" />
            <path d="M3.515 9.515c4.686 -4.687 12.284 -4.687 17 0" />
            </svg>
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 18l.01 0" />
            <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
            <path d="M6.343 12.343a7.963 7.963 0 0 1 3.864 -2.14m4.163 .155a7.965 7.965 0 0 1 3.287 2" />
            <path d="M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374" />
            <path d="M3 3l18 18" />
            </svg>
        </div>
        <label for="toggle-2" aria-label="Toggle Filter">
            <input type="checkbox" id="toggle-2"  checked data-on="YES" data-off="NO">
        </label>
        <span class="led"></span>
        </div>
      `;
  
      shadow.appendChild(wrapper);
    }
  }
  // template tag names should be unique
  customElements.define('custom-toggle-wifi', CustomToggleWifi);
  