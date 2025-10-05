import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.39.0/+esm';

export function initMonaco(container: HTMLDivElement) {
    return monaco.editor.create(container, {
        value: "// Hello kintone\nconsole.log('Hello from Monaco!');",
        language: 'typescript',
        theme: 'vs-dark',
        automaticLayout: true
    });
}
