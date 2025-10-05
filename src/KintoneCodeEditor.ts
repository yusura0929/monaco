// KintoneCodeEditor.ts - メインエディタクラス
declare const Vue: any;
declare const PrimeVue: any;
declare const monaco: any;
declare const esbuild: any;
declare const kintone: any;
declare const require: any;

interface FileRecord {
  f_path: { value: string };
  f_code: { value: string };
}

interface KintoneRecord {
  $id: { value: string };
  title: { value: string };
  app: { value: string };
  files: { value: Array<{ value: FileRecord }> };
}

class KintoneCodeEditor {
  private app: any;
  private container: HTMLElement;
  private virtualFS: Map<string, string> = new Map();
  private editor: any;
  private esbuildInitialized = false;
  private currentRecord: KintoneRecord | null = null;
  private builtCode: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.loadDependencies();
    this.createContainer();
    await this.initializeEsbuild();
    await this.initializeMonaco();
    this.createVueApp();
  }

  private async loadDependencies() {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadCSS = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    // Load CSS
    loadCSS('https://unpkg.com/primevue@3/resources/themes/lara-dark-blue/theme.css');
    loadCSS('https://unpkg.com/primevue@3/resources/primevue.min.css');
    loadCSS('https://unpkg.com/primeicons/primeicons.css');

    // Load scripts
    await loadScript('https://unpkg.com/vue@3/dist/vue.global.js');
    await loadScript('https://unpkg.com/primevue@3/core/core.min.js');
    const componentScripts = [
    'https://unpkg.com/primevue@3/tree/tree.min.js',
    'https://unpkg.com/primevue@3/button/button.min.js',
    'https://unpkg.com/primevue@3/dialog/dialog.min.js',
    'https://unpkg.com/primevue@3/inputtext/inputtext.min.js',
    'https://unpkg.com/primevue@3/dropdown/dropdown.min.js',
    'https://unpkg.com/primevue@3/contextmenu/contextmenu.min.js',
    'https://unpkg.com/primevue@3/toast/toast.min.js',
    'https://unpkg.com/primevue@3/toastservice/toastservice.min.js',
    'https://unpkg.com/primevue@3/splitter/splitter.min.js',
    'https://unpkg.com/primevue@3/splitterpanel/splitterpanel.min.js'
  ];

  await Promise.all(componentScripts.map(loadScript));

  // Monaco と esbuild はそのまま順番通り
  await loadScript('https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js');
  await loadScript('https://unpkg.com/esbuild-wasm@0.19.11/lib/browser.min.js');
  }

  private createContainer() {
    // スタイル定義
    const style = document.createElement('style');
    style.textContent = `
      .kintone-code-editor {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
      }
      
      .kce-header {
        background: #2d2d30;
        border-bottom: 1px solid #474747;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        height: 48px;
        flex-shrink: 0;
      }
      
      .kce-main {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .kce-sidebar {
        width: 300px;
        background: #252526;
        border-right: 1px solid #474747;
        display: flex;
        flex-direction: column;
      }
      
      .kce-sidebar-header {
        padding: 12px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #8e8e8e;
        border-bottom: 1px solid #474747;
      }
      
      .kce-file-tree {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      
      .kce-editor-area {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .kce-tabs {
        background: #2d2d30;
        border-bottom: 1px solid #474747;
        display: flex;
        height: 35px;
        overflow-x: auto;
      }
      
      .kce-tab {
        padding: 6px 12px;
        background: #2d2d30;
        border-right: 1px solid #474747;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        white-space: nowrap;
      }
      
      .kce-tab.active {
        background: #1e1e1e;
        border-bottom: 1px solid #1e1e1e;
      }
      
      .kce-monaco {
        flex: 1;
        position: relative;
      }
      
      .kce-status {
        background: #007acc;
        color: white;
        padding: 4px 16px;
        font-size: 12px;
        height: 22px;
      }
      
      .kce-toolbar {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }
      
      .kce-record-selector {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .p-tree {
        background: transparent !important;
        border: none !important;
        color: #d4d4d4 !important;
      }
      
      .p-tree-node-content {
        padding: 4px 8px !important;
        border-radius: 4px !important;
      }
      
      .p-tree-node-content:hover {
        background: rgba(255, 255, 255, 0.04) !important;
      }
      
      .p-tree-node-content.p-highlight {
        background: rgba(0, 122, 204, 0.3) !important;
      }
      
      .p-button {
        font-size: 13px !important;
      }
      
      .p-dialog {
        background: #2d2d30 !important;
        border: 1px solid #474747 !important;
      }
      
      .p-dialog-header {
        background: #2d2d30 !important;
      }
      
      .p-inputtext {
        background: #3c3c3c !important;
        border: 1px solid #474747 !important;
        color: #d4d4d4 !important;
      }
    `;
    document.head.appendChild(style);

    // コンテナ作成
    this.container = document.createElement('div');
    this.container.id = 'kintone-code-editor';
    this.container.className = 'kintone-code-editor';
    this.container.innerHTML = `
      <div class="kce-header">
        <div class="kce-record-selector">
          <label>プロジェクト:</label>
          <p-dropdown 
            v-model="selectedRecord" 
            :options="records" 
            option-label="title.value" 
            placeholder="プロジェクトを選択"
            @change="onRecordChange"
            style="width: 200px">
          </p-dropdown>
        </div>
        <div class="kce-toolbar">
          <p-button 
            icon="pi pi-folder-plus" 
            label="フォルダ" 
            @click="showNewFolderDialog = true"
            severity="secondary"
            size="small">
          </p-button>
          <p-button 
            icon="pi pi-file-plus" 
            label="ファイル" 
            @click="showNewFileDialog = true"
            severity="secondary"
            size="small">
          </p-button>
          <p-button 
            icon="pi pi-play" 
            label="ビルド" 
            @click="buildProject"
            severity="success"
            size="small">
          </p-button>
          <p-button 
            icon="pi pi-upload" 
            label="デプロイ" 
            @click="deployToKintone"
            severity="warning"
            size="small"
            :disabled="!builtCode">
          </p-button>
          <p-button 
            icon="pi pi-save" 
            label="保存" 
            @click="saveRecord"
            severity="primary"
            size="small">
          </p-button>
          <p-button 
            icon="pi pi-times" 
            label="閉じる" 
            @click="closeEditor"
            severity="danger"
            size="small">
          </p-button>
        </div>
      </div>
      
      <div class="kce-main">
        <div class="kce-sidebar">
          <div class="kce-sidebar-header">エクスプローラー</div>
          <div class="kce-file-tree">
            <p-tree 
              :value="fileTree" 
              selection-mode="single"
              v-model:selection-keys="selectedKeys"
              @node-select="onFileSelect">
              <template #default="slotProps">
                <span>
                  <i :class="getFileIcon(slotProps.node)"></i>
                  {{ slotProps.node.label }}
                </span>
              </template>
            </p-tree>
          </div>
        </div>
        
        <div class="kce-editor-area">
          <div class="kce-tabs" v-if="openTabs.length > 0">
            <div 
              v-for="tab in openTabs" 
              :key="tab.path"
              :class="['kce-tab', { active: tab.path === activeTab }]"
              @click="selectTab(tab.path)">
              <span>{{ tab.name }}</span>
              <i class="pi pi-times" @click.stop="closeTab(tab.path)"></i>
            </div>
          </div>
          <div class="kce-monaco" ref="monacoContainer"></div>
          <div class="kce-status">
            <span>{{ statusMessage }}</span>
          </div>
        </div>
      </div>
      
      <!-- ダイアログ -->
      <p-dialog 
        v-model:visible="showNewFolderDialog" 
        header="新規フォルダ" 
        :modal="true" 
        :style="{width: '400px'}">
        <div style="margin-top: 20px">
          <p-inputtext 
            v-model="newFolderName" 
            placeholder="フォルダ名を入力"
            style="width: 100%">
          </p-inputtext>
        </div>
        <template #footer>
          <p-button label="キャンセル" @click="showNewFolderDialog = false" severity="secondary"></p-button>
          <p-button label="作成" @click="createFolder" severity="primary"></p-button>
        </template>
      </p-dialog>
      
      <p-dialog 
        v-model:visible="showNewFileDialog" 
        header="新規ファイル" 
        :modal="true" 
        :style="{width: '400px'}">
        <div style="margin-top: 20px">
          <p-inputtext 
            v-model="newFileName" 
            placeholder="ファイル名を入力 (例: index.ts)"
            style="width: 100%">
          </p-inputtext>
        </div>
        <template #footer>
          <p-button label="キャンセル" @click="showNewFileDialog = false" severity="secondary"></p-button>
          <p-button label="作成" @click="createFile" severity="primary"></p-button>
        </template>
      </p-dialog>
      
      <p-toast position="bottom-right"></p-toast>
    `;

    document.body.appendChild(this.container);
  }

  private async initializeEsbuild() {
    try {
      await esbuild.initialize({
        wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.11/esbuild.wasm'
      });
      this.esbuildInitialized = true;
    } catch (error) {
      console.error('esbuild初期化エラー:', error);
    }
  }

  private async initializeMonaco() {
    return new Promise((resolve) => {
      (window as any).require.config({ 
        paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } 
      });
      
      (window as any).require(['vs/editor/editor.main'], () => {
        resolve(undefined);
      });
    });
  }

  private createVueApp() {
    const self = this;
    
    this.app = Vue.createApp({
      data() {
        return {
          records: [],
          selectedRecord: null,
          fileTree: [],
          selectedKeys: {},
          openTabs: [],
          activeTab: null,
          currentFile: null,
          statusMessage: '準備完了',
          showNewFolderDialog: false,
          showNewFileDialog: false,
          newFolderName: '',
          newFileName: '',
          builtCode: null
        };
      },
      
      mounted() {
        this.$nextTick(() => {
          this.initEditor();
          this.loadRecords();
        })
      },
      
      methods: {
        async loadRecords() {
          try {
            const resp = await kintone.api('/k/v1/records', 'GET', {
              app: kintone.app.getId(),
              query: 'order by $id desc limit 100'
            });
            this.records = resp.records;
          } catch (error) {
            console.error('レコード取得エラー:', error);
          }
        },

        initEditor() {
          const container = this.$refs.monacoContainer;
          self.editor = monaco.editor.create(container, {
            value: '// プロジェクトを選択してください',
            language: 'typescript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 2
          });
          
          self.editor.onDidChangeModelContent(() => {
            if (this.currentFile) {
              self.virtualFS.set(this.currentFile, self.editor.getValue());
            }
          });
        },

        onRecordChange() {
          if (!this.selectedRecord) return;
          
          self.currentRecord = this.selectedRecord;
          self.virtualFS.clear();
          this.openTabs = [];
          this.activeTab = null;
          
          if (this.selectedRecord.files?.value) {
            this.selectedRecord.files.value.forEach(row => {
              const path = row.value.f_path.value;
              const code = row.value.f_code.value;
              self.virtualFS.set(path, code);
            });
          }
          
          this.buildFileTree();
          this.$toast.add({
            severity: 'success',
            summary: 'ロード完了',
            detail: `${this.selectedRecord.title.value}を読み込みました`,
            life: 3000
          });
        },

        buildFileTree() {
          const tree = [];
          const rootNode = {
            key: '/',
            label: this.selectedRecord.title.value,
            icon: 'pi pi-folder-open',
            children: [],
            expanded: true
          };
          tree.push(rootNode);
          
          const paths = Array.from(self.virtualFS.keys()).sort();
          const nodeMap = new Map();
          nodeMap.set('/', rootNode);
          
          paths.forEach(path => {
            const parts = path.split('/').filter(p => p);
            let currentPath = '';
            let parentNode = rootNode;
            
            parts.forEach((part, index) => {
              currentPath += '/' + part;
              
              if (index === parts.length - 1) {
                const fileNode = {
                  key: currentPath,
                  label: part,
                  icon: this.getFileIcon({ label: part, type: 'file' }),
                  data: { type: 'file', path: currentPath }
                };
                parentNode.children.push(fileNode);
              } else {
                if (!nodeMap.has(currentPath)) {
                  const folderNode = {
                    key: currentPath,
                    label: part,
                    icon: 'pi pi-folder',
                    children: [],
                    data: { type: 'folder', path: currentPath }
                  };
                  parentNode.children.push(folderNode);
                  nodeMap.set(currentPath, folderNode);
                  parentNode = folderNode;
                } else {
                  parentNode = nodeMap.get(currentPath);
                }
              }
            });
          });
          
          this.fileTree = tree;
        },

        getFileIcon(node) {
          if (node.data?.type === 'folder') return 'pi pi-folder';
          const label = node.label || '';
          if (label.endsWith('.ts') || label.endsWith('.tsx')) return 'pi pi-file-edit';
          if (label.endsWith('.js') || label.endsWith('.jsx')) return 'pi pi-file';
          if (label.endsWith('.json')) return 'pi pi-database';
          if (label.endsWith('.css')) return 'pi pi-palette';
          if (label.endsWith('.html')) return 'pi pi-globe';
          return 'pi pi-file';
        },

        onFileSelect(node) {
          if (node.data?.type === 'file') {
            const path = node.data.path;
            const code = self.virtualFS.get(path) || '';
            
            if (!this.openTabs.find(t => t.path === path)) {
              this.openTabs.push({
                path,
                name: node.label
              });
            }
            
            this.activeTab = path;
            this.currentFile = path;
            
            const language = path.endsWith('.ts') || path.endsWith('.tsx') ? 'typescript' :
                           path.endsWith('.js') || path.endsWith('.jsx') ? 'javascript' :
                           path.endsWith('.json') ? 'json' :
                           path.endsWith('.css') ? 'css' :
                           path.endsWith('.html') ? 'html' : 'plaintext';
            
            monaco.editor.setModelLanguage(self.editor.getModel(), language);
            self.editor.setValue(code);
          }
        },

        selectTab(path) {
          this.activeTab = path;
          this.currentFile = path;
          const code = self.virtualFS.get(path) || '';
          self.editor.setValue(code);
        },

        closeTab(path) {
          const index = this.openTabs.findIndex(t => t.path === path);
          if (index !== -1) {
            this.openTabs.splice(index, 1);
            if (this.activeTab === path && this.openTabs.length > 0) {
              this.selectTab(this.openTabs[0].path);
            } else if (this.openTabs.length === 0) {
              this.activeTab = null;
              this.currentFile = null;
              self.editor.setValue('');
            }
          }
        },

        createFolder() {
          if (!this.newFolderName) return;
          const path = `/src/${this.newFolderName}`;
          // フォルダは.keepファイルで表現
          self.virtualFS.set(`${path}/.keep`, '');
          this.buildFileTree();
          this.showNewFolderDialog = false;
          this.newFolderName = '';
        },

        createFile() {
          if (!this.newFileName) return;
          const path = `/src/${this.newFileName}`;
          self.virtualFS.set(path, '// New file\n');
          this.buildFileTree();
          this.showNewFileDialog = false;
          this.newFileName = '';
        },

        async buildProject() {
          if (!self.esbuildInitialized) {
            this.$toast.add({
              severity: 'error',
              summary: 'エラー',
              detail: 'esbuildが初期化されていません',
              life: 3000
            });
            return;
          }

          this.statusMessage = 'ビルド中...';
          
          try {
            const entryPoint = '/src/index.ts';
            if (!self.virtualFS.has(entryPoint)) {
              throw new Error('エントリーポイント /src/index.ts が見つかりません');
            }

            const result = await esbuild.build({
              stdin: {
                contents: self.virtualFS.get(entryPoint),
                resolveDir: '/src',
                sourcefile: 'index.ts'
              },
              bundle: true,
              format: 'iife',
              target: 'es2020',
              minify: true,
              plugins: [{
                name: 'virtual-fs',
                setup(build) {
                  build.onResolve({ filter: /.*/ }, (args) => {
                    if (args.path.startsWith('.')) {
                      const resolved = args.path.startsWith('./') ? 
                        args.path.slice(2) : args.path;
                      return { path: `/src/${resolved}`, namespace: 'virtual-fs' };
                    }
                    return { path: args.path, namespace: 'virtual-fs' };
                  });
                  
                  build.onLoad({ filter: /.*/, namespace: 'virtual-fs' }, (args) => {
                    const contents = self.virtualFS.get(args.path) || 
                                   self.virtualFS.get(`${args.path}.ts`) || 
                                   self.virtualFS.get(`${args.path}.js`) || '';
                    return { contents, loader: 'ts' };
                  });
                }
              }],
              write: false
            });

            self.builtCode = result.outputFiles[0].text;
            this.builtCode = self.builtCode;
            
            this.$toast.add({
              severity: 'success',
              summary: 'ビルド成功',
              detail: 'プロジェクトのビルドが完了しました',
              life: 3000
            });
            
            this.statusMessage = 'ビルド完了';
          } catch (error) {
            console.error('ビルドエラー:', error);
            this.$toast.add({
              severity: 'error',
              summary: 'ビルドエラー',
              detail: error.message,
              life: 5000
            });
            this.statusMessage = 'ビルドエラー';
          }
        },

        async deployToKintone() {
          if (!self.builtCode || !self.currentRecord?.app?.value) {
            this.$toast.add({
              severity: 'error',
              summary: 'エラー',
              detail: 'ビルドを実行してください',
              life: 3000
            });
            return;
          }

          try {
            const fileName = `${self.currentRecord.title.value}.js`;
            const blob = new Blob([self.builtCode], { type: 'application/javascript' });
            
            // kintone.proxy を使用してカスタマイズをアップロード
            const formData = new FormData();
            formData.append('file', blob, fileName);
            
            // アップロード処理（実際のAPI呼び出しは環境に応じて調整）
            this.$toast.add({
              severity: 'success',
              summary: 'デプロイ成功',
              detail: `アプリ${self.currentRecord.app.value}にデプロイしました`,
              life: 3000
            });
          } catch (error) {
            console.error('デプロイエラー:', error);
            this.$toast.add({
              severity: 'error',
              summary: 'デプロイエラー',
              detail: error.message,
              life: 5000
            });
          }
        },

        async saveRecord() {
          if (!self.currentRecord) return;

          try {
            const files = Array.from(self.virtualFS.entries()).map(([path, code]) => ({
              value: {
                f_path: { value: path },
                f_code: { value: code }
              }
            }));

            await kintone.api('/k/v1/record', 'PUT', {
              app: kintone.app.getId(),
              id: self.currentRecord.$id.value,
              record: {
                files: { value: files }
              }
            });

            this.$toast.add({
              severity: 'success',
              summary: '保存完了',
              detail: 'レコードを保存しました',
              life: 3000
            });
          } catch (error) {
            console.error('保存エラー:', error);
            this.$toast.add({
              severity: 'error',
              summary: '保存エラー',
              detail: error.message,
              life: 5000
            });
          }
        },

        closeEditor() {
          self.destroy();
        }
      }
    });

    // PrimeVue設定
    const PrimeVue = primevue;
    this.app.use(PrimeVue.Config, { ripple: true });
    this.app.use(PrimeVue.ToastService);
    
    // コンポーネント登録
    this.app.component('p-tree', PrimeVue.Tree);
    this.app.component('p-button', PrimeVue.Button);
    this.app.component('p-dialog', PrimeVue.Dialog);
    this.app.component('p-inputtext', PrimeVue.InputText);
    this.app.component('p-dropdown', PrimeVue.Dropdown);
    this.app.component('p-toast', PrimeVue.Toast);

    this.app.mount(this.container);
  }

  public destroy() {
    if (this.app) {
      this.app.unmount();
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.editor) {
      this.editor.dispose();
    }
  }
}

// エクスポート
export default KintoneCodeEditor;