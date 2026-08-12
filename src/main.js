import './style.css';
import { KnowledgeStore } from './modules/knowledgeStore.js';
import { ZizeeEngine } from './modules/zizeeEngine.js';
import { UIManager } from './modules/uiManager.js';

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  
  if (appContainer) {
    const knowledgeStore = new KnowledgeStore();
    const zizeeEngine = new ZizeeEngine(knowledgeStore);
    const uiManager = new UIManager(appContainer, knowledgeStore, zizeeEngine);

    console.log('zizee Executive Assistant Web App initialized successfully!');
  }
});
