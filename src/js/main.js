// #package js/main

// #include Application.js
// #include ResourceLoader.js

const resources = {
    shaders: {
        type: 'json',
        url: 'glsl/shaders.json'
    },
    mixins: {
        type: 'json',
        url: 'glsl/mixins.json'
    },
    templates: {
        type: 'json',
        url: 'html/templates.json'
    },
    uispecs: {
        type: 'json',
        url: 'uispecs.json'
    },
    all: {
        type: 'dummy',
        dependencies: [
            'shaders',
            'mixins',
            'templates',
            'uispecs'
        ]
    }
};

// TODO: fix this quick hack to load all resources into the old globals
ResourceLoader.instance = new ResourceLoader(resources);

let SHADERS;
let MIXINS;
let TEMPLATES;
let UISPECS;

document.temporal_flag = false;     // flag if temporal is active
document.temporal_frame = 0;        // current temporal volume frame
document.max_temporal_frame = 1;    // number of temporal frames
document.temporal_type = 'time';    // type of temporal rendering (time or rmse)
document.temporal_value = 1000;     // temporal value, either for time or rmse (default time)
document.temporal_play = false;     // global playButton flag
document.reader = false;            // global reader, to save on memory
document.current_rmse = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const rl = ResourceLoader.instance;
    const res = await rl.loadResource('all');
    SHADERS   = await rl.loadResource('shaders');
    MIXINS    = await rl.loadResource('mixins');
    TEMPLATES = await rl.loadResource('templates');
    UISPECS   = await rl.loadResource('uispecs');
    for (const name in UISPECS) {
        UISPECS[name] = JSON.parse(UISPECS[name]);
    }
    const application = new Application();
});
