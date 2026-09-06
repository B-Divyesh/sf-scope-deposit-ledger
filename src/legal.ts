import './styles.css';
declare const __RELEASE_VERSION__: string;
const saved = localStorage.getItem('scope-ledger-theme');
if (saved) document.documentElement.dataset.theme = saved;
document.querySelectorAll<HTMLElement>('[data-release]').forEach((node) => { node.textContent = `Version ${__RELEASE_VERSION__}`; });
