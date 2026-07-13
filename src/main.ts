import './styles/app.css';
import { registerPwa } from './pwa/register';
import { renderApp } from './ui/app';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('App root not found');
}

const render = (): void => renderApp(root);

render();
window.addEventListener('hashchange', render);
registerPwa();
