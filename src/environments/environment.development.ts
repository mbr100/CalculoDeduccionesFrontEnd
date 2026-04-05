import {Toolbar} from 'ngx-editor';

export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080',
    apiEconomicos: 'api/economicos',
    apiPersonal: 'api/personal',
    apiProyectos: '/api/proyectos',
    apiColaboraciones: '/api/colaboraciones',
    apiMateriales: '/api/materiales',
    editorToolbar: <Toolbar>[
        ['bold', 'italic'],
        ['underline', 'strike'],
        ['code', 'blockquote'],
        ['ordered_list', 'bullet_list'],
        [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
        ['link', 'image'],
        ['text_color', 'background_color'],
        ['align_left', 'align_center', 'align_right', 'align_justify'],
        ['horizontal_rule', 'format_clear', 'indent', 'outdent'],
        ['superscript', 'subscript'],
        ['undo', 'redo'],
    ]
};
