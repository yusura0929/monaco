import KintoneCodeEditor from './KintoneCodeEditor.ts';

kintone.events.on('app.record.index.show', (event) => {
  const editor = new KintoneCodeEditor();
});
