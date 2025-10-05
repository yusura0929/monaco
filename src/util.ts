export function createDivContainer(id: string): HTMLDivElement {
    const div = document.createElement('div');
    div.id = id;
    div.style.position = 'fixed';
    div.style.top = '50px';
    div.style.left = '50px';
    div.style.width = '80vw';
    div.style.height = '80vh';
    div.style.border = '1px solid #ccc';
    div.style.zIndex = '9999';
    div.style.backgroundColor = '#fff';
    div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    return div;
}
