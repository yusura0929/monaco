import { createDivContainer } from './utils.js';
import { initMonaco } from './editor.js';
import { mountVueApp } from './vue-app.js';

kintone.events.on('app.record.index.show', () => {
    const container = createDivContainer('kintone-editor-container');
    document.body.appendChild(container);

    // Monaco Editor
    const monacoInstance = initMonaco(container);

    // Vue + PrimeVue
    mountVueApp(container);
});
