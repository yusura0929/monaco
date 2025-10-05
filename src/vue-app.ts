import { createApp, defineComponent, ref } from 'https://cdn.jsdelivr.net/npm/vue@3.3.4/+esm';
import 'https://cdn.jsdelivr.net/npm/primevue@3.11.2/resources/themes/saga-blue/theme.css';
import 'https://cdn.jsdelivr.net/npm/primevue@3.11.2/resources/primevue.min.css';
import Button from 'https://cdn.jsdelivr.net/npm/primevue@3.11.2/button/+esm';

export function mountVueApp(container: HTMLElement) {
    const App = defineComponent({
        setup() {
            const code = ref('// Write your JS/TS code here\n');
            const run = () => { console.log('Run:', code.value); };
            return { code, run };
        },
        template: `
            <div>
                <textarea v-model="code" style="width:100%; height:70%;"></textarea>
                <Button label="Run" @click="run" class="p-button p-component"/>
            </div>
        `,
        components: { Button }
    });

    createApp(App).mount(container);
}
