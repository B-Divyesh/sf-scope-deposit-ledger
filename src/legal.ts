import './styles.css';
const saved = localStorage.getItem('scope-ledger-theme');
if (saved) document.documentElement.dataset.theme = saved;
