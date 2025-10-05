(()=>{var p=class{app;container;virtualFS=new Map;editor;esbuildInitialized=!1;currentRecord=null;builtCode=null;constructor(){this.initialize()}async initialize(){await this.loadDependencies(),this.createContainer(),await this.initializeEsbuild(),await this.initializeMonaco(),this.createVueApp()}async loadDependencies(){let e=i=>new Promise((a,s)=>{let o=document.createElement("script");o.src=i,o.onload=()=>a(),o.onerror=s,document.head.appendChild(o)}),t=i=>{let a=document.createElement("link");a.rel="stylesheet",a.href=i,document.head.appendChild(a)};t("https://unpkg.com/primevue@3/resources/themes/lara-dark-blue/theme.css"),t("https://unpkg.com/primevue@3/resources/primevue.min.css"),t("https://unpkg.com/primeicons/primeicons.css"),await e("https://unpkg.com/vue@3/dist/vue.global.js"),await e("https://unpkg.com/primevue@3/core/core.min.js"),await e("https://unpkg.com/primevue@3/tree/tree.min.js"),await e("https://unpkg.com/primevue@3/button/button.min.js"),await e("https://unpkg.com/primevue@3/dialog/dialog.min.js"),await e("https://unpkg.com/primevue@3/inputtext/inputtext.min.js"),await e("https://unpkg.com/primevue@3/dropdown/dropdown.min.js"),await e("https://unpkg.com/primevue@3/contextmenu/contextmenu.min.js"),await e("https://unpkg.com/primevue@3/toast/toast.min.js"),await e("https://unpkg.com/primevue@3/toastservice/toastservice.min.js"),await e("https://unpkg.com/primevue@3/splitter/splitter.min.js"),await e("https://unpkg.com/primevue@3/splitterpanel/splitterpanel.min.js"),await e("https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js"),await e("https://unpkg.com/esbuild-wasm@0.19.11/lib/browser.min.js")}createContainer(){let e=document.createElement("style");e.textContent=`
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
    `,document.head.appendChild(e),this.container=document.createElement("div"),this.container.id="kintone-code-editor",this.container.className="kintone-code-editor",this.container.innerHTML=`
      <div class="kce-header">
        <div class="kce-record-selector">
          <label>\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8:</label>
          <p-dropdown 
            v-model="selectedRecord" 
            :options="records" 
            option-label="title.value" 
            placeholder="\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u9078\u629E"
            @change="onRecordChange"
            style="width: 200px">
          </p-dropdown>
        </div>
        <div class="kce-toolbar">
          <p-button 
            icon="pi pi-folder-plus" 
            label="\u30D5\u30A9\u30EB\u30C0" 
            @click="showNewFolderDialog = true"
            severity="secondary"
            size="small">
          </p-button>
          <p-button 
            icon="pi pi-file-plus" 
            label="\u30D5\u30A1\u30A4\u30EB" 
            @click="showNewFileDialog = true"
            severity="secondary"
            size="small">
          </p-button>
          <p-button 
            icon="pi pi-play" 
            label="\u30D3\u30EB\u30C9" 
            @click="buildProject"
            severity="success"
            size="small">
          </p-button>
          <p-button 
            icon="pi pi-upload" 
            label="\u30C7\u30D7\u30ED\u30A4" 
            @click="deployToKintone"
            severity="warning"
            size="small"
            :disabled="!builtCode">
          </p-button>
          <p-button 
            icon="pi pi-save" 
            label="\u4FDD\u5B58" 
            @click="saveRecord"
            severity="primary"
            size="small">
          </p-button>
          <p-button 
            icon="pi pi-times" 
            label="\u9589\u3058\u308B" 
            @click="closeEditor"
            severity="danger"
            size="small">
          </p-button>
        </div>
      </div>
      
      <div class="kce-main">
        <div class="kce-sidebar">
          <div class="kce-sidebar-header">\u30A8\u30AF\u30B9\u30D7\u30ED\u30FC\u30E9\u30FC</div>
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
      
      <!-- \u30C0\u30A4\u30A2\u30ED\u30B0 -->
      <p-dialog 
        v-model:visible="showNewFolderDialog" 
        header="\u65B0\u898F\u30D5\u30A9\u30EB\u30C0" 
        :modal="true" 
        :style="{width: '400px'}">
        <div style="margin-top: 20px">
          <p-inputtext 
            v-model="newFolderName" 
            placeholder="\u30D5\u30A9\u30EB\u30C0\u540D\u3092\u5165\u529B"
            style="width: 100%">
          </p-inputtext>
        </div>
        <template #footer>
          <p-button label="\u30AD\u30E3\u30F3\u30BB\u30EB" @click="showNewFolderDialog = false" severity="secondary"></p-button>
          <p-button label="\u4F5C\u6210" @click="createFolder" severity="primary"></p-button>
        </template>
      </p-dialog>
      
      <p-dialog 
        v-model:visible="showNewFileDialog" 
        header="\u65B0\u898F\u30D5\u30A1\u30A4\u30EB" 
        :modal="true" 
        :style="{width: '400px'}">
        <div style="margin-top: 20px">
          <p-inputtext 
            v-model="newFileName" 
            placeholder="\u30D5\u30A1\u30A4\u30EB\u540D\u3092\u5165\u529B (\u4F8B: index.ts)"
            style="width: 100%">
          </p-inputtext>
        </div>
        <template #footer>
          <p-button label="\u30AD\u30E3\u30F3\u30BB\u30EB" @click="showNewFileDialog = false" severity="secondary"></p-button>
          <p-button label="\u4F5C\u6210" @click="createFile" severity="primary"></p-button>
        </template>
      </p-dialog>
      
      <p-toast position="bottom-right"></p-toast>
    `,document.body.appendChild(this.container)}async initializeEsbuild(){try{await esbuild.initialize({wasmURL:"https://unpkg.com/esbuild-wasm@0.19.11/esbuild.wasm"}),this.esbuildInitialized=!0}catch(e){console.error("esbuild\u521D\u671F\u5316\u30A8\u30E9\u30FC:",e)}}async initializeMonaco(){return new Promise(e=>{window.require.config({paths:{vs:"https://unpkg.com/monaco-editor@0.45.0/min/vs"}}),window.require(["vs/editor/editor.main"],()=>{e(void 0)})})}createVueApp(){let e=this;this.app=Vue.createApp({data(){return{records:[],selectedRecord:null,fileTree:[],selectedKeys:{},openTabs:[],activeTab:null,currentFile:null,statusMessage:"\u6E96\u5099\u5B8C\u4E86",showNewFolderDialog:!1,showNewFileDialog:!1,newFolderName:"",newFileName:"",builtCode:null}},mounted(){this.initEditor(),this.loadRecords()},methods:{async loadRecords(){try{let t=await kintone.api("/k/v1/records","GET",{app:kintone.app.getId(),query:"order by $id desc limit 100"});this.records=t.records}catch(t){console.error("\u30EC\u30B3\u30FC\u30C9\u53D6\u5F97\u30A8\u30E9\u30FC:",t)}},initEditor(){let t=this.$refs.monacoContainer;e.editor=monaco.editor.create(t,{value:"// \u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044",language:"typescript",theme:"vs-dark",automaticLayout:!0,minimap:{enabled:!1},fontSize:14,tabSize:2}),e.editor.onDidChangeModelContent(()=>{this.currentFile&&e.virtualFS.set(this.currentFile,e.editor.getValue())})},onRecordChange(){this.selectedRecord&&(e.currentRecord=this.selectedRecord,e.virtualFS.clear(),this.openTabs=[],this.activeTab=null,this.selectedRecord.files?.value&&this.selectedRecord.files.value.forEach(t=>{let i=t.value.f_path.value,a=t.value.f_code.value;e.virtualFS.set(i,a)}),this.buildFileTree(),this.$toast.add({severity:"success",summary:"\u30ED\u30FC\u30C9\u5B8C\u4E86",detail:`${this.selectedRecord.title.value}\u3092\u8AAD\u307F\u8FBC\u307F\u307E\u3057\u305F`,life:3e3}))},buildFileTree(){let t=[],i={key:"/",label:this.selectedRecord.title.value,icon:"pi pi-folder-open",children:[],expanded:!0};t.push(i);let a=Array.from(e.virtualFS.keys()).sort(),s=new Map;s.set("/",i),a.forEach(o=>{let c=o.split("/").filter(n=>n),r="",d=i;c.forEach((n,h)=>{if(r+="/"+n,h===c.length-1){let l={key:r,label:n,icon:this.getFileIcon({label:n,type:"file"}),data:{type:"file",path:r}};d.children.push(l)}else if(s.has(r))d=s.get(r);else{let l={key:r,label:n,icon:"pi pi-folder",children:[],data:{type:"folder",path:r}};d.children.push(l),s.set(r,l),d=l}})}),this.fileTree=t},getFileIcon(t){if(t.data?.type==="folder")return"pi pi-folder";let i=t.label||"";return i.endsWith(".ts")||i.endsWith(".tsx")?"pi pi-file-edit":i.endsWith(".js")||i.endsWith(".jsx")?"pi pi-file":i.endsWith(".json")?"pi pi-database":i.endsWith(".css")?"pi pi-palette":i.endsWith(".html")?"pi pi-globe":"pi pi-file"},onFileSelect(t){if(t.data?.type==="file"){let i=t.data.path,a=e.virtualFS.get(i)||"";this.openTabs.find(o=>o.path===i)||this.openTabs.push({path:i,name:t.label}),this.activeTab=i,this.currentFile=i;let s=i.endsWith(".ts")||i.endsWith(".tsx")?"typescript":i.endsWith(".js")||i.endsWith(".jsx")?"javascript":i.endsWith(".json")?"json":i.endsWith(".css")?"css":i.endsWith(".html")?"html":"plaintext";monaco.editor.setModelLanguage(e.editor.getModel(),s),e.editor.setValue(a)}},selectTab(t){this.activeTab=t,this.currentFile=t;let i=e.virtualFS.get(t)||"";e.editor.setValue(i)},closeTab(t){let i=this.openTabs.findIndex(a=>a.path===t);i!==-1&&(this.openTabs.splice(i,1),this.activeTab===t&&this.openTabs.length>0?this.selectTab(this.openTabs[0].path):this.openTabs.length===0&&(this.activeTab=null,this.currentFile=null,e.editor.setValue("")))},createFolder(){if(!this.newFolderName)return;let t=`/src/${this.newFolderName}`;e.virtualFS.set(`${t}/.keep`,""),this.buildFileTree(),this.showNewFolderDialog=!1,this.newFolderName=""},createFile(){if(!this.newFileName)return;let t=`/src/${this.newFileName}`;e.virtualFS.set(t,`// New file
`),this.buildFileTree(),this.showNewFileDialog=!1,this.newFileName=""},async buildProject(){if(!e.esbuildInitialized){this.$toast.add({severity:"error",summary:"\u30A8\u30E9\u30FC",detail:"esbuild\u304C\u521D\u671F\u5316\u3055\u308C\u3066\u3044\u307E\u305B\u3093",life:3e3});return}this.statusMessage="\u30D3\u30EB\u30C9\u4E2D...";try{let t="/src/index.ts";if(!e.virtualFS.has(t))throw new Error("\u30A8\u30F3\u30C8\u30EA\u30FC\u30DD\u30A4\u30F3\u30C8 /src/index.ts \u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");let i=await esbuild.build({stdin:{contents:e.virtualFS.get(t),resolveDir:"/src",sourcefile:"index.ts"},bundle:!0,format:"iife",target:"es2020",minify:!0,plugins:[{name:"virtual-fs",setup(a){a.onResolve({filter:/.*/},s=>s.path.startsWith(".")?{path:`/src/${s.path.startsWith("./")?s.path.slice(2):s.path}`,namespace:"virtual-fs"}:{path:s.path,namespace:"virtual-fs"}),a.onLoad({filter:/.*/,namespace:"virtual-fs"},s=>({contents:e.virtualFS.get(s.path)||e.virtualFS.get(`${s.path}.ts`)||e.virtualFS.get(`${s.path}.js`)||"",loader:"ts"}))}}],write:!1});e.builtCode=i.outputFiles[0].text,this.builtCode=e.builtCode,this.$toast.add({severity:"success",summary:"\u30D3\u30EB\u30C9\u6210\u529F",detail:"\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30D3\u30EB\u30C9\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F",life:3e3}),this.statusMessage="\u30D3\u30EB\u30C9\u5B8C\u4E86"}catch(t){console.error("\u30D3\u30EB\u30C9\u30A8\u30E9\u30FC:",t),this.$toast.add({severity:"error",summary:"\u30D3\u30EB\u30C9\u30A8\u30E9\u30FC",detail:t.message,life:5e3}),this.statusMessage="\u30D3\u30EB\u30C9\u30A8\u30E9\u30FC"}},async deployToKintone(){if(!e.builtCode||!e.currentRecord?.app?.value){this.$toast.add({severity:"error",summary:"\u30A8\u30E9\u30FC",detail:"\u30D3\u30EB\u30C9\u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044",life:3e3});return}try{let t=`${e.currentRecord.title.value}.js`,i=new Blob([e.builtCode],{type:"application/javascript"});new FormData().append("file",i,t),this.$toast.add({severity:"success",summary:"\u30C7\u30D7\u30ED\u30A4\u6210\u529F",detail:`\u30A2\u30D7\u30EA${e.currentRecord.app.value}\u306B\u30C7\u30D7\u30ED\u30A4\u3057\u307E\u3057\u305F`,life:3e3})}catch(t){console.error("\u30C7\u30D7\u30ED\u30A4\u30A8\u30E9\u30FC:",t),this.$toast.add({severity:"error",summary:"\u30C7\u30D7\u30ED\u30A4\u30A8\u30E9\u30FC",detail:t.message,life:5e3})}},async saveRecord(){if(e.currentRecord)try{let t=Array.from(e.virtualFS.entries()).map(([i,a])=>({value:{f_path:{value:i},f_code:{value:a}}}));await kintone.api("/k/v1/record","PUT",{app:kintone.app.getId(),id:e.currentRecord.$id.value,record:{files:{value:t}}}),this.$toast.add({severity:"success",summary:"\u4FDD\u5B58\u5B8C\u4E86",detail:"\u30EC\u30B3\u30FC\u30C9\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F",life:3e3})}catch(t){console.error("\u4FDD\u5B58\u30A8\u30E9\u30FC:",t),this.$toast.add({severity:"error",summary:"\u4FDD\u5B58\u30A8\u30E9\u30FC",detail:t.message,life:5e3})}},closeEditor(){e.destroy()}}}),this.app.use(PrimeVue.Config,{ripple:!0}),this.app.use(PrimeVue.ToastService),this.app.component("p-tree",PrimeVue.Tree),this.app.component("p-button",PrimeVue.Button),this.app.component("p-dialog",PrimeVue.Dialog),this.app.component("p-inputtext",PrimeVue.InputText),this.app.component("p-dropdown",PrimeVue.Dropdown),this.app.component("p-toast",PrimeVue.Toast),this.app.mount(this.container)}destroy(){this.app&&this.app.unmount(),this.container&&this.container.parentNode&&this.container.parentNode.removeChild(this.container),this.editor&&this.editor.dispose()}},u=p;var f=new u;})();
//# sourceMappingURL=kintone-customize.js.map
