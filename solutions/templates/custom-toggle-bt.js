// Prototype name for this template:
export class CustomToggleBt extends HTMLElement {
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
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M7 8l10 8l-5 4l0 -16l5 4l-10 8" />
          </svg>
          <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 3l18 18" />
            <path d="M16.438 16.45l-4.438 3.55v-8m0 -4v-4l5 4l-2.776 2.22m-2.222 1.779l-5 4" />
          </svg>
        </div>
        <label for="toggle" aria-label="Toggle Filter">
          <input type="checkbox" id="toggle"   data-on="ON" data-off="OFF">
        </label>
        <span class="led"></span>
      </div>
      `;
  
      shadow.appendChild(wrapper);
    }
  }
  // template tag names should be unique
  customElements.define('custom-toggle-bt', CustomToggleBt);
  