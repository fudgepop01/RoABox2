
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(document);
var require;

function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function is_promise(value) {
    return value && typeof value === 'object' && typeof value.then === 'function';
}
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function validate_store(store, name) {
    if (!store || typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
}
function subscribe(store, callback) {
    const unsub = store.subscribe(callback);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, fn) {
    return definition[1]
        ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
        : ctx.$$scope.ctx;
}
function get_slot_changes(definition, ctx, changed, fn) {
    return definition[1]
        ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
        : ctx.$$scope.changed || {};
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
let running = false;
function run_tasks() {
    tasks.forEach(task => {
        if (!task[0](now())) {
            tasks.delete(task);
            task[1]();
        }
    });
    running = tasks.size > 0;
    if (running)
        raf(run_tasks);
}
function loop(fn) {
    let task;
    if (!running) {
        running = true;
        raf(run_tasks);
    }
    return {
        promise: new Promise(fulfil => {
            tasks.add(task = [fn, fulfil]);
        }),
        abort() {
            tasks.delete(task);
        }
    };
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    for (const key in attributes) {
        if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (key in node) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_input_value(input, value) {
    if (value != null || input.value) {
        input.value = value;
    }
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let stylesheet;
let active = 0;
let current_rules = {};
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    if (!current_rules[name]) {
        if (!stylesheet) {
            const style = element('style');
            document.head.appendChild(style);
            stylesheet = style.sheet;
        }
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    node.style.animation = (node.style.animation || '')
        .split(', ')
        .filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    )
        .join(', ');
    if (name && !--active)
        clear_rules();
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        let i = stylesheet.cssRules.length;
        while (i--)
            stylesheet.deleteRule(i);
        current_rules = {};
    });
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = current_component;
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
const null_transition = { duration: 0 };
function create_in_transition(node, fn, params) {
    let config = fn(node, params);
    let running = false;
    let animation_name;
    let task;
    let uid = 0;
    function cleanup() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
        tick(0, 1);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        if (task)
            task.abort();
        running = true;
        add_render_callback(() => dispatch(node, true, 'start'));
        task = loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(1, 0);
                    dispatch(node, true, 'end');
                    cleanup();
                    return running = false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(t, 1 - t);
                }
            }
            return running;
        });
    }
    let started = false;
    return {
        start() {
            if (started)
                return;
            delete_rule(node);
            if (is_function(config)) {
                config = config();
                wait().then(go);
            }
            else {
                go();
            }
        },
        invalidate() {
            started = false;
        },
        end() {
            if (running) {
                cleanup();
                running = false;
            }
        }
    };
}
function create_out_transition(node, fn, params) {
    let config = fn(node, params);
    let running = true;
    let animation_name;
    const group = outros;
    group.r += 1;
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        add_render_callback(() => dispatch(node, false, 'start'));
        loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(0, 1);
                    dispatch(node, false, 'end');
                    if (!--group.r) {
                        // this will result in `end()` being called,
                        // so we don't need to clean up here
                        run_all(group.c);
                    }
                    return false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(1 - t, t);
                }
            }
            return running;
        });
    }
    if (is_function(config)) {
        wait().then(() => {
            // @ts-ignore
            config = config();
            go();
        });
    }
    else {
        go();
    }
    return {
        end(reset) {
            if (reset && config.tick) {
                config.tick(1, 0);
            }
            if (running) {
                if (animation_name)
                    delete_rule(node, animation_name);
                running = false;
            }
        }
    };
}
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = program.b - t;
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

function handle_promise(promise, info) {
    const token = info.token = {};
    function update(type, index, key, value) {
        if (info.token !== token)
            return;
        info.resolved = key && { [key]: value };
        const child_ctx = assign(assign({}, info.ctx), info.resolved);
        const block = type && (info.current = type)(child_ctx);
        if (info.block) {
            if (info.blocks) {
                info.blocks.forEach((block, i) => {
                    if (i !== index && block) {
                        group_outros();
                        transition_out(block, 1, 1, () => {
                            info.blocks[i] = null;
                        });
                        check_outros();
                    }
                });
            }
            else {
                info.block.d(1);
            }
            block.c();
            transition_in(block, 1);
            block.m(info.mount(), info.anchor);
            flush();
        }
        info.block = block;
        if (info.blocks)
            info.blocks[index] = block;
    }
    if (is_promise(promise)) {
        const current_component = get_current_component();
        promise.then(value => {
            set_current_component(current_component);
            update(info.then, 1, info.value, value);
            set_current_component(null);
        }, error => {
            set_current_component(current_component);
            update(info.catch, 2, info.error, error);
            set_current_component(null);
        });
        // if we previously had a then/catch block, destroy it
        if (info.current !== info.pending) {
            update(info.pending, 0);
            return true;
        }
    }
    else {
        if (info.current !== info.then) {
            update(info.then, 1, info.value, promise);
            return true;
        }
        info.resolved = { [info.value]: promise };
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}

function bind(component, name, callback) {
    if (component.$$.props.indexOf(name) === -1)
        return;
    component.$$.bound[name] = callback;
    callback(component.$$.ctx[name]);
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, ret, value = ret) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
            return ret;
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, detail));
}
function append_dev(target, node) {
    dispatch_dev("SvelteDOMInsert", { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev("SvelteDOMInsert", { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev("SvelteDOMRemove", { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
    else
        dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.data === data)
        return;
    dispatch_dev("SvelteDOMSetData", { node: text, data });
    text.data = data;
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
}

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}
function quintInOut(t) {
    if ((t *= 2) < 1)
        return 0.5 * t * t * t * t * t;
    return 0.5 * ((t -= 2) * t * t * t * t + 2);
}

function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
    const style = getComputedStyle(node);
    const target_opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    const od = target_opacity * (1 - opacity);
    return {
        delay,
        duration,
        easing,
        css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
    };
}

function forwardEventsBuilder(component, additionalEvents = []) {
  const events = [
    'focus', 'blur',
    'fullscreenchange', 'fullscreenerror', 'scroll',
    'cut', 'copy', 'paste',
    'keydown', 'keypress', 'keyup',
    'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel',
    'drag', 'dragend', 'dragenter', 'dragstart', 'dragleave', 'dragover', 'drop',
    'touchcancel', 'touchend', 'touchmove', 'touchstart',
    'pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerleave', 'gotpointercapture', 'lostpointercapture',
    ...additionalEvents
  ];

  function forward(e) {
    bubble(component, e);
  }

  return node => {
    const destructors = [];

    for (let i = 0; i < events.length; i++) {
      destructors.push(listen(node, events[i], forward));
    }

    return {
      destroy: () => {
        for (let i = 0; i < destructors.length; i++) {
          destructors[i]();
        }
      }
    }
  };
}

function exclude(obj, keys) {
  let names = Object.getOwnPropertyNames(obj);
  const newObj = {};

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const cashIndex = name.indexOf('$');
    if (cashIndex !== -1 && keys.indexOf(name.substring(0, cashIndex + 1)) !== -1) {
      continue;
    }
    if (keys.indexOf(name) !== -1) {
      continue;
    }
    newObj[name] = obj[name];
  }

  return newObj;
}

function useActions(node, actions) {
  let objects = [];

  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const isArray = Array.isArray(actions[i]);
      const action = isArray ? actions[i][0] : actions[i];
      if (isArray && actions[i].length > 1) {
        objects.push(action(node, actions[i][1]));
      } else {
        objects.push(action(node));
      }
    }
  }

  return {
    update(actions) {
      if ((actions && actions.length || 0) != objects.length) {
        throw new Error('You must not change the length of an actions array.');
      }

      if (actions) {
        for (let i = 0; i < actions.length; i++) {
          if (objects[i] && 'update' in objects[i]) {
            const isArray = Array.isArray(actions[i]);
            if (isArray && actions[i].length > 1) {
              objects[i].update(actions[i][1]);
            } else {
              objects[i].update();
            }
          }
        }
      }
    },

    destroy() {
      for (let i = 0; i < objects.length; i++) {
        if (objects[i] && 'destroy' in objects[i]) {
          objects[i].destroy();
        }
      }
    }
  }
}

/**
 * Stores result from supportsCssVariables to avoid redundant processing to
 * detect CSS custom variable support.
 */
var supportsCssVariables_;
function detectEdgePseudoVarBug(windowObj) {
    // Detect versions of Edge with buggy var() support
    // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11495448/
    var document = windowObj.document;
    var node = document.createElement('div');
    node.className = 'mdc-ripple-surface--test-edge-var-bug';
    // Append to head instead of body because this script might be invoked in the
    // head, in which case the body doesn't exist yet. The probe works either way.
    document.head.appendChild(node);
    // The bug exists if ::before style ends up propagating to the parent element.
    // Additionally, getComputedStyle returns null in iframes with display: "none" in Firefox,
    // but Firefox is known to support CSS custom properties correctly.
    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
    var computedStyle = windowObj.getComputedStyle(node);
    var hasPseudoVarBug = computedStyle !== null && computedStyle.borderTopStyle === 'solid';
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
    return hasPseudoVarBug;
}
function supportsCssVariables(windowObj, forceRefresh) {
    if (forceRefresh === void 0) { forceRefresh = false; }
    var CSS = windowObj.CSS;
    var supportsCssVars = supportsCssVariables_;
    if (typeof supportsCssVariables_ === 'boolean' && !forceRefresh) {
        return supportsCssVariables_;
    }
    var supportsFunctionPresent = CSS && typeof CSS.supports === 'function';
    if (!supportsFunctionPresent) {
        return false;
    }
    var explicitlySupportsCssVars = CSS.supports('--css-vars', 'yes');
    // See: https://bugs.webkit.org/show_bug.cgi?id=154669
    // See: README section on Safari
    var weAreFeatureDetectingSafari10plus = (CSS.supports('(--css-vars: yes)') &&
        CSS.supports('color', '#00000000'));
    if (explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus) {
        supportsCssVars = !detectEdgePseudoVarBug(windowObj);
    }
    else {
        supportsCssVars = false;
    }
    if (!forceRefresh) {
        supportsCssVariables_ = supportsCssVars;
    }
    return supportsCssVars;
}
function getNormalizedEventCoords(evt, pageOffset, clientRect) {
    if (!evt) {
        return { x: 0, y: 0 };
    }
    var x = pageOffset.x, y = pageOffset.y;
    var documentX = x + clientRect.left;
    var documentY = y + clientRect.top;
    var normalizedX;
    var normalizedY;
    // Determine touch point relative to the ripple container.
    if (evt.type === 'touchstart') {
        var touchEvent = evt;
        normalizedX = touchEvent.changedTouches[0].pageX - documentX;
        normalizedY = touchEvent.changedTouches[0].pageY - documentY;
    }
    else {
        var mouseEvent = evt;
        normalizedX = mouseEvent.pageX - documentX;
        normalizedY = mouseEvent.pageY - documentY;
    }
    return { x: normalizedX, y: normalizedY };
}
//# sourceMappingURL=util.js.map

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCFoundation = /** @class */ (function () {
    function MDCFoundation(adapter) {
        if (adapter === void 0) { adapter = {}; }
        this.adapter_ = adapter;
    }
    Object.defineProperty(MDCFoundation, "cssClasses", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports every
            // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
            return {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "strings", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports all
            // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
            return {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "numbers", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports all
            // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
            return {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "defaultAdapter", {
        get: function () {
            // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
            // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
            // validation.
            return {};
        },
        enumerable: true,
        configurable: true
    });
    MDCFoundation.prototype.init = function () {
        // Subclasses should override this method to perform initialization routines (registering events, etc.)
    };
    MDCFoundation.prototype.destroy = function () {
        // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
    };
    return MDCFoundation;
}());
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCComponent = /** @class */ (function () {
    function MDCComponent(root, foundation) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        this.root_ = root;
        this.initialize.apply(this, __spread(args));
        // Note that we initialize foundation here and not within the constructor's default param so that
        // this.root_ is defined and can be used within the foundation class.
        this.foundation_ = foundation === undefined ? this.getDefaultFoundation() : foundation;
        this.foundation_.init();
        this.initialSyncWithDOM();
    }
    MDCComponent.attachTo = function (root) {
        // Subclasses which extend MDCBase should provide an attachTo() method that takes a root element and
        // returns an instantiated component with its root set to that element. Also note that in the cases of
        // subclasses, an explicit foundation class will not have to be passed in; it will simply be initialized
        // from getDefaultFoundation().
        return new MDCComponent(root, new MDCFoundation({}));
    };
    /* istanbul ignore next: method param only exists for typing purposes; it does not need to be unit tested */
    MDCComponent.prototype.initialize = function () {
        var _args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _args[_i] = arguments[_i];
        }
        // Subclasses can override this to do any additional setup work that would be considered part of a
        // "constructor". Essentially, it is a hook into the parent constructor before the foundation is
        // initialized. Any additional arguments besides root and foundation will be passed in here.
    };
    MDCComponent.prototype.getDefaultFoundation = function () {
        // Subclasses must override this method to return a properly configured foundation class for the
        // component.
        throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
            'foundation class');
    };
    MDCComponent.prototype.initialSyncWithDOM = function () {
        // Subclasses should override this method if they need to perform work to synchronize with a host DOM
        // object. An example of this would be a form control wrapper that needs to synchronize its internal state
        // to some property or attribute of the host DOM. Please note: this is *not* the place to perform DOM
        // reads/writes that would cause layout / paint, as this is called synchronously from within the constructor.
    };
    MDCComponent.prototype.destroy = function () {
        // Subclasses may implement this method to release any resources / deregister any listeners they have
        // attached. An example of this might be deregistering a resize event from the window object.
        this.foundation_.destroy();
    };
    MDCComponent.prototype.listen = function (evtType, handler, options) {
        this.root_.addEventListener(evtType, handler, options);
    };
    MDCComponent.prototype.unlisten = function (evtType, handler, options) {
        this.root_.removeEventListener(evtType, handler, options);
    };
    /**
     * Fires a cross-browser-compatible custom event from the component root of the given type, with the given data.
     */
    MDCComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
        if (shouldBubble === void 0) { shouldBubble = false; }
        var evt;
        if (typeof CustomEvent === 'function') {
            evt = new CustomEvent(evtType, {
                bubbles: shouldBubble,
                detail: evtData,
            });
        }
        else {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(evtType, shouldBubble, false, evtData);
        }
        this.root_.dispatchEvent(evt);
    };
    return MDCComponent;
}());
//# sourceMappingURL=component.js.map

/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * Stores result from applyPassive to avoid redundant processing to detect
 * passive event listener support.
 */
var supportsPassive_;
/**
 * Determine whether the current browser supports passive event listeners, and
 * if so, use them.
 */
function applyPassive(globalObj, forceRefresh) {
    if (globalObj === void 0) { globalObj = window; }
    if (forceRefresh === void 0) { forceRefresh = false; }
    if (supportsPassive_ === undefined || forceRefresh) {
        var isSupported_1 = false;
        try {
            globalObj.document.addEventListener('test', function () { return undefined; }, {
                get passive() {
                    isSupported_1 = true;
                    return isSupported_1;
                },
            });
        }
        catch (e) {
        } // tslint:disable-line:no-empty cannot throw error due to tests. tslint also disables console.log.
        supportsPassive_ = isSupported_1;
    }
    return supportsPassive_ ? { passive: true } : false;
}
//# sourceMappingURL=events.js.map

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
function matches(element, selector) {
    var nativeMatches = element.matches
        || element.webkitMatchesSelector
        || element.msMatchesSelector;
    return nativeMatches.call(element, selector);
}
//# sourceMappingURL=ponyfill.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses = {
    // Ripple is a special case where the "root" component is really a "mixin" of sorts,
    // given that it's an 'upgrade' to an existing component. That being said it is the root
    // CSS class that all other CSS classes derive from.
    BG_FOCUSED: 'mdc-ripple-upgraded--background-focused',
    FG_ACTIVATION: 'mdc-ripple-upgraded--foreground-activation',
    FG_DEACTIVATION: 'mdc-ripple-upgraded--foreground-deactivation',
    ROOT: 'mdc-ripple-upgraded',
    UNBOUNDED: 'mdc-ripple-upgraded--unbounded',
};
var strings = {
    VAR_FG_SCALE: '--mdc-ripple-fg-scale',
    VAR_FG_SIZE: '--mdc-ripple-fg-size',
    VAR_FG_TRANSLATE_END: '--mdc-ripple-fg-translate-end',
    VAR_FG_TRANSLATE_START: '--mdc-ripple-fg-translate-start',
    VAR_LEFT: '--mdc-ripple-left',
    VAR_TOP: '--mdc-ripple-top',
};
var numbers = {
    DEACTIVATION_TIMEOUT_MS: 225,
    FG_DEACTIVATION_MS: 150,
    INITIAL_ORIGIN_SCALE: 0.6,
    PADDING: 10,
    TAP_DELAY_MS: 300,
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
// Activation events registered on the root element of each instance for activation
var ACTIVATION_EVENT_TYPES = [
    'touchstart', 'pointerdown', 'mousedown', 'keydown',
];
// Deactivation events registered on documentElement when a pointer-related down event occurs
var POINTER_DEACTIVATION_EVENT_TYPES = [
    'touchend', 'pointerup', 'mouseup', 'contextmenu',
];
// simultaneous nested activations
var activatedTargets = [];
var MDCRippleFoundation = /** @class */ (function (_super) {
    __extends(MDCRippleFoundation, _super);
    function MDCRippleFoundation(adapter) {
        var _this = _super.call(this, __assign({}, MDCRippleFoundation.defaultAdapter, adapter)) || this;
        _this.activationAnimationHasEnded_ = false;
        _this.activationTimer_ = 0;
        _this.fgDeactivationRemovalTimer_ = 0;
        _this.fgScale_ = '0';
        _this.frame_ = { width: 0, height: 0 };
        _this.initialSize_ = 0;
        _this.layoutFrame_ = 0;
        _this.maxRadius_ = 0;
        _this.unboundedCoords_ = { left: 0, top: 0 };
        _this.activationState_ = _this.defaultActivationState_();
        _this.activationTimerCallback_ = function () {
            _this.activationAnimationHasEnded_ = true;
            _this.runDeactivationUXLogicIfReady_();
        };
        _this.activateHandler_ = function (e) { return _this.activate_(e); };
        _this.deactivateHandler_ = function () { return _this.deactivate_(); };
        _this.focusHandler_ = function () { return _this.handleFocus(); };
        _this.blurHandler_ = function () { return _this.handleBlur(); };
        _this.resizeHandler_ = function () { return _this.layout(); };
        return _this;
    }
    Object.defineProperty(MDCRippleFoundation, "cssClasses", {
        get: function () {
            return cssClasses;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCRippleFoundation, "strings", {
        get: function () {
            return strings;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCRippleFoundation, "numbers", {
        get: function () {
            return numbers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCRippleFoundation, "defaultAdapter", {
        get: function () {
            return {
                addClass: function () { return undefined; },
                browserSupportsCssVars: function () { return true; },
                computeBoundingRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                containsEventTarget: function () { return true; },
                deregisterDocumentInteractionHandler: function () { return undefined; },
                deregisterInteractionHandler: function () { return undefined; },
                deregisterResizeHandler: function () { return undefined; },
                getWindowPageOffset: function () { return ({ x: 0, y: 0 }); },
                isSurfaceActive: function () { return true; },
                isSurfaceDisabled: function () { return true; },
                isUnbounded: function () { return true; },
                registerDocumentInteractionHandler: function () { return undefined; },
                registerInteractionHandler: function () { return undefined; },
                registerResizeHandler: function () { return undefined; },
                removeClass: function () { return undefined; },
                updateCssVariable: function () { return undefined; },
            };
        },
        enumerable: true,
        configurable: true
    });
    MDCRippleFoundation.prototype.init = function () {
        var _this = this;
        var supportsPressRipple = this.supportsPressRipple_();
        this.registerRootHandlers_(supportsPressRipple);
        if (supportsPressRipple) {
            var _a = MDCRippleFoundation.cssClasses, ROOT_1 = _a.ROOT, UNBOUNDED_1 = _a.UNBOUNDED;
            requestAnimationFrame(function () {
                _this.adapter_.addClass(ROOT_1);
                if (_this.adapter_.isUnbounded()) {
                    _this.adapter_.addClass(UNBOUNDED_1);
                    // Unbounded ripples need layout logic applied immediately to set coordinates for both shade and ripple
                    _this.layoutInternal_();
                }
            });
        }
    };
    MDCRippleFoundation.prototype.destroy = function () {
        var _this = this;
        if (this.supportsPressRipple_()) {
            if (this.activationTimer_) {
                clearTimeout(this.activationTimer_);
                this.activationTimer_ = 0;
                this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_ACTIVATION);
            }
            if (this.fgDeactivationRemovalTimer_) {
                clearTimeout(this.fgDeactivationRemovalTimer_);
                this.fgDeactivationRemovalTimer_ = 0;
                this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_DEACTIVATION);
            }
            var _a = MDCRippleFoundation.cssClasses, ROOT_2 = _a.ROOT, UNBOUNDED_2 = _a.UNBOUNDED;
            requestAnimationFrame(function () {
                _this.adapter_.removeClass(ROOT_2);
                _this.adapter_.removeClass(UNBOUNDED_2);
                _this.removeCssVars_();
            });
        }
        this.deregisterRootHandlers_();
        this.deregisterDeactivationHandlers_();
    };
    /**
     * @param evt Optional event containing position information.
     */
    MDCRippleFoundation.prototype.activate = function (evt) {
        this.activate_(evt);
    };
    MDCRippleFoundation.prototype.deactivate = function () {
        this.deactivate_();
    };
    MDCRippleFoundation.prototype.layout = function () {
        var _this = this;
        if (this.layoutFrame_) {
            cancelAnimationFrame(this.layoutFrame_);
        }
        this.layoutFrame_ = requestAnimationFrame(function () {
            _this.layoutInternal_();
            _this.layoutFrame_ = 0;
        });
    };
    MDCRippleFoundation.prototype.setUnbounded = function (unbounded) {
        var UNBOUNDED = MDCRippleFoundation.cssClasses.UNBOUNDED;
        if (unbounded) {
            this.adapter_.addClass(UNBOUNDED);
        }
        else {
            this.adapter_.removeClass(UNBOUNDED);
        }
    };
    MDCRippleFoundation.prototype.handleFocus = function () {
        var _this = this;
        requestAnimationFrame(function () {
            return _this.adapter_.addClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
        });
    };
    MDCRippleFoundation.prototype.handleBlur = function () {
        var _this = this;
        requestAnimationFrame(function () {
            return _this.adapter_.removeClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
        });
    };
    /**
     * We compute this property so that we are not querying information about the client
     * until the point in time where the foundation requests it. This prevents scenarios where
     * client-side feature-detection may happen too early, such as when components are rendered on the server
     * and then initialized at mount time on the client.
     */
    MDCRippleFoundation.prototype.supportsPressRipple_ = function () {
        return this.adapter_.browserSupportsCssVars();
    };
    MDCRippleFoundation.prototype.defaultActivationState_ = function () {
        return {
            activationEvent: undefined,
            hasDeactivationUXRun: false,
            isActivated: false,
            isProgrammatic: false,
            wasActivatedByPointer: false,
            wasElementMadeActive: false,
        };
    };
    /**
     * supportsPressRipple Passed from init to save a redundant function call
     */
    MDCRippleFoundation.prototype.registerRootHandlers_ = function (supportsPressRipple) {
        var _this = this;
        if (supportsPressRipple) {
            ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.registerInteractionHandler(evtType, _this.activateHandler_);
            });
            if (this.adapter_.isUnbounded()) {
                this.adapter_.registerResizeHandler(this.resizeHandler_);
            }
        }
        this.adapter_.registerInteractionHandler('focus', this.focusHandler_);
        this.adapter_.registerInteractionHandler('blur', this.blurHandler_);
    };
    MDCRippleFoundation.prototype.registerDeactivationHandlers_ = function (evt) {
        var _this = this;
        if (evt.type === 'keydown') {
            this.adapter_.registerInteractionHandler('keyup', this.deactivateHandler_);
        }
        else {
            POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.registerDocumentInteractionHandler(evtType, _this.deactivateHandler_);
            });
        }
    };
    MDCRippleFoundation.prototype.deregisterRootHandlers_ = function () {
        var _this = this;
        ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
            _this.adapter_.deregisterInteractionHandler(evtType, _this.activateHandler_);
        });
        this.adapter_.deregisterInteractionHandler('focus', this.focusHandler_);
        this.adapter_.deregisterInteractionHandler('blur', this.blurHandler_);
        if (this.adapter_.isUnbounded()) {
            this.adapter_.deregisterResizeHandler(this.resizeHandler_);
        }
    };
    MDCRippleFoundation.prototype.deregisterDeactivationHandlers_ = function () {
        var _this = this;
        this.adapter_.deregisterInteractionHandler('keyup', this.deactivateHandler_);
        POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
            _this.adapter_.deregisterDocumentInteractionHandler(evtType, _this.deactivateHandler_);
        });
    };
    MDCRippleFoundation.prototype.removeCssVars_ = function () {
        var _this = this;
        var rippleStrings = MDCRippleFoundation.strings;
        var keys = Object.keys(rippleStrings);
        keys.forEach(function (key) {
            if (key.indexOf('VAR_') === 0) {
                _this.adapter_.updateCssVariable(rippleStrings[key], null);
            }
        });
    };
    MDCRippleFoundation.prototype.activate_ = function (evt) {
        var _this = this;
        if (this.adapter_.isSurfaceDisabled()) {
            return;
        }
        var activationState = this.activationState_;
        if (activationState.isActivated) {
            return;
        }
        // Avoid reacting to follow-on events fired by touch device after an already-processed user interaction
        var previousActivationEvent = this.previousActivationEvent_;
        var isSameInteraction = previousActivationEvent && evt !== undefined && previousActivationEvent.type !== evt.type;
        if (isSameInteraction) {
            return;
        }
        activationState.isActivated = true;
        activationState.isProgrammatic = evt === undefined;
        activationState.activationEvent = evt;
        activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : evt !== undefined && (evt.type === 'mousedown' || evt.type === 'touchstart' || evt.type === 'pointerdown');
        var hasActivatedChild = evt !== undefined && activatedTargets.length > 0 && activatedTargets.some(function (target) { return _this.adapter_.containsEventTarget(target); });
        if (hasActivatedChild) {
            // Immediately reset activation state, while preserving logic that prevents touch follow-on events
            this.resetActivationState_();
            return;
        }
        if (evt !== undefined) {
            activatedTargets.push(evt.target);
            this.registerDeactivationHandlers_(evt);
        }
        activationState.wasElementMadeActive = this.checkElementMadeActive_(evt);
        if (activationState.wasElementMadeActive) {
            this.animateActivation_();
        }
        requestAnimationFrame(function () {
            // Reset array on next frame after the current event has had a chance to bubble to prevent ancestor ripples
            activatedTargets = [];
            if (!activationState.wasElementMadeActive
                && evt !== undefined
                && (evt.key === ' ' || evt.keyCode === 32)) {
                // If space was pressed, try again within an rAF call to detect :active, because different UAs report
                // active states inconsistently when they're called within event handling code:
                // - https://bugs.chromium.org/p/chromium/issues/detail?id=635971
                // - https://bugzilla.mozilla.org/show_bug.cgi?id=1293741
                // We try first outside rAF to support Edge, which does not exhibit this problem, but will crash if a CSS
                // variable is set within a rAF callback for a submit button interaction (#2241).
                activationState.wasElementMadeActive = _this.checkElementMadeActive_(evt);
                if (activationState.wasElementMadeActive) {
                    _this.animateActivation_();
                }
            }
            if (!activationState.wasElementMadeActive) {
                // Reset activation state immediately if element was not made active.
                _this.activationState_ = _this.defaultActivationState_();
            }
        });
    };
    MDCRippleFoundation.prototype.checkElementMadeActive_ = function (evt) {
        return (evt !== undefined && evt.type === 'keydown') ? this.adapter_.isSurfaceActive() : true;
    };
    MDCRippleFoundation.prototype.animateActivation_ = function () {
        var _this = this;
        var _a = MDCRippleFoundation.strings, VAR_FG_TRANSLATE_START = _a.VAR_FG_TRANSLATE_START, VAR_FG_TRANSLATE_END = _a.VAR_FG_TRANSLATE_END;
        var _b = MDCRippleFoundation.cssClasses, FG_DEACTIVATION = _b.FG_DEACTIVATION, FG_ACTIVATION = _b.FG_ACTIVATION;
        var DEACTIVATION_TIMEOUT_MS = MDCRippleFoundation.numbers.DEACTIVATION_TIMEOUT_MS;
        this.layoutInternal_();
        var translateStart = '';
        var translateEnd = '';
        if (!this.adapter_.isUnbounded()) {
            var _c = this.getFgTranslationCoordinates_(), startPoint = _c.startPoint, endPoint = _c.endPoint;
            translateStart = startPoint.x + "px, " + startPoint.y + "px";
            translateEnd = endPoint.x + "px, " + endPoint.y + "px";
        }
        this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
        this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
        // Cancel any ongoing activation/deactivation animations
        clearTimeout(this.activationTimer_);
        clearTimeout(this.fgDeactivationRemovalTimer_);
        this.rmBoundedActivationClasses_();
        this.adapter_.removeClass(FG_DEACTIVATION);
        // Force layout in order to re-trigger the animation.
        this.adapter_.computeBoundingRect();
        this.adapter_.addClass(FG_ACTIVATION);
        this.activationTimer_ = setTimeout(function () { return _this.activationTimerCallback_(); }, DEACTIVATION_TIMEOUT_MS);
    };
    MDCRippleFoundation.prototype.getFgTranslationCoordinates_ = function () {
        var _a = this.activationState_, activationEvent = _a.activationEvent, wasActivatedByPointer = _a.wasActivatedByPointer;
        var startPoint;
        if (wasActivatedByPointer) {
            startPoint = getNormalizedEventCoords(activationEvent, this.adapter_.getWindowPageOffset(), this.adapter_.computeBoundingRect());
        }
        else {
            startPoint = {
                x: this.frame_.width / 2,
                y: this.frame_.height / 2,
            };
        }
        // Center the element around the start point.
        startPoint = {
            x: startPoint.x - (this.initialSize_ / 2),
            y: startPoint.y - (this.initialSize_ / 2),
        };
        var endPoint = {
            x: (this.frame_.width / 2) - (this.initialSize_ / 2),
            y: (this.frame_.height / 2) - (this.initialSize_ / 2),
        };
        return { startPoint: startPoint, endPoint: endPoint };
    };
    MDCRippleFoundation.prototype.runDeactivationUXLogicIfReady_ = function () {
        var _this = this;
        // This method is called both when a pointing device is released, and when the activation animation ends.
        // The deactivation animation should only run after both of those occur.
        var FG_DEACTIVATION = MDCRippleFoundation.cssClasses.FG_DEACTIVATION;
        var _a = this.activationState_, hasDeactivationUXRun = _a.hasDeactivationUXRun, isActivated = _a.isActivated;
        var activationHasEnded = hasDeactivationUXRun || !isActivated;
        if (activationHasEnded && this.activationAnimationHasEnded_) {
            this.rmBoundedActivationClasses_();
            this.adapter_.addClass(FG_DEACTIVATION);
            this.fgDeactivationRemovalTimer_ = setTimeout(function () {
                _this.adapter_.removeClass(FG_DEACTIVATION);
            }, numbers.FG_DEACTIVATION_MS);
        }
    };
    MDCRippleFoundation.prototype.rmBoundedActivationClasses_ = function () {
        var FG_ACTIVATION = MDCRippleFoundation.cssClasses.FG_ACTIVATION;
        this.adapter_.removeClass(FG_ACTIVATION);
        this.activationAnimationHasEnded_ = false;
        this.adapter_.computeBoundingRect();
    };
    MDCRippleFoundation.prototype.resetActivationState_ = function () {
        var _this = this;
        this.previousActivationEvent_ = this.activationState_.activationEvent;
        this.activationState_ = this.defaultActivationState_();
        // Touch devices may fire additional events for the same interaction within a short time.
        // Store the previous event until it's safe to assume that subsequent events are for new interactions.
        setTimeout(function () { return _this.previousActivationEvent_ = undefined; }, MDCRippleFoundation.numbers.TAP_DELAY_MS);
    };
    MDCRippleFoundation.prototype.deactivate_ = function () {
        var _this = this;
        var activationState = this.activationState_;
        // This can happen in scenarios such as when you have a keyup event that blurs the element.
        if (!activationState.isActivated) {
            return;
        }
        var state = __assign({}, activationState);
        if (activationState.isProgrammatic) {
            requestAnimationFrame(function () { return _this.animateDeactivation_(state); });
            this.resetActivationState_();
        }
        else {
            this.deregisterDeactivationHandlers_();
            requestAnimationFrame(function () {
                _this.activationState_.hasDeactivationUXRun = true;
                _this.animateDeactivation_(state);
                _this.resetActivationState_();
            });
        }
    };
    MDCRippleFoundation.prototype.animateDeactivation_ = function (_a) {
        var wasActivatedByPointer = _a.wasActivatedByPointer, wasElementMadeActive = _a.wasElementMadeActive;
        if (wasActivatedByPointer || wasElementMadeActive) {
            this.runDeactivationUXLogicIfReady_();
        }
    };
    MDCRippleFoundation.prototype.layoutInternal_ = function () {
        var _this = this;
        this.frame_ = this.adapter_.computeBoundingRect();
        var maxDim = Math.max(this.frame_.height, this.frame_.width);
        // Surface diameter is treated differently for unbounded vs. bounded ripples.
        // Unbounded ripple diameter is calculated smaller since the surface is expected to already be padded appropriately
        // to extend the hitbox, and the ripple is expected to meet the edges of the padded hitbox (which is typically
        // square). Bounded ripples, on the other hand, are fully expected to expand beyond the surface's longest diameter
        // (calculated based on the diagonal plus a constant padding), and are clipped at the surface's border via
        // `overflow: hidden`.
        var getBoundedRadius = function () {
            var hypotenuse = Math.sqrt(Math.pow(_this.frame_.width, 2) + Math.pow(_this.frame_.height, 2));
            return hypotenuse + MDCRippleFoundation.numbers.PADDING;
        };
        this.maxRadius_ = this.adapter_.isUnbounded() ? maxDim : getBoundedRadius();
        // Ripple is sized as a fraction of the largest dimension of the surface, then scales up using a CSS scale transform
        this.initialSize_ = Math.floor(maxDim * MDCRippleFoundation.numbers.INITIAL_ORIGIN_SCALE);
        this.fgScale_ = "" + this.maxRadius_ / this.initialSize_;
        this.updateLayoutCssVars_();
    };
    MDCRippleFoundation.prototype.updateLayoutCssVars_ = function () {
        var _a = MDCRippleFoundation.strings, VAR_FG_SIZE = _a.VAR_FG_SIZE, VAR_LEFT = _a.VAR_LEFT, VAR_TOP = _a.VAR_TOP, VAR_FG_SCALE = _a.VAR_FG_SCALE;
        this.adapter_.updateCssVariable(VAR_FG_SIZE, this.initialSize_ + "px");
        this.adapter_.updateCssVariable(VAR_FG_SCALE, this.fgScale_);
        if (this.adapter_.isUnbounded()) {
            this.unboundedCoords_ = {
                left: Math.round((this.frame_.width / 2) - (this.initialSize_ / 2)),
                top: Math.round((this.frame_.height / 2) - (this.initialSize_ / 2)),
            };
            this.adapter_.updateCssVariable(VAR_LEFT, this.unboundedCoords_.left + "px");
            this.adapter_.updateCssVariable(VAR_TOP, this.unboundedCoords_.top + "px");
        }
    };
    return MDCRippleFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCRipple = /** @class */ (function (_super) {
    __extends(MDCRipple, _super);
    function MDCRipple() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.disabled = false;
        return _this;
    }
    MDCRipple.attachTo = function (root, opts) {
        if (opts === void 0) { opts = { isUnbounded: undefined }; }
        var ripple = new MDCRipple(root);
        // Only override unbounded behavior if option is explicitly specified
        if (opts.isUnbounded !== undefined) {
            ripple.unbounded = opts.isUnbounded;
        }
        return ripple;
    };
    MDCRipple.createAdapter = function (instance) {
        return {
            addClass: function (className) { return instance.root_.classList.add(className); },
            browserSupportsCssVars: function () { return supportsCssVariables(window); },
            computeBoundingRect: function () { return instance.root_.getBoundingClientRect(); },
            containsEventTarget: function (target) { return instance.root_.contains(target); },
            deregisterDocumentInteractionHandler: function (evtType, handler) {
                return document.documentElement.removeEventListener(evtType, handler, applyPassive());
            },
            deregisterInteractionHandler: function (evtType, handler) {
                return instance.root_.removeEventListener(evtType, handler, applyPassive());
            },
            deregisterResizeHandler: function (handler) { return window.removeEventListener('resize', handler); },
            getWindowPageOffset: function () { return ({ x: window.pageXOffset, y: window.pageYOffset }); },
            isSurfaceActive: function () { return matches(instance.root_, ':active'); },
            isSurfaceDisabled: function () { return Boolean(instance.disabled); },
            isUnbounded: function () { return Boolean(instance.unbounded); },
            registerDocumentInteractionHandler: function (evtType, handler) {
                return document.documentElement.addEventListener(evtType, handler, applyPassive());
            },
            registerInteractionHandler: function (evtType, handler) {
                return instance.root_.addEventListener(evtType, handler, applyPassive());
            },
            registerResizeHandler: function (handler) { return window.addEventListener('resize', handler); },
            removeClass: function (className) { return instance.root_.classList.remove(className); },
            updateCssVariable: function (varName, value) { return instance.root_.style.setProperty(varName, value); },
        };
    };
    Object.defineProperty(MDCRipple.prototype, "unbounded", {
        get: function () {
            return Boolean(this.unbounded_);
        },
        set: function (unbounded) {
            this.unbounded_ = Boolean(unbounded);
            this.setUnbounded_();
        },
        enumerable: true,
        configurable: true
    });
    MDCRipple.prototype.activate = function () {
        this.foundation_.activate();
    };
    MDCRipple.prototype.deactivate = function () {
        this.foundation_.deactivate();
    };
    MDCRipple.prototype.layout = function () {
        this.foundation_.layout();
    };
    MDCRipple.prototype.getDefaultFoundation = function () {
        return new MDCRippleFoundation(MDCRipple.createAdapter(this));
    };
    MDCRipple.prototype.initialSyncWithDOM = function () {
        var root = this.root_;
        this.unbounded = 'mdcRippleIsUnbounded' in root.dataset;
    };
    /**
     * Closure Compiler throws an access control error when directly accessing a
     * protected or private property inside a getter/setter, like unbounded above.
     * By accessing the protected property inside a method, we solve that problem.
     * That's why this function exists.
     */
    MDCRipple.prototype.setUnbounded_ = function () {
        this.foundation_.setUnbounded(Boolean(this.unbounded_));
    };
    return MDCRipple;
}(MDCComponent));
//# sourceMappingURL=component.js.map

function Ripple(node, [ripple, props = {unbounded: false, color: null}]) {
  let instance = null;
  let addLayoutListener = getContext('SMUI:addLayoutListener');
  let removeLayoutListener;

  function handleProps(ripple, props) {
    if (ripple && !instance) {
      instance = new MDCRipple(node);
    } else if (instance && !ripple) {
      instance.destroy();
      instance = null;
    }
    if (ripple) {
      instance.unbounded = !!props.unbounded;
      switch (props.color) {
        case 'surface':
          node.classList.add('mdc-ripple-surface');
          node.classList.remove('mdc-ripple-surface--primary');
          node.classList.remove('mdc-ripple-surface--accent');
          return;
        case 'primary':
          node.classList.add('mdc-ripple-surface');
          node.classList.add('mdc-ripple-surface--primary');
          node.classList.remove('mdc-ripple-surface--accent');
          return;
        case 'secondary':
          node.classList.add('mdc-ripple-surface');
          node.classList.remove('mdc-ripple-surface--primary');
          node.classList.add('mdc-ripple-surface--accent');
          return;
      }
    }
    node.classList.remove('mdc-ripple-surface');
    node.classList.remove('mdc-ripple-surface--primary');
    node.classList.remove('mdc-ripple-surface--accent');
  }

  if (ripple) {
    handleProps(ripple, props);
  }

  if (addLayoutListener) {
    removeLayoutListener = addLayoutListener(layout);
  }

  function layout() {
    if (instance) {
      instance.layout();
    }
  }

  return {
    update([ripple, props = {unbounded: false, color: null}]) {
      handleProps(ripple, props);
    },

    destroy() {
      if (instance) {
        instance.destroy();
        instance = null;
        node.classList.remove('mdc-ripple-surface');
        node.classList.remove('mdc-ripple-surface--primary');
        node.classList.remove('mdc-ripple-surface--accent');
      }

      if (removeLayoutListener) {
        removeLayoutListener();
      }
    }
  }
}

/* node_modules\@smui\button\Button.svelte generated by Svelte v3.12.1 */

const file = "node_modules\\@smui\\button\\Button.svelte";

// (26:0) {:else}
function create_else_block(ctx) {
	var button, useActions_action, forwardEvents_action, Ripple_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var button_levels = [
		{ class: "\n      mdc-button\n      " + ctx.className + "\n      " + (ctx.variant === 'raised' ? 'mdc-button--raised' : '') + "\n      " + (ctx.variant === 'unelevated' ? 'mdc-button--unelevated' : '') + "\n      " + (ctx.variant === 'outlined' ? 'mdc-button--outlined' : '') + "\n      " + (ctx.dense ? 'mdc-button--dense' : '') + "\n      " + (ctx.color === 'secondary' ? 'smui-button--color-secondary' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action--button' : '') + "\n      " + (ctx.context === 'dialog:action' ? 'mdc-dialog__button' : '') + "\n      " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n      " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n      " + (ctx.context === 'snackbar' ? 'mdc-snackbar__action' : '') + "\n    " },
		ctx.actionProp,
		ctx.defaultProp,
		ctx.props
	];

	var button_data = {};
	for (var i = 0; i < button_levels.length; i += 1) {
		button_data = assign(button_data, button_levels[i]);
	}

	const block = {
		c: function create() {
			button = element("button");

			if (default_slot) default_slot.c();

			set_attributes(button, button_data);
			add_location(button, file, 26, 2, 971);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(button_nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, button, anchor);

			if (default_slot) {
				default_slot.m(button, null);
			}

			useActions_action = useActions.call(null, button, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, button) || {};
			Ripple_action = Ripple.call(null, button, [ctx.ripple, {unbounded: false}]) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			set_attributes(button, get_spread_update(button_levels, [
				(changed.className || changed.variant || changed.dense || changed.color || changed.context) && { class: "\n      mdc-button\n      " + ctx.className + "\n      " + (ctx.variant === 'raised' ? 'mdc-button--raised' : '') + "\n      " + (ctx.variant === 'unelevated' ? 'mdc-button--unelevated' : '') + "\n      " + (ctx.variant === 'outlined' ? 'mdc-button--outlined' : '') + "\n      " + (ctx.dense ? 'mdc-button--dense' : '') + "\n      " + (ctx.color === 'secondary' ? 'smui-button--color-secondary' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action--button' : '') + "\n      " + (ctx.context === 'dialog:action' ? 'mdc-dialog__button' : '') + "\n      " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n      " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n      " + (ctx.context === 'snackbar' ? 'mdc-snackbar__action' : '') + "\n    " },
				(changed.actionProp) && ctx.actionProp,
				(changed.defaultProp) && ctx.defaultProp,
				(changed.props) && ctx.props
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if (typeof Ripple_action.update === 'function' && changed.ripple) {
				Ripple_action.update.call(null, [ctx.ripple, {unbounded: false}]);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(button);
			}

			if (default_slot) default_slot.d(detaching);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
			if (Ripple_action && typeof Ripple_action.destroy === 'function') Ripple_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(26:0) {:else}", ctx });
	return block;
}

// (1:0) {#if href}
function create_if_block(ctx) {
	var a, useActions_action, forwardEvents_action, Ripple_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var a_levels = [
		{ class: "\n      mdc-button\n      " + ctx.className + "\n      " + (ctx.variant === 'raised' ? 'mdc-button--raised' : '') + "\n      " + (ctx.variant === 'unelevated' ? 'mdc-button--unelevated' : '') + "\n      " + (ctx.variant === 'outlined' ? 'mdc-button--outlined' : '') + "\n      " + (ctx.dense ? 'mdc-button--dense' : '') + "\n      " + (ctx.color === 'secondary' ? 'smui-button--color-secondary' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action--button' : '') + "\n      " + (ctx.context === 'dialog:action' ? 'mdc-dialog__button' : '') + "\n      " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n      " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n      " + (ctx.context === 'snackbar' ? 'mdc-snackbar__action' : '') + "\n    " },
		{ href: ctx.href },
		ctx.actionProp,
		ctx.defaultProp,
		ctx.props
	];

	var a_data = {};
	for (var i = 0; i < a_levels.length; i += 1) {
		a_data = assign(a_data, a_levels[i]);
	}

	const block = {
		c: function create() {
			a = element("a");

			if (default_slot) default_slot.c();

			set_attributes(a, a_data);
			add_location(a, file, 1, 2, 13);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(a_nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, a, anchor);

			if (default_slot) {
				default_slot.m(a, null);
			}

			useActions_action = useActions.call(null, a, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, a) || {};
			Ripple_action = Ripple.call(null, a, [ctx.ripple, {unbounded: false}]) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			set_attributes(a, get_spread_update(a_levels, [
				(changed.className || changed.variant || changed.dense || changed.color || changed.context) && { class: "\n      mdc-button\n      " + ctx.className + "\n      " + (ctx.variant === 'raised' ? 'mdc-button--raised' : '') + "\n      " + (ctx.variant === 'unelevated' ? 'mdc-button--unelevated' : '') + "\n      " + (ctx.variant === 'outlined' ? 'mdc-button--outlined' : '') + "\n      " + (ctx.dense ? 'mdc-button--dense' : '') + "\n      " + (ctx.color === 'secondary' ? 'smui-button--color-secondary' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action' : '') + "\n      " + (ctx.context === 'card:action' ? 'mdc-card__action--button' : '') + "\n      " + (ctx.context === 'dialog:action' ? 'mdc-dialog__button' : '') + "\n      " + (ctx.context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : '') + "\n      " + (ctx.context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : '') + "\n      " + (ctx.context === 'snackbar' ? 'mdc-snackbar__action' : '') + "\n    " },
				(changed.href) && { href: ctx.href },
				(changed.actionProp) && ctx.actionProp,
				(changed.defaultProp) && ctx.defaultProp,
				(changed.props) && ctx.props
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if (typeof Ripple_action.update === 'function' && changed.ripple) {
				Ripple_action.update.call(null, [ctx.ripple, {unbounded: false}]);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(a);
			}

			if (default_slot) default_slot.d(detaching);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
			if (Ripple_action && typeof Ripple_action.destroy === 'function') Ripple_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(1:0) {#if href}", ctx });
	return block;
}

function create_fragment(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block,
		create_else_block
	];

	var if_blocks = [];

	function select_block_type(changed, ctx) {
		if (ctx.href) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(changed, ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach_dev(if_block_anchor);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
	return block;
}

function instance($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);

  let { use = [], class: className = '', ripple = true, color = 'primary', variant = 'text', dense = false, href = null, action = 'close', default: defaultAction = false } = $$props;

  let context = getContext('SMUI:button:context');

  setContext('SMUI:label:context', 'button');
  setContext('SMUI:icon:context', 'button');

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('ripple' in $$new_props) $$invalidate('ripple', ripple = $$new_props.ripple);
		if ('color' in $$new_props) $$invalidate('color', color = $$new_props.color);
		if ('variant' in $$new_props) $$invalidate('variant', variant = $$new_props.variant);
		if ('dense' in $$new_props) $$invalidate('dense', dense = $$new_props.dense);
		if ('href' in $$new_props) $$invalidate('href', href = $$new_props.href);
		if ('action' in $$new_props) $$invalidate('action', action = $$new_props.action);
		if ('default' in $$new_props) $$invalidate('defaultAction', defaultAction = $$new_props.default);
		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { use, className, ripple, color, variant, dense, href, action, defaultAction, context, dialogExcludes, props, actionProp, defaultProp };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('ripple' in $$props) $$invalidate('ripple', ripple = $$new_props.ripple);
		if ('color' in $$props) $$invalidate('color', color = $$new_props.color);
		if ('variant' in $$props) $$invalidate('variant', variant = $$new_props.variant);
		if ('dense' in $$props) $$invalidate('dense', dense = $$new_props.dense);
		if ('href' in $$props) $$invalidate('href', href = $$new_props.href);
		if ('action' in $$props) $$invalidate('action', action = $$new_props.action);
		if ('defaultAction' in $$props) $$invalidate('defaultAction', defaultAction = $$new_props.defaultAction);
		if ('context' in $$props) $$invalidate('context', context = $$new_props.context);
		if ('dialogExcludes' in $$props) $$invalidate('dialogExcludes', dialogExcludes = $$new_props.dialogExcludes);
		if ('props' in $$props) $$invalidate('props', props = $$new_props.props);
		if ('actionProp' in $$props) $$invalidate('actionProp', actionProp = $$new_props.actionProp);
		if ('defaultProp' in $$props) $$invalidate('defaultProp', defaultProp = $$new_props.defaultProp);
	};

	let dialogExcludes, props, actionProp, defaultProp;

	$$self.$$.update = ($$dirty = { context: 1, $$props: 1, dialogExcludes: 1, action: 1, defaultAction: 1 }) => {
		if ($$dirty.context) { $$invalidate('dialogExcludes', dialogExcludes = (context === 'dialog:action') ? ['action', 'default'] : []); }
		$$invalidate('props', props = exclude($$props, ['use', 'class', 'ripple', 'color', 'variant', 'dense', 'href', ...dialogExcludes]));
		if ($$dirty.context || $$dirty.action) { $$invalidate('actionProp', actionProp = (context === 'dialog:action' && action !== null) ? {'data-mdc-dialog-action': action} : {}); }
		if ($$dirty.context || $$dirty.defaultAction) { $$invalidate('defaultProp', defaultProp = (context === 'dialog:action' && defaultAction) ? {'data-mdc-dialog-button-default': ''} : {}); }
	};

	return {
		forwardEvents,
		use,
		className,
		ripple,
		color,
		variant,
		dense,
		href,
		action,
		defaultAction,
		context,
		props,
		actionProp,
		defaultProp,
		$$props: $$props = exclude_internal_props($$props),
		$$slots,
		$$scope
	};
}

class Button extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, ["use", "class", "ripple", "color", "variant", "dense", "href", "action", "default"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Button", options, id: create_fragment.name });
	}

	get use() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ripple() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ripple(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get variant() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set variant(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dense() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dense(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get href() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set href(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get action() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set action(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get default() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set default(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\@smui\button\Group.svelte generated by Svelte v3.12.1 */

const file$1 = "node_modules\\@smui\\button\\Group.svelte";

function create_fragment$1(ctx) {
	var div, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var div_levels = [
		{ class: "\n    smui-button__group\n    " + ctx.className + "\n    " + (ctx.variant === 'raised' ? 'smui-button__group--raised' : '') + "\n  " },
		exclude(ctx.$$props, ['use', 'class', 'variant'])
	];

	var div_data = {};
	for (var i = 0; i < div_levels.length; i += 1) {
		div_data = assign(div_data, div_levels[i]);
	}

	const block = {
		c: function create() {
			div = element("div");

			if (default_slot) default_slot.c();

			set_attributes(div, div_data);
			add_location(div, file$1, 0, 0, 0);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			useActions_action = useActions.call(null, div, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			set_attributes(div, get_spread_update(div_levels, [
				(changed.className || changed.variant) && { class: "\n    smui-button__group\n    " + ctx.className + "\n    " + (ctx.variant === 'raised' ? 'smui-button__group--raised' : '') + "\n  " },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'variant'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			if (default_slot) default_slot.d(detaching);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
	return block;
}

function instance$1($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);

  let { use = [], class: className = '', variant = 'text' } = $$props;

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('variant' in $$new_props) $$invalidate('variant', variant = $$new_props.variant);
		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { use, className, variant };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('variant' in $$props) $$invalidate('variant', variant = $$new_props.variant);
	};

	return {
		forwardEvents,
		use,
		className,
		variant,
		$$props,
		$$props: $$props = exclude_internal_props($$props),
		$$slots,
		$$scope
	};
}

class Group extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["use", "class", "variant"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Group", options, id: create_fragment$1.name });
	}

	get use() {
		throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get variant() {
		throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set variant(value) {
		throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\@smui\common\Label.svelte generated by Svelte v3.12.1 */

const file$2 = "node_modules\\@smui\\common\\Label.svelte";

function create_fragment$2(ctx) {
	var span, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var span_levels = [
		{ class: "\n    " + ctx.className + "\n    " + (ctx.context === 'button' ? 'mdc-button__label' : '') + "\n    " + (ctx.context === 'fab' ? 'mdc-fab__label' : '') + "\n    " + (ctx.context === 'chip' ? 'mdc-chip__text' : '') + "\n    " + (ctx.context === 'tab' ? 'mdc-tab__text-label' : '') + "\n    " + (ctx.context === 'image-list' ? 'mdc-image-list__label' : '') + "\n    " + (ctx.context === 'snackbar' ? 'mdc-snackbar__label' : '') + "\n  " },
		((ctx.context === 'snackbar') ? {role: 'status', 'aria-live': 'polite'} : {}),
		exclude(ctx.$$props, ['use', 'class'])
	];

	var span_data = {};
	for (var i = 0; i < span_levels.length; i += 1) {
		span_data = assign(span_data, span_levels[i]);
	}

	const block = {
		c: function create() {
			span = element("span");

			if (default_slot) default_slot.c();

			set_attributes(span, span_data);
			add_location(span, file$2, 0, 0, 0);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(span_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);

			if (default_slot) {
				default_slot.m(span, null);
			}

			useActions_action = useActions.call(null, span, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, span) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			set_attributes(span, get_spread_update(span_levels, [
				(changed.className || changed.context) && { class: "\n    " + ctx.className + "\n    " + (ctx.context === 'button' ? 'mdc-button__label' : '') + "\n    " + (ctx.context === 'fab' ? 'mdc-fab__label' : '') + "\n    " + (ctx.context === 'chip' ? 'mdc-chip__text' : '') + "\n    " + (ctx.context === 'tab' ? 'mdc-tab__text-label' : '') + "\n    " + (ctx.context === 'image-list' ? 'mdc-image-list__label' : '') + "\n    " + (ctx.context === 'snackbar' ? 'mdc-snackbar__label' : '') + "\n  " },
				(changed.context) && ((ctx.context === 'snackbar') ? {role: 'status', 'aria-live': 'polite'} : {}),
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(span);
			}

			if (default_slot) default_slot.d(detaching);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
	return block;
}

function instance$2($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);

  let { use = [], class: className = '' } = $$props;

  const context = getContext('SMUI:label:context');

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { use, className };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
	};

	return {
		forwardEvents,
		use,
		className,
		context,
		$$props,
		$$props: $$props = exclude_internal_props($$props),
		$$slots,
		$$scope
	};
}

class Label extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["use", "class"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Label", options, id: create_fragment$2.name });
	}

	get use() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$1 = {
    ROOT: 'mdc-form-field',
};
var strings$1 = {
    LABEL_SELECTOR: '.mdc-form-field > label',
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCFormFieldFoundation = /** @class */ (function (_super) {
    __extends(MDCFormFieldFoundation, _super);
    function MDCFormFieldFoundation(adapter) {
        var _this = _super.call(this, __assign({}, MDCFormFieldFoundation.defaultAdapter, adapter)) || this;
        _this.clickHandler_ = function () { return _this.handleClick_(); };
        return _this;
    }
    Object.defineProperty(MDCFormFieldFoundation, "cssClasses", {
        get: function () {
            return cssClasses$1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFormFieldFoundation, "strings", {
        get: function () {
            return strings$1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFormFieldFoundation, "defaultAdapter", {
        get: function () {
            return {
                activateInputRipple: function () { return undefined; },
                deactivateInputRipple: function () { return undefined; },
                deregisterInteractionHandler: function () { return undefined; },
                registerInteractionHandler: function () { return undefined; },
            };
        },
        enumerable: true,
        configurable: true
    });
    MDCFormFieldFoundation.prototype.init = function () {
        this.adapter_.registerInteractionHandler('click', this.clickHandler_);
    };
    MDCFormFieldFoundation.prototype.destroy = function () {
        this.adapter_.deregisterInteractionHandler('click', this.clickHandler_);
    };
    MDCFormFieldFoundation.prototype.handleClick_ = function () {
        var _this = this;
        this.adapter_.activateInputRipple();
        requestAnimationFrame(function () { return _this.adapter_.deactivateInputRipple(); });
    };
    return MDCFormFieldFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCFormField = /** @class */ (function (_super) {
    __extends(MDCFormField, _super);
    function MDCFormField() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCFormField.attachTo = function (root) {
        return new MDCFormField(root);
    };
    Object.defineProperty(MDCFormField.prototype, "input", {
        get: function () {
            return this.input_;
        },
        set: function (input) {
            this.input_ = input;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFormField.prototype, "label_", {
        get: function () {
            var LABEL_SELECTOR = MDCFormFieldFoundation.strings.LABEL_SELECTOR;
            return this.root_.querySelector(LABEL_SELECTOR);
        },
        enumerable: true,
        configurable: true
    });
    MDCFormField.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        var adapter = {
            activateInputRipple: function () {
                if (_this.input_ && _this.input_.ripple) {
                    _this.input_.ripple.activate();
                }
            },
            deactivateInputRipple: function () {
                if (_this.input_ && _this.input_.ripple) {
                    _this.input_.ripple.deactivate();
                }
            },
            deregisterInteractionHandler: function (evtType, handler) {
                if (_this.label_) {
                    _this.label_.removeEventListener(evtType, handler);
                }
            },
            registerInteractionHandler: function (evtType, handler) {
                if (_this.label_) {
                    _this.label_.addEventListener(evtType, handler);
                }
            },
        };
        return new MDCFormFieldFoundation(adapter);
    };
    return MDCFormField;
}(MDCComponent));
//# sourceMappingURL=component.js.map

function forwardEventsBuilder$1(component, additionalEvents = []) {
  const events = [
    'focus', 'blur',
    'fullscreenchange', 'fullscreenerror', 'scroll',
    'cut', 'copy', 'paste',
    'keydown', 'keypress', 'keyup',
    'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel',
    'drag', 'dragend', 'dragenter', 'dragstart', 'dragleave', 'dragover', 'drop',
    'touchcancel', 'touchend', 'touchmove', 'touchstart',
    'pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerleave', 'gotpointercapture', 'lostpointercapture',
    ...additionalEvents
  ];

  function forward(e) {
    bubble(component, e);
  }

  return node => {
    const destructors = [];

    for (let i = 0; i < events.length; i++) {
      destructors.push(listen(node, events[i], forward));
    }

    return {
      destroy: () => {
        for (let i = 0; i < destructors.length; i++) {
          destructors[i]();
        }
      }
    }
  };
}

function exclude$1(obj, keys) {
  let names = Object.getOwnPropertyNames(obj);
  const newObj = {};

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const cashIndex = name.indexOf('$');
    if (cashIndex !== -1 && keys.indexOf(name.substring(0, cashIndex + 1)) !== -1) {
      continue;
    }
    if (keys.indexOf(name) !== -1) {
      continue;
    }
    newObj[name] = obj[name];
  }

  return newObj;
}

function prefixFilter(obj, prefix) {
  let names = Object.getOwnPropertyNames(obj);
  const newObj = {};

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name.substring(0, prefix.length) === prefix) {
      newObj[name.substring(prefix.length)] = obj[name];
    }
  }

  return newObj;
}

function useActions$1(node, actions) {
  let objects = [];

  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const isArray = Array.isArray(actions[i]);
      const action = isArray ? actions[i][0] : actions[i];
      if (isArray && actions[i].length > 1) {
        objects.push(action(node, actions[i][1]));
      } else {
        objects.push(action(node));
      }
    }
  }

  return {
    update(actions) {
      if ((actions && actions.length || 0) != objects.length) {
        throw new Error('You must not change the length of an actions array.');
      }

      if (actions) {
        for (let i = 0; i < actions.length; i++) {
          if (objects[i] && 'update' in objects[i]) {
            const isArray = Array.isArray(actions[i]);
            if (isArray && actions[i].length > 1) {
              objects[i].update(actions[i][1]);
            } else {
              objects[i].update();
            }
          }
        }
      }
    },

    destroy() {
      for (let i = 0; i < objects.length; i++) {
        if (objects[i] && 'destroy' in objects[i]) {
          objects[i].destroy();
        }
      }
    }
  }
}

/* node_modules\@smui\form-field\FormField.svelte generated by Svelte v3.12.1 */

const file$3 = "node_modules\\@smui\\form-field\\FormField.svelte";

const get_label_slot_changes = () => ({});
const get_label_slot_context = () => ({});

function create_fragment$3(ctx) {
	var div, t, label, useActions_action, useActions_action_1, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	const label_slot_template = ctx.$$slots.label;
	const label_slot = create_slot(label_slot_template, ctx, get_label_slot_context);

	var label_levels = [
		{ for: ctx.inputId },
		exclude$1(prefixFilter(ctx.$$props, 'label$'), ['use'])
	];

	var label_data = {};
	for (var i = 0; i < label_levels.length; i += 1) {
		label_data = assign(label_data, label_levels[i]);
	}

	var div_levels = [
		{ class: "\n    mdc-form-field\n    " + ctx.className + "\n    " + (ctx.align === 'end' ? 'mdc-form-field--align-end' : '') + "\n  " },
		exclude$1(ctx.$$props, ['use', 'class', 'alignEnd', 'inputId', 'label$'])
	];

	var div_data = {};
	for (var i = 0; i < div_levels.length; i += 1) {
		div_data = assign(div_data, div_levels[i]);
	}

	const block = {
		c: function create() {
			div = element("div");

			if (default_slot) default_slot.c();
			t = space();
			label = element("label");

			if (label_slot) label_slot.c();

			set_attributes(label, label_data);
			add_location(label, file$3, 12, 2, 271);
			set_attributes(div, div_data);
			add_location(div, file$3, 0, 0, 0);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div_nodes);

			if (label_slot) label_slot.l(label_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append_dev(div, t);
			append_dev(div, label);

			if (label_slot) {
				label_slot.m(label, null);
			}

			useActions_action = useActions$1.call(null, label, ctx.label$use) || {};
			ctx.div_binding(div);
			useActions_action_1 = useActions$1.call(null, div, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			if (label_slot && label_slot.p && changed.$$scope) {
				label_slot.p(
					get_slot_changes(label_slot_template, ctx, changed, get_label_slot_changes),
					get_slot_context(label_slot_template, ctx, get_label_slot_context)
				);
			}

			set_attributes(label, get_spread_update(label_levels, [
				(changed.inputId) && { for: ctx.inputId },
				(changed.exclude || changed.prefixFilter || changed.$$props) && exclude$1(prefixFilter(ctx.$$props, 'label$'), ['use'])
			]));

			if (typeof useActions_action.update === 'function' && changed.label$use) {
				useActions_action.update.call(null, ctx.label$use);
			}

			set_attributes(div, get_spread_update(div_levels, [
				(changed.className || changed.align) && { class: "\n    mdc-form-field\n    " + ctx.className + "\n    " + (ctx.align === 'end' ? 'mdc-form-field--align-end' : '') + "\n  " },
				(changed.exclude || changed.$$props) && exclude$1(ctx.$$props, ['use', 'class', 'alignEnd', 'inputId', 'label$'])
			]));

			if (typeof useActions_action_1.update === 'function' && changed.use) {
				useActions_action_1.update.call(null, ctx.use);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			transition_in(label_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			transition_out(label_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			if (default_slot) default_slot.d(detaching);

			if (label_slot) label_slot.d(detaching);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			ctx.div_binding(null);
			if (useActions_action_1 && typeof useActions_action_1.destroy === 'function') useActions_action_1.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
	return block;
}

let counter = 0;

function instance$3($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder$1(current_component);

  let { use = [], class: className = '', align = 'start', inputId = 'SMUI-form-field-'+(counter++), label$use = [] } = $$props;

  let element;
  let formField;

  setContext('SMUI:form-field', () => formField);
  setContext('SMUI:generic:input:props', {id: inputId});

  onMount(() => {
    formField = new MDCFormField(element);
  });

  onDestroy(() => {
    formField && formField.destroy();
  });

	let { $$slots = {}, $$scope } = $$props;

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('align' in $$new_props) $$invalidate('align', align = $$new_props.align);
		if ('inputId' in $$new_props) $$invalidate('inputId', inputId = $$new_props.inputId);
		if ('label$use' in $$new_props) $$invalidate('label$use', label$use = $$new_props.label$use);
		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { counter, use, className, align, inputId, label$use, element, formField };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('align' in $$props) $$invalidate('align', align = $$new_props.align);
		if ('inputId' in $$props) $$invalidate('inputId', inputId = $$new_props.inputId);
		if ('label$use' in $$props) $$invalidate('label$use', label$use = $$new_props.label$use);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
		if ('formField' in $$props) formField = $$new_props.formField;
	};

	return {
		forwardEvents,
		use,
		className,
		align,
		inputId,
		label$use,
		element,
		$$props,
		div_binding,
		$$props: $$props = exclude_internal_props($$props),
		$$slots,
		$$scope
	};
}

class FormField extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["use", "class", "align", "inputId", "label$use"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "FormField", options, id: create_fragment$3.name });
	}

	get use() {
		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get align() {
		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set align(value) {
		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get inputId() {
		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set inputId(value) {
		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label$use() {
		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label$use(value) {
		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

// Material Design Icons v4.7.95
var mdiCloudDownload = "M17,13L12,18L7,13H10V9H14V13M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z";
var mdiCloudUpload = "M14,13V17H10V13H7L12,8L17,13M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z";
var mdiDelete = "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";
var mdiFile = "M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z";
var mdiFilePlus = "M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M11,15V12H9V15H6V17H9V20H11V17H14V15H11Z";
var mdiFolder = "M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z";
var mdiFolderDownload = "M20,6A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4C2.89,20 2,19.1 2,18V6C2,4.89 2.89,4 4,4H10L12,6H20M19.25,13H16V9H14V13H10.75L15,17.25";
var mdiFolderOpen = "M19,20H4C2.89,20 2,19.1 2,18V6C2,4.89 2.89,4 4,4H10L12,6H19A2,2 0 0,1 21,8H21L4,8V18L6.14,10H23.21L20.93,18.5C20.7,19.37 19.92,20 19,20Z";
var mdiFolderPlus = "M10,4L12,6H20A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4C2.89,20 2,19.1 2,18V6C2,4.89 2.89,4 4,4H10M15,9V12H12V14H15V17H17V14H20V12H17V9H15Z";
var mdiFolderUpload = "M20,6A2,2 0 0,1 22,8V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4H10L12,6H20M10.75,13H14V17H16V13H19.25L15,8.75";
var mdiPencil = "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var store2 = createCommonjsModule(function (module) {
(function(window, define) {
    var _ = {
        version: "2.10.0",
        areas: {},
        apis: {},

        // utilities
        inherit: function(api, o) {
            for (var p in api) {
                if (!o.hasOwnProperty(p)) {
                    Object.defineProperty(o, p, Object.getOwnPropertyDescriptor(api, p));
                }
            }
            return o;
        },
        stringify: function(d) {
            return d === undefined || typeof d === "function" ? d+'' : JSON.stringify(d);
        },
        parse: function(s) {
            // if it doesn't parse, return as is
            try{ return JSON.parse(s); }catch(e){ return s; }
        },

        // extension hooks
        fn: function(name, fn) {
            _.storeAPI[name] = fn;
            for (var api in _.apis) {
                _.apis[api][name] = fn;
            }
        },
        get: function(area, key){ return area.getItem(key); },
        set: function(area, key, string){ area.setItem(key, string); },
        remove: function(area, key){ area.removeItem(key); },
        key: function(area, i){ return area.key(i); },
        length: function(area){ return area.length; },
        clear: function(area){ area.clear(); },

        // core functions
        Store: function(id, area, namespace) {
            var store = _.inherit(_.storeAPI, function(key, data, overwrite) {
                if (arguments.length === 0){ return store.getAll(); }
                if (typeof data === "function"){ return store.transact(key, data, overwrite); }// fn=data, alt=overwrite
                if (data !== undefined){ return store.set(key, data, overwrite); }
                if (typeof key === "string" || typeof key === "number"){ return store.get(key); }
                if (typeof key === "function"){ return store.each(key); }
                if (!key){ return store.clear(); }
                return store.setAll(key, data);// overwrite=data, data=key
            });
            store._id = id;
            try {
                var testKey = '_-bad-_';
                area.setItem(testKey, 'wolf');
                store._area = area;
                area.removeItem(testKey);
            } catch (e) {}
            if (!store._area) {
                store._area = _.storage('fake');
            }
            store._ns = namespace || '';
            if (!_.areas[id]) {
                _.areas[id] = store._area;
            }
            if (!_.apis[store._ns+store._id]) {
                _.apis[store._ns+store._id] = store;
            }
            return store;
        },
        storeAPI: {
            // admin functions
            area: function(id, area) {
                var store = this[id];
                if (!store || !store.area) {
                    store = _.Store(id, area, this._ns);//new area-specific api in this namespace
                    if (!this[id]){ this[id] = store; }
                }
                return store;
            },
            namespace: function(namespace, singleArea) {
                if (!namespace){
                    return this._ns ? this._ns.substring(0,this._ns.length-1) : '';
                }
                var ns = namespace, store = this[ns];
                if (!store || !store.namespace) {
                    store = _.Store(this._id, this._area, this._ns+ns+'.');//new namespaced api
                    if (!this[ns]){ this[ns] = store; }
                    if (!singleArea) {
                        for (var name in _.areas) {
                            store.area(name, _.areas[name]);
                        }
                    }
                }
                return store;
            },
            isFake: function(){ return this._area.name === 'fake'; },
            toString: function() {
                return 'store'+(this._ns?'.'+this.namespace():'')+'['+this._id+']';
            },

            // storage functions
            has: function(key) {
                if (this._area.has) {
                    return this._area.has(this._in(key));//extension hook
                }
                return !!(this._in(key) in this._area);
            },
            size: function(){ return this.keys().length; },
            each: function(fn, fill) {// fill is used by keys(fillList) and getAll(fillList))
                for (var i=0, m=_.length(this._area); i<m; i++) {
                    var key = this._out(_.key(this._area, i));
                    if (key !== undefined) {
                        if (fn.call(this, key, this.get(key), fill) === false) {
                            break;
                        }
                    }
                    if (m > _.length(this._area)) { m--; i--; }// in case of removeItem
                }
                return fill || this;
            },
            keys: function(fillList) {
                return this.each(function(k, v, list){ list.push(k); }, fillList || []);
            },
            get: function(key, alt) {
                var s = _.get(this._area, this._in(key));
                return s !== null ? _.parse(s) : alt || s;// support alt for easy default mgmt
            },
            getAll: function(fillObj) {
                return this.each(function(k, v, all){ all[k] = v; }, fillObj || {});
            },
            transact: function(key, fn, alt) {
                var val = this.get(key, alt),
                    ret = fn(val);
                this.set(key, ret === undefined ? val : ret);
                return this;
            },
            set: function(key, data, overwrite) {
                var d = this.get(key);
                if (d != null && overwrite === false) {
                    return data;
                }
                return _.set(this._area, this._in(key), _.stringify(data), overwrite) || d;
            },
            setAll: function(data, overwrite) {
                var changed, val;
                for (var key in data) {
                    val = data[key];
                    if (this.set(key, val, overwrite) !== val) {
                        changed = true;
                    }
                }
                return changed;
            },
            add: function(key, data) {
                var d = this.get(key);
                if (d instanceof Array) {
                    data = d.concat(data);
                } else if (d !== null) {
                    var type = typeof d;
                    if (type === typeof data && type === 'object') {
                        for (var k in data) {
                            d[k] = data[k];
                        }
                        data = d;
                    } else {
                        data = d + data;
                    }
                }
                _.set(this._area, this._in(key), _.stringify(data));
                return data;
            },
            remove: function(key, alt) {
                var d = this.get(key, alt);
                _.remove(this._area, this._in(key));
                return d;
            },
            clear: function() {
                if (!this._ns) {
                    _.clear(this._area);
                } else {
                    this.each(function(k){ _.remove(this._area, this._in(k)); }, 1);
                }
                return this;
            },
            clearAll: function() {
                var area = this._area;
                for (var id in _.areas) {
                    if (_.areas.hasOwnProperty(id)) {
                        this._area = _.areas[id];
                        this.clear();
                    }
                }
                this._area = area;
                return this;
            },

            // internal use functions
            _in: function(k) {
                if (typeof k !== "string"){ k = _.stringify(k); }
                return this._ns ? this._ns + k : k;
            },
            _out: function(k) {
                return this._ns ?
                    k && k.indexOf(this._ns) === 0 ?
                        k.substring(this._ns.length) :
                        undefined : // so each() knows to skip it
                    k;
            }
        },// end _.storeAPI
        storage: function(name) {
            return _.inherit(_.storageAPI, { items: {}, name: name });
        },
        storageAPI: {
            length: 0,
            has: function(k){ return this.items.hasOwnProperty(k); },
            key: function(i) {
                var c = 0;
                for (var k in this.items){
                    if (this.has(k) && i === c++) {
                        return k;
                    }
                }
            },
            setItem: function(k, v) {
                if (!this.has(k)) {
                    this.length++;
                }
                this.items[k] = v;
            },
            removeItem: function(k) {
                if (this.has(k)) {
                    delete this.items[k];
                    this.length--;
                }
            },
            getItem: function(k){ return this.has(k) ? this.items[k] : null; },
            clear: function(){ for (var k in this.items){ this.removeItem(k); } }
        }// end _.storageAPI
    };

    var store =
        // safely set this up (throws error in IE10/32bit mode for local files)
        _.Store("local", (function(){try{ return localStorage; }catch(e){}})());
    store.local = store;// for completeness
    store._ = _;// for extenders and debuggers...
    // safely setup store.session (throws exception in FF for file:/// urls)
    store.area("session", (function(){try{ return sessionStorage; }catch(e){}})());
    store.area("page", _.storage("page"));

    if (typeof define === 'function' && define.amd !== undefined) {
        define('store2', [], function () {
            return store;
        });
    } else if ( module.exports) {
        module.exports = store;
    } else {
        // expose the primary store fn to the global object and save conflicts
        if (window.store){ _.conflict = window.store; }
        window.store = store;
    }

})(commonjsGlobal, commonjsGlobal && commonjsGlobal.define);
});

var jszip_min = createCommonjsModule(function (module, exports) {
/*!

JSZip v3.2.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/master/LICENSE
*/

!function(t){module.exports=t();}(function(){return function s(a,o,h){function u(r,t){if(!o[r]){if(!a[r]){var e="function"==typeof commonjsRequire&&commonjsRequire;if(!t&&e)return e(r,!0);if(l)return l(r,!0);var i=new Error("Cannot find module '"+r+"'");throw i.code="MODULE_NOT_FOUND",i}var n=o[r]={exports:{}};a[r][0].call(n.exports,function(t){var e=a[r][1][t];return u(e||t)},n,n.exports,s,a,o,h);}return o[r].exports}for(var l="function"==typeof commonjsRequire&&commonjsRequire,t=0;t<h.length;t++)u(h[t]);return u}({1:[function(t,e,r){var c=t("./utils"),d=t("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(t){for(var e,r,i,n,s,a,o,h=[],u=0,l=t.length,f=l,d="string"!==c.getTypeOf(t);u<t.length;)f=l-u,i=d?(e=t[u++],r=u<l?t[u++]:0,u<l?t[u++]:0):(e=t.charCodeAt(u++),r=u<l?t.charCodeAt(u++):0,u<l?t.charCodeAt(u++):0),n=e>>2,s=(3&e)<<4|r>>4,a=1<f?(15&r)<<2|i>>6:64,o=2<f?63&i:64,h.push(p.charAt(n)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(t){var e,r,i,n,s,a,o=0,h=0,u="data:";if(t.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(t=t.replace(/[^A-Za-z0-9\+\/\=]/g,"")).length/4;if(t.charAt(t.length-1)===p.charAt(64)&&f--,t.charAt(t.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=d.uint8array?new Uint8Array(0|f):new Array(0|f);o<t.length;)e=p.indexOf(t.charAt(o++))<<2|(n=p.indexOf(t.charAt(o++)))>>4,r=(15&n)<<4|(s=p.indexOf(t.charAt(o++)))>>2,i=(3&s)<<6|(a=p.indexOf(t.charAt(o++))),l[h++]=e,64!==s&&(l[h++]=r),64!==a&&(l[h++]=i);return l};},{"./support":30,"./utils":32}],2:[function(t,e,r){var i=t("./external"),n=t("./stream/DataWorker"),s=t("./stream/DataLengthProbe"),a=t("./stream/Crc32Probe");s=t("./stream/DataLengthProbe");function o(t,e,r,i,n){this.compressedSize=t,this.uncompressedSize=e,this.crc32=r,this.compression=i,this.compressedContent=n;}o.prototype={getContentWorker:function(){var t=new n(i.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new s("data_length")),e=this;return t.on("end",function(){if(this.streamInfo.data_length!==e.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),t},getCompressedWorker:function(){return new n(i.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(t,e,r){return t.pipe(new a).pipe(new s("uncompressedSize")).pipe(e.compressWorker(r)).pipe(new s("compressedSize")).withStreamInfo("compression",e)},e.exports=o;},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(t,e,r){var i=t("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(t){return new i("STORE compression")},uncompressWorker:function(){return new i("STORE decompression")}},r.DEFLATE=t("./flate");},{"./flate":7,"./stream/GenericWorker":28}],4:[function(t,e,r){var i=t("./utils");var o=function(){for(var t,e=[],r=0;r<256;r++){t=r;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[r]=t;}return e}();e.exports=function(t,e){return void 0!==t&&t.length?"string"!==i.getTypeOf(t)?function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e[a])];return -1^t}(0|e,t,t.length,0):function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e.charCodeAt(a))];return -1^t}(0|e,t,t.length,0):0};},{"./utils":32}],5:[function(t,e,r){r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null;},{}],6:[function(t,e,r){var i=null;i="undefined"!=typeof Promise?Promise:t("lie"),e.exports={Promise:i};},{lie:37}],7:[function(t,e,r){var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,n=t("pako"),s=t("./utils"),a=t("./stream/GenericWorker"),o=i?"uint8array":"array";function h(t,e){a.call(this,"FlateWorker/"+t),this._pako=null,this._pakoAction=t,this._pakoOptions=e,this.meta={};}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(t){this.meta=t.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,t.data),!1);},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0);},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null;},h.prototype._createPako=function(){this._pako=new n[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var e=this;this._pako.onData=function(t){e.push({data:t,meta:e.meta});};},r.compressWorker=function(t){return new h("Deflate",t)},r.uncompressWorker=function(){return new h("Inflate",{})};},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(t,e,r){function A(t,e){var r,i="";for(r=0;r<e;r++)i+=String.fromCharCode(255&t),t>>>=8;return i}function i(t,e,r,i,n,s){var a,o,h=t.file,u=t.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),d=I.transformTo("string",O.utf8encode(h.name)),c=h.comment,p=I.transformTo("string",s(c)),m=I.transformTo("string",O.utf8encode(c)),_=d.length!==h.name.length,g=m.length!==c.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};e&&!r||(x.crc32=t.crc32,x.compressedSize=t.compressedSize,x.uncompressedSize=t.uncompressedSize);var S=0;e&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===n?(C=798,z|=function(t,e){var r=t;return t||(r=e?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(t){return 63&(t||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+d,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(i,4)+f+b+p}}var I=t("../utils"),n=t("../stream/GenericWorker"),O=t("../utf8"),B=t("../crc32"),R=t("../signature");function s(t,e,r,i){n.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=e,this.zipPlatform=r,this.encodeFileName=i,this.streamFiles=t,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[];}I.inherits(s,n),s.prototype.push=function(t){var e=t.meta.percent||0,r=this.entriesCount,i=this._sources.length;this.accumulate?this.contentBuffer.push(t):(this.bytesWritten+=t.data.length,n.prototype.push.call(this,{data:t.data,meta:{currentFile:this.currentFile,percent:r?(e+100*(r-i-1))/r:100}}));},s.prototype.openedSource=function(t){this.currentSourceOffset=this.bytesWritten,this.currentFile=t.file.name;var e=this.streamFiles&&!t.file.dir;if(e){var r=i(t,e,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}});}else this.accumulate=!0;},s.prototype.closedSource=function(t){this.accumulate=!1;var e=this.streamFiles&&!t.file.dir,r=i(t,e,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),e)this.push({data:function(t){return R.DATA_DESCRIPTOR+A(t.crc32,4)+A(t.compressedSize,4)+A(t.uncompressedSize,4)}(t),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null;},s.prototype.flush=function(){for(var t=this.bytesWritten,e=0;e<this.dirRecords.length;e++)this.push({data:this.dirRecords[e],meta:{percent:100}});var r=this.bytesWritten-t,i=function(t,e,r,i,n){var s=I.transformTo("string",n(i));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(t,2)+A(t,2)+A(e,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,t,this.zipComment,this.encodeFileName);this.push({data:i,meta:{percent:100}});},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume();},s.prototype.registerPrevious=function(t){this._sources.push(t);var e=this;return t.on("data",function(t){e.processChunk(t);}),t.on("end",function(){e.closedSource(e.previous.streamInfo),e._sources.length?e.prepareNextSource():e.end();}),t.on("error",function(t){e.error(t);}),this},s.prototype.resume=function(){return !!n.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},s.prototype.error=function(t){var e=this._sources;if(!n.prototype.error.call(this,t))return !1;for(var r=0;r<e.length;r++)try{e[r].error(t);}catch(t){}return !0},s.prototype.lock=function(){n.prototype.lock.call(this);for(var t=this._sources,e=0;e<t.length;e++)t[e].lock();},e.exports=s;},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(t,e,r){var u=t("../compressions"),i=t("./ZipFileWorker");r.generateWorker=function(t,a,e){var o=new i(a.streamFiles,e,a.platform,a.encodeFileName),h=0;try{t.forEach(function(t,e){h++;var r=function(t,e){var r=t||e,i=u[r];if(!i)throw new Error(r+" is not a valid compression method !");return i}(e.options.compression,a.compression),i=e.options.compressionOptions||a.compressionOptions||{},n=e.dir,s=e.date;e._compressWorker(r,i).withStreamInfo("file",{name:t,dir:n,date:s,comment:e.comment||"",unixPermissions:e.unixPermissions,dosPermissions:e.dosPermissions}).pipe(o);}),o.entriesCount=h;}catch(t){o.error(t);}return o};},{"../compressions":3,"./ZipFileWorker":8}],10:[function(t,e,r){function i(){if(!(this instanceof i))return new i;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files={},this.comment=null,this.root="",this.clone=function(){var t=new i;for(var e in this)"function"!=typeof this[e]&&(t[e]=this[e]);return t};}(i.prototype=t("./object")).loadAsync=t("./load"),i.support=t("./support"),i.defaults=t("./defaults"),i.version="3.2.0",i.loadAsync=function(t,e){return (new i).loadAsync(t,e)},i.external=t("./external"),e.exports=i;},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(t,e,r){var i=t("./utils"),n=t("./external"),o=t("./utf8"),h=(i=t("./utils"),t("./zipEntries")),s=t("./stream/Crc32Probe"),u=t("./nodejsUtils");function l(i){return new n.Promise(function(t,e){var r=i.decompressed.getContentWorker().pipe(new s);r.on("error",function(t){e(t);}).on("end",function(){r.streamInfo.crc32!==i.decompressed.crc32?e(new Error("Corrupted zip : CRC32 mismatch")):t();}).resume();})}e.exports=function(t,s){var a=this;return s=i.extend(s||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:o.utf8decode}),u.isNode&&u.isStream(t)?n.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):i.prepareContent("the loaded zip file",t,!0,s.optimizedBinaryString,s.base64).then(function(t){var e=new h(s);return e.load(t),e}).then(function(t){var e=[n.Promise.resolve(t)],r=t.files;if(s.checkCRC32)for(var i=0;i<r.length;i++)e.push(l(r[i]));return n.Promise.all(e)}).then(function(t){for(var e=t.shift(),r=e.files,i=0;i<r.length;i++){var n=r[i];a.file(n.fileNameStr,n.decompressed,{binary:!0,optimizedBinaryString:!0,date:n.date,dir:n.dir,comment:n.fileCommentStr.length?n.fileCommentStr:null,unixPermissions:n.unixPermissions,dosPermissions:n.dosPermissions,createFolders:s.createFolders});}return e.zipComment.length&&(a.comment=e.zipComment),a})};},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(t,e,r){var i=t("../utils"),n=t("../stream/GenericWorker");function s(t,e){n.call(this,"Nodejs stream input adapter for "+t),this._upstreamEnded=!1,this._bindStream(e);}i.inherits(s,n),s.prototype._bindStream=function(t){var e=this;(this._stream=t).pause(),t.on("data",function(t){e.push({data:t,meta:{percent:0}});}).on("error",function(t){e.isPaused?this.generatedError=t:e.error(t);}).on("end",function(){e.isPaused?e._upstreamEnded=!0:e.end();});},s.prototype.pause=function(){return !!n.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return !!n.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},e.exports=s;},{"../stream/GenericWorker":28,"../utils":32}],13:[function(t,e,r){var n=t("readable-stream").Readable;function i(t,e,r){n.call(this,e),this._helper=t;var i=this;t.on("data",function(t,e){i.push(t)||i._helper.pause(),r&&r(e);}).on("error",function(t){i.emit("error",t);}).on("end",function(){i.push(null);});}t("../utils").inherits(i,n),i.prototype._read=function(){this._helper.resume();},e.exports=i;},{"../utils":32,"readable-stream":16}],14:[function(t,e,r){e.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(t,e){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(t,e);if("number"==typeof t)throw new Error('The "data" argument must not be a number');return new Buffer(t,e)},allocBuffer:function(t){if(Buffer.alloc)return Buffer.alloc(t);var e=new Buffer(t);return e.fill(0),e},isBuffer:function(t){return Buffer.isBuffer(t)},isStream:function(t){return t&&"function"==typeof t.on&&"function"==typeof t.pause&&"function"==typeof t.resume}};},{}],15:[function(t,e,r){function s(t,e,r){var i,n=u.getTypeOf(e),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(t=g(t)),s.createFolders&&(i=_(t))&&b.call(this,i,!0);var a="string"===n&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(e instanceof d&&0===e.uncompressedSize||s.dir||!e||0===e.length)&&(s.base64=!1,s.binary=!0,e="",s.compression="STORE",n="string");var o=null;o=e instanceof d||e instanceof l?e:p.isNode&&p.isStream(e)?new m(t,e):u.prepareContent(t,e,s.binary,s.optimizedBinaryString,s.base64);var h=new c(t,o,s);this.files[t]=h;}var n=t("./utf8"),u=t("./utils"),l=t("./stream/GenericWorker"),a=t("./stream/StreamHelper"),f=t("./defaults"),d=t("./compressedObject"),c=t("./zipObject"),o=t("./generate"),p=t("./nodejsUtils"),m=t("./nodejs/NodejsStreamInputAdapter"),_=function(t){"/"===t.slice(-1)&&(t=t.substring(0,t.length-1));var e=t.lastIndexOf("/");return 0<e?t.substring(0,e):""},g=function(t){return "/"!==t.slice(-1)&&(t+="/"),t},b=function(t,e){return e=void 0!==e?e:f.createFolders,t=g(t),this.files[t]||s.call(this,t,null,{dir:!0,createFolders:e}),this.files[t]};function h(t){return "[object RegExp]"===Object.prototype.toString.call(t)}var i={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(t){var e,r,i;for(e in this.files)this.files.hasOwnProperty(e)&&(i=this.files[e],(r=e.slice(this.root.length,e.length))&&e.slice(0,this.root.length)===this.root&&t(r,i));},filter:function(r){var i=[];return this.forEach(function(t,e){r(t,e)&&i.push(e);}),i},file:function(t,e,r){if(1!==arguments.length)return t=this.root+t,s.call(this,t,e,r),this;if(h(t)){var i=t;return this.filter(function(t,e){return !e.dir&&i.test(t)})}var n=this.files[this.root+t];return n&&!n.dir?n:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(t,e){return e.dir&&r.test(t)});var t=this.root+r,e=b.call(this,t),i=this.clone();return i.root=e.name,i},remove:function(r){r=this.root+r;var t=this.files[r];if(t||("/"!==r.slice(-1)&&(r+="/"),t=this.files[r]),t&&!t.dir)delete this.files[r];else for(var e=this.filter(function(t,e){return e.name.slice(0,r.length)===r}),i=0;i<e.length;i++)delete this.files[e[i].name];return this},generate:function(t){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(t){var e,r={};try{if((r=u.extend(t||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:n.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var i=r.comment||this.comment||"";e=o.generateWorker(this,r,i);}catch(t){(e=new l("error")).error(t);}return new a(e,r.type||"string",r.mimeType)},generateAsync:function(t,e){return this.generateInternalStream(t).accumulate(e)},generateNodeStream:function(t,e){return (t=t||{}).type||(t.type="nodebuffer"),this.generateInternalStream(t).toNodejsStream(e)}};e.exports=i;},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(t,e,r){e.exports=t("stream");},{stream:void 0}],17:[function(t,e,r){var i=t("./DataReader");function n(t){i.call(this,t);for(var e=0;e<this.data.length;e++)t[e]=255&t[e];}t("../utils").inherits(n,i),n.prototype.byteAt=function(t){return this.data[this.zero+t]},n.prototype.lastIndexOfSignature=function(t){for(var e=t.charCodeAt(0),r=t.charCodeAt(1),i=t.charCodeAt(2),n=t.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===e&&this.data[s+1]===r&&this.data[s+2]===i&&this.data[s+3]===n)return s-this.zero;return -1},n.prototype.readAndCheckSignature=function(t){var e=t.charCodeAt(0),r=t.charCodeAt(1),i=t.charCodeAt(2),n=t.charCodeAt(3),s=this.readData(4);return e===s[0]&&r===s[1]&&i===s[2]&&n===s[3]},n.prototype.readData=function(t){if(this.checkOffset(t),0===t)return [];var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n;},{"../utils":32,"./DataReader":18}],18:[function(t,e,r){var i=t("../utils");function n(t){this.data=t,this.length=t.length,this.index=0,this.zero=0;}n.prototype={checkOffset:function(t){this.checkIndex(this.index+t);},checkIndex:function(t){if(this.length<this.zero+t||t<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+t+"). Corrupted zip ?")},setIndex:function(t){this.checkIndex(t),this.index=t;},skip:function(t){this.setIndex(this.index+t);},byteAt:function(t){},readInt:function(t){var e,r=0;for(this.checkOffset(t),e=this.index+t-1;e>=this.index;e--)r=(r<<8)+this.byteAt(e);return this.index+=t,r},readString:function(t){return i.transformTo("string",this.readData(t))},readData:function(t){},lastIndexOfSignature:function(t){},readAndCheckSignature:function(t){},readDate:function(){var t=this.readInt(4);return new Date(Date.UTC(1980+(t>>25&127),(t>>21&15)-1,t>>16&31,t>>11&31,t>>5&63,(31&t)<<1))}},e.exports=n;},{"../utils":32}],19:[function(t,e,r){var i=t("./Uint8ArrayReader");function n(t){i.call(this,t);}t("../utils").inherits(n,i),n.prototype.readData=function(t){this.checkOffset(t);var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n;},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(t,e,r){var i=t("./DataReader");function n(t){i.call(this,t);}t("../utils").inherits(n,i),n.prototype.byteAt=function(t){return this.data.charCodeAt(this.zero+t)},n.prototype.lastIndexOfSignature=function(t){return this.data.lastIndexOf(t)-this.zero},n.prototype.readAndCheckSignature=function(t){return t===this.readData(4)},n.prototype.readData=function(t){this.checkOffset(t);var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n;},{"../utils":32,"./DataReader":18}],21:[function(t,e,r){var i=t("./ArrayReader");function n(t){i.call(this,t);}t("../utils").inherits(n,i),n.prototype.readData=function(t){if(this.checkOffset(t),0===t)return new Uint8Array(0);var e=this.data.subarray(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n;},{"../utils":32,"./ArrayReader":17}],22:[function(t,e,r){var i=t("../utils"),n=t("../support"),s=t("./ArrayReader"),a=t("./StringReader"),o=t("./NodeBufferReader"),h=t("./Uint8ArrayReader");e.exports=function(t){var e=i.getTypeOf(t);return i.checkSupport(e),"string"!==e||n.uint8array?"nodebuffer"===e?new o(t):n.uint8array?new h(i.transformTo("uint8array",t)):new s(i.transformTo("array",t)):new a(t)};},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(t,e,r){r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b";},{}],24:[function(t,e,r){var i=t("./GenericWorker"),n=t("../utils");function s(t){i.call(this,"ConvertWorker to "+t),this.destType=t;}n.inherits(s,i),s.prototype.processChunk=function(t){this.push({data:n.transformTo(this.destType,t.data),meta:t.meta});},e.exports=s;},{"../utils":32,"./GenericWorker":28}],25:[function(t,e,r){var i=t("./GenericWorker"),n=t("../crc32");function s(){i.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0);}t("../utils").inherits(s,i),s.prototype.processChunk=function(t){this.streamInfo.crc32=n(t.data,this.streamInfo.crc32||0),this.push(t);},e.exports=s;},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(t,e,r){var i=t("../utils"),n=t("./GenericWorker");function s(t){n.call(this,"DataLengthProbe for "+t),this.propName=t,this.withStreamInfo(t,0);}i.inherits(s,n),s.prototype.processChunk=function(t){if(t){var e=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=e+t.data.length;}n.prototype.processChunk.call(this,t);},e.exports=s;},{"../utils":32,"./GenericWorker":28}],27:[function(t,e,r){var i=t("../utils"),n=t("./GenericWorker");function s(t){n.call(this,"DataWorker");var e=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,t.then(function(t){e.dataIsReady=!0,e.data=t,e.max=t&&t.length||0,e.type=i.getTypeOf(t),e.isPaused||e._tickAndRepeat();},function(t){e.error(t);});}i.inherits(s,n),s.prototype.cleanUp=function(){n.prototype.cleanUp.call(this),this.data=null;},s.prototype.resume=function(){return !!n.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,i.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(i.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0));},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return !1;var t=null,e=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":t=this.data.substring(this.index,e);break;case"uint8array":t=this.data.subarray(this.index,e);break;case"array":case"nodebuffer":t=this.data.slice(this.index,e);}return this.index=e,this.push({data:t,meta:{percent:this.max?this.index/this.max*100:0}})},e.exports=s;},{"../utils":32,"./GenericWorker":28}],28:[function(t,e,r){function i(t){this.name=t||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null;}i.prototype={push:function(t){this.emit("data",t);},end:function(){if(this.isFinished)return !1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0;}catch(t){this.emit("error",t);}return !0},error:function(t){return !this.isFinished&&(this.isPaused?this.generatedError=t:(this.isFinished=!0,this.emit("error",t),this.previous&&this.previous.error(t),this.cleanUp()),!0)},on:function(t,e){return this._listeners[t].push(e),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[];},emit:function(t,e){if(this._listeners[t])for(var r=0;r<this._listeners[t].length;r++)this._listeners[t][r].call(this,e);},pipe:function(t){return t.registerPrevious(this)},registerPrevious:function(t){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=t.streamInfo,this.mergeStreamInfo(),this.previous=t;var e=this;return t.on("data",function(t){e.processChunk(t);}),t.on("end",function(){e.end();}),t.on("error",function(t){e.error(t);}),this},pause:function(){return !this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return !1;var t=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),t=!0),this.previous&&this.previous.resume(),!t},flush:function(){},processChunk:function(t){this.push(t);},withStreamInfo:function(t,e){return this.extraStreamInfo[t]=e,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var t in this.extraStreamInfo)this.extraStreamInfo.hasOwnProperty(t)&&(this.streamInfo[t]=this.extraStreamInfo[t]);},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock();},toString:function(){var t="Worker "+this.name;return this.previous?this.previous+" -> "+t:t}},e.exports=i;},{}],29:[function(t,e,r){var h=t("../utils"),n=t("./ConvertWorker"),s=t("./GenericWorker"),u=t("../base64"),i=t("../support"),a=t("../external"),o=null;if(i.nodestream)try{o=t("../nodejs/NodejsStreamOutputAdapter");}catch(t){}function l(t,o){return new a.Promise(function(e,r){var i=[],n=t._internalType,s=t._outputType,a=t._mimeType;t.on("data",function(t,e){i.push(t),o&&o(e);}).on("error",function(t){i=[],r(t);}).on("end",function(){try{var t=function(t,e,r){switch(t){case"blob":return h.newBlob(h.transformTo("arraybuffer",e),r);case"base64":return u.encode(e);default:return h.transformTo(t,e)}}(s,function(t,e){var r,i=0,n=null,s=0;for(r=0;r<e.length;r++)s+=e[r].length;switch(t){case"string":return e.join("");case"array":return Array.prototype.concat.apply([],e);case"uint8array":for(n=new Uint8Array(s),r=0;r<e.length;r++)n.set(e[r],i),i+=e[r].length;return n;case"nodebuffer":return Buffer.concat(e);default:throw new Error("concat : unsupported type '"+t+"'")}}(n,i),a);e(t);}catch(t){r(t);}i=[];}).resume();})}function f(t,e,r){var i=e;switch(e){case"blob":case"arraybuffer":i="uint8array";break;case"base64":i="string";}try{this._internalType=i,this._outputType=e,this._mimeType=r,h.checkSupport(i),this._worker=t.pipe(new n(i)),t.lock();}catch(t){this._worker=new s("error"),this._worker.error(t);}}f.prototype={accumulate:function(t){return l(this,t)},on:function(t,e){var r=this;return "data"===t?this._worker.on(t,function(t){e.call(r,t.data,t.meta);}):this._worker.on(t,function(){h.delay(e,arguments,r);}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(t){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},t)}},e.exports=f;},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(t,e,r){if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var i=new ArrayBuffer(0);try{r.blob=0===new Blob([i],{type:"application/zip"}).size;}catch(t){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);n.append(i),r.blob=0===n.getBlob("application/zip").size;}catch(t){r.blob=!1;}}}try{r.nodestream=!!t("readable-stream").Readable;}catch(t){r.nodestream=!1;}},{"readable-stream":16}],31:[function(t,e,s){for(var o=t("./utils"),h=t("./support"),r=t("./nodejsUtils"),i=t("./stream/GenericWorker"),u=new Array(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;u[254]=u[254]=1;function a(){i.call(this,"utf-8 decode"),this.leftOver=null;}function l(){i.call(this,"utf-8 encode");}s.utf8encode=function(t){return h.nodebuffer?r.newBufferFrom(t,"utf-8"):function(t){var e,r,i,n,s,a=t.length,o=0;for(n=0;n<a;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),o+=r<128?1:r<2048?2:r<65536?3:4;for(e=h.uint8array?new Uint8Array(o):new Array(o),n=s=0;s<o;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),r<128?e[s++]=r:(r<2048?e[s++]=192|r>>>6:(r<65536?e[s++]=224|r>>>12:(e[s++]=240|r>>>18,e[s++]=128|r>>>12&63),e[s++]=128|r>>>6&63),e[s++]=128|63&r);return e}(t)},s.utf8decode=function(t){return h.nodebuffer?o.transformTo("nodebuffer",t).toString("utf-8"):function(t){var e,r,i,n,s=t.length,a=new Array(2*s);for(e=r=0;e<s;)if((i=t[e++])<128)a[r++]=i;else if(4<(n=u[i]))a[r++]=65533,e+=n-1;else{for(i&=2===n?31:3===n?15:7;1<n&&e<s;)i=i<<6|63&t[e++],n--;1<n?a[r++]=65533:i<65536?a[r++]=i:(i-=65536,a[r++]=55296|i>>10&1023,a[r++]=56320|1023&i);}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(t=o.transformTo(h.uint8array?"uint8array":"array",t))},o.inherits(a,i),a.prototype.processChunk=function(t){var e=o.transformTo(h.uint8array?"uint8array":"array",t.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=e;(e=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),e.set(r,this.leftOver.length);}else e=this.leftOver.concat(e);this.leftOver=null;}var i=function(t,e){var r;for((e=e||t.length)>t.length&&(e=t.length),r=e-1;0<=r&&128==(192&t[r]);)r--;return r<0?e:0===r?e:r+u[t[r]]>e?r:e}(e),n=e;i!==e.length&&(h.uint8array?(n=e.subarray(0,i),this.leftOver=e.subarray(i,e.length)):(n=e.slice(0,i),this.leftOver=e.slice(i,e.length))),this.push({data:s.utf8decode(n),meta:t.meta});},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null);},s.Utf8DecodeWorker=a,o.inherits(l,i),l.prototype.processChunk=function(t){this.push({data:s.utf8encode(t.data),meta:t.meta});},s.Utf8EncodeWorker=l;},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(t,e,a){var o=t("./support"),h=t("./base64"),r=t("./nodejsUtils"),i=t("set-immediate-shim"),u=t("./external");function n(t){return t}function l(t,e){for(var r=0;r<t.length;++r)e[r]=255&t.charCodeAt(r);return e}a.newBlob=function(e,r){a.checkSupport("blob");try{return new Blob([e],{type:r})}catch(t){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return i.append(e),i.getBlob(r)}catch(t){throw new Error("Bug : can't construct the Blob.")}}};var s={stringifyByChunk:function(t,e,r){var i=[],n=0,s=t.length;if(s<=r)return String.fromCharCode.apply(null,t);for(;n<s;)"array"===e||"nodebuffer"===e?i.push(String.fromCharCode.apply(null,t.slice(n,Math.min(n+r,s)))):i.push(String.fromCharCode.apply(null,t.subarray(n,Math.min(n+r,s)))),n+=r;return i.join("")},stringifyByChar:function(t){for(var e="",r=0;r<t.length;r++)e+=String.fromCharCode(t[r]);return e},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(t){return !1}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(t){return !1}}()}};function f(t){var e=65536,r=a.getTypeOf(t),i=!0;if("uint8array"===r?i=s.applyCanBeUsed.uint8array:"nodebuffer"===r&&(i=s.applyCanBeUsed.nodebuffer),i)for(;1<e;)try{return s.stringifyByChunk(t,r,e)}catch(t){e=Math.floor(e/2);}return s.stringifyByChar(t)}function d(t,e){for(var r=0;r<t.length;r++)e[r]=t[r];return e}a.applyFromCharCode=f;var c={};c.string={string:n,array:function(t){return l(t,new Array(t.length))},arraybuffer:function(t){return c.string.uint8array(t).buffer},uint8array:function(t){return l(t,new Uint8Array(t.length))},nodebuffer:function(t){return l(t,r.allocBuffer(t.length))}},c.array={string:f,array:n,arraybuffer:function(t){return new Uint8Array(t).buffer},uint8array:function(t){return new Uint8Array(t)},nodebuffer:function(t){return r.newBufferFrom(t)}},c.arraybuffer={string:function(t){return f(new Uint8Array(t))},array:function(t){return d(new Uint8Array(t),new Array(t.byteLength))},arraybuffer:n,uint8array:function(t){return new Uint8Array(t)},nodebuffer:function(t){return r.newBufferFrom(new Uint8Array(t))}},c.uint8array={string:f,array:function(t){return d(t,new Array(t.length))},arraybuffer:function(t){return t.buffer},uint8array:n,nodebuffer:function(t){return r.newBufferFrom(t)}},c.nodebuffer={string:f,array:function(t){return d(t,new Array(t.length))},arraybuffer:function(t){return c.nodebuffer.uint8array(t).buffer},uint8array:function(t){return d(t,new Uint8Array(t.length))},nodebuffer:n},a.transformTo=function(t,e){if(e=e||"",!t)return e;a.checkSupport(t);var r=a.getTypeOf(e);return c[r][t](e)},a.getTypeOf=function(t){return "string"==typeof t?"string":"[object Array]"===Object.prototype.toString.call(t)?"array":o.nodebuffer&&r.isBuffer(t)?"nodebuffer":o.uint8array&&t instanceof Uint8Array?"uint8array":o.arraybuffer&&t instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(t){if(!o[t.toLowerCase()])throw new Error(t+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(t){var e,r,i="";for(r=0;r<(t||"").length;r++)i+="\\x"+((e=t.charCodeAt(r))<16?"0":"")+e.toString(16).toUpperCase();return i},a.delay=function(t,e,r){i(function(){t.apply(r||null,e||[]);});},a.inherits=function(t,e){function r(){}r.prototype=e.prototype,t.prototype=new r;},a.extend=function(){var t,e,r={};for(t=0;t<arguments.length;t++)for(e in arguments[t])arguments[t].hasOwnProperty(e)&&void 0===r[e]&&(r[e]=arguments[t][e]);return r},a.prepareContent=function(r,t,i,n,s){return u.Promise.resolve(t).then(function(i){return o.blob&&(i instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(i)))&&"undefined"!=typeof FileReader?new u.Promise(function(e,r){var t=new FileReader;t.onload=function(t){e(t.target.result);},t.onerror=function(t){r(t.target.error);},t.readAsArrayBuffer(i);}):i}).then(function(t){var e=a.getTypeOf(t);return e?("arraybuffer"===e?t=a.transformTo("uint8array",t):"string"===e&&(s?t=h.decode(t):i&&!0!==n&&(t=function(t){return l(t,o.uint8array?new Uint8Array(t.length):new Array(t.length))}(t))),t):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})};},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,"set-immediate-shim":54}],33:[function(t,e,r){var i=t("./reader/readerFor"),n=t("./utils"),s=t("./signature"),a=t("./zipEntry"),o=(t("./utf8"),t("./support"));function h(t){this.files=[],this.loadOptions=t;}h.prototype={checkSignature:function(t){if(!this.reader.readAndCheckSignature(t)){this.reader.index-=4;var e=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+n.pretty(e)+", expected "+n.pretty(t)+")")}},isSignature:function(t,e){var r=this.reader.index;this.reader.setIndex(t);var i=this.reader.readString(4)===e;return this.reader.setIndex(r),i},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var t=this.reader.readData(this.zipCommentLength),e=o.uint8array?"uint8array":"array",r=n.transformTo(e,t);this.zipComment=this.loadOptions.decodeFileName(r);},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var t,e,r,i=this.zip64EndOfCentralSize-44;0<i;)t=this.reader.readInt(2),e=this.reader.readInt(4),r=this.reader.readData(e),this.zip64ExtensibleData[t]={id:t,length:e,value:r};},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var t,e;for(t=0;t<this.files.length;t++)e=this.files[t],this.reader.setIndex(e.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),e.readLocalPart(this.reader),e.handleUTF8(),e.processAttributes();},readCentralDir:function(){var t;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(t=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(t);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var t=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(t<0)throw !this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(t);var e=t;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===n.MAX_VALUE_16BITS||this.diskWithCentralDirStart===n.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===n.MAX_VALUE_16BITS||this.centralDirRecords===n.MAX_VALUE_16BITS||this.centralDirSize===n.MAX_VALUE_32BITS||this.centralDirOffset===n.MAX_VALUE_32BITS){if(this.zip64=!0,(t=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(t),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral();}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var i=e-r;if(0<i)this.isSignature(e,s.CENTRAL_FILE_HEADER)||(this.reader.zero=i);else if(i<0)throw new Error("Corrupted zip: missing "+Math.abs(i)+" bytes.")},prepareReader:function(t){this.reader=i(t);},load:function(t){this.prepareReader(t),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles();}},e.exports=h;},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utf8":31,"./utils":32,"./zipEntry":34}],34:[function(t,e,r){var i=t("./reader/readerFor"),s=t("./utils"),n=t("./compressedObject"),a=t("./crc32"),o=t("./utf8"),h=t("./compressions"),u=t("./support");function l(t,e){this.options=t,this.loadOptions=e;}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(t){var e,r;if(t.skip(22),this.fileNameLength=t.readInt(2),r=t.readInt(2),this.fileName=t.readData(this.fileNameLength),t.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(e=function(t){for(var e in h)if(h.hasOwnProperty(e)&&h[e].magic===t)return h[e];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new n(this.compressedSize,this.uncompressedSize,this.crc32,e,t.readData(this.compressedSize));},readCentralPart:function(t){this.versionMadeBy=t.readInt(2),t.skip(2),this.bitFlag=t.readInt(2),this.compressionMethod=t.readString(2),this.date=t.readDate(),this.crc32=t.readInt(4),this.compressedSize=t.readInt(4),this.uncompressedSize=t.readInt(4);var e=t.readInt(2);if(this.extraFieldsLength=t.readInt(2),this.fileCommentLength=t.readInt(2),this.diskNumberStart=t.readInt(2),this.internalFileAttributes=t.readInt(2),this.externalFileAttributes=t.readInt(4),this.localHeaderOffset=t.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");t.skip(e),this.readExtraFields(t),this.parseZIP64ExtraField(t),this.fileComment=t.readData(this.fileCommentLength);},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var t=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==t&&(this.dosPermissions=63&this.externalFileAttributes),3==t&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0);},parseZIP64ExtraField:function(t){if(this.extraFields[1]){var e=i(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4));}},readExtraFields:function(t){var e,r,i,n=t.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});t.index<n;)e=t.readInt(2),r=t.readInt(2),i=t.readData(r),this.extraFields[e]={id:e,length:r,value:i};},handleUTF8:function(){var t=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else{var e=this.findExtraFieldUnicodePath();if(null!==e)this.fileNameStr=e;else{var r=s.transformTo(t,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r);}var i=this.findExtraFieldUnicodeComment();if(null!==i)this.fileCommentStr=i;else{var n=s.transformTo(t,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(n);}}},findExtraFieldUnicodePath:function(){var t=this.extraFields[28789];if(t){var e=i(t.value);return 1!==e.readInt(1)?null:a(this.fileName)!==e.readInt(4)?null:o.utf8decode(e.readData(t.length-5))}return null},findExtraFieldUnicodeComment:function(){var t=this.extraFields[25461];if(t){var e=i(t.value);return 1!==e.readInt(1)?null:a(this.fileComment)!==e.readInt(4)?null:o.utf8decode(e.readData(t.length-5))}return null}},e.exports=l;},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(t,e,r){function i(t,e,r){this.name=t,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=e,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions};}var s=t("./stream/StreamHelper"),n=t("./stream/DataWorker"),a=t("./utf8"),o=t("./compressedObject"),h=t("./stream/GenericWorker");i.prototype={internalStream:function(t){var e=null,r="string";try{if(!t)throw new Error("No output type specified.");var i="string"===(r=t.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),e=this._decompressWorker();var n=!this._dataBinary;n&&!i&&(e=e.pipe(new a.Utf8EncodeWorker)),!n&&i&&(e=e.pipe(new a.Utf8DecodeWorker));}catch(t){(e=new h("error")).error(t);}return new s(e,r,"")},async:function(t,e){return this.internalStream(t).accumulate(e)},nodeStream:function(t,e){return this.internalStream(t||"nodebuffer").toNodejsStream(e)},_compressWorker:function(t,e){if(this._data instanceof o&&this._data.compression.magic===t.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,t,e)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new n(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)i.prototype[u[f]]=l;e.exports=i;},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(t,l,e){(function(e){var r,i,t=e.MutationObserver||e.WebKitMutationObserver;if(t){var n=0,s=new t(u),a=e.document.createTextNode("");s.observe(a,{characterData:!0}),r=function(){a.data=n=++n%2;};}else if(e.setImmediate||void 0===e.MessageChannel)r="document"in e&&"onreadystatechange"in e.document.createElement("script")?function(){var t=e.document.createElement("script");t.onreadystatechange=function(){u(),t.onreadystatechange=null,t.parentNode.removeChild(t),t=null;},e.document.documentElement.appendChild(t);}:function(){setTimeout(u,0);};else{var o=new e.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0);};}var h=[];function u(){var t,e;i=!0;for(var r=h.length;r;){for(e=h,h=[],t=-1;++t<r;)e[t]();r=h.length;}i=!1;}l.exports=function(t){1!==h.push(t)||i||r();};}).call(this,"undefined"!=typeof commonjsGlobal?commonjsGlobal:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{});},{}],37:[function(t,e,r){var n=t("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],i=["PENDING"];function o(t){if("function"!=typeof t)throw new TypeError("resolver must be a function");this.state=i,this.queue=[],this.outcome=void 0,t!==u&&c(this,t);}function h(t,e,r){this.promise=t,"function"==typeof e&&(this.onFulfilled=e,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected);}function f(e,r,i){n(function(){var t;try{t=r(i);}catch(t){return l.reject(e,t)}t===e?l.reject(e,new TypeError("Cannot resolve promise with itself")):l.resolve(e,t);});}function d(t){var e=t&&t.then;if(t&&("object"==typeof t||"function"==typeof t)&&"function"==typeof e)return function(){e.apply(t,arguments);}}function c(e,t){var r=!1;function i(t){r||(r=!0,l.reject(e,t));}function n(t){r||(r=!0,l.resolve(e,t));}var s=p(function(){t(n,i);});"error"===s.status&&i(s.value);}function p(t,e){var r={};try{r.value=t(e),r.status="success";}catch(t){r.status="error",r.value=t;}return r}(e.exports=o).prototype.finally=function(e){if("function"!=typeof e)return this;var r=this.constructor;return this.then(function(t){return r.resolve(e()).then(function(){return t})},function(t){return r.resolve(e()).then(function(){throw t})})},o.prototype.catch=function(t){return this.then(null,t)},o.prototype.then=function(t,e){if("function"!=typeof t&&this.state===a||"function"!=typeof e&&this.state===s)return this;var r=new this.constructor(u);this.state!==i?f(r,this.state===a?t:e,this.outcome):this.queue.push(new h(r,t,e));return r},h.prototype.callFulfilled=function(t){l.resolve(this.promise,t);},h.prototype.otherCallFulfilled=function(t){f(this.promise,this.onFulfilled,t);},h.prototype.callRejected=function(t){l.reject(this.promise,t);},h.prototype.otherCallRejected=function(t){f(this.promise,this.onRejected,t);},l.resolve=function(t,e){var r=p(d,e);if("error"===r.status)return l.reject(t,r.value);var i=r.value;if(i)c(t,i);else{t.state=a,t.outcome=e;for(var n=-1,s=t.queue.length;++n<s;)t.queue[n].callFulfilled(e);}return t},l.reject=function(t,e){t.state=s,t.outcome=e;for(var r=-1,i=t.queue.length;++r<i;)t.queue[r].callRejected(e);return t},o.resolve=function(t){if(t instanceof this)return t;return l.resolve(new this(u),t)},o.reject=function(t){var e=new this(u);return l.reject(e,t)},o.all=function(t){var r=this;if("[object Array]"!==Object.prototype.toString.call(t))return this.reject(new TypeError("must be an array"));var i=t.length,n=!1;if(!i)return this.resolve([]);var s=new Array(i),a=0,e=-1,o=new this(u);for(;++e<i;)h(t[e],e);return o;function h(t,e){r.resolve(t).then(function(t){s[e]=t,++a!==i||n||(n=!0,l.resolve(o,s));},function(t){n||(n=!0,l.reject(o,t));});}},o.race=function(t){var e=this;if("[object Array]"!==Object.prototype.toString.call(t))return this.reject(new TypeError("must be an array"));var r=t.length,i=!1;if(!r)return this.resolve([]);var n=-1,s=new this(u);for(;++n<r;)a=t[n],e.resolve(a).then(function(t){i||(i=!0,l.resolve(s,t));},function(t){i||(i=!0,l.reject(s,t));});var a;return s};},{immediate:36}],38:[function(t,e,r){var i={};(0, t("./lib/utils/common").assign)(i,t("./lib/deflate"),t("./lib/inflate"),t("./lib/zlib/constants")),e.exports=i;},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(t,e,r){var a=t("./zlib/deflate"),o=t("./utils/common"),h=t("./utils/strings"),n=t("./zlib/messages"),s=t("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,d=0,c=8;function p(t){if(!(this instanceof p))return new p(t);this.options=o.assign({level:f,method:c,chunkSize:16384,windowBits:15,memLevel:8,strategy:d,to:""},t||{});var e=this.options;e.raw&&0<e.windowBits?e.windowBits=-e.windowBits:e.gzip&&0<e.windowBits&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(r!==l)throw new Error(n[r]);if(e.header&&a.deflateSetHeader(this.strm,e.header),e.dictionary){var i;if(i="string"==typeof e.dictionary?h.string2buf(e.dictionary):"[object ArrayBuffer]"===u.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,(r=a.deflateSetDictionary(this.strm,i))!==l)throw new Error(n[r]);this._dict_set=!0;}}function i(t,e){var r=new p(e);if(r.push(t,!0),r.err)throw r.msg||n[r.err];return r.result}p.prototype.push=function(t,e){var r,i,n=this.strm,s=this.options.chunkSize;if(this.ended)return !1;i=e===~~e?e:!0===e?4:0,"string"==typeof t?n.input=h.string2buf(t):"[object ArrayBuffer]"===u.call(t)?n.input=new Uint8Array(t):n.input=t,n.next_in=0,n.avail_in=n.input.length;do{if(0===n.avail_out&&(n.output=new o.Buf8(s),n.next_out=0,n.avail_out=s),1!==(r=a.deflate(n,i))&&r!==l)return this.onEnd(r),!(this.ended=!0);0!==n.avail_out&&(0!==n.avail_in||4!==i&&2!==i)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(n.output,n.next_out))):this.onData(o.shrinkBuf(n.output,n.next_out)));}while((0<n.avail_in||0===n.avail_out)&&1!==r);return 4===i?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===l):2!==i||(this.onEnd(l),!(n.avail_out=0))},p.prototype.onData=function(t){this.chunks.push(t);},p.prototype.onEnd=function(t){t===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg;},r.Deflate=p,r.deflate=i,r.deflateRaw=function(t,e){return (e=e||{}).raw=!0,i(t,e)},r.gzip=function(t,e){return (e=e||{}).gzip=!0,i(t,e)};},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(t,e,r){var d=t("./zlib/inflate"),c=t("./utils/common"),p=t("./utils/strings"),m=t("./zlib/constants"),i=t("./zlib/messages"),n=t("./zlib/zstream"),s=t("./zlib/gzheader"),_=Object.prototype.toString;function a(t){if(!(this instanceof a))return new a(t);this.options=c.assign({chunkSize:16384,windowBits:0,to:""},t||{});var e=this.options;e.raw&&0<=e.windowBits&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(0<=e.windowBits&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),15<e.windowBits&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new n,this.strm.avail_out=0;var r=d.inflateInit2(this.strm,e.windowBits);if(r!==m.Z_OK)throw new Error(i[r]);this.header=new s,d.inflateGetHeader(this.strm,this.header);}function o(t,e){var r=new a(e);if(r.push(t,!0),r.err)throw r.msg||i[r.err];return r.result}a.prototype.push=function(t,e){var r,i,n,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=!1;if(this.ended)return !1;i=e===~~e?e:!0===e?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof t?h.input=p.binstring2buf(t):"[object ArrayBuffer]"===_.call(t)?h.input=new Uint8Array(t):h.input=t,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new c.Buf8(u),h.next_out=0,h.avail_out=u),(r=d.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=d.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&!0===f&&(r=m.Z_OK,f=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||i!==m.Z_FINISH&&i!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(n=p.utf8border(h.output,h.next_out),s=h.next_out-n,a=p.buf2string(h.output,n),h.next_out=s,h.avail_out=u-s,s&&c.arraySet(h.output,h.output,n,s,0),this.onData(a)):this.onData(c.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=!0);}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(i=m.Z_FINISH),i===m.Z_FINISH?(r=d.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):i!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(t){this.chunks.push(t);},a.prototype.onEnd=function(t){t===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=c.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg;},r.Inflate=a,r.inflate=o,r.inflateRaw=function(t,e){return (e=e||{}).raw=!0,o(t,e)},r.ungzip=o;},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(t,e,r){var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(t){for(var e=Array.prototype.slice.call(arguments,1);e.length;){var r=e.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var i in r)r.hasOwnProperty(i)&&(t[i]=r[i]);}}return t},r.shrinkBuf=function(t,e){return t.length===e?t:t.subarray?t.subarray(0,e):(t.length=e,t)};var n={arraySet:function(t,e,r,i,n){if(e.subarray&&t.subarray)t.set(e.subarray(r,r+i),n);else for(var s=0;s<i;s++)t[n+s]=e[r+s];},flattenChunks:function(t){var e,r,i,n,s,a;for(e=i=0,r=t.length;e<r;e++)i+=t[e].length;for(a=new Uint8Array(i),e=n=0,r=t.length;e<r;e++)s=t[e],a.set(s,n),n+=s.length;return a}},s={arraySet:function(t,e,r,i,n){for(var s=0;s<i;s++)t[n+s]=e[r+s];},flattenChunks:function(t){return [].concat.apply([],t)}};r.setTyped=function(t){t?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,n)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s));},r.setTyped(i);},{}],42:[function(t,e,r){var h=t("./common"),n=!0,s=!0;try{String.fromCharCode.apply(null,[0]);}catch(t){n=!1;}try{String.fromCharCode.apply(null,new Uint8Array(1));}catch(t){s=!1;}for(var u=new h.Buf8(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;function l(t,e){if(e<65537&&(t.subarray&&s||!t.subarray&&n))return String.fromCharCode.apply(null,h.shrinkBuf(t,e));for(var r="",i=0;i<e;i++)r+=String.fromCharCode(t[i]);return r}u[254]=u[254]=1,r.string2buf=function(t){var e,r,i,n,s,a=t.length,o=0;for(n=0;n<a;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),o+=r<128?1:r<2048?2:r<65536?3:4;for(e=new h.Buf8(o),n=s=0;s<o;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),r<128?e[s++]=r:(r<2048?e[s++]=192|r>>>6:(r<65536?e[s++]=224|r>>>12:(e[s++]=240|r>>>18,e[s++]=128|r>>>12&63),e[s++]=128|r>>>6&63),e[s++]=128|63&r);return e},r.buf2binstring=function(t){return l(t,t.length)},r.binstring2buf=function(t){for(var e=new h.Buf8(t.length),r=0,i=e.length;r<i;r++)e[r]=t.charCodeAt(r);return e},r.buf2string=function(t,e){var r,i,n,s,a=e||t.length,o=new Array(2*a);for(r=i=0;r<a;)if((n=t[r++])<128)o[i++]=n;else if(4<(s=u[n]))o[i++]=65533,r+=s-1;else{for(n&=2===s?31:3===s?15:7;1<s&&r<a;)n=n<<6|63&t[r++],s--;1<s?o[i++]=65533:n<65536?o[i++]=n:(n-=65536,o[i++]=55296|n>>10&1023,o[i++]=56320|1023&n);}return l(o,i)},r.utf8border=function(t,e){var r;for((e=e||t.length)>t.length&&(e=t.length),r=e-1;0<=r&&128==(192&t[r]);)r--;return r<0?e:0===r?e:r+u[t[r]]>e?r:e};},{"./common":41}],43:[function(t,e,r){e.exports=function(t,e,r,i){for(var n=65535&t|0,s=t>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(n=n+e[i++]|0)|0,--a;);n%=65521,s%=65521;}return n|s<<16|0};},{}],44:[function(t,e,r){e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};},{}],45:[function(t,e,r){var o=function(){for(var t,e=[],r=0;r<256;r++){t=r;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[r]=t;}return e}();e.exports=function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e[a])];return -1^t};},{}],46:[function(t,e,r){var h,d=t("../utils/common"),u=t("./trees"),c=t("./adler32"),p=t("./crc32"),i=t("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,n=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(t,e){return t.msg=i[e],e}function T(t){return (t<<1)-(4<t?9:0)}function D(t){for(var e=t.length;0<=--e;)t[e]=0;}function F(t){var e=t.state,r=e.pending;r>t.avail_out&&(r=t.avail_out),0!==r&&(d.arraySet(t.output,e.pending_buf,e.pending_out,r,t.next_out),t.next_out+=r,e.pending_out+=r,t.total_out+=r,t.avail_out-=r,e.pending-=r,0===e.pending&&(e.pending_out=0));}function N(t,e){u._tr_flush_block(t,0<=t.block_start?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,F(t.strm);}function U(t,e){t.pending_buf[t.pending++]=e;}function P(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e;}function L(t,e){var r,i,n=t.max_chain_length,s=t.strstart,a=t.prev_length,o=t.nice_match,h=t.strstart>t.w_size-z?t.strstart-(t.w_size-z):0,u=t.window,l=t.w_mask,f=t.prev,d=t.strstart+S,c=u[s+a-1],p=u[s+a];t.prev_length>=t.good_match&&(n>>=2),o>t.lookahead&&(o=t.lookahead);do{if(u[(r=e)+a]===p&&u[r+a-1]===c&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<d);if(i=S-(d-s),s=d-S,a<i){if(t.match_start=e,o<=(a=i))break;c=u[s+a-1],p=u[s+a];}}}while((e=f[e&l])>h&&0!=--n);return a<=t.lookahead?a:t.lookahead}function j(t){var e,r,i,n,s,a,o,h,u,l,f=t.w_size;do{if(n=t.window_size-t.lookahead-t.strstart,t.strstart>=f+(f-z)){for(d.arraySet(t.window,t.window,f,f,0),t.match_start-=f,t.strstart-=f,t.block_start-=f,e=r=t.hash_size;i=t.head[--e],t.head[e]=f<=i?i-f:0,--r;);for(e=r=f;i=t.prev[--e],t.prev[e]=f<=i?i-f:0,--r;);n+=f;}if(0===t.strm.avail_in)break;if(a=t.strm,o=t.window,h=t.strstart+t.lookahead,u=n,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,d.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=c(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),t.lookahead+=r,t.lookahead+t.insert>=x)for(s=t.strstart-t.insert,t.ins_h=t.window[s],t.ins_h=(t.ins_h<<t.hash_shift^t.window[s+1])&t.hash_mask;t.insert&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[s+x-1])&t.hash_mask,t.prev[s&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=s,s++,t.insert--,!(t.lookahead+t.insert<x)););}while(t.lookahead<z&&0!==t.strm.avail_in)}function Z(t,e){for(var r,i;;){if(t.lookahead<z){if(j(t),t.lookahead<z&&e===l)return A;if(0===t.lookahead)break}if(r=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==r&&t.strstart-r<=t.w_size-z&&(t.match_length=L(t,r)),t.match_length>=x)if(i=u._tr_tally(t,t.strstart-t.match_start,t.match_length-x),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=x){for(t.match_length--;t.strstart++,t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart,0!=--t.match_length;);t.strstart++;}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+1])&t.hash_mask;else i=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(i&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}function W(t,e){for(var r,i,n;;){if(t.lookahead<z){if(j(t),t.lookahead<z&&e===l)return A;if(0===t.lookahead)break}if(r=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=x-1,0!==r&&t.prev_length<t.max_lazy_match&&t.strstart-r<=t.w_size-z&&(t.match_length=L(t,r),t.match_length<=5&&(1===t.strategy||t.match_length===x&&4096<t.strstart-t.match_start)&&(t.match_length=x-1)),t.prev_length>=x&&t.match_length<=t.prev_length){for(n=t.strstart+t.lookahead-x,i=u._tr_tally(t,t.strstart-1-t.prev_match,t.prev_length-x),t.lookahead-=t.prev_length-1,t.prev_length-=2;++t.strstart<=n&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!=--t.prev_length;);if(t.match_available=0,t.match_length=x-1,t.strstart++,i&&(N(t,!1),0===t.strm.avail_out))return A}else if(t.match_available){if((i=u._tr_tally(t,0,t.window[t.strstart-1]))&&N(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return A}else t.match_available=1,t.strstart++,t.lookahead--;}return t.match_available&&(i=u._tr_tally(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}function M(t,e,r,i,n){this.good_length=t,this.max_lazy=e,this.nice_length=r,this.max_chain=i,this.func=n;}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new d.Buf16(2*w),this.dyn_dtree=new d.Buf16(2*(2*a+1)),this.bl_tree=new d.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new d.Buf16(k+1),this.heap=new d.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new d.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0;}function G(t){var e;return t&&t.state?(t.total_in=t.total_out=0,t.data_type=n,(e=t.state).pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?C:E,t.adler=2===e.wrap?0:1,e.last_flush=l,u._tr_init(e),m):R(t,_)}function K(t){var e=G(t);return e===m&&function(t){t.window_size=2*t.w_size,D(t.head),t.max_lazy_match=h[t.level].max_lazy,t.good_match=h[t.level].good_length,t.nice_match=h[t.level].nice_length,t.max_chain_length=h[t.level].max_chain,t.strstart=0,t.block_start=0,t.lookahead=0,t.insert=0,t.match_length=t.prev_length=x-1,t.match_available=0,t.ins_h=0;}(t.state),e}function Y(t,e,r,i,n,s){if(!t)return _;var a=1;if(e===g&&(e=6),i<0?(a=0,i=-i):15<i&&(a=2,i-=16),n<1||y<n||r!==v||i<8||15<i||e<0||9<e||s<0||b<s)return R(t,_);8===i&&(i=9);var o=new H;return (t.state=o).strm=t,o.wrap=a,o.gzhead=null,o.w_bits=i,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=n+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new d.Buf8(2*o.w_size),o.head=new d.Buf16(o.hash_size),o.prev=new d.Buf16(o.w_size),o.lit_bufsize=1<<n+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new d.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=e,o.strategy=s,o.method=r,K(t)}h=[new M(0,0,0,0,function(t,e){var r=65535;for(r>t.pending_buf_size-5&&(r=t.pending_buf_size-5);;){if(t.lookahead<=1){if(j(t),0===t.lookahead&&e===l)return A;if(0===t.lookahead)break}t.strstart+=t.lookahead,t.lookahead=0;var i=t.block_start+r;if((0===t.strstart||t.strstart>=i)&&(t.lookahead=t.strstart-i,t.strstart=i,N(t,!1),0===t.strm.avail_out))return A;if(t.strstart-t.block_start>=t.w_size-z&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):(t.strstart>t.block_start&&(N(t,!1),t.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(t,e){return Y(t,e,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(t,e){return t&&t.state?2!==t.state.wrap?_:(t.state.gzhead=e,m):_},r.deflate=function(t,e){var r,i,n,s;if(!t||!t.state||5<e||e<0)return t?R(t,_):_;if(i=t.state,!t.output||!t.input&&0!==t.avail_in||666===i.status&&e!==f)return R(t,0===t.avail_out?-5:_);if(i.strm=t,r=i.last_flush,i.last_flush=e,i.status===C)if(2===i.wrap)t.adler=0,U(i,31),U(i,139),U(i,8),i.gzhead?(U(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),U(i,255&i.gzhead.time),U(i,i.gzhead.time>>8&255),U(i,i.gzhead.time>>16&255),U(i,i.gzhead.time>>24&255),U(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),U(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(U(i,255&i.gzhead.extra.length),U(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(t.adler=p(t.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(U(i,0),U(i,0),U(i,0),U(i,0),U(i,0),U(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),U(i,3),i.status=E);else{var a=v+(i.w_bits-8<<4)<<8;a|=(2<=i.strategy||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(a|=32),a+=31-a%31,i.status=E,P(i,a),0!==i.strstart&&(P(i,t.adler>>>16),P(i,65535&t.adler)),t.adler=1;}if(69===i.status)if(i.gzhead.extra){for(n=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending!==i.pending_buf_size));)U(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73);}else i.status=73;if(73===i.status)if(i.gzhead.name){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending===i.pending_buf_size)){s=1;break}s=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,U(i,s);}while(0!==s);i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),0===s&&(i.gzindex=0,i.status=91);}else i.status=91;if(91===i.status)if(i.gzhead.comment){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending===i.pending_buf_size)){s=1;break}s=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,U(i,s);}while(0!==s);i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),0===s&&(i.status=103);}else i.status=103;if(103===i.status&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&F(t),i.pending+2<=i.pending_buf_size&&(U(i,255&t.adler),U(i,t.adler>>8&255),t.adler=0,i.status=E)):i.status=E),0!==i.pending){if(F(t),0===t.avail_out)return i.last_flush=-1,m}else if(0===t.avail_in&&T(e)<=T(r)&&e!==f)return R(t,-5);if(666===i.status&&0!==t.avail_in)return R(t,-5);if(0!==t.avail_in||0!==i.lookahead||e!==l&&666!==i.status){var o=2===i.strategy?function(t,e){for(var r;;){if(0===t.lookahead&&(j(t),0===t.lookahead)){if(e===l)return A;break}if(t.match_length=0,r=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,r&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}(i,e):3===i.strategy?function(t,e){for(var r,i,n,s,a=t.window;;){if(t.lookahead<=S){if(j(t),t.lookahead<=S&&e===l)return A;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=x&&0<t.strstart&&(i=a[n=t.strstart-1])===a[++n]&&i===a[++n]&&i===a[++n]){s=t.strstart+S;do{}while(i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&n<s);t.match_length=S-(s-n),t.match_length>t.lookahead&&(t.match_length=t.lookahead);}if(t.match_length>=x?(r=u._tr_tally(t,1,t.match_length-x),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(r=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),r&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}(i,e):h[i.level].func(i,e);if(o!==O&&o!==B||(i.status=666),o===A||o===O)return 0===t.avail_out&&(i.last_flush=-1),m;if(o===I&&(1===e?u._tr_align(i):5!==e&&(u._tr_stored_block(i,0,0,!1),3===e&&(D(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),F(t),0===t.avail_out))return i.last_flush=-1,m}return e!==f?m:i.wrap<=0?1:(2===i.wrap?(U(i,255&t.adler),U(i,t.adler>>8&255),U(i,t.adler>>16&255),U(i,t.adler>>24&255),U(i,255&t.total_in),U(i,t.total_in>>8&255),U(i,t.total_in>>16&255),U(i,t.total_in>>24&255)):(P(i,t.adler>>>16),P(i,65535&t.adler)),F(t),0<i.wrap&&(i.wrap=-i.wrap),0!==i.pending?m:1)},r.deflateEnd=function(t){var e;return t&&t.state?(e=t.state.status)!==C&&69!==e&&73!==e&&91!==e&&103!==e&&e!==E&&666!==e?R(t,_):(t.state=null,e===E?R(t,-3):m):_},r.deflateSetDictionary=function(t,e){var r,i,n,s,a,o,h,u,l=e.length;if(!t||!t.state)return _;if(2===(s=(r=t.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(t.adler=c(t.adler,e,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new d.Buf8(r.w_size),d.arraySet(u,e,l-r.w_size,r.w_size,0),e=u,l=r.w_size),a=t.avail_in,o=t.next_in,h=t.input,t.avail_in=l,t.next_in=0,t.input=e,j(r);r.lookahead>=x;){for(i=r.strstart,n=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[i+x-1])&r.hash_mask,r.prev[i&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=i,i++,--n;);r.strstart=i,r.lookahead=x-1,j(r);}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,t.next_in=o,t.input=h,t.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)";},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(t,e,r){e.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1;};},{}],48:[function(t,e,r){e.exports=function(t,e){var r,i,n,s,a,o,h,u,l,f,d,c,p,m,_,g,b,v,y,w,k,x,S,z,C;r=t.state,i=t.next_in,z=t.input,n=i+(t.avail_in-5),s=t.next_out,C=t.output,a=s-(e-t.avail_out),o=s+(t.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,d=r.window,c=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;t:do{p<15&&(c+=z[i++]<<p,p+=8,c+=z[i++]<<p,p+=8),v=m[c&g];e:for(;;){if(c>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else{if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(c&(1<<y)-1)];continue e}if(32&y){r.mode=12;break t}t.msg="invalid literal/length code",r.mode=30;break t}w=65535&v,(y&=15)&&(p<y&&(c+=z[i++]<<p,p+=8),w+=c&(1<<y)-1,c>>>=y,p-=y),p<15&&(c+=z[i++]<<p,p+=8,c+=z[i++]<<p,p+=8),v=_[c&b];r:for(;;){if(c>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(c&(1<<y)-1)];continue r}t.msg="invalid distance code",r.mode=30;break t}if(k=65535&v,p<(y&=15)&&(c+=z[i++]<<p,(p+=8)<y&&(c+=z[i++]<<p,p+=8)),h<(k+=c&(1<<y)-1)){t.msg="invalid distance too far back",r.mode=30;break t}if(c>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){t.msg="invalid distance too far back",r.mode=30;break t}if(S=d,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=d[x++],--y;);x=s-k,S=C;}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=d[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=d[x++],--y;);x=s-k,S=C;}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=d[x++],--y;);x=s-k,S=C;}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]));}else{for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]));}break}}break}}while(i<n&&s<o);i-=w=p>>3,c&=(1<<(p-=w<<3))-1,t.next_in=i,t.next_out=s,t.avail_in=i<n?n-i+5:5-(i-n),t.avail_out=s<o?o-s+257:257-(s-o),r.hold=c,r.bits=p;};},{}],49:[function(t,e,r){var I=t("../utils/common"),O=t("./adler32"),B=t("./crc32"),R=t("./inffast"),T=t("./inftrees"),D=1,F=2,N=0,U=-2,P=1,i=852,n=592;function L(t){return (t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0;}function a(t){var e;return t&&t.state?(e=t.state,t.total_in=t.total_out=e.total=0,t.msg="",e.wrap&&(t.adler=1&e.wrap),e.mode=P,e.last=0,e.havedict=0,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new I.Buf32(i),e.distcode=e.distdyn=new I.Buf32(n),e.sane=1,e.back=-1,N):U}function o(t){var e;return t&&t.state?((e=t.state).wsize=0,e.whave=0,e.wnext=0,a(t)):U}function h(t,e){var r,i;return t&&t.state?(i=t.state,e<0?(r=0,e=-e):(r=1+(e>>4),e<48&&(e&=15)),e&&(e<8||15<e)?U:(null!==i.window&&i.wbits!==e&&(i.window=null),i.wrap=r,i.wbits=e,o(t))):U}function u(t,e){var r,i;return t?(i=new s,(t.state=i).window=null,(r=h(t,e))!==N&&(t.state=null),r):U}var l,f,d=!0;function j(t){if(d){var e;for(l=new I.Buf32(512),f=new I.Buf32(32),e=0;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(T(D,t.lens,0,288,l,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;T(F,t.lens,0,32,f,0,t.work,{bits:5}),d=!1;}t.lencode=l,t.lenbits=9,t.distcode=f,t.distbits=5;}function Z(t,e,r,i){var n,s=t.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),i>=s.wsize?(I.arraySet(s.window,e,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(i<(n=s.wsize-s.wnext)&&(n=i),I.arraySet(s.window,e,r-i,n,s.wnext),(i-=n)?(I.arraySet(s.window,e,r-i,i,0),s.wnext=i,s.whave=s.wsize):(s.wnext+=n,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=n))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(t){return u(t,15)},r.inflateInit2=u,r.inflate=function(t,e){var r,i,n,s,a,o,h,u,l,f,d,c,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!t||!t.state||!t.output||!t.input&&0!==t.avail_in)return U;12===(r=t.state).mode&&(r.mode=13),a=t.next_out,n=t.output,h=t.avail_out,s=t.next_in,i=t.input,o=t.avail_in,u=r.hold,l=r.bits,f=o,d=h,x=N;t:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){t.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){t.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){t.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,t.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(r.flags=u,8!=(255&r.flags)){t.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){t.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0;}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(c=r.length)&&(c=o),c&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,i,s,c,k)),512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,r.length-=c),r.length))break t;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break t;for(c=0;k=i[s+c++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&c<o;);if(512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,k)break t}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break t;for(c=0;k=i[s+c++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&c<o;);if(512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,k)break t}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(u!==(65535&r.check)){t.msg="header crc mismatch",r.mode=30;break}l=u=0;}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),t.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}t.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,2;t.adler=r.check=1,r.mode=12;case 12:if(5===e||6===e)break t;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==e)break;u>>>=2,l-=2;break t;case 2:r.mode=17;break;case 3:t.msg="invalid block type",r.mode=30;}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if((65535&u)!=(u>>>16^65535)){t.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===e)break t;case 15:r.mode=16;case 16:if(c=r.length){if(o<c&&(c=o),h<c&&(c=h),0===c)break t;I.arraySet(n,i,s,c,a),o-=c,s+=c,h-=c,a+=c,r.length-=c;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){t.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3;}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){t.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else{if(16===b){for(z=_+2;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(u>>>=_,l-=_,0===r.have){t.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],c=3+(3&u),u>>>=2,l-=2;}else if(17===b){for(z=_+3;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}l-=_,k=0,c=3+(7&(u>>>=_)),u>>>=3,l-=3;}else{for(z=_+7;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}l-=_,k=0,c=11+(127&(u>>>=_)),u>>>=7,l-=7;}if(r.have+c>r.nlen+r.ndist){t.msg="invalid bit length repeat",r.mode=30;break}for(;c--;)r.lens[r.have++]=k;}}if(30===r.mode)break;if(0===r.lens[256]){t.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){t.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){t.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===e)break t;case 20:r.mode=21;case 21:if(6<=o&&258<=h){t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,R(t,d),a=t.next_out,n=t.output,h=t.avail_out,s=t.next_in,i=t.input,o=t.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}u>>>=v,l-=v,r.back+=v;}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){t.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra;}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}u>>>=v,l-=v,r.back+=v;}if(u>>>=_,l-=_,r.back+=_,64&g){t.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra;}if(r.offset>r.dmax){t.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break t;if(c=d-h,r.offset>c){if((c=r.offset-c)>r.whave&&r.sane){t.msg="invalid distance too far back",r.mode=30;break}p=c>r.wnext?(c-=r.wnext,r.wsize-c):r.wnext-c,c>r.length&&(c=r.length),m=r.window;}else m=n,p=a-r.offset,c=r.length;for(h<c&&(c=h),h-=c,r.length-=c;n[a++]=m[p++],--c;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break t;n[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break t;o--,u|=i[s++]<<l,l+=8;}if(d-=h,t.total_out+=d,r.total+=d,d&&(t.adler=r.check=r.flags?B(r.check,n,d,a-d):O(r.check,n,d,a-d)),d=h,(r.flags?u:L(u))!==r.check){t.msg="incorrect data check",r.mode=30;break}l=u=0;}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8;}if(u!==(4294967295&r.total)){t.msg="incorrect length check",r.mode=30;break}l=u=0;}r.mode=29;case 29:x=1;break t;case 30:x=-3;break t;case 31:return -4;case 32:default:return U}return t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,(r.wsize||d!==t.avail_out&&r.mode<30&&(r.mode<27||4!==e))&&Z(t,t.output,t.next_out,d-t.avail_out)?(r.mode=31,-4):(f-=t.avail_in,d-=t.avail_out,t.total_in+=f,t.total_out+=d,r.total+=d,r.wrap&&d&&(t.adler=r.check=r.flags?B(r.check,n,d,t.next_out-d):O(r.check,n,d,t.next_out-d)),t.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===d||4===e)&&x===N&&(x=-5),x)},r.inflateEnd=function(t){if(!t||!t.state)return U;var e=t.state;return e.window&&(e.window=null),t.state=null,N},r.inflateGetHeader=function(t,e){var r;return t&&t.state?0==(2&(r=t.state).wrap)?U:((r.head=e).done=!1,N):U},r.inflateSetDictionary=function(t,e){var r,i=e.length;return t&&t.state?0!==(r=t.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,e,i,0)!==r.check?-3:Z(t,e,i,i)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)";},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(t,e,r){var D=t("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(t,e,r,i,n,s,a,o){var h,u,l,f,d,c,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<i;v++)O[e[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return n[s++]=20971520,n[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return -1;if(0<z&&(0===t||1!==w))return -1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<i;v++)0!==e[r+v]&&(a[B[e[r+v]]++]=v);if(c=0===t?(A=R=a,19):1===t?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,d=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===t&&852<C||2===t&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<c?(m=0,a[v]):a[v]>c?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;n[d+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=e[r+a[v]];}if(k<b&&(E&f)!==l){for(0===S&&(S=k),d+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===t&&852<C||2===t&&592<C)return 1;n[l=E&f]=k<<24|x<<16|d-s|0;}}return 0!==E&&(n[d+E]=b-S<<24|64<<16|0),o.bits=k,0};},{"../utils/common":41}],51:[function(t,e,r){e.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"};},{}],52:[function(t,e,r){var n=t("../utils/common"),o=0,h=1;function i(t){for(var e=t.length;0<=--e;)t[e]=0;}var s=0,a=29,u=256,l=u+1+a,f=30,d=19,_=2*l+1,g=15,c=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));i(z);var C=new Array(2*f);i(C);var E=new Array(512);i(E);var A=new Array(256);i(A);var I=new Array(a);i(I);var O,B,R,T=new Array(f);function D(t,e,r,i,n){this.static_tree=t,this.extra_bits=e,this.extra_base=r,this.elems=i,this.max_length=n,this.has_stree=t&&t.length;}function F(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e;}function N(t){return t<256?E[t]:E[256+(t>>>7)]}function U(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255;}function P(t,e,r){t.bi_valid>c-r?(t.bi_buf|=e<<t.bi_valid&65535,U(t,t.bi_buf),t.bi_buf=e>>c-t.bi_valid,t.bi_valid+=r-c):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=r);}function L(t,e,r){P(t,r[2*e],r[2*e+1]);}function j(t,e){for(var r=0;r|=1&t,t>>>=1,r<<=1,0<--e;);return r>>>1}function Z(t,e,r){var i,n,s=new Array(g+1),a=0;for(i=1;i<=g;i++)s[i]=a=a+r[i-1]<<1;for(n=0;n<=e;n++){var o=t[2*n+1];0!==o&&(t[2*n]=j(s[o]++,o));}}function W(t){var e;for(e=0;e<l;e++)t.dyn_ltree[2*e]=0;for(e=0;e<f;e++)t.dyn_dtree[2*e]=0;for(e=0;e<d;e++)t.bl_tree[2*e]=0;t.dyn_ltree[2*m]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0;}function M(t){8<t.bi_valid?U(t,t.bi_buf):0<t.bi_valid&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0;}function H(t,e,r,i){var n=2*e,s=2*r;return t[n]<t[s]||t[n]===t[s]&&i[e]<=i[r]}function G(t,e,r){for(var i=t.heap[r],n=r<<1;n<=t.heap_len&&(n<t.heap_len&&H(e,t.heap[n+1],t.heap[n],t.depth)&&n++,!H(e,i,t.heap[n],t.depth));)t.heap[r]=t.heap[n],r=n,n<<=1;t.heap[r]=i;}function K(t,e,r){var i,n,s,a,o=0;if(0!==t.last_lit)for(;i=t.pending_buf[t.d_buf+2*o]<<8|t.pending_buf[t.d_buf+2*o+1],n=t.pending_buf[t.l_buf+o],o++,0===i?L(t,n,e):(L(t,(s=A[n])+u+1,e),0!==(a=w[s])&&P(t,n-=I[s],a),L(t,s=N(--i),r),0!==(a=k[s])&&P(t,i-=T[s],a)),o<t.last_lit;);L(t,m,e);}function Y(t,e){var r,i,n,s=e.dyn_tree,a=e.stat_desc.static_tree,o=e.stat_desc.has_stree,h=e.stat_desc.elems,u=-1;for(t.heap_len=0,t.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(t.heap[++t.heap_len]=u=r,t.depth[r]=0):s[2*r+1]=0;for(;t.heap_len<2;)s[2*(n=t.heap[++t.heap_len]=u<2?++u:0)]=1,t.depth[n]=0,t.opt_len--,o&&(t.static_len-=a[2*n+1]);for(e.max_code=u,r=t.heap_len>>1;1<=r;r--)G(t,s,r);for(n=h;r=t.heap[1],t.heap[1]=t.heap[t.heap_len--],G(t,s,1),i=t.heap[1],t.heap[--t.heap_max]=r,t.heap[--t.heap_max]=i,s[2*n]=s[2*r]+s[2*i],t.depth[n]=(t.depth[r]>=t.depth[i]?t.depth[r]:t.depth[i])+1,s[2*r+1]=s[2*i+1]=n,t.heap[1]=n++,G(t,s,1),2<=t.heap_len;);t.heap[--t.heap_max]=t.heap[1],function(t,e){var r,i,n,s,a,o,h=e.dyn_tree,u=e.max_code,l=e.stat_desc.static_tree,f=e.stat_desc.has_stree,d=e.stat_desc.extra_bits,c=e.stat_desc.extra_base,p=e.stat_desc.max_length,m=0;for(s=0;s<=g;s++)t.bl_count[s]=0;for(h[2*t.heap[t.heap_max]+1]=0,r=t.heap_max+1;r<_;r++)p<(s=h[2*h[2*(i=t.heap[r])+1]+1]+1)&&(s=p,m++),h[2*i+1]=s,u<i||(t.bl_count[s]++,a=0,c<=i&&(a=d[i-c]),o=h[2*i],t.opt_len+=o*(s+a),f&&(t.static_len+=o*(l[2*i+1]+a)));if(0!==m){do{for(s=p-1;0===t.bl_count[s];)s--;t.bl_count[s]--,t.bl_count[s+1]+=2,t.bl_count[p]--,m-=2;}while(0<m);for(s=p;0!==s;s--)for(i=t.bl_count[s];0!==i;)u<(n=t.heap[--r])||(h[2*n+1]!==s&&(t.opt_len+=(s-h[2*n+1])*h[2*n],h[2*n+1]=s),i--);}}(t,e),Z(s,u,t.bl_count);}function X(t,e,r){var i,n,s=-1,a=e[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),e[2*(r+1)+1]=65535,i=0;i<=r;i++)n=a,a=e[2*(i+1)+1],++o<h&&n===a||(o<u?t.bl_tree[2*n]+=o:0!==n?(n!==s&&t.bl_tree[2*n]++,t.bl_tree[2*b]++):o<=10?t.bl_tree[2*v]++:t.bl_tree[2*y]++,s=n,u=(o=0)===a?(h=138,3):n===a?(h=6,3):(h=7,4));}function V(t,e,r){var i,n,s=-1,a=e[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),i=0;i<=r;i++)if(n=a,a=e[2*(i+1)+1],!(++o<h&&n===a)){if(o<u)for(;L(t,n,t.bl_tree),0!=--o;);else 0!==n?(n!==s&&(L(t,n,t.bl_tree),o--),L(t,b,t.bl_tree),P(t,o-3,2)):o<=10?(L(t,v,t.bl_tree),P(t,o-3,3)):(L(t,y,t.bl_tree),P(t,o-11,7));s=n,u=(o=0)===a?(h=138,3):n===a?(h=6,3):(h=7,4);}}i(T);var q=!1;function J(t,e,r,i){P(t,(s<<1)+(i?1:0),3),function(t,e,r,i){M(t),i&&(U(t,r),U(t,~r)),n.arraySet(t.pending_buf,t.window,e,r,t.pending),t.pending+=r;}(t,e,r,!0);}r._tr_init=function(t){q||(function(){var t,e,r,i,n,s=new Array(g+1);for(i=r=0;i<a-1;i++)for(I[i]=r,t=0;t<1<<w[i];t++)A[r++]=i;for(A[r-1]=i,i=n=0;i<16;i++)for(T[i]=n,t=0;t<1<<k[i];t++)E[n++]=i;for(n>>=7;i<f;i++)for(T[i]=n<<7,t=0;t<1<<k[i]-7;t++)E[256+n++]=i;for(e=0;e<=g;e++)s[e]=0;for(t=0;t<=143;)z[2*t+1]=8,t++,s[8]++;for(;t<=255;)z[2*t+1]=9,t++,s[9]++;for(;t<=279;)z[2*t+1]=7,t++,s[7]++;for(;t<=287;)z[2*t+1]=8,t++,s[8]++;for(Z(z,l+1,s),t=0;t<f;t++)C[2*t+1]=5,C[2*t]=j(t,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,d,p);}(),q=!0),t.l_desc=new F(t.dyn_ltree,O),t.d_desc=new F(t.dyn_dtree,B),t.bl_desc=new F(t.bl_tree,R),t.bi_buf=0,t.bi_valid=0,W(t);},r._tr_stored_block=J,r._tr_flush_block=function(t,e,r,i){var n,s,a=0;0<t.level?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,r=4093624447;for(e=0;e<=31;e++,r>>>=1)if(1&r&&0!==t.dyn_ltree[2*e])return o;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return h;for(e=32;e<u;e++)if(0!==t.dyn_ltree[2*e])return h;return o}(t)),Y(t,t.l_desc),Y(t,t.d_desc),a=function(t){var e;for(X(t,t.dyn_ltree,t.l_desc.max_code),X(t,t.dyn_dtree,t.d_desc.max_code),Y(t,t.bl_desc),e=d-1;3<=e&&0===t.bl_tree[2*S[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e}(t),n=t.opt_len+3+7>>>3,(s=t.static_len+3+7>>>3)<=n&&(n=s)):n=s=r+5,r+4<=n&&-1!==e?J(t,e,r,i):4===t.strategy||s===n?(P(t,2+(i?1:0),3),K(t,z,C)):(P(t,4+(i?1:0),3),function(t,e,r,i){var n;for(P(t,e-257,5),P(t,r-1,5),P(t,i-4,4),n=0;n<i;n++)P(t,t.bl_tree[2*S[n]+1],3);V(t,t.dyn_ltree,e-1),V(t,t.dyn_dtree,r-1);}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,a+1),K(t,t.dyn_ltree,t.dyn_dtree)),W(t),i&&M(t);},r._tr_tally=function(t,e,r){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&r,t.last_lit++,0===e?t.dyn_ltree[2*r]++:(t.matches++,e--,t.dyn_ltree[2*(A[r]+u+1)]++,t.dyn_dtree[2*N(e)]++),t.last_lit===t.lit_bufsize-1},r._tr_align=function(t){P(t,2,3),L(t,m,z),function(t){16===t.bi_valid?(U(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):8<=t.bi_valid&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8);}(t);};},{"../utils/common":41}],53:[function(t,e,r){e.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0;};},{}],54:[function(t,e,r){e.exports="function"==typeof setImmediate?setImmediate:function(){var t=[].slice.apply(arguments);t.splice(1,0,0),setTimeout.apply(null,t);};},{}]},{},[10])(10)});
});

var StreamSaver = createCommonjsModule(function (module) {
((name, definition) => {
   module.exports = definition()
    ;
})('streamSaver', () => {

  let mitmTransporter = null;
  let supportsTransferable = false;
  const test = fn => { try { fn(); } catch (e) {} };
  const ponyfill = window.WebStreamsPolyfill || {};
  const isSecureContext = window.isSecureContext;
  let useBlobFallback = /constructor/i.test(window.HTMLElement) || !!window.safari;
  const downloadStrategy = isSecureContext || 'MozAppearance' in document.documentElement.style
    ? 'iframe'
    : 'navigate';

  const streamSaver = {
    createWriteStream,
    WritableStream: window.WritableStream || ponyfill.WritableStream,
    supported: true,
    version: { full: '2.0.0', major: 2, minor: 0, dot: 0 },
    mitm: 'https://jimmywarting.github.io/StreamSaver.js/mitm.html?version=2.0.0'
  };

  /**
   * create a hidden iframe and append it to the DOM (body)
   *
   * @param  {string} src page to load
   * @return {HTMLIFrameElement} page to load
   */
  function makeIframe (src) {
    if (!src) throw new Error('meh')
    const iframe = document.createElement('iframe');
    iframe.hidden = true;
    iframe.src = src;
    iframe.loaded = false;
    iframe.name = 'iframe';
    iframe.isIframe = true;
    iframe.postMessage = (...args) => iframe.contentWindow.postMessage(...args);
    iframe.addEventListener('load', () => {
      iframe.loaded = true;
    }, { once: true });
    document.body.appendChild(iframe);
    return iframe
  }

  /**
   * create a popup that simulates the basic things
   * of what a iframe can do
   *
   * @param  {string} src page to load
   * @return {object}     iframe like object
   */
  function makePopup (src) {
    const options = 'width=200,height=100';
    const delegate = document.createDocumentFragment();
    const popup = {
      frame: window.open(src, 'popup', options),
      loaded: false,
      isIframe: false,
      isPopup: true,
      remove () { popup.frame.close(); },
      addEventListener (...args) { delegate.addEventListener(...args); },
      dispatchEvent (...args) { delegate.dispatchEvent(...args); },
      removeEventListener (...args) { delegate.removeEventListener(...args); },
      postMessage (...args) { popup.frame.postMessage(...args); }
    };

    const onReady = evt => {
      if (evt.source === popup.frame) {
        popup.loaded = true;
        window.removeEventListener('message', onReady);
        popup.dispatchEvent(new Event('load'));
      }
    };

    window.addEventListener('message', onReady);

    return popup
  }

  try {
    // We can't look for service worker since it may still work on http
    new Response(new ReadableStream());
    if (isSecureContext && !('serviceWorker' in navigator)) {
      useBlobFallback = true;
    }
  } catch (err) {
    useBlobFallback = true;
  }

  test(() => {
    // Transfariable stream was first enabled in chrome v73 behind a flag
    const { readable } = new TransformStream();
    const mc = new MessageChannel();
    mc.port1.postMessage(readable, [readable]);
    mc.port1.close();
    mc.port2.close();
    supportsTransferable = true;
    // Freeze TransformStream object (can only work with native)
    Object.defineProperty(streamSaver, 'TransformStream', {
      configurable: false,
      writable: false,
      value: TransformStream
    });
  });

  function loadTransporter () {
    if (!mitmTransporter) {
      mitmTransporter = isSecureContext
        ? makeIframe(streamSaver.mitm)
        : makePopup(streamSaver.mitm);
    }
  }

  /**
   * @param  {string} filename filename that should be used
   * @param  {object} options  [description]
   * @param  {number} size     depricated
   * @return {WritableStream}
   */
  function createWriteStream (filename, options, size) {
    let opts = {
      size: null,
      pathname: null,
      writableStrategy: undefined,
      readableStrategy: undefined
    };

    // normalize arguments
    if (Number.isFinite(options)) {
      [ size, options ] = [ options, size ];
      console.warn('[StreamSaver] Depricated pass an object as 2nd argument when creating a write stream');
      opts.size = size;
      opts.writableStrategy = options;
    } else if (options && options.highWaterMark) {
      console.warn('[StreamSaver] Depricated pass an object as 2nd argument when creating a write stream');
      opts.size = size;
      opts.writableStrategy = options;
    } else {
      opts = options || {};
    }
    if (!useBlobFallback) {
      loadTransporter();

      var bytesWritten = 0; // by StreamSaver.js (not the service worker)
      var downloadUrl = null;
      var channel = new MessageChannel();

      // Make filename RFC5987 compatible
      filename = encodeURIComponent(filename.replace(/\//g, ':'))
        .replace(/['()]/g, escape)
        .replace(/\*/g, '%2A');

      const response = {
        transferringReadable: supportsTransferable,
        pathname: opts.pathname || Math.random().toString().slice(-6) + '/' + filename,
        headers: {
          'Content-Type': 'application/octet-stream; charset=utf-8',
          'Content-Disposition': "attachment; filename*=UTF-8''" + filename
        }
      };

      if (opts.size) {
        response.headers['Content-Length'] = opts.size;
      }

      const args = [ response, '*', [ channel.port2 ] ];

      if (supportsTransferable) {
        const transformer = downloadStrategy === 'iframe' ? undefined : {
          // This transformer & flush method is only used by insecure context.
          transform (chunk, controller) {
            bytesWritten += chunk.length;
            controller.enqueue(chunk);

            if (downloadUrl) {
              location.href = downloadUrl;
              downloadUrl = null;
            }
          },
          flush () {
            if (downloadUrl) {
              location.href = downloadUrl;
            }
          }
        };
        var ts = new streamSaver.TransformStream(
          transformer,
          opts.writableStrategy,
          opts.readableStrategy
        );
        const readableStream = ts.readable;

        channel.port1.postMessage({ readableStream }, [ readableStream ]);
      }

      channel.port1.onmessage = evt => {
        // Service worker sent us a link that we should open.
        if (evt.data.download) {
          // Special treatment for popup...
          if (downloadStrategy === 'navigate') {
            mitmTransporter.remove();
            mitmTransporter = null;
            if (bytesWritten) {
              location.href = evt.data.download;
            } else {
              downloadUrl = evt.data.download;
            }
          } else {
            if (mitmTransporter.isPopup) {
              mitmTransporter.remove();
              // Special case for firefox, they can keep sw alive with fetch
              if (downloadStrategy === 'iframe') {
                makeIframe(streamSaver.mitm);
              }
            }

            // We never remove this iframes b/c it can interrupt saving
            makeIframe(evt.data.download);
          }
        }
      };

      if (mitmTransporter.loaded) {
        mitmTransporter.postMessage(...args);
      } else {
        mitmTransporter.addEventListener('load', () => {
          mitmTransporter.postMessage(...args);
        }, { once: true });
      }
    }

    let chunks = [];

    return (!useBlobFallback && ts && ts.writable) || new streamSaver.WritableStream({
      write (chunk) {
        if (useBlobFallback) {
          // Safari... The new IE6
          // https://github.com/jimmywarting/StreamSaver.js/issues/69
          //
          // even doe it has everything it fails to download anything
          // that comes from the service worker..!
          chunks.push(chunk);
          return
        }

        // is called when a new chunk of data is ready to be written
        // to the underlying sink. It can return a promise to signal
        // success or failure of the write operation. The stream
        // implementation guarantees that this method will be called
        // only after previous writes have succeeded, and never after
        // close or abort is called.

        // TODO: Kind of important that service worker respond back when
        // it has been written. Otherwise we can't handle backpressure
        // EDIT: Transfarable streams solvs this...
        channel.port1.postMessage(chunk);
        bytesWritten += chunk.length;

        if (downloadUrl) {
          location.href = downloadUrl;
          downloadUrl = null;
        }
      },
      close () {
        if (useBlobFallback) {
          const blob = new Blob(chunks, { type: 'application/octet-stream; charset=utf-8' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
        } else {
          channel.port1.postMessage('end');
        }
      },
      abort () {
        chunks = [];
        channel.port1.postMessage('abort');
        channel.port1.onmessage = null;
        channel.port1.close();
        channel.port2.close();
        channel = null;
      }
    }, opts.writableStrategy)
  }

  return streamSaver
});
});

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

const selected = writable('');

const fileSystemFactory = () => {
  const myStore = writable([]);
  const { set, update, subscribe } = myStore;

  const genPaths = (nodes, path = '') => {
    for (const node of nodes) {
      if (node.type === 'folder') {
        genPaths(node.children, `${path}/${node.name}`);
      }
      node.path = `${path}/${node.name}`;
    }
  };

  const getFolderPath = (n, path) => {
    path = path.substring(1);
    let target = path.substring(0, path.indexOf('/'));
    if (target.length === 0) target = path;

    for (const entry of n) {
      if (entry.name === target) {
        if (path.indexOf('/') === -1) return entry;
        else {
          let item = getFolderPath(entry.children, path.substring(path.indexOf('/')));
          if (item && item.type === 'folder') return item;
          else return entry;
        }
      }
    }

    return undefined;
  };

  const getPath = (n, path) => {
    path = path.substring(1);
    let target = path.substring(0, path.indexOf('/'));
    if (target.length === 0) target = path;

    for (const entry of n) {
      if (entry.name === target) {
        if (path.indexOf('/') === -1) return entry;
        else return getPath(entry.children, path.substring(path.indexOf('/')));
      }
    }

    return undefined;
  };

  const addEntry = (n, path, type, name, data) => {
    const folder = getFolderPath(n, path);
    const names = folder.children.map((ch) => ch.name);
    let highest = 0;
    let duplicateRegex = new RegExp(`${name ? name : 'new_' + type}(?:\\(\\d+?\\))?`);

    if (duplicateRegex.test(names.join(' -- '))) {
      for (const fileName of names) {
        if (duplicateRegex.test(fileName) === true) {
          let val = parseInt(fileName.substring(fileName.lastIndexOf('(') + 1, fileName.lastIndexOf(')')));
          if (!isNaN(val) && val > highest) {
            highest = val;
          }
        }
      }
      highest += 1;
    }
    if (type === 'folder') {
      folder.children.push({
        type: 'folder',
        name: `${name ? name : 'new_folder'}${highest !== 0 ? `(${highest})` : ''}`,
        children: []
      });
    } else {
      folder.children.push({
        type: 'file',
        name: `${name ? name : 'new_file'}${highest !== 0 ? `(${highest})` : ''}`,
        extension: 'gml',
        data: data ? data : 'NONE'
      });
    }

    return highest;
  };

  const sort = (n) => {
    for (const entry of n) {
      if (entry.type === 'folder') sort(entry.children);
    }

    n.sort((a, b) => {
      if (a.type === b.type) {
        if (a.name === b.name) return 0;
        if ([a.name, b.name].sort()[0] === a.name) return -1
        else return 1
      }
      else {
        return a.type === 'folder' ? -1 : 1;
      }
    });
  };

  const flattenFiles = (n, out = []) => {
    for (let entry of n.children) {
      if (entry.type === 'folder' && entry.children.length === 0) {
        out.push(entry);
      } else {
        if (entry.type === 'file') out.push(entry);
        else flattenFiles(entry, out);
      }
    }
    return out;
  };

  const zipAndDownload = async (files, name, path = '') => {
    const zip = new jszip_min();
    for (const file of files) {
      if (file.type === 'folder') zip.folder(`${file.path.substring(path.length + 1)}`);
      else zip.file(`${file.path.substring(path.length + 1)}`, file.data);
    }
    console.log(zip);
    const fileStream = StreamSaver.createWriteStream(`${name}.zip`);
    await new Response(await zip.generateAsync({type: 'arraybuffer'})).body.pipeTo(fileStream);
  };

  return {
    subscribe,
    set,
    newCharacter() {
      update(n => {
        n.push({
          type: 'folder',
          name: 'new character',
          children: [
            {
              type: 'folder',
              name: 'sprites',
              nameLocked: true,
              children: []
            },
            {
              type: 'folder',
              name: 'scripts',
              nameLocked: true,
              children: [
                {
                  type: 'file',
                  name: 'init',
                  extension: 'gml',
                  nameLocked: true,
                  data: 'NONE'
                },
                {
                  type: 'file',
                  name: 'load',
                  extension: 'gml',
                  nameLocked: true,
                  data: 'NONE'
                },
                {
                  type: 'folder',
                  name: 'attacks',
                  nameLocked: true,
                  children: []
                }
              ]
            },
          ]
        });
        sort(n);
        genPaths(n);
        return n;
      });
    },
    updatePaths() {
      update(n => {
        genPaths(n);
        return n;
      });
    },
    newEntry(path, type, name) {
      update(n => {
        addEntry(n, path, type, name);
        sort(n);
        genPaths(n);
        return n;
      });
    },
    rename(path, newName) {
      update(n => {
        const item = getPath(n, path);
        item.name = newName;
        sort(n);
        genPaths(n);
        return n;
      });
    },
    delete(path) {
      update(n => {
        let file = getPath(n, path);
        if (n.includes(file)) {
          n.splice(n.indexOf(file), 1);
        } else {
          let folder = getFolderPath(n, path.substring(0, path.lastIndexOf('/')));
          folder.children.splice(folder.children.indexOf(file), 1);
        }
        return n;
      });
    },
    sort() {
      update(n => {
        sort(n);
        return n;
      });
    },
    async downloadAsZip(path) {
      let item = getPath(get_store_value(myStore), path);
      if (item.type === 'file') {
        const fileStream = StreamSaver.createWriteStream(`${item.name}.${item.extension}`);
        await new Response(item.data).body.pipeTo(fileStream);
      } else {
        const files = flattenFiles(item);

        zipAndDownload(files, path.substring(path.lastIndexOf('/') + 1), path);
      }
    },
    async downloadAllAsZip() {
      let item = {
        type: 'folder',
        name: 'characters',
        path: '.',
        children: get_store_value(myStore)
      };
      const files = flattenFiles(item);

      zipAndDownload(files, 'characters');
    },
    async loadFromZip(data, zipName, path) {
      const zip = await jszip_min.loadAsync(data);
      let folders = [{
        dir: true,
        path: '/',
        name: zipName
      }];

      let files = [];
      for (const entry of Object.values(zip.files)) {
        if (entry.dir) {
          let name = entry.name.substring(0, entry.name.length - 1);
          name = name.substring(name.lastIndexOf('/') + 1);
          let path = zipName + '/' + entry.name.substring(0, entry.name.length - name.length - 2);
          if (path.length > 0) path = '/' + path;
          folders.push({
            ...entry,
            path,
            name
          });
        } else {
          const name = entry.name.substring(entry.name.lastIndexOf('/') + 1);
          const data = await entry.async("text");
          let path = zipName + '/' + entry.name.substring(0, entry.name.length - name.length - 1);
          if (path.length > 0) path = '/' + path;
          files.push({
            ...entry,
            path,
            name,
            data
          });
        }
      }
      update(n => {
        for (const [i, folder] of folders.entries()) {
          let duplicateNum = addEntry(n, path + folder.path, 'folder', folder.name);
          if (duplicateNum !== 0) {
            for (const f of folders.slice(i + 1)) f.path = f.path.replace(folder.name, `${folder.name}(${duplicateNum})`);
            for (const f of files) f.path = f.path.replace(folder.name, `${folder.name}(${duplicateNum})`);
          }
        }
        for (const file of files) addEntry(n, path + file.path, 'file', file.name, file.data);
        sort(n);
        genPaths(n);
        return n;
      });

    }

  }
};
const fileSystem = fileSystemFactory();

/* src\components\webFS\Entry.svelte generated by Svelte v3.12.1 */

const file$4 = "src\\components\\webFS\\Entry.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.child = list[i];
	return child_ctx;
}

// (5:2) {#if uploading}
function create_if_block_5(ctx) {
	var input, dispose;

	const block = {
		c: function create() {
			input = element("input");
			attr_dev(input, "type", "file");
			attr_dev(input, "class", "svelte-t6z6hu");
			add_location(input, file$4, 5, 4, 242);
			dispose = listen_dev(input, "change", ctx.uploadSelected);
		},

		m: function mount(target, anchor) {
			insert_dev(target, input, anchor);
			ctx.input_binding(input);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(input);
			}

			ctx.input_binding(null);
			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_5.name, type: "if", source: "(5:2) {#if uploading}", ctx });
	return block;
}

// (15:2) {:else}
function create_else_block_1(ctx) {
	var svg, path, t, if_block_anchor;

	function select_block_type_2(changed, ctx) {
		if (ctx.renaming) return create_if_block_4;
		return create_else_block_2;
	}

	var current_block_type = select_block_type_2(null, ctx);
	var if_block = current_block_type(ctx);

	const block = {
		c: function create() {
			svg = svg_element("svg");
			path = svg_element("path");
			t = space();
			if_block.c();
			if_block_anchor = empty();
			attr_dev(path, "d", mdiFile);
			add_location(path, file$4, 15, 29, 673);
			attr_dev(svg, "viewBox", "0 0 24 24");
			attr_dev(svg, "class", "svelte-t6z6hu");
			add_location(svg, file$4, 15, 4, 648);
		},

		m: function mount(target, anchor) {
			insert_dev(target, svg, anchor);
			append_dev(svg, path);
			insert_dev(target, t, anchor);
			if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
		},

		p: function update(changed, ctx) {
			if (current_block_type === (current_block_type = select_block_type_2(changed, ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(svg);
				detach_dev(t);
			}

			if_block.d(detaching);

			if (detaching) {
				detach_dev(if_block_anchor);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block_1.name, type: "else", source: "(15:2) {:else}", ctx });
	return block;
}

// (8:2) {#if data.type === 'folder'}
function create_if_block_2(ctx) {
	var svg, path, path_d_value, t, if_block_anchor, dispose;

	function select_block_type_1(changed, ctx) {
		if (ctx.renaming) return create_if_block_3;
		return create_else_block$1;
	}

	var current_block_type = select_block_type_1(null, ctx);
	var if_block = current_block_type(ctx);

	const block = {
		c: function create() {
			svg = svg_element("svg");
			path = svg_element("path");
			t = space();
			if_block.c();
			if_block_anchor = empty();
			attr_dev(path, "d", path_d_value = ctx.data.open ? mdiFolderOpen : mdiFolder);
			add_location(path, file$4, 8, 68, 424);
			attr_dev(svg, "viewBox", "0 0 24 24");
			attr_dev(svg, "class", "svelte-t6z6hu");
			add_location(svg, file$4, 8, 4, 360);
			dispose = listen_dev(svg, "click", stop_propagation(ctx.handleClick), false, false, true);
		},

		m: function mount(target, anchor) {
			insert_dev(target, svg, anchor);
			append_dev(svg, path);
			insert_dev(target, t, anchor);
			if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
		},

		p: function update(changed, ctx) {
			if ((changed.data) && path_d_value !== (path_d_value = ctx.data.open ? mdiFolderOpen : mdiFolder)) {
				attr_dev(path, "d", path_d_value);
			}

			if (current_block_type === (current_block_type = select_block_type_1(changed, ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(svg);
				detach_dev(t);
			}

			if_block.d(detaching);

			if (detaching) {
				detach_dev(if_block_anchor);
			}

			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(8:2) {#if data.type === 'folder'}", ctx });
	return block;
}

// (20:4) {:else}
function create_else_block_2(ctx) {
	var span, t0_value = ctx.data.name + "", t0, t1, t2_value = ctx.data.extension + "", t2;

	const block = {
		c: function create() {
			span = element("span");
			t0 = text(t0_value);
			t1 = text(".");
			t2 = text(t2_value);
			add_location(span, file$4, 20, 6, 853);
		},

		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t0);
			append_dev(span, t1);
			append_dev(span, t2);
		},

		p: function update(changed, ctx) {
			if ((changed.data) && t0_value !== (t0_value = ctx.data.name + "")) {
				set_data_dev(t0, t0_value);
			}

			if ((changed.data) && t2_value !== (t2_value = ctx.data.extension + "")) {
				set_data_dev(t2, t2_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(span);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block_2.name, type: "else", source: "(20:4) {:else}", ctx });
	return block;
}

// (17:4) {#if renaming}
function create_if_block_4(ctx) {
	var input, t0, span, t1, t2_value = ctx.data.extension + "", t2, dispose;

	const block = {
		c: function create() {
			input = element("input");
			t0 = space();
			span = element("span");
			t1 = text(".");
			t2 = text(t2_value);
			attr_dev(input, "type", "text");
			attr_dev(input, "class", "svelte-t6z6hu");
			add_location(input, file$4, 17, 6, 727);
			add_location(span, file$4, 18, 6, 802);
			dispose = listen_dev(input, "keypress", ctx.renameSubmit);
		},

		m: function mount(target, anchor) {
			insert_dev(target, input, anchor);
			ctx.input_binding_2(input);
			insert_dev(target, t0, anchor);
			insert_dev(target, span, anchor);
			append_dev(span, t1);
			append_dev(span, t2);
		},

		p: function update(changed, ctx) {
			if ((changed.data) && t2_value !== (t2_value = ctx.data.extension + "")) {
				set_data_dev(t2, t2_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(input);
			}

			ctx.input_binding_2(null);

			if (detaching) {
				detach_dev(t0);
				detach_dev(span);
			}

			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_4.name, type: "if", source: "(17:4) {#if renaming}", ctx });
	return block;
}

// (12:4) {:else}
function create_else_block$1(ctx) {
	var span, t_value = ctx.data.name + "", t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(t_value);
			add_location(span, file$4, 12, 6, 596);
		},

		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},

		p: function update(changed, ctx) {
			if ((changed.data) && t_value !== (t_value = ctx.data.name + "")) {
				set_data_dev(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(span);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$1.name, type: "else", source: "(12:4) {:else}", ctx });
	return block;
}

// (10:4) {#if renaming}
function create_if_block_3(ctx) {
	var input, dispose;

	const block = {
		c: function create() {
			input = element("input");
			attr_dev(input, "type", "text");
			attr_dev(input, "class", "svelte-t6z6hu");
			add_location(input, file$4, 10, 6, 508);
			dispose = listen_dev(input, "keypress", ctx.renameSubmit);
		},

		m: function mount(target, anchor) {
			insert_dev(target, input, anchor);
			ctx.input_binding_1(input);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(input);
			}

			ctx.input_binding_1(null);
			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_3.name, type: "if", source: "(10:4) {#if renaming}", ctx });
	return block;
}

// (24:2) {#if data.path === $selected}
function create_if_block_1(ctx) {
	var svg0, path0, t0, svg1, path1, t1, svg2, path2, t2, svg3, path3, dispose;

	const block = {
		c: function create() {
			svg0 = svg_element("svg");
			path0 = svg_element("path");
			t0 = space();
			svg1 = svg_element("svg");
			path1 = svg_element("path");
			t1 = space();
			svg2 = svg_element("svg");
			path2 = svg_element("path");
			t2 = space();
			svg3 = svg_element("svg");
			path3 = svg_element("path");
			attr_dev(path0, "d", mdiPencil);
			add_location(path0, file$4, 24, 68, 1017);
			attr_dev(svg0, "viewBox", "0 0 24 24");
			attr_dev(svg0, "class", "svelte-t6z6hu");
			add_location(svg0, file$4, 24, 4, 953);
			attr_dev(path1, "d", mdiDelete);
			add_location(path1, file$4, 25, 67, 1114);
			attr_dev(svg1, "viewBox", "0 0 24 24");
			attr_dev(svg1, "class", "svelte-t6z6hu");
			add_location(svg1, file$4, 25, 4, 1051);
			attr_dev(path2, "d", mdiFolderDownload);
			add_location(path2, file$4, 26, 65, 1209);
			attr_dev(svg2, "viewBox", "0 0 24 24");
			attr_dev(svg2, "class", "svelte-t6z6hu");
			add_location(svg2, file$4, 26, 4, 1148);
			attr_dev(path3, "d", mdiFolderUpload);
			add_location(path3, file$4, 27, 63, 1310);
			attr_dev(svg3, "viewBox", "0 0 24 24");
			attr_dev(svg3, "class", "svelte-t6z6hu");
			add_location(svg3, file$4, 27, 4, 1251);

			dispose = [
				listen_dev(svg0, "click", stop_propagation(ctx.renameStart), false, false, true),
				listen_dev(svg1, "click", stop_propagation(ctx.deleteFile), false, false, true),
				listen_dev(svg2, "click", stop_propagation(ctx.download), false, false, true),
				listen_dev(svg3, "click", stop_propagation(ctx.upload), false, false, true)
			];
		},

		m: function mount(target, anchor) {
			insert_dev(target, svg0, anchor);
			append_dev(svg0, path0);
			insert_dev(target, t0, anchor);
			insert_dev(target, svg1, anchor);
			append_dev(svg1, path1);
			insert_dev(target, t1, anchor);
			insert_dev(target, svg2, anchor);
			append_dev(svg2, path2);
			insert_dev(target, t2, anchor);
			insert_dev(target, svg3, anchor);
			append_dev(svg3, path3);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(svg0);
				detach_dev(t0);
				detach_dev(svg1);
				detach_dev(t1);
				detach_dev(svg2);
				detach_dev(t2);
				detach_dev(svg3);
			}

			run_all(dispose);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(24:2) {#if data.path === $selected}", ctx });
	return block;
}

// (30:2) {#if data.open}
function create_if_block$1(ctx) {
	var each_1_anchor, current;

	let each_value = ctx.data.children;

	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},

		m: function mount(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert_dev(target, each_1_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.data) {
				each_value = ctx.data.children;

				let i;
				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},

		d: function destroy(detaching) {
			destroy_each(each_blocks, detaching);

			if (detaching) {
				detach_dev(each_1_anchor);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(30:2) {#if data.open}", ctx });
	return block;
}

// (31:4) {#each data.children as child}
function create_each_block(ctx) {
	var current;

	var entry = new Entry({
		props: { data: ctx.child },
		$$inline: true
	});

	const block = {
		c: function create() {
			entry.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(entry, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var entry_changes = {};
			if (changed.data) entry_changes.data = ctx.child;
			entry.$set(entry_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(entry.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(entry.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(entry, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(31:4) {#each data.children as child}", ctx });
	return block;
}

function create_fragment$4(ctx) {
	var div, t0, t1, t2, div_class_value, div_transition, current, dispose;

	var if_block0 = (ctx.uploading) && create_if_block_5(ctx);

	function select_block_type(changed, ctx) {
		if (ctx.data.type === 'folder') return create_if_block_2;
		return create_else_block_1;
	}

	var current_block_type = select_block_type(null, ctx);
	var if_block1 = current_block_type(ctx);

	var if_block2 = (ctx.data.path === ctx.$selected) && create_if_block_1(ctx);

	var if_block3 = (ctx.data.open) && create_if_block$1(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			if (if_block3) if_block3.c();
			attr_dev(div, "class", div_class_value = "container" + (ctx.data.path === ctx.$selected ? ' selected' : '') + " svelte-t6z6hu");
			add_location(div, file$4, 0, 0, 0);
			dispose = listen_dev(div, "click", stop_propagation(ctx.click_handler), false, false, true);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			append_dev(div, t0);
			if_block1.m(div, null);
			append_dev(div, t1);
			if (if_block2) if_block2.m(div, null);
			append_dev(div, t2);
			if (if_block3) if_block3.m(div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.uploading) {
				if (if_block0) {
					if_block0.p(changed, ctx);
				} else {
					if_block0 = create_if_block_5(ctx);
					if_block0.c();
					if_block0.m(div, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block1) {
				if_block1.p(changed, ctx);
			} else {
				if_block1.d(1);
				if_block1 = current_block_type(ctx);
				if (if_block1) {
					if_block1.c();
					if_block1.m(div, t1);
				}
			}

			if (ctx.data.path === ctx.$selected) {
				if (if_block2) {
					if_block2.p(changed, ctx);
				} else {
					if_block2 = create_if_block_1(ctx);
					if_block2.c();
					if_block2.m(div, t2);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (ctx.data.open) {
				if (if_block3) {
					if_block3.p(changed, ctx);
					transition_in(if_block3, 1);
				} else {
					if_block3 = create_if_block$1(ctx);
					if_block3.c();
					transition_in(if_block3, 1);
					if_block3.m(div, null);
				}
			} else if (if_block3) {
				group_outros();
				transition_out(if_block3, 1, 1, () => {
					if_block3 = null;
				});
				check_outros();
			}

			if ((!current || changed.data || changed.$selected) && div_class_value !== (div_class_value = "container" + (ctx.data.path === ctx.$selected ? ' selected' : '') + " svelte-t6z6hu")) {
				attr_dev(div, "class", div_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block3);

			add_render_callback(() => {
				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, {delay: 0, duration: 300, x: -20, opacity: 0, easing: quintInOut}, true);
				div_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(if_block3);

			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, {delay: 0, duration: 300, x: -20, opacity: 0, easing: quintInOut}, false);
			div_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			if (if_block0) if_block0.d();
			if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();

			if (detaching) {
				if (div_transition) div_transition.end();
			}

			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
	return block;
}

function instance$4($$self, $$props, $$invalidate) {
	let $selected;

	validate_store(selected, 'selected');
	component_subscribe($$self, selected, $$value => { $selected = $$value; $$invalidate('$selected', $selected); });

	

  let { data, root = false } = $$props;

  let renaming = false;
  let editBox;

  let uploading = false;
  let uploadInput;

  const handleClick = () => {
    if (data.type === 'folder') {
      $$invalidate('data', data.open = !data.open, data);
    }
  };

  const renameStart = async () => {
    $$invalidate('renaming', renaming = true);
    await tick();
    editBox.select();
  };

  const renameSubmit = (evt) => {
    if (['Enter', 'Insert'].includes(evt.key)) {
      evt.preventDefault();

      $$invalidate('renaming', renaming = false);
      fileSystem.rename(data.path, editBox.value);
    }
  };

  const deleteFile = () => {
    fileSystem.delete(data.path);
  };

  const download = () => {
    fileSystem.downloadAsZip(data.path);
  };

  const upload = async () => {
    $$invalidate('uploading', uploading = true);
    await tick();
    uploadInput.click();
  };

  const uploadSelected = () => {
    const file = uploadInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      fileSystem.loadFromZip(reader.result, file.name.substring(0, file.name.length - 4), data.path);
      $$invalidate('uploading', uploading = false);
    };
    reader.readAsArrayBuffer(file);
  };

	const writable_props = ['data', 'root'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Entry> was created with unknown prop '${key}'`);
	});

	function input_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('uploadInput', uploadInput = $$value);
		});
	}

	function input_binding_1($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('editBox', editBox = $$value);
		});
	}

	function input_binding_2($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('editBox', editBox = $$value);
		});
	}

	const click_handler = () => selected.set(data.path);

	$$self.$set = $$props => {
		if ('data' in $$props) $$invalidate('data', data = $$props.data);
		if ('root' in $$props) $$invalidate('root', root = $$props.root);
	};

	$$self.$capture_state = () => {
		return { data, root, renaming, editBox, uploading, uploadInput, $selected };
	};

	$$self.$inject_state = $$props => {
		if ('data' in $$props) $$invalidate('data', data = $$props.data);
		if ('root' in $$props) $$invalidate('root', root = $$props.root);
		if ('renaming' in $$props) $$invalidate('renaming', renaming = $$props.renaming);
		if ('editBox' in $$props) $$invalidate('editBox', editBox = $$props.editBox);
		if ('uploading' in $$props) $$invalidate('uploading', uploading = $$props.uploading);
		if ('uploadInput' in $$props) $$invalidate('uploadInput', uploadInput = $$props.uploadInput);
		if ('$selected' in $$props) selected.set($selected);
	};

	return {
		data,
		root,
		renaming,
		editBox,
		uploading,
		uploadInput,
		handleClick,
		renameStart,
		renameSubmit,
		deleteFile,
		download,
		upload,
		uploadSelected,
		$selected,
		input_binding,
		input_binding_1,
		input_binding_2,
		click_handler
	};
}

class Entry extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["data", "root"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Entry", options, id: create_fragment$4.name });

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.data === undefined && !('data' in props)) {
			console.warn("<Entry> was created without expected prop 'data'");
		}
	}

	get data() {
		throw new Error("<Entry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set data(value) {
		throw new Error("<Entry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get root() {
		throw new Error("<Entry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set root(value) {
		throw new Error("<Entry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\components\webFS\WebFS.svelte generated by Svelte v3.12.1 */

const file$5 = "src\\components\\webFS\\WebFS.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.item = list[i];
	return child_ctx;
}

// (2:2) {#if uploading}
function create_if_block$2(ctx) {
	var input, dispose;

	const block = {
		c: function create() {
			input = element("input");
			attr_dev(input, "type", "file");
			attr_dev(input, "class", "svelte-1nuc14q");
			add_location(input, file$5, 2, 4, 48);
			dispose = listen_dev(input, "change", ctx.uploadSelected);
		},

		m: function mount(target, anchor) {
			insert_dev(target, input, anchor);
			ctx.input_binding(input);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(input);
			}

			ctx.input_binding(null);
			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$2.name, type: "if", source: "(2:2) {#if uploading}", ctx });
	return block;
}

// (6:4) {#each $fileSystem as item}
function create_each_block$1(ctx) {
	var current;

	var entry = new Entry({
		props: { data: ctx.item, root: true },
		$$inline: true
	});

	const block = {
		c: function create() {
			entry.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(entry, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var entry_changes = {};
			if (changed.$fileSystem) entry_changes.data = ctx.item;
			entry.$set(entry_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(entry.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(entry.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(entry, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(6:4) {#each $fileSystem as item}", ctx });
	return block;
}

function create_fragment$5(ctx) {
	var div8, t0, div0, t1, div7, div1, svg0, path0, t2, div2, svg1, path1, t3, div3, svg2, path2, t4, div4, svg3, path3, t5, div5, svg4, path4, t6, div6, svg5, path5, current, dispose;

	var if_block = (ctx.uploading) && create_if_block$2(ctx);

	let each_value = ctx.$fileSystem;

	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			div8 = element("div");
			if (if_block) if_block.c();
			t0 = space();
			div0 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			div7 = element("div");
			div1 = element("div");
			svg0 = svg_element("svg");
			path0 = svg_element("path");
			t2 = space();
			div2 = element("div");
			svg1 = svg_element("svg");
			path1 = svg_element("path");
			t3 = space();
			div3 = element("div");
			svg2 = svg_element("svg");
			path2 = svg_element("path");
			t4 = space();
			div4 = element("div");
			svg3 = svg_element("svg");
			path3 = svg_element("path");
			t5 = space();
			div5 = element("div");
			svg4 = svg_element("svg");
			path4 = svg_element("path");
			t6 = space();
			div6 = element("div");
			svg5 = svg_element("svg");
			path5 = svg_element("path");
			attr_dev(div0, "class", "files svelte-1nuc14q");
			add_location(div0, file$5, 4, 2, 132);
			attr_dev(path0, "d", mdiFolderPlus);
			add_location(path0, file$5, 11, 31, 356);
			attr_dev(svg0, "viewBox", "0 0 24 24");
			attr_dev(svg0, "class", "svelte-1nuc14q");
			add_location(svg0, file$5, 11, 6, 331);
			attr_dev(div1, "class", "option svelte-1nuc14q");
			add_location(div1, file$5, 10, 4, 279);
			attr_dev(path1, "d", mdiFilePlus);
			add_location(path1, file$5, 14, 31, 477);
			attr_dev(svg1, "viewBox", "0 0 24 24");
			attr_dev(svg1, "class", "svelte-1nuc14q");
			add_location(svg1, file$5, 14, 6, 452);
			attr_dev(div2, "class", "option svelte-1nuc14q");
			add_location(div2, file$5, 13, 4, 405);
			attr_dev(path2, "d", mdiFolderDownload);
			add_location(path2, file$5, 17, 31, 597);
			attr_dev(svg2, "viewBox", "0 0 24 24");
			attr_dev(svg2, "class", "svelte-1nuc14q");
			add_location(svg2, file$5, 17, 6, 572);
			attr_dev(div3, "class", "option svelte-1nuc14q");
			add_location(div3, file$5, 16, 4, 524);
			attr_dev(path3, "d", mdiFolderUpload);
			add_location(path3, file$5, 20, 31, 721);
			attr_dev(svg3, "viewBox", "0 0 24 24");
			attr_dev(svg3, "class", "svelte-1nuc14q");
			add_location(svg3, file$5, 20, 6, 696);
			attr_dev(div4, "class", "option svelte-1nuc14q");
			add_location(div4, file$5, 19, 4, 650);
			attr_dev(path4, "d", mdiCloudUpload);
			add_location(path4, file$5, 23, 31, 845);
			attr_dev(svg4, "viewBox", "0 0 24 24");
			attr_dev(svg4, "class", "svelte-1nuc14q");
			add_location(svg4, file$5, 23, 6, 820);
			attr_dev(div5, "class", "option svelte-1nuc14q");
			add_location(div5, file$5, 22, 4, 772);
			attr_dev(path5, "d", mdiCloudDownload);
			add_location(path5, file$5, 26, 31, 973);
			attr_dev(svg5, "viewBox", "0 0 24 24");
			attr_dev(svg5, "class", "svelte-1nuc14q");
			add_location(svg5, file$5, 26, 6, 948);
			attr_dev(div6, "class", "option svelte-1nuc14q");
			add_location(div6, file$5, 25, 4, 895);
			attr_dev(div7, "class", "options svelte-1nuc14q");
			add_location(div7, file$5, 9, 2, 252);
			attr_dev(div8, "class", "container svelte-1nuc14q");
			add_location(div8, file$5, 0, 0, 0);

			dispose = [
				listen_dev(div1, "click", ctx.newCharacter),
				listen_dev(div2, "click", ctx.newFile),
				listen_dev(div3, "click", ctx.download),
				listen_dev(div4, "click", ctx.upload),
				listen_dev(div5, "click", ctx.storeAll),
				listen_dev(div6, "click", ctx.loadFromStore)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div8, anchor);
			if (if_block) if_block.m(div8, null);
			append_dev(div8, t0);
			append_dev(div8, div0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div0, null);
			}

			append_dev(div8, t1);
			append_dev(div8, div7);
			append_dev(div7, div1);
			append_dev(div1, svg0);
			append_dev(svg0, path0);
			append_dev(div7, t2);
			append_dev(div7, div2);
			append_dev(div2, svg1);
			append_dev(svg1, path1);
			append_dev(div7, t3);
			append_dev(div7, div3);
			append_dev(div3, svg2);
			append_dev(svg2, path2);
			append_dev(div7, t4);
			append_dev(div7, div4);
			append_dev(div4, svg3);
			append_dev(svg3, path3);
			append_dev(div7, t5);
			append_dev(div7, div5);
			append_dev(div5, svg4);
			append_dev(svg4, path4);
			append_dev(div7, t6);
			append_dev(div7, div6);
			append_dev(div6, svg5);
			append_dev(svg5, path5);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.uploading) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					if_block.m(div8, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (changed.$fileSystem) {
				each_value = ctx.$fileSystem;

				let i;
				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div0, null);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div8);
			}

			if (if_block) if_block.d();

			destroy_each(each_blocks, detaching);

			run_all(dispose);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
	return block;
}

function instance$5($$self, $$props, $$invalidate) {
	let $selected, $fileSystem;

	validate_store(selected, 'selected');
	component_subscribe($$self, selected, $$value => { $selected = $$value; $$invalidate('$selected', $selected); });
	validate_store(fileSystem, 'fileSystem');
	component_subscribe($$self, fileSystem, $$value => { $fileSystem = $$value; $$invalidate('$fileSystem', $fileSystem); });

	

  const newCharacter = () => {
    fileSystem.newCharacter();
  };

  const newFile = () => {
    fileSystem.newEntry($selected, 'file');
  };

  const download = () => {
    fileSystem.downloadAllAsZip();
  };

  let uploading = false;
  let uploadInput;
  const upload = async () => {
    $$invalidate('uploading', uploading = true);
    await tick();
    uploadInput.click();
  };

  const uploadSelected = () => {
    const file = uploadInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      fileSystem.loadFromZip(reader.result, file.name.substring(0, file.name.length - 4), data.path);
      $$invalidate('uploading', uploading = false);
    };
    reader.readAsArrayBuffer(file);
  };

  const storeAll = () => {
    store2({
      fs: $fileSystem
    });
  };

  const loadFromStore = () => {
    fileSystem.set(store2().fs);
  };

	function input_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('uploadInput', uploadInput = $$value);
		});
	}

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ('uploading' in $$props) $$invalidate('uploading', uploading = $$props.uploading);
		if ('uploadInput' in $$props) $$invalidate('uploadInput', uploadInput = $$props.uploadInput);
		if ('$selected' in $$props) selected.set($selected);
		if ('$fileSystem' in $$props) fileSystem.set($fileSystem);
	};

	return {
		newCharacter,
		newFile,
		download,
		uploading,
		uploadInput,
		upload,
		uploadSelected,
		storeAll,
		loadFromStore,
		$fileSystem,
		input_binding
	};
}

class WebFS extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$5, create_fragment$5, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "WebFS", options, id: create_fragment$5.name });
	}
}

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssPropertyNameMap = {
    animation: {
        prefixed: '-webkit-animation',
        standard: 'animation',
    },
    transform: {
        prefixed: '-webkit-transform',
        standard: 'transform',
    },
    transition: {
        prefixed: '-webkit-transition',
        standard: 'transition',
    },
};
function isWindow(windowObj) {
    return Boolean(windowObj.document) && typeof windowObj.document.createElement === 'function';
}
function getCorrectPropertyName(windowObj, cssProperty) {
    if (isWindow(windowObj) && cssProperty in cssPropertyNameMap) {
        var el = windowObj.document.createElement('div');
        var _a = cssPropertyNameMap[cssProperty], standard = _a.standard, prefixed = _a.prefixed;
        var isStandard = standard in el.style;
        return isStandard ? standard : prefixed;
    }
    return cssProperty;
}
//# sourceMappingURL=util.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$2 = {
    CLOSED_CLASS: 'mdc-linear-progress--closed',
    INDETERMINATE_CLASS: 'mdc-linear-progress--indeterminate',
    REVERSED_CLASS: 'mdc-linear-progress--reversed',
};
var strings$2 = {
    BUFFER_SELECTOR: '.mdc-linear-progress__buffer',
    PRIMARY_BAR_SELECTOR: '.mdc-linear-progress__primary-bar',
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCLinearProgressFoundation = /** @class */ (function (_super) {
    __extends(MDCLinearProgressFoundation, _super);
    function MDCLinearProgressFoundation(adapter) {
        return _super.call(this, __assign({}, MDCLinearProgressFoundation.defaultAdapter, adapter)) || this;
    }
    Object.defineProperty(MDCLinearProgressFoundation, "cssClasses", {
        get: function () {
            return cssClasses$2;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCLinearProgressFoundation, "strings", {
        get: function () {
            return strings$2;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCLinearProgressFoundation, "defaultAdapter", {
        get: function () {
            return {
                addClass: function () { return undefined; },
                getBuffer: function () { return null; },
                getPrimaryBar: function () { return null; },
                hasClass: function () { return false; },
                removeClass: function () { return undefined; },
                setStyle: function () { return undefined; },
            };
        },
        enumerable: true,
        configurable: true
    });
    MDCLinearProgressFoundation.prototype.init = function () {
        this.isDeterminate_ = !this.adapter_.hasClass(cssClasses$2.INDETERMINATE_CLASS);
        this.isReversed_ = this.adapter_.hasClass(cssClasses$2.REVERSED_CLASS);
        this.progress_ = 0;
    };
    MDCLinearProgressFoundation.prototype.setDeterminate = function (isDeterminate) {
        this.isDeterminate_ = isDeterminate;
        if (this.isDeterminate_) {
            this.adapter_.removeClass(cssClasses$2.INDETERMINATE_CLASS);
            this.setScale_(this.adapter_.getPrimaryBar(), this.progress_);
        }
        else {
            this.adapter_.addClass(cssClasses$2.INDETERMINATE_CLASS);
            this.setScale_(this.adapter_.getPrimaryBar(), 1);
            this.setScale_(this.adapter_.getBuffer(), 1);
        }
    };
    MDCLinearProgressFoundation.prototype.setProgress = function (value) {
        this.progress_ = value;
        if (this.isDeterminate_) {
            this.setScale_(this.adapter_.getPrimaryBar(), value);
        }
    };
    MDCLinearProgressFoundation.prototype.setBuffer = function (value) {
        if (this.isDeterminate_) {
            this.setScale_(this.adapter_.getBuffer(), value);
        }
    };
    MDCLinearProgressFoundation.prototype.setReverse = function (isReversed) {
        this.isReversed_ = isReversed;
        if (this.isReversed_) {
            this.adapter_.addClass(cssClasses$2.REVERSED_CLASS);
        }
        else {
            this.adapter_.removeClass(cssClasses$2.REVERSED_CLASS);
        }
    };
    MDCLinearProgressFoundation.prototype.open = function () {
        this.adapter_.removeClass(cssClasses$2.CLOSED_CLASS);
    };
    MDCLinearProgressFoundation.prototype.close = function () {
        this.adapter_.addClass(cssClasses$2.CLOSED_CLASS);
    };
    MDCLinearProgressFoundation.prototype.setScale_ = function (el, scaleValue) {
        if (!el) {
            return;
        }
        var value = "scaleX(" + scaleValue + ")";
        this.adapter_.setStyle(el, getCorrectPropertyName(window, 'transform'), value);
    };
    return MDCLinearProgressFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCLinearProgress = /** @class */ (function (_super) {
    __extends(MDCLinearProgress, _super);
    function MDCLinearProgress() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCLinearProgress.attachTo = function (root) {
        return new MDCLinearProgress(root);
    };
    Object.defineProperty(MDCLinearProgress.prototype, "determinate", {
        set: function (value) {
            this.foundation_.setDeterminate(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCLinearProgress.prototype, "progress", {
        set: function (value) {
            this.foundation_.setProgress(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCLinearProgress.prototype, "buffer", {
        set: function (value) {
            this.foundation_.setBuffer(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCLinearProgress.prototype, "reverse", {
        set: function (value) {
            this.foundation_.setReverse(value);
        },
        enumerable: true,
        configurable: true
    });
    MDCLinearProgress.prototype.open = function () {
        this.foundation_.open();
    };
    MDCLinearProgress.prototype.close = function () {
        this.foundation_.close();
    };
    MDCLinearProgress.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        var adapter = {
            addClass: function (className) { return _this.root_.classList.add(className); },
            getBuffer: function () { return _this.root_.querySelector(MDCLinearProgressFoundation.strings.BUFFER_SELECTOR); },
            getPrimaryBar: function () { return _this.root_.querySelector(MDCLinearProgressFoundation.strings.PRIMARY_BAR_SELECTOR); },
            hasClass: function (className) { return _this.root_.classList.contains(className); },
            removeClass: function (className) { return _this.root_.classList.remove(className); },
            setStyle: function (el, styleProperty, value) { return el.style.setProperty(styleProperty, value); },
        };
        return new MDCLinearProgressFoundation(adapter);
    };
    return MDCLinearProgress;
}(MDCComponent));
//# sourceMappingURL=component.js.map

/* node_modules\@smui\linear-progress\LinearProgress.svelte generated by Svelte v3.12.1 */

const file$6 = "node_modules\\@smui\\linear-progress\\LinearProgress.svelte";

function create_fragment$6(ctx) {
	var div4, div0, t0, div1, t1, div2, span0, t2, div3, span1, useActions_action, forwardEvents_action;

	var div4_levels = [
		{ class: "\n    mdc-linear-progress\n    " + ctx.className + "\n    " + (ctx.indeterminate ? 'mdc-linear-progress--indeterminate' : '') + "\n    " + (ctx.reversed ? 'mdc-linear-progress--reversed' : '') + "\n    " + (ctx.closed ? 'mdc-linear-progress--closed' : '') + "\n  " },
		{ role: "progressbar" },
		exclude(ctx.$$props, ['use', 'class', 'indeterminate', 'reversed', 'closed', 'progress'])
	];

	var div4_data = {};
	for (var i = 0; i < div4_levels.length; i += 1) {
		div4_data = assign(div4_data, div4_levels[i]);
	}

	const block = {
		c: function create() {
			div4 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			t1 = space();
			div2 = element("div");
			span0 = element("span");
			t2 = space();
			div3 = element("div");
			span1 = element("span");
			attr_dev(div0, "class", "mdc-linear-progress__buffering-dots");
			add_location(div0, file$6, 14, 2, 410);
			attr_dev(div1, "class", "mdc-linear-progress__buffer");
			add_location(div1, file$6, 15, 2, 468);
			attr_dev(span0, "class", "mdc-linear-progress__bar-inner");
			add_location(span0, file$6, 17, 4, 594);
			attr_dev(div2, "class", "mdc-linear-progress__bar mdc-linear-progress__primary-bar");
			add_location(div2, file$6, 16, 2, 518);
			attr_dev(span1, "class", "mdc-linear-progress__bar-inner");
			add_location(span1, file$6, 20, 4, 736);
			attr_dev(div3, "class", "mdc-linear-progress__bar mdc-linear-progress__secondary-bar");
			add_location(div3, file$6, 19, 2, 658);
			set_attributes(div4, div4_data);
			add_location(div4, file$6, 0, 0, 0);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div4, anchor);
			append_dev(div4, div0);
			append_dev(div4, t0);
			append_dev(div4, div1);
			append_dev(div4, t1);
			append_dev(div4, div2);
			append_dev(div2, span0);
			append_dev(div4, t2);
			append_dev(div4, div3);
			append_dev(div3, span1);
			ctx.div4_binding(div4);
			useActions_action = useActions.call(null, div4, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, div4) || {};
		},

		p: function update(changed, ctx) {
			set_attributes(div4, get_spread_update(div4_levels, [
				(changed.className || changed.indeterminate || changed.reversed || changed.closed) && { class: "\n    mdc-linear-progress\n    " + ctx.className + "\n    " + (ctx.indeterminate ? 'mdc-linear-progress--indeterminate' : '') + "\n    " + (ctx.reversed ? 'mdc-linear-progress--reversed' : '') + "\n    " + (ctx.closed ? 'mdc-linear-progress--closed' : '') + "\n  " },
				{ role: "progressbar" },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'indeterminate', 'reversed', 'closed', 'progress'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div4);
			}

			ctx.div4_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
	return block;
}

function instance$6($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);

  let { use = [], class: className = '', indeterminate = false, reversed = false, closed = false, progress = 0, buffer = null } = $$props;

  let element;
  let linearProgress;

  onMount(() => {
    $$invalidate('linearProgress', linearProgress = new MDCLinearProgress(element));
  });

  onDestroy(() => {
    linearProgress && linearProgress.destroy();
  });

	function div4_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('indeterminate' in $$new_props) $$invalidate('indeterminate', indeterminate = $$new_props.indeterminate);
		if ('reversed' in $$new_props) $$invalidate('reversed', reversed = $$new_props.reversed);
		if ('closed' in $$new_props) $$invalidate('closed', closed = $$new_props.closed);
		if ('progress' in $$new_props) $$invalidate('progress', progress = $$new_props.progress);
		if ('buffer' in $$new_props) $$invalidate('buffer', buffer = $$new_props.buffer);
	};

	$$self.$capture_state = () => {
		return { use, className, indeterminate, reversed, closed, progress, buffer, element, linearProgress };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('indeterminate' in $$props) $$invalidate('indeterminate', indeterminate = $$new_props.indeterminate);
		if ('reversed' in $$props) $$invalidate('reversed', reversed = $$new_props.reversed);
		if ('closed' in $$props) $$invalidate('closed', closed = $$new_props.closed);
		if ('progress' in $$props) $$invalidate('progress', progress = $$new_props.progress);
		if ('buffer' in $$props) $$invalidate('buffer', buffer = $$new_props.buffer);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
		if ('linearProgress' in $$props) $$invalidate('linearProgress', linearProgress = $$new_props.linearProgress);
	};

	$$self.$$.update = ($$dirty = { linearProgress: 1, indeterminate: 1, progress: 1, buffer: 1, reversed: 1, closed: 1 }) => {
		if ($$dirty.linearProgress || $$dirty.indeterminate) { if (linearProgress) {
        $$invalidate('linearProgress', linearProgress.determinate = !indeterminate, linearProgress);
      } }
		if ($$dirty.linearProgress || $$dirty.progress) { if (linearProgress) {
        $$invalidate('linearProgress', linearProgress.progress = progress, linearProgress);
      } }
		if ($$dirty.linearProgress || $$dirty.buffer) { if (linearProgress) {
        $$invalidate('linearProgress', linearProgress.buffer = buffer, linearProgress);
      } }
		if ($$dirty.linearProgress || $$dirty.reversed) { if (linearProgress) {
        $$invalidate('linearProgress', linearProgress.reverse = reversed, linearProgress);
      } }
		if ($$dirty.linearProgress || $$dirty.closed) { if (linearProgress) {
        if (closed) {
          linearProgress.close();
        } else {
          linearProgress.open();
        }
      } }
	};

	return {
		forwardEvents,
		use,
		className,
		indeterminate,
		reversed,
		closed,
		progress,
		buffer,
		element,
		$$props,
		div4_binding,
		$$props: $$props = exclude_internal_props($$props)
	};
}

class LinearProgress extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["use", "class", "indeterminate", "reversed", "closed", "progress", "buffer"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LinearProgress", options, id: create_fragment$6.name });
	}

	get use() {
		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get indeterminate() {
		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set indeterminate(value) {
		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get reversed() {
		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set reversed(value) {
		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get closed() {
		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set closed(value) {
		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get progress() {
		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set progress(value) {
		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get buffer() {
		throw new Error("<LinearProgress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set buffer(value) {
		throw new Error("<LinearProgress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

const spritesheet = writable({});

const frameCount = writable(1);
const currentFrame = writable(0);

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$3 = {
    LABEL_FLOAT_ABOVE: 'mdc-floating-label--float-above',
    LABEL_SHAKE: 'mdc-floating-label--shake',
    ROOT: 'mdc-floating-label',
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCFloatingLabelFoundation = /** @class */ (function (_super) {
    __extends(MDCFloatingLabelFoundation, _super);
    function MDCFloatingLabelFoundation(adapter) {
        var _this = _super.call(this, __assign({}, MDCFloatingLabelFoundation.defaultAdapter, adapter)) || this;
        _this.shakeAnimationEndHandler_ = function () { return _this.handleShakeAnimationEnd_(); };
        return _this;
    }
    Object.defineProperty(MDCFloatingLabelFoundation, "cssClasses", {
        get: function () {
            return cssClasses$3;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCFloatingLabelFoundation, "defaultAdapter", {
        /**
         * See {@link MDCFloatingLabelAdapter} for typing information on parameters and return types.
         */
        get: function () {
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                addClass: function () { return undefined; },
                removeClass: function () { return undefined; },
                getWidth: function () { return 0; },
                registerInteractionHandler: function () { return undefined; },
                deregisterInteractionHandler: function () { return undefined; },
            };
            // tslint:enable:object-literal-sort-keys
        },
        enumerable: true,
        configurable: true
    });
    MDCFloatingLabelFoundation.prototype.init = function () {
        this.adapter_.registerInteractionHandler('animationend', this.shakeAnimationEndHandler_);
    };
    MDCFloatingLabelFoundation.prototype.destroy = function () {
        this.adapter_.deregisterInteractionHandler('animationend', this.shakeAnimationEndHandler_);
    };
    /**
     * Returns the width of the label element.
     */
    MDCFloatingLabelFoundation.prototype.getWidth = function () {
        return this.adapter_.getWidth();
    };
    /**
     * Styles the label to produce a shake animation to indicate an error.
     * @param shouldShake If true, adds the shake CSS class; otherwise, removes shake class.
     */
    MDCFloatingLabelFoundation.prototype.shake = function (shouldShake) {
        var LABEL_SHAKE = MDCFloatingLabelFoundation.cssClasses.LABEL_SHAKE;
        if (shouldShake) {
            this.adapter_.addClass(LABEL_SHAKE);
        }
        else {
            this.adapter_.removeClass(LABEL_SHAKE);
        }
    };
    /**
     * Styles the label to float or dock.
     * @param shouldFloat If true, adds the float CSS class; otherwise, removes float and shake classes to dock the label.
     */
    MDCFloatingLabelFoundation.prototype.float = function (shouldFloat) {
        var _a = MDCFloatingLabelFoundation.cssClasses, LABEL_FLOAT_ABOVE = _a.LABEL_FLOAT_ABOVE, LABEL_SHAKE = _a.LABEL_SHAKE;
        if (shouldFloat) {
            this.adapter_.addClass(LABEL_FLOAT_ABOVE);
        }
        else {
            this.adapter_.removeClass(LABEL_FLOAT_ABOVE);
            this.adapter_.removeClass(LABEL_SHAKE);
        }
    };
    MDCFloatingLabelFoundation.prototype.handleShakeAnimationEnd_ = function () {
        var LABEL_SHAKE = MDCFloatingLabelFoundation.cssClasses.LABEL_SHAKE;
        this.adapter_.removeClass(LABEL_SHAKE);
    };
    return MDCFloatingLabelFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCFloatingLabel = /** @class */ (function (_super) {
    __extends(MDCFloatingLabel, _super);
    function MDCFloatingLabel() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCFloatingLabel.attachTo = function (root) {
        return new MDCFloatingLabel(root);
    };
    /**
     * Styles the label to produce the label shake for errors.
     * @param shouldShake If true, shakes the label by adding a CSS class; otherwise, stops shaking by removing the class.
     */
    MDCFloatingLabel.prototype.shake = function (shouldShake) {
        this.foundation_.shake(shouldShake);
    };
    /**
     * Styles the label to float/dock.
     * @param shouldFloat If true, floats the label by adding a CSS class; otherwise, docks it by removing the class.
     */
    MDCFloatingLabel.prototype.float = function (shouldFloat) {
        this.foundation_.float(shouldFloat);
    };
    MDCFloatingLabel.prototype.getWidth = function () {
        return this.foundation_.getWidth();
    };
    MDCFloatingLabel.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        var adapter = {
            addClass: function (className) { return _this.root_.classList.add(className); },
            removeClass: function (className) { return _this.root_.classList.remove(className); },
            getWidth: function () { return _this.root_.scrollWidth; },
            registerInteractionHandler: function (evtType, handler) { return _this.listen(evtType, handler); },
            deregisterInteractionHandler: function (evtType, handler) { return _this.unlisten(evtType, handler); },
        };
        // tslint:enable:object-literal-sort-keys
        return new MDCFloatingLabelFoundation(adapter);
    };
    return MDCFloatingLabel;
}(MDCComponent));
//# sourceMappingURL=component.js.map

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$4 = {
    LINE_RIPPLE_ACTIVE: 'mdc-line-ripple--active',
    LINE_RIPPLE_DEACTIVATING: 'mdc-line-ripple--deactivating',
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCLineRippleFoundation = /** @class */ (function (_super) {
    __extends(MDCLineRippleFoundation, _super);
    function MDCLineRippleFoundation(adapter) {
        var _this = _super.call(this, __assign({}, MDCLineRippleFoundation.defaultAdapter, adapter)) || this;
        _this.transitionEndHandler_ = function (evt) { return _this.handleTransitionEnd(evt); };
        return _this;
    }
    Object.defineProperty(MDCLineRippleFoundation, "cssClasses", {
        get: function () {
            return cssClasses$4;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCLineRippleFoundation, "defaultAdapter", {
        /**
         * See {@link MDCLineRippleAdapter} for typing information on parameters and return types.
         */
        get: function () {
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                addClass: function () { return undefined; },
                removeClass: function () { return undefined; },
                hasClass: function () { return false; },
                setStyle: function () { return undefined; },
                registerEventHandler: function () { return undefined; },
                deregisterEventHandler: function () { return undefined; },
            };
            // tslint:enable:object-literal-sort-keys
        },
        enumerable: true,
        configurable: true
    });
    MDCLineRippleFoundation.prototype.init = function () {
        this.adapter_.registerEventHandler('transitionend', this.transitionEndHandler_);
    };
    MDCLineRippleFoundation.prototype.destroy = function () {
        this.adapter_.deregisterEventHandler('transitionend', this.transitionEndHandler_);
    };
    MDCLineRippleFoundation.prototype.activate = function () {
        this.adapter_.removeClass(cssClasses$4.LINE_RIPPLE_DEACTIVATING);
        this.adapter_.addClass(cssClasses$4.LINE_RIPPLE_ACTIVE);
    };
    MDCLineRippleFoundation.prototype.setRippleCenter = function (xCoordinate) {
        this.adapter_.setStyle('transform-origin', xCoordinate + "px center");
    };
    MDCLineRippleFoundation.prototype.deactivate = function () {
        this.adapter_.addClass(cssClasses$4.LINE_RIPPLE_DEACTIVATING);
    };
    MDCLineRippleFoundation.prototype.handleTransitionEnd = function (evt) {
        // Wait for the line ripple to be either transparent or opaque
        // before emitting the animation end event
        var isDeactivating = this.adapter_.hasClass(cssClasses$4.LINE_RIPPLE_DEACTIVATING);
        if (evt.propertyName === 'opacity') {
            if (isDeactivating) {
                this.adapter_.removeClass(cssClasses$4.LINE_RIPPLE_ACTIVE);
                this.adapter_.removeClass(cssClasses$4.LINE_RIPPLE_DEACTIVATING);
            }
        }
    };
    return MDCLineRippleFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCLineRipple = /** @class */ (function (_super) {
    __extends(MDCLineRipple, _super);
    function MDCLineRipple() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCLineRipple.attachTo = function (root) {
        return new MDCLineRipple(root);
    };
    /**
     * Activates the line ripple
     */
    MDCLineRipple.prototype.activate = function () {
        this.foundation_.activate();
    };
    /**
     * Deactivates the line ripple
     */
    MDCLineRipple.prototype.deactivate = function () {
        this.foundation_.deactivate();
    };
    /**
     * Sets the transform origin given a user's click location.
     * The `rippleCenter` is the x-coordinate of the middle of the ripple.
     */
    MDCLineRipple.prototype.setRippleCenter = function (xCoordinate) {
        this.foundation_.setRippleCenter(xCoordinate);
    };
    MDCLineRipple.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        var adapter = {
            addClass: function (className) { return _this.root_.classList.add(className); },
            removeClass: function (className) { return _this.root_.classList.remove(className); },
            hasClass: function (className) { return _this.root_.classList.contains(className); },
            setStyle: function (propertyName, value) { return _this.root_.style.setProperty(propertyName, value); },
            registerEventHandler: function (evtType, handler) { return _this.listen(evtType, handler); },
            deregisterEventHandler: function (evtType, handler) { return _this.unlisten(evtType, handler); },
        };
        // tslint:enable:object-literal-sort-keys
        return new MDCLineRippleFoundation(adapter);
    };
    return MDCLineRipple;
}(MDCComponent));
//# sourceMappingURL=component.js.map

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var strings$3 = {
    NOTCH_ELEMENT_SELECTOR: '.mdc-notched-outline__notch',
};
var numbers$1 = {
    // This should stay in sync with $mdc-notched-outline-padding * 2.
    NOTCH_ELEMENT_PADDING: 8,
};
var cssClasses$5 = {
    NO_LABEL: 'mdc-notched-outline--no-label',
    OUTLINE_NOTCHED: 'mdc-notched-outline--notched',
    OUTLINE_UPGRADED: 'mdc-notched-outline--upgraded',
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCNotchedOutlineFoundation = /** @class */ (function (_super) {
    __extends(MDCNotchedOutlineFoundation, _super);
    function MDCNotchedOutlineFoundation(adapter) {
        return _super.call(this, __assign({}, MDCNotchedOutlineFoundation.defaultAdapter, adapter)) || this;
    }
    Object.defineProperty(MDCNotchedOutlineFoundation, "strings", {
        get: function () {
            return strings$3;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCNotchedOutlineFoundation, "cssClasses", {
        get: function () {
            return cssClasses$5;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCNotchedOutlineFoundation, "numbers", {
        get: function () {
            return numbers$1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCNotchedOutlineFoundation, "defaultAdapter", {
        /**
         * See {@link MDCNotchedOutlineAdapter} for typing information on parameters and return types.
         */
        get: function () {
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                addClass: function () { return undefined; },
                removeClass: function () { return undefined; },
                setNotchWidthProperty: function () { return undefined; },
                removeNotchWidthProperty: function () { return undefined; },
            };
            // tslint:enable:object-literal-sort-keys
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Adds the outline notched selector and updates the notch width calculated based off of notchWidth.
     */
    MDCNotchedOutlineFoundation.prototype.notch = function (notchWidth) {
        var OUTLINE_NOTCHED = MDCNotchedOutlineFoundation.cssClasses.OUTLINE_NOTCHED;
        if (notchWidth > 0) {
            notchWidth += numbers$1.NOTCH_ELEMENT_PADDING; // Add padding from left/right.
        }
        this.adapter_.setNotchWidthProperty(notchWidth);
        this.adapter_.addClass(OUTLINE_NOTCHED);
    };
    /**
     * Removes notched outline selector to close the notch in the outline.
     */
    MDCNotchedOutlineFoundation.prototype.closeNotch = function () {
        var OUTLINE_NOTCHED = MDCNotchedOutlineFoundation.cssClasses.OUTLINE_NOTCHED;
        this.adapter_.removeClass(OUTLINE_NOTCHED);
        this.adapter_.removeNotchWidthProperty();
    };
    return MDCNotchedOutlineFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCNotchedOutline = /** @class */ (function (_super) {
    __extends(MDCNotchedOutline, _super);
    function MDCNotchedOutline() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCNotchedOutline.attachTo = function (root) {
        return new MDCNotchedOutline(root);
    };
    MDCNotchedOutline.prototype.initialSyncWithDOM = function () {
        this.notchElement_ = this.root_.querySelector(strings$3.NOTCH_ELEMENT_SELECTOR);
        var label = this.root_.querySelector('.' + MDCFloatingLabelFoundation.cssClasses.ROOT);
        if (label) {
            label.style.transitionDuration = '0s';
            this.root_.classList.add(cssClasses$5.OUTLINE_UPGRADED);
            requestAnimationFrame(function () {
                label.style.transitionDuration = '';
            });
        }
        else {
            this.root_.classList.add(cssClasses$5.NO_LABEL);
        }
    };
    /**
     * Updates classes and styles to open the notch to the specified width.
     * @param notchWidth The notch width in the outline.
     */
    MDCNotchedOutline.prototype.notch = function (notchWidth) {
        this.foundation_.notch(notchWidth);
    };
    /**
     * Updates classes and styles to close the notch.
     */
    MDCNotchedOutline.prototype.closeNotch = function () {
        this.foundation_.closeNotch();
    };
    MDCNotchedOutline.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        var adapter = {
            addClass: function (className) { return _this.root_.classList.add(className); },
            removeClass: function (className) { return _this.root_.classList.remove(className); },
            setNotchWidthProperty: function (width) { return _this.notchElement_.style.setProperty('width', width + 'px'); },
            removeNotchWidthProperty: function () { return _this.notchElement_.style.removeProperty('width'); },
        };
        // tslint:enable:object-literal-sort-keys
        return new MDCNotchedOutlineFoundation(adapter);
    };
    return MDCNotchedOutline;
}(MDCComponent));
//# sourceMappingURL=component.js.map

/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$6 = {
    ROOT: 'mdc-text-field-character-counter',
};
var strings$4 = {
    ROOT_SELECTOR: "." + cssClasses$6.ROOT,
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCTextFieldCharacterCounterFoundation = /** @class */ (function (_super) {
    __extends(MDCTextFieldCharacterCounterFoundation, _super);
    function MDCTextFieldCharacterCounterFoundation(adapter) {
        return _super.call(this, __assign({}, MDCTextFieldCharacterCounterFoundation.defaultAdapter, adapter)) || this;
    }
    Object.defineProperty(MDCTextFieldCharacterCounterFoundation, "cssClasses", {
        get: function () {
            return cssClasses$6;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldCharacterCounterFoundation, "strings", {
        get: function () {
            return strings$4;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldCharacterCounterFoundation, "defaultAdapter", {
        /**
         * See {@link MDCTextFieldCharacterCounterAdapter} for typing information on parameters and return types.
         */
        get: function () {
            return {
                setContent: function () { return undefined; },
            };
        },
        enumerable: true,
        configurable: true
    });
    MDCTextFieldCharacterCounterFoundation.prototype.setCounterValue = function (currentLength, maxLength) {
        currentLength = Math.min(currentLength, maxLength);
        this.adapter_.setContent(currentLength + " / " + maxLength);
    };
    return MDCTextFieldCharacterCounterFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCTextFieldCharacterCounter = /** @class */ (function (_super) {
    __extends(MDCTextFieldCharacterCounter, _super);
    function MDCTextFieldCharacterCounter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCTextFieldCharacterCounter.attachTo = function (root) {
        return new MDCTextFieldCharacterCounter(root);
    };
    Object.defineProperty(MDCTextFieldCharacterCounter.prototype, "foundation", {
        get: function () {
            return this.foundation_;
        },
        enumerable: true,
        configurable: true
    });
    MDCTextFieldCharacterCounter.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        var adapter = {
            setContent: function (content) {
                _this.root_.textContent = content;
            },
        };
        return new MDCTextFieldCharacterCounterFoundation(adapter);
    };
    return MDCTextFieldCharacterCounter;
}(MDCComponent));
//# sourceMappingURL=component.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var strings$5 = {
    ARIA_CONTROLS: 'aria-controls',
    ICON_SELECTOR: '.mdc-text-field__icon',
    INPUT_SELECTOR: '.mdc-text-field__input',
    LABEL_SELECTOR: '.mdc-floating-label',
    LINE_RIPPLE_SELECTOR: '.mdc-line-ripple',
    OUTLINE_SELECTOR: '.mdc-notched-outline',
};
var cssClasses$7 = {
    DENSE: 'mdc-text-field--dense',
    DISABLED: 'mdc-text-field--disabled',
    FOCUSED: 'mdc-text-field--focused',
    FULLWIDTH: 'mdc-text-field--fullwidth',
    HELPER_LINE: 'mdc-text-field-helper-line',
    INVALID: 'mdc-text-field--invalid',
    NO_LABEL: 'mdc-text-field--no-label',
    OUTLINED: 'mdc-text-field--outlined',
    ROOT: 'mdc-text-field',
    TEXTAREA: 'mdc-text-field--textarea',
    WITH_LEADING_ICON: 'mdc-text-field--with-leading-icon',
    WITH_TRAILING_ICON: 'mdc-text-field--with-trailing-icon',
};
var numbers$2 = {
    DENSE_LABEL_SCALE: 0.923,
    LABEL_SCALE: 0.75,
};
/**
 * Whitelist based off of https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
 * under the "Validation-related attributes" section.
 */
var VALIDATION_ATTR_WHITELIST = [
    'pattern', 'min', 'max', 'required', 'step', 'minlength', 'maxlength',
];
/**
 * Label should always float for these types as they show some UI even if value is empty.
 */
var ALWAYS_FLOAT_TYPES = [
    'color', 'date', 'datetime-local', 'month', 'range', 'time', 'week',
];
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var POINTERDOWN_EVENTS = ['mousedown', 'touchstart'];
var INTERACTION_EVENTS = ['click', 'keydown'];
var MDCTextFieldFoundation = /** @class */ (function (_super) {
    __extends(MDCTextFieldFoundation, _super);
    /**
     * @param adapter
     * @param foundationMap Map from subcomponent names to their subfoundations.
     */
    function MDCTextFieldFoundation(adapter, foundationMap) {
        if (foundationMap === void 0) { foundationMap = {}; }
        var _this = _super.call(this, __assign({}, MDCTextFieldFoundation.defaultAdapter, adapter)) || this;
        _this.isFocused_ = false;
        _this.receivedUserInput_ = false;
        _this.isValid_ = true;
        _this.useNativeValidation_ = true;
        _this.helperText_ = foundationMap.helperText;
        _this.characterCounter_ = foundationMap.characterCounter;
        _this.leadingIcon_ = foundationMap.leadingIcon;
        _this.trailingIcon_ = foundationMap.trailingIcon;
        _this.inputFocusHandler_ = function () { return _this.activateFocus(); };
        _this.inputBlurHandler_ = function () { return _this.deactivateFocus(); };
        _this.inputInputHandler_ = function () { return _this.handleInput(); };
        _this.setPointerXOffset_ = function (evt) { return _this.setTransformOrigin(evt); };
        _this.textFieldInteractionHandler_ = function () { return _this.handleTextFieldInteraction(); };
        _this.validationAttributeChangeHandler_ = function (attributesList) { return _this.handleValidationAttributeChange(attributesList); };
        return _this;
    }
    Object.defineProperty(MDCTextFieldFoundation, "cssClasses", {
        get: function () {
            return cssClasses$7;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation, "strings", {
        get: function () {
            return strings$5;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation, "numbers", {
        get: function () {
            return numbers$2;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation.prototype, "shouldAlwaysFloat_", {
        get: function () {
            var type = this.getNativeInput_().type;
            return ALWAYS_FLOAT_TYPES.indexOf(type) >= 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation.prototype, "shouldFloat", {
        get: function () {
            return this.shouldAlwaysFloat_ || this.isFocused_ || Boolean(this.getValue()) || this.isBadInput_();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation.prototype, "shouldShake", {
        get: function () {
            return !this.isFocused_ && !this.isValid() && Boolean(this.getValue());
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation, "defaultAdapter", {
        /**
         * See {@link MDCTextFieldAdapter} for typing information on parameters and return types.
         */
        get: function () {
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                addClass: function () { return undefined; },
                removeClass: function () { return undefined; },
                hasClass: function () { return true; },
                registerTextFieldInteractionHandler: function () { return undefined; },
                deregisterTextFieldInteractionHandler: function () { return undefined; },
                registerInputInteractionHandler: function () { return undefined; },
                deregisterInputInteractionHandler: function () { return undefined; },
                registerValidationAttributeChangeHandler: function () { return new MutationObserver(function () { return undefined; }); },
                deregisterValidationAttributeChangeHandler: function () { return undefined; },
                getNativeInput: function () { return null; },
                isFocused: function () { return false; },
                activateLineRipple: function () { return undefined; },
                deactivateLineRipple: function () { return undefined; },
                setLineRippleTransformOrigin: function () { return undefined; },
                shakeLabel: function () { return undefined; },
                floatLabel: function () { return undefined; },
                hasLabel: function () { return false; },
                getLabelWidth: function () { return 0; },
                hasOutline: function () { return false; },
                notchOutline: function () { return undefined; },
                closeOutline: function () { return undefined; },
            };
            // tslint:enable:object-literal-sort-keys
        },
        enumerable: true,
        configurable: true
    });
    MDCTextFieldFoundation.prototype.init = function () {
        var _this = this;
        if (this.adapter_.isFocused()) {
            this.inputFocusHandler_();
        }
        else if (this.adapter_.hasLabel() && this.shouldFloat) {
            this.notchOutline(true);
            this.adapter_.floatLabel(true);
        }
        this.adapter_.registerInputInteractionHandler('focus', this.inputFocusHandler_);
        this.adapter_.registerInputInteractionHandler('blur', this.inputBlurHandler_);
        this.adapter_.registerInputInteractionHandler('input', this.inputInputHandler_);
        POINTERDOWN_EVENTS.forEach(function (evtType) {
            _this.adapter_.registerInputInteractionHandler(evtType, _this.setPointerXOffset_);
        });
        INTERACTION_EVENTS.forEach(function (evtType) {
            _this.adapter_.registerTextFieldInteractionHandler(evtType, _this.textFieldInteractionHandler_);
        });
        this.validationObserver_ =
            this.adapter_.registerValidationAttributeChangeHandler(this.validationAttributeChangeHandler_);
        this.setCharacterCounter_(this.getValue().length);
    };
    MDCTextFieldFoundation.prototype.destroy = function () {
        var _this = this;
        this.adapter_.deregisterInputInteractionHandler('focus', this.inputFocusHandler_);
        this.adapter_.deregisterInputInteractionHandler('blur', this.inputBlurHandler_);
        this.adapter_.deregisterInputInteractionHandler('input', this.inputInputHandler_);
        POINTERDOWN_EVENTS.forEach(function (evtType) {
            _this.adapter_.deregisterInputInteractionHandler(evtType, _this.setPointerXOffset_);
        });
        INTERACTION_EVENTS.forEach(function (evtType) {
            _this.adapter_.deregisterTextFieldInteractionHandler(evtType, _this.textFieldInteractionHandler_);
        });
        this.adapter_.deregisterValidationAttributeChangeHandler(this.validationObserver_);
    };
    /**
     * Handles user interactions with the Text Field.
     */
    MDCTextFieldFoundation.prototype.handleTextFieldInteraction = function () {
        var nativeInput = this.adapter_.getNativeInput();
        if (nativeInput && nativeInput.disabled) {
            return;
        }
        this.receivedUserInput_ = true;
    };
    /**
     * Handles validation attribute changes
     */
    MDCTextFieldFoundation.prototype.handleValidationAttributeChange = function (attributesList) {
        var _this = this;
        attributesList.some(function (attributeName) {
            if (VALIDATION_ATTR_WHITELIST.indexOf(attributeName) > -1) {
                _this.styleValidity_(true);
                return true;
            }
            return false;
        });
        if (attributesList.indexOf('maxlength') > -1) {
            this.setCharacterCounter_(this.getValue().length);
        }
    };
    /**
     * Opens/closes the notched outline.
     */
    MDCTextFieldFoundation.prototype.notchOutline = function (openNotch) {
        if (!this.adapter_.hasOutline()) {
            return;
        }
        if (openNotch) {
            var isDense = this.adapter_.hasClass(cssClasses$7.DENSE);
            var labelScale = isDense ? numbers$2.DENSE_LABEL_SCALE : numbers$2.LABEL_SCALE;
            var labelWidth = this.adapter_.getLabelWidth() * labelScale;
            this.adapter_.notchOutline(labelWidth);
        }
        else {
            this.adapter_.closeOutline();
        }
    };
    /**
     * Activates the text field focus state.
     */
    MDCTextFieldFoundation.prototype.activateFocus = function () {
        this.isFocused_ = true;
        this.styleFocused_(this.isFocused_);
        this.adapter_.activateLineRipple();
        if (this.adapter_.hasLabel()) {
            this.notchOutline(this.shouldFloat);
            this.adapter_.floatLabel(this.shouldFloat);
            this.adapter_.shakeLabel(this.shouldShake);
        }
        if (this.helperText_) {
            this.helperText_.showToScreenReader();
        }
    };
    /**
     * Sets the line ripple's transform origin, so that the line ripple activate
     * animation will animate out from the user's click location.
     */
    MDCTextFieldFoundation.prototype.setTransformOrigin = function (evt) {
        var touches = evt.touches;
        var targetEvent = touches ? touches[0] : evt;
        var targetClientRect = targetEvent.target.getBoundingClientRect();
        var normalizedX = targetEvent.clientX - targetClientRect.left;
        this.adapter_.setLineRippleTransformOrigin(normalizedX);
    };
    /**
     * Handles input change of text input and text area.
     */
    MDCTextFieldFoundation.prototype.handleInput = function () {
        this.autoCompleteFocus();
        this.setCharacterCounter_(this.getValue().length);
    };
    /**
     * Activates the Text Field's focus state in cases when the input value
     * changes without user input (e.g. programmatically).
     */
    MDCTextFieldFoundation.prototype.autoCompleteFocus = function () {
        if (!this.receivedUserInput_) {
            this.activateFocus();
        }
    };
    /**
     * Deactivates the Text Field's focus state.
     */
    MDCTextFieldFoundation.prototype.deactivateFocus = function () {
        this.isFocused_ = false;
        this.adapter_.deactivateLineRipple();
        var isValid = this.isValid();
        this.styleValidity_(isValid);
        this.styleFocused_(this.isFocused_);
        if (this.adapter_.hasLabel()) {
            this.notchOutline(this.shouldFloat);
            this.adapter_.floatLabel(this.shouldFloat);
            this.adapter_.shakeLabel(this.shouldShake);
        }
        if (!this.shouldFloat) {
            this.receivedUserInput_ = false;
        }
    };
    MDCTextFieldFoundation.prototype.getValue = function () {
        return this.getNativeInput_().value;
    };
    /**
     * @param value The value to set on the input Element.
     */
    MDCTextFieldFoundation.prototype.setValue = function (value) {
        // Prevent Safari from moving the caret to the end of the input when the value has not changed.
        if (this.getValue() !== value) {
            this.getNativeInput_().value = value;
        }
        this.setCharacterCounter_(value.length);
        var isValid = this.isValid();
        this.styleValidity_(isValid);
        if (this.adapter_.hasLabel()) {
            this.notchOutline(this.shouldFloat);
            this.adapter_.floatLabel(this.shouldFloat);
            this.adapter_.shakeLabel(this.shouldShake);
        }
    };
    /**
     * @return The custom validity state, if set; otherwise, the result of a native validity check.
     */
    MDCTextFieldFoundation.prototype.isValid = function () {
        return this.useNativeValidation_
            ? this.isNativeInputValid_() : this.isValid_;
    };
    /**
     * @param isValid Sets the custom validity state of the Text Field.
     */
    MDCTextFieldFoundation.prototype.setValid = function (isValid) {
        this.isValid_ = isValid;
        this.styleValidity_(isValid);
        var shouldShake = !isValid && !this.isFocused_;
        if (this.adapter_.hasLabel()) {
            this.adapter_.shakeLabel(shouldShake);
        }
    };
    /**
     * Enables or disables the use of native validation. Use this for custom validation.
     * @param useNativeValidation Set this to false to ignore native input validation.
     */
    MDCTextFieldFoundation.prototype.setUseNativeValidation = function (useNativeValidation) {
        this.useNativeValidation_ = useNativeValidation;
    };
    MDCTextFieldFoundation.prototype.isDisabled = function () {
        return this.getNativeInput_().disabled;
    };
    /**
     * @param disabled Sets the text-field disabled or enabled.
     */
    MDCTextFieldFoundation.prototype.setDisabled = function (disabled) {
        this.getNativeInput_().disabled = disabled;
        this.styleDisabled_(disabled);
    };
    /**
     * @param content Sets the content of the helper text.
     */
    MDCTextFieldFoundation.prototype.setHelperTextContent = function (content) {
        if (this.helperText_) {
            this.helperText_.setContent(content);
        }
    };
    /**
     * Sets the aria label of the leading icon.
     */
    MDCTextFieldFoundation.prototype.setLeadingIconAriaLabel = function (label) {
        if (this.leadingIcon_) {
            this.leadingIcon_.setAriaLabel(label);
        }
    };
    /**
     * Sets the text content of the leading icon.
     */
    MDCTextFieldFoundation.prototype.setLeadingIconContent = function (content) {
        if (this.leadingIcon_) {
            this.leadingIcon_.setContent(content);
        }
    };
    /**
     * Sets the aria label of the trailing icon.
     */
    MDCTextFieldFoundation.prototype.setTrailingIconAriaLabel = function (label) {
        if (this.trailingIcon_) {
            this.trailingIcon_.setAriaLabel(label);
        }
    };
    /**
     * Sets the text content of the trailing icon.
     */
    MDCTextFieldFoundation.prototype.setTrailingIconContent = function (content) {
        if (this.trailingIcon_) {
            this.trailingIcon_.setContent(content);
        }
    };
    /**
     * Sets character counter values that shows characters used and the total character limit.
     */
    MDCTextFieldFoundation.prototype.setCharacterCounter_ = function (currentLength) {
        if (!this.characterCounter_) {
            return;
        }
        var maxLength = this.getNativeInput_().maxLength;
        if (maxLength === -1) {
            throw new Error('MDCTextFieldFoundation: Expected maxlength html property on text input or textarea.');
        }
        this.characterCounter_.setCounterValue(currentLength, maxLength);
    };
    /**
     * @return True if the Text Field input fails in converting the user-supplied value.
     */
    MDCTextFieldFoundation.prototype.isBadInput_ = function () {
        // The badInput property is not supported in IE 11 💩.
        return this.getNativeInput_().validity.badInput || false;
    };
    /**
     * @return The result of native validity checking (ValidityState.valid).
     */
    MDCTextFieldFoundation.prototype.isNativeInputValid_ = function () {
        return this.getNativeInput_().validity.valid;
    };
    /**
     * Styles the component based on the validity state.
     */
    MDCTextFieldFoundation.prototype.styleValidity_ = function (isValid) {
        var INVALID = MDCTextFieldFoundation.cssClasses.INVALID;
        if (isValid) {
            this.adapter_.removeClass(INVALID);
        }
        else {
            this.adapter_.addClass(INVALID);
        }
        if (this.helperText_) {
            this.helperText_.setValidity(isValid);
        }
    };
    /**
     * Styles the component based on the focused state.
     */
    MDCTextFieldFoundation.prototype.styleFocused_ = function (isFocused) {
        var FOCUSED = MDCTextFieldFoundation.cssClasses.FOCUSED;
        if (isFocused) {
            this.adapter_.addClass(FOCUSED);
        }
        else {
            this.adapter_.removeClass(FOCUSED);
        }
    };
    /**
     * Styles the component based on the disabled state.
     */
    MDCTextFieldFoundation.prototype.styleDisabled_ = function (isDisabled) {
        var _a = MDCTextFieldFoundation.cssClasses, DISABLED = _a.DISABLED, INVALID = _a.INVALID;
        if (isDisabled) {
            this.adapter_.addClass(DISABLED);
            this.adapter_.removeClass(INVALID);
        }
        else {
            this.adapter_.removeClass(DISABLED);
        }
        if (this.leadingIcon_) {
            this.leadingIcon_.setDisabled(isDisabled);
        }
        if (this.trailingIcon_) {
            this.trailingIcon_.setDisabled(isDisabled);
        }
    };
    /**
     * @return The native text input element from the host environment, or an object with the same shape for unit tests.
     */
    MDCTextFieldFoundation.prototype.getNativeInput_ = function () {
        // this.adapter_ may be undefined in foundation unit tests. This happens when testdouble is creating a mock object
        // and invokes the shouldShake/shouldFloat getters (which in turn call getValue(), which calls this method) before
        // init() has been called from the MDCTextField constructor. To work around that issue, we return a dummy object.
        var nativeInput = this.adapter_ ? this.adapter_.getNativeInput() : null;
        return nativeInput || {
            disabled: false,
            maxLength: -1,
            type: 'input',
            validity: {
                badInput: false,
                valid: true,
            },
            value: '',
        };
    };
    return MDCTextFieldFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$8 = {
    HELPER_TEXT_PERSISTENT: 'mdc-text-field-helper-text--persistent',
    HELPER_TEXT_VALIDATION_MSG: 'mdc-text-field-helper-text--validation-msg',
    ROOT: 'mdc-text-field-helper-text',
};
var strings$6 = {
    ARIA_HIDDEN: 'aria-hidden',
    ROLE: 'role',
    ROOT_SELECTOR: "." + cssClasses$8.ROOT,
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCTextFieldHelperTextFoundation = /** @class */ (function (_super) {
    __extends(MDCTextFieldHelperTextFoundation, _super);
    function MDCTextFieldHelperTextFoundation(adapter) {
        return _super.call(this, __assign({}, MDCTextFieldHelperTextFoundation.defaultAdapter, adapter)) || this;
    }
    Object.defineProperty(MDCTextFieldHelperTextFoundation, "cssClasses", {
        get: function () {
            return cssClasses$8;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldHelperTextFoundation, "strings", {
        get: function () {
            return strings$6;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldHelperTextFoundation, "defaultAdapter", {
        /**
         * See {@link MDCTextFieldHelperTextAdapter} for typing information on parameters and return types.
         */
        get: function () {
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                addClass: function () { return undefined; },
                removeClass: function () { return undefined; },
                hasClass: function () { return false; },
                setAttr: function () { return undefined; },
                removeAttr: function () { return undefined; },
                setContent: function () { return undefined; },
            };
            // tslint:enable:object-literal-sort-keys
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Sets the content of the helper text field.
     */
    MDCTextFieldHelperTextFoundation.prototype.setContent = function (content) {
        this.adapter_.setContent(content);
    };
    /**
     * @param isPersistent Sets the persistency of the helper text.
     */
    MDCTextFieldHelperTextFoundation.prototype.setPersistent = function (isPersistent) {
        if (isPersistent) {
            this.adapter_.addClass(cssClasses$8.HELPER_TEXT_PERSISTENT);
        }
        else {
            this.adapter_.removeClass(cssClasses$8.HELPER_TEXT_PERSISTENT);
        }
    };
    /**
     * @param isValidation True to make the helper text act as an error validation message.
     */
    MDCTextFieldHelperTextFoundation.prototype.setValidation = function (isValidation) {
        if (isValidation) {
            this.adapter_.addClass(cssClasses$8.HELPER_TEXT_VALIDATION_MSG);
        }
        else {
            this.adapter_.removeClass(cssClasses$8.HELPER_TEXT_VALIDATION_MSG);
        }
    };
    /**
     * Makes the helper text visible to the screen reader.
     */
    MDCTextFieldHelperTextFoundation.prototype.showToScreenReader = function () {
        this.adapter_.removeAttr(strings$6.ARIA_HIDDEN);
    };
    /**
     * Sets the validity of the helper text based on the input validity.
     */
    MDCTextFieldHelperTextFoundation.prototype.setValidity = function (inputIsValid) {
        var helperTextIsPersistent = this.adapter_.hasClass(cssClasses$8.HELPER_TEXT_PERSISTENT);
        var helperTextIsValidationMsg = this.adapter_.hasClass(cssClasses$8.HELPER_TEXT_VALIDATION_MSG);
        var validationMsgNeedsDisplay = helperTextIsValidationMsg && !inputIsValid;
        if (validationMsgNeedsDisplay) {
            this.adapter_.setAttr(strings$6.ROLE, 'alert');
        }
        else {
            this.adapter_.removeAttr(strings$6.ROLE);
        }
        if (!helperTextIsPersistent && !validationMsgNeedsDisplay) {
            this.hide_();
        }
    };
    /**
     * Hides the help text from screen readers.
     */
    MDCTextFieldHelperTextFoundation.prototype.hide_ = function () {
        this.adapter_.setAttr(strings$6.ARIA_HIDDEN, 'true');
    };
    return MDCTextFieldHelperTextFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCTextFieldHelperText = /** @class */ (function (_super) {
    __extends(MDCTextFieldHelperText, _super);
    function MDCTextFieldHelperText() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCTextFieldHelperText.attachTo = function (root) {
        return new MDCTextFieldHelperText(root);
    };
    Object.defineProperty(MDCTextFieldHelperText.prototype, "foundation", {
        get: function () {
            return this.foundation_;
        },
        enumerable: true,
        configurable: true
    });
    MDCTextFieldHelperText.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        var adapter = {
            addClass: function (className) { return _this.root_.classList.add(className); },
            removeClass: function (className) { return _this.root_.classList.remove(className); },
            hasClass: function (className) { return _this.root_.classList.contains(className); },
            setAttr: function (attr, value) { return _this.root_.setAttribute(attr, value); },
            removeAttr: function (attr) { return _this.root_.removeAttribute(attr); },
            setContent: function (content) {
                _this.root_.textContent = content;
            },
        };
        // tslint:enable:object-literal-sort-keys
        return new MDCTextFieldHelperTextFoundation(adapter);
    };
    return MDCTextFieldHelperText;
}(MDCComponent));
//# sourceMappingURL=component.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var strings$7 = {
    ICON_EVENT: 'MDCTextField:icon',
    ICON_ROLE: 'button',
};
var cssClasses$9 = {
    ROOT: 'mdc-text-field__icon',
};
//# sourceMappingURL=constants.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var INTERACTION_EVENTS$1 = ['click', 'keydown'];
var MDCTextFieldIconFoundation = /** @class */ (function (_super) {
    __extends(MDCTextFieldIconFoundation, _super);
    function MDCTextFieldIconFoundation(adapter) {
        var _this = _super.call(this, __assign({}, MDCTextFieldIconFoundation.defaultAdapter, adapter)) || this;
        _this.savedTabIndex_ = null;
        _this.interactionHandler_ = function (evt) { return _this.handleInteraction(evt); };
        return _this;
    }
    Object.defineProperty(MDCTextFieldIconFoundation, "strings", {
        get: function () {
            return strings$7;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldIconFoundation, "cssClasses", {
        get: function () {
            return cssClasses$9;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextFieldIconFoundation, "defaultAdapter", {
        /**
         * See {@link MDCTextFieldIconAdapter} for typing information on parameters and return types.
         */
        get: function () {
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            return {
                getAttr: function () { return null; },
                setAttr: function () { return undefined; },
                removeAttr: function () { return undefined; },
                setContent: function () { return undefined; },
                registerInteractionHandler: function () { return undefined; },
                deregisterInteractionHandler: function () { return undefined; },
                notifyIconAction: function () { return undefined; },
            };
            // tslint:enable:object-literal-sort-keys
        },
        enumerable: true,
        configurable: true
    });
    MDCTextFieldIconFoundation.prototype.init = function () {
        var _this = this;
        this.savedTabIndex_ = this.adapter_.getAttr('tabindex');
        INTERACTION_EVENTS$1.forEach(function (evtType) {
            _this.adapter_.registerInteractionHandler(evtType, _this.interactionHandler_);
        });
    };
    MDCTextFieldIconFoundation.prototype.destroy = function () {
        var _this = this;
        INTERACTION_EVENTS$1.forEach(function (evtType) {
            _this.adapter_.deregisterInteractionHandler(evtType, _this.interactionHandler_);
        });
    };
    MDCTextFieldIconFoundation.prototype.setDisabled = function (disabled) {
        if (!this.savedTabIndex_) {
            return;
        }
        if (disabled) {
            this.adapter_.setAttr('tabindex', '-1');
            this.adapter_.removeAttr('role');
        }
        else {
            this.adapter_.setAttr('tabindex', this.savedTabIndex_);
            this.adapter_.setAttr('role', strings$7.ICON_ROLE);
        }
    };
    MDCTextFieldIconFoundation.prototype.setAriaLabel = function (label) {
        this.adapter_.setAttr('aria-label', label);
    };
    MDCTextFieldIconFoundation.prototype.setContent = function (content) {
        this.adapter_.setContent(content);
    };
    MDCTextFieldIconFoundation.prototype.handleInteraction = function (evt) {
        var isEnterKey = evt.key === 'Enter' || evt.keyCode === 13;
        if (evt.type === 'click' || isEnterKey) {
            this.adapter_.notifyIconAction();
        }
    };
    return MDCTextFieldIconFoundation;
}(MDCFoundation));
//# sourceMappingURL=foundation.js.map

/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCTextFieldIcon = /** @class */ (function (_super) {
    __extends(MDCTextFieldIcon, _super);
    function MDCTextFieldIcon() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCTextFieldIcon.attachTo = function (root) {
        return new MDCTextFieldIcon(root);
    };
    Object.defineProperty(MDCTextFieldIcon.prototype, "foundation", {
        get: function () {
            return this.foundation_;
        },
        enumerable: true,
        configurable: true
    });
    MDCTextFieldIcon.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        var adapter = {
            getAttr: function (attr) { return _this.root_.getAttribute(attr); },
            setAttr: function (attr, value) { return _this.root_.setAttribute(attr, value); },
            removeAttr: function (attr) { return _this.root_.removeAttribute(attr); },
            setContent: function (content) {
                _this.root_.textContent = content;
            },
            registerInteractionHandler: function (evtType, handler) { return _this.listen(evtType, handler); },
            deregisterInteractionHandler: function (evtType, handler) { return _this.unlisten(evtType, handler); },
            notifyIconAction: function () { return _this.emit(MDCTextFieldIconFoundation.strings.ICON_EVENT, {} /* evtData */, true /* shouldBubble */); },
        };
        // tslint:enable:object-literal-sort-keys
        return new MDCTextFieldIconFoundation(adapter);
    };
    return MDCTextFieldIcon;
}(MDCComponent));
//# sourceMappingURL=component.js.map

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCTextField = /** @class */ (function (_super) {
    __extends(MDCTextField, _super);
    function MDCTextField() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCTextField.attachTo = function (root) {
        return new MDCTextField(root);
    };
    MDCTextField.prototype.initialize = function (rippleFactory, lineRippleFactory, helperTextFactory, characterCounterFactory, iconFactory, labelFactory, outlineFactory) {
        if (rippleFactory === void 0) { rippleFactory = function (el, foundation) { return new MDCRipple(el, foundation); }; }
        if (lineRippleFactory === void 0) { lineRippleFactory = function (el) { return new MDCLineRipple(el); }; }
        if (helperTextFactory === void 0) { helperTextFactory = function (el) { return new MDCTextFieldHelperText(el); }; }
        if (characterCounterFactory === void 0) { characterCounterFactory = function (el) { return new MDCTextFieldCharacterCounter(el); }; }
        if (iconFactory === void 0) { iconFactory = function (el) { return new MDCTextFieldIcon(el); }; }
        if (labelFactory === void 0) { labelFactory = function (el) { return new MDCFloatingLabel(el); }; }
        if (outlineFactory === void 0) { outlineFactory = function (el) { return new MDCNotchedOutline(el); }; }
        this.input_ = this.root_.querySelector(strings$5.INPUT_SELECTOR);
        var labelElement = this.root_.querySelector(strings$5.LABEL_SELECTOR);
        this.label_ = labelElement ? labelFactory(labelElement) : null;
        var lineRippleElement = this.root_.querySelector(strings$5.LINE_RIPPLE_SELECTOR);
        this.lineRipple_ = lineRippleElement ? lineRippleFactory(lineRippleElement) : null;
        var outlineElement = this.root_.querySelector(strings$5.OUTLINE_SELECTOR);
        this.outline_ = outlineElement ? outlineFactory(outlineElement) : null;
        // Helper text
        var helperTextStrings = MDCTextFieldHelperTextFoundation.strings;
        var nextElementSibling = this.root_.nextElementSibling;
        var hasHelperLine = (nextElementSibling && nextElementSibling.classList.contains(cssClasses$7.HELPER_LINE));
        var helperTextEl = hasHelperLine && nextElementSibling && nextElementSibling.querySelector(helperTextStrings.ROOT_SELECTOR);
        this.helperText_ = helperTextEl ? helperTextFactory(helperTextEl) : null;
        // Character counter
        var characterCounterStrings = MDCTextFieldCharacterCounterFoundation.strings;
        var characterCounterEl = this.root_.querySelector(characterCounterStrings.ROOT_SELECTOR);
        // If character counter is not found in root element search in sibling element.
        if (!characterCounterEl && hasHelperLine && nextElementSibling) {
            characterCounterEl = nextElementSibling.querySelector(characterCounterStrings.ROOT_SELECTOR);
        }
        this.characterCounter_ = characterCounterEl ? characterCounterFactory(characterCounterEl) : null;
        this.leadingIcon_ = null;
        this.trailingIcon_ = null;
        var iconElements = this.root_.querySelectorAll(strings$5.ICON_SELECTOR);
        if (iconElements.length > 0) {
            if (iconElements.length > 1) { // Has both icons.
                this.leadingIcon_ = iconFactory(iconElements[0]);
                this.trailingIcon_ = iconFactory(iconElements[1]);
            }
            else {
                if (this.root_.classList.contains(cssClasses$7.WITH_LEADING_ICON)) {
                    this.leadingIcon_ = iconFactory(iconElements[0]);
                }
                else {
                    this.trailingIcon_ = iconFactory(iconElements[0]);
                }
            }
        }
        this.ripple = this.createRipple_(rippleFactory);
    };
    MDCTextField.prototype.destroy = function () {
        if (this.ripple) {
            this.ripple.destroy();
        }
        if (this.lineRipple_) {
            this.lineRipple_.destroy();
        }
        if (this.helperText_) {
            this.helperText_.destroy();
        }
        if (this.characterCounter_) {
            this.characterCounter_.destroy();
        }
        if (this.leadingIcon_) {
            this.leadingIcon_.destroy();
        }
        if (this.trailingIcon_) {
            this.trailingIcon_.destroy();
        }
        if (this.label_) {
            this.label_.destroy();
        }
        if (this.outline_) {
            this.outline_.destroy();
        }
        _super.prototype.destroy.call(this);
    };
    /**
     * Initializes the Text Field's internal state based on the environment's
     * state.
     */
    MDCTextField.prototype.initialSyncWithDOM = function () {
        this.disabled = this.input_.disabled;
    };
    Object.defineProperty(MDCTextField.prototype, "value", {
        get: function () {
            return this.foundation_.getValue();
        },
        /**
         * @param value The value to set on the input.
         */
        set: function (value) {
            this.foundation_.setValue(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "disabled", {
        get: function () {
            return this.foundation_.isDisabled();
        },
        /**
         * @param disabled Sets the Text Field disabled or enabled.
         */
        set: function (disabled) {
            this.foundation_.setDisabled(disabled);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "valid", {
        get: function () {
            return this.foundation_.isValid();
        },
        /**
         * @param valid Sets the Text Field valid or invalid.
         */
        set: function (valid) {
            this.foundation_.setValid(valid);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "required", {
        get: function () {
            return this.input_.required;
        },
        /**
         * @param required Sets the Text Field to required.
         */
        set: function (required) {
            this.input_.required = required;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "pattern", {
        get: function () {
            return this.input_.pattern;
        },
        /**
         * @param pattern Sets the input element's validation pattern.
         */
        set: function (pattern) {
            this.input_.pattern = pattern;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "minLength", {
        get: function () {
            return this.input_.minLength;
        },
        /**
         * @param minLength Sets the input element's minLength.
         */
        set: function (minLength) {
            this.input_.minLength = minLength;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "maxLength", {
        get: function () {
            return this.input_.maxLength;
        },
        /**
         * @param maxLength Sets the input element's maxLength.
         */
        set: function (maxLength) {
            // Chrome throws exception if maxLength is set to a value less than zero
            if (maxLength < 0) {
                this.input_.removeAttribute('maxLength');
            }
            else {
                this.input_.maxLength = maxLength;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "min", {
        get: function () {
            return this.input_.min;
        },
        /**
         * @param min Sets the input element's min.
         */
        set: function (min) {
            this.input_.min = min;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "max", {
        get: function () {
            return this.input_.max;
        },
        /**
         * @param max Sets the input element's max.
         */
        set: function (max) {
            this.input_.max = max;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "step", {
        get: function () {
            return this.input_.step;
        },
        /**
         * @param step Sets the input element's step.
         */
        set: function (step) {
            this.input_.step = step;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "helperTextContent", {
        /**
         * Sets the helper text element content.
         */
        set: function (content) {
            this.foundation_.setHelperTextContent(content);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "leadingIconAriaLabel", {
        /**
         * Sets the aria label of the leading icon.
         */
        set: function (label) {
            this.foundation_.setLeadingIconAriaLabel(label);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "leadingIconContent", {
        /**
         * Sets the text content of the leading icon.
         */
        set: function (content) {
            this.foundation_.setLeadingIconContent(content);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "trailingIconAriaLabel", {
        /**
         * Sets the aria label of the trailing icon.
         */
        set: function (label) {
            this.foundation_.setTrailingIconAriaLabel(label);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "trailingIconContent", {
        /**
         * Sets the text content of the trailing icon.
         */
        set: function (content) {
            this.foundation_.setTrailingIconContent(content);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MDCTextField.prototype, "useNativeValidation", {
        /**
         * Enables or disables the use of native validation. Use this for custom validation.
         * @param useNativeValidation Set this to false to ignore native input validation.
         */
        set: function (useNativeValidation) {
            this.foundation_.setUseNativeValidation(useNativeValidation);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Focuses the input element.
     */
    MDCTextField.prototype.focus = function () {
        this.input_.focus();
    };
    /**
     * Recomputes the outline SVG path for the outline element.
     */
    MDCTextField.prototype.layout = function () {
        var openNotch = this.foundation_.shouldFloat;
        this.foundation_.notchOutline(openNotch);
    };
    MDCTextField.prototype.getDefaultFoundation = function () {
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        var adapter = __assign({}, this.getRootAdapterMethods_(), this.getInputAdapterMethods_(), this.getLabelAdapterMethods_(), this.getLineRippleAdapterMethods_(), this.getOutlineAdapterMethods_());
        // tslint:enable:object-literal-sort-keys
        return new MDCTextFieldFoundation(adapter, this.getFoundationMap_());
    };
    MDCTextField.prototype.getRootAdapterMethods_ = function () {
        var _this = this;
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        return {
            addClass: function (className) { return _this.root_.classList.add(className); },
            removeClass: function (className) { return _this.root_.classList.remove(className); },
            hasClass: function (className) { return _this.root_.classList.contains(className); },
            registerTextFieldInteractionHandler: function (evtType, handler) { return _this.listen(evtType, handler); },
            deregisterTextFieldInteractionHandler: function (evtType, handler) { return _this.unlisten(evtType, handler); },
            registerValidationAttributeChangeHandler: function (handler) {
                var getAttributesList = function (mutationsList) {
                    return mutationsList
                        .map(function (mutation) { return mutation.attributeName; })
                        .filter(function (attributeName) { return attributeName; });
                };
                var observer = new MutationObserver(function (mutationsList) { return handler(getAttributesList(mutationsList)); });
                var config = { attributes: true };
                observer.observe(_this.input_, config);
                return observer;
            },
            deregisterValidationAttributeChangeHandler: function (observer) { return observer.disconnect(); },
        };
        // tslint:enable:object-literal-sort-keys
    };
    MDCTextField.prototype.getInputAdapterMethods_ = function () {
        var _this = this;
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        return {
            getNativeInput: function () { return _this.input_; },
            isFocused: function () { return document.activeElement === _this.input_; },
            registerInputInteractionHandler: function (evtType, handler) {
                return _this.input_.addEventListener(evtType, handler, applyPassive());
            },
            deregisterInputInteractionHandler: function (evtType, handler) {
                return _this.input_.removeEventListener(evtType, handler, applyPassive());
            },
        };
        // tslint:enable:object-literal-sort-keys
    };
    MDCTextField.prototype.getLabelAdapterMethods_ = function () {
        var _this = this;
        return {
            floatLabel: function (shouldFloat) { return _this.label_ && _this.label_.float(shouldFloat); },
            getLabelWidth: function () { return _this.label_ ? _this.label_.getWidth() : 0; },
            hasLabel: function () { return Boolean(_this.label_); },
            shakeLabel: function (shouldShake) { return _this.label_ && _this.label_.shake(shouldShake); },
        };
    };
    MDCTextField.prototype.getLineRippleAdapterMethods_ = function () {
        var _this = this;
        return {
            activateLineRipple: function () {
                if (_this.lineRipple_) {
                    _this.lineRipple_.activate();
                }
            },
            deactivateLineRipple: function () {
                if (_this.lineRipple_) {
                    _this.lineRipple_.deactivate();
                }
            },
            setLineRippleTransformOrigin: function (normalizedX) {
                if (_this.lineRipple_) {
                    _this.lineRipple_.setRippleCenter(normalizedX);
                }
            },
        };
    };
    MDCTextField.prototype.getOutlineAdapterMethods_ = function () {
        var _this = this;
        return {
            closeOutline: function () { return _this.outline_ && _this.outline_.closeNotch(); },
            hasOutline: function () { return Boolean(_this.outline_); },
            notchOutline: function (labelWidth) { return _this.outline_ && _this.outline_.notch(labelWidth); },
        };
    };
    /**
     * @return A map of all subcomponents to subfoundations.
     */
    MDCTextField.prototype.getFoundationMap_ = function () {
        return {
            characterCounter: this.characterCounter_ ? this.characterCounter_.foundation : undefined,
            helperText: this.helperText_ ? this.helperText_.foundation : undefined,
            leadingIcon: this.leadingIcon_ ? this.leadingIcon_.foundation : undefined,
            trailingIcon: this.trailingIcon_ ? this.trailingIcon_.foundation : undefined,
        };
    };
    MDCTextField.prototype.createRipple_ = function (rippleFactory) {
        var _this = this;
        var isTextArea = this.root_.classList.contains(cssClasses$7.TEXTAREA);
        var isOutlined = this.root_.classList.contains(cssClasses$7.OUTLINED);
        if (isTextArea || isOutlined) {
            return null;
        }
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
        var adapter = __assign({}, MDCRipple.createAdapter(this), { isSurfaceActive: function () { return matches(_this.input_, ':active'); }, registerInteractionHandler: function (evtType, handler) { return _this.input_.addEventListener(evtType, handler, applyPassive()); }, deregisterInteractionHandler: function (evtType, handler) {
                return _this.input_.removeEventListener(evtType, handler, applyPassive());
            } });
        // tslint:enable:object-literal-sort-keys
        return rippleFactory(this.root_, new MDCRippleFoundation(adapter));
    };
    return MDCTextField;
}(MDCComponent));
//# sourceMappingURL=component.js.map

function prefixFilter$1(obj, prefix) {
  let names = Object.getOwnPropertyNames(obj);
  const newObj = {};

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name.substring(0, prefix.length) === prefix) {
      newObj[name.substring(prefix.length)] = obj[name];
    }
  }

  return newObj;
}

/* node_modules\@smui\floating-label\FloatingLabel.svelte generated by Svelte v3.12.1 */

const file$7 = "node_modules\\@smui\\floating-label\\FloatingLabel.svelte";

// (9:0) {:else}
function create_else_block$2(ctx) {
	var label, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var label_levels = [
		{ class: "mdc-floating-label " + ctx.className },
		((ctx.forId || ctx.inputProps && ctx.inputProps.id) ? {'for': ctx.forId || ctx.inputProps && ctx.inputProps.id} : {}),
		exclude(ctx.$$props, ['use', 'class', 'for', 'wrapped'])
	];

	var label_data = {};
	for (var i = 0; i < label_levels.length; i += 1) {
		label_data = assign(label_data, label_levels[i]);
	}

	const block = {
		c: function create() {
			label = element("label");

			if (default_slot) default_slot.c();

			set_attributes(label, label_data);
			add_location(label, file$7, 9, 2, 225);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(label_nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, label, anchor);

			if (default_slot) {
				default_slot.m(label, null);
			}

			ctx.label_binding(label);
			useActions_action = useActions.call(null, label, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, label) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			set_attributes(label, get_spread_update(label_levels, [
				(changed.className) && { class: "mdc-floating-label " + ctx.className },
				(changed.forId || changed.inputProps) && ((ctx.forId || ctx.inputProps && ctx.inputProps.id) ? {'for': ctx.forId || ctx.inputProps && ctx.inputProps.id} : {}),
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'for', 'wrapped'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(label);
			}

			if (default_slot) default_slot.d(detaching);
			ctx.label_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$2.name, type: "else", source: "(9:0) {:else}", ctx });
	return block;
}

// (1:0) {#if wrapped}
function create_if_block$3(ctx) {
	var span, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var span_levels = [
		{ class: "mdc-floating-label " + ctx.className },
		exclude(ctx.$$props, ['use', 'class', 'wrapped'])
	];

	var span_data = {};
	for (var i = 0; i < span_levels.length; i += 1) {
		span_data = assign(span_data, span_levels[i]);
	}

	const block = {
		c: function create() {
			span = element("span");

			if (default_slot) default_slot.c();

			set_attributes(span, span_data);
			add_location(span, file$7, 1, 2, 16);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(span_nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);

			if (default_slot) {
				default_slot.m(span, null);
			}

			ctx.span_binding(span);
			useActions_action = useActions.call(null, span, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, span) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			set_attributes(span, get_spread_update(span_levels, [
				(changed.className) && { class: "mdc-floating-label " + ctx.className },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'wrapped'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(span);
			}

			if (default_slot) default_slot.d(detaching);
			ctx.span_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$3.name, type: "if", source: "(1:0) {#if wrapped}", ctx });
	return block;
}

function create_fragment$7(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$3,
		create_else_block$2
	];

	var if_blocks = [];

	function select_block_type(changed, ctx) {
		if (ctx.wrapped) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(changed, ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach_dev(if_block_anchor);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
	return block;
}

function instance$7($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);

  let { use = [], class: className = '', for: forId = '', wrapped = false } = $$props;

  let element;
  let floatingLabel;
  let inputProps = getContext('SMUI:generic:input:props') || {};

  onMount(() => {
    floatingLabel = new MDCFloatingLabel(element);
  });

  onDestroy(() => {
    floatingLabel && floatingLabel.destroy();
  });

  function shake(shouldShake, ...args) {
    return floatingLabel.shake(shouldShake, ...args);
  }

  function float(shouldFloat, ...args) {
    return floatingLabel.float(shouldFloat, ...args);
  }

  function getWidth(...args) {
    return floatingLabel.getWidth(...args);
  }

	let { $$slots = {}, $$scope } = $$props;

	function span_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	function label_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('for' in $$new_props) $$invalidate('forId', forId = $$new_props.for);
		if ('wrapped' in $$new_props) $$invalidate('wrapped', wrapped = $$new_props.wrapped);
		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { use, className, forId, wrapped, element, floatingLabel, inputProps };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('forId' in $$props) $$invalidate('forId', forId = $$new_props.forId);
		if ('wrapped' in $$props) $$invalidate('wrapped', wrapped = $$new_props.wrapped);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
		if ('floatingLabel' in $$props) floatingLabel = $$new_props.floatingLabel;
		if ('inputProps' in $$props) $$invalidate('inputProps', inputProps = $$new_props.inputProps);
	};

	return {
		forwardEvents,
		use,
		className,
		forId,
		wrapped,
		element,
		inputProps,
		shake,
		float,
		getWidth,
		$$props,
		span_binding,
		label_binding,
		$$props: $$props = exclude_internal_props($$props),
		$$slots,
		$$scope
	};
}

class FloatingLabel extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["use", "class", "for", "wrapped", "shake", "float", "getWidth"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "FloatingLabel", options, id: create_fragment$7.name });

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.shake === undefined && !('shake' in props)) {
			console.warn("<FloatingLabel> was created without expected prop 'shake'");
		}
		if (ctx.float === undefined && !('float' in props)) {
			console.warn("<FloatingLabel> was created without expected prop 'float'");
		}
		if (ctx.getWidth === undefined && !('getWidth' in props)) {
			console.warn("<FloatingLabel> was created without expected prop 'getWidth'");
		}
	}

	get use() {
		throw new Error("<FloatingLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<FloatingLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get for() {
		throw new Error("<FloatingLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set for(value) {
		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapped() {
		throw new Error("<FloatingLabel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapped(value) {
		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get shake() {
		return this.$$.ctx.shake;
	}

	set shake(value) {
		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get float() {
		return this.$$.ctx.float;
	}

	set float(value) {
		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get getWidth() {
		return this.$$.ctx.getWidth;
	}

	set getWidth(value) {
		throw new Error("<FloatingLabel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\@smui\line-ripple\LineRipple.svelte generated by Svelte v3.12.1 */

const file$8 = "node_modules\\@smui\\line-ripple\\LineRipple.svelte";

function create_fragment$8(ctx) {
	var div, useActions_action, forwardEvents_action;

	var div_levels = [
		{ class: "\n    mdc-line-ripple\n    " + ctx.className + "\n    " + (ctx.active ? 'mdc-line-ripple--active' : '') + "\n  " },
		exclude(ctx.$$props, ['use', 'class', 'active'])
	];

	var div_data = {};
	for (var i = 0; i < div_levels.length; i += 1) {
		div_data = assign(div_data, div_levels[i]);
	}

	const block = {
		c: function create() {
			div = element("div");
			set_attributes(div, div_data);
			add_location(div, file$8, 0, 0, 0);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			ctx.div_binding(div);
			useActions_action = useActions.call(null, div, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
		},

		p: function update(changed, ctx) {
			set_attributes(div, get_spread_update(div_levels, [
				(changed.className || changed.active) && { class: "\n    mdc-line-ripple\n    " + ctx.className + "\n    " + (ctx.active ? 'mdc-line-ripple--active' : '') + "\n  " },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'active'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			ctx.div_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
	return block;
}

function instance$8($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);

  let { use = [], class: className = '', active = false } = $$props;

  let element;
  let lineRipple;

  onMount(() => {
    lineRipple = new MDCLineRipple(element);
  });

  onDestroy(() => {
    lineRipple && lineRipple.destroy();
  });

  function activate(...args) {
    return lineRipple.activate(...args);
  }

  function deactivate(...args) {
    return lineRipple.deactivate(...args);
  }

  function setRippleCenter(xCoordinate, ...args) {
    return lineRipple.setRippleCenter(xCoordinate, ...args);
  }

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('active' in $$new_props) $$invalidate('active', active = $$new_props.active);
	};

	$$self.$capture_state = () => {
		return { use, className, active, element, lineRipple };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('active' in $$props) $$invalidate('active', active = $$new_props.active);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
		if ('lineRipple' in $$props) lineRipple = $$new_props.lineRipple;
	};

	return {
		forwardEvents,
		use,
		className,
		active,
		element,
		activate,
		deactivate,
		setRippleCenter,
		$$props,
		div_binding,
		$$props: $$props = exclude_internal_props($$props)
	};
}

class LineRipple extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["use", "class", "active", "activate", "deactivate", "setRippleCenter"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LineRipple", options, id: create_fragment$8.name });

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.activate === undefined && !('activate' in props)) {
			console.warn("<LineRipple> was created without expected prop 'activate'");
		}
		if (ctx.deactivate === undefined && !('deactivate' in props)) {
			console.warn("<LineRipple> was created without expected prop 'deactivate'");
		}
		if (ctx.setRippleCenter === undefined && !('setRippleCenter' in props)) {
			console.warn("<LineRipple> was created without expected prop 'setRippleCenter'");
		}
	}

	get use() {
		throw new Error("<LineRipple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<LineRipple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get active() {
		throw new Error("<LineRipple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set active(value) {
		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get activate() {
		return this.$$.ctx.activate;
	}

	set activate(value) {
		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get deactivate() {
		return this.$$.ctx.deactivate;
	}

	set deactivate(value) {
		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get setRippleCenter() {
		return this.$$.ctx.setRippleCenter;
	}

	set setRippleCenter(value) {
		throw new Error("<LineRipple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\@smui\notched-outline\NotchedOutline.svelte generated by Svelte v3.12.1 */

const file$9 = "node_modules\\@smui\\notched-outline\\NotchedOutline.svelte";

// (14:2) {#if !noLabel}
function create_if_block$4(ctx) {
	var div, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	const block = {
		c: function create() {
			div = element("div");

			if (default_slot) default_slot.c();

			attr_dev(div, "class", "mdc-notched-outline__notch");
			add_location(div, file$9, 14, 4, 367);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div_nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			if (default_slot) default_slot.d(detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$4.name, type: "if", source: "(14:2) {#if !noLabel}", ctx });
	return block;
}

function create_fragment$9(ctx) {
	var div2, div0, t0, t1, div1, useActions_action, forwardEvents_action, current;

	var if_block = (!ctx.noLabel) && create_if_block$4(ctx);

	var div2_levels = [
		{ class: "\n    mdc-notched-outline\n    " + ctx.className + "\n    " + (ctx.notched ? 'mdc-notched-outline--notched' : '') + "\n    " + (ctx.noLabel ? 'mdc-notched-outline--no-label' : '') + "\n  " },
		exclude(ctx.$$props, ['use', 'class', 'notched', 'noLabel'])
	];

	var div2_data = {};
	for (var i = 0; i < div2_levels.length; i += 1) {
		div2_data = assign(div2_data, div2_levels[i]);
	}

	const block = {
		c: function create() {
			div2 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			div1 = element("div");
			attr_dev(div0, "class", "mdc-notched-outline__leading");
			add_location(div0, file$9, 12, 2, 297);
			attr_dev(div1, "class", "mdc-notched-outline__trailing");
			add_location(div1, file$9, 16, 2, 437);
			set_attributes(div2, div2_data);
			add_location(div2, file$9, 0, 0, 0);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div2, anchor);
			append_dev(div2, div0);
			append_dev(div2, t0);
			if (if_block) if_block.m(div2, null);
			append_dev(div2, t1);
			append_dev(div2, div1);
			ctx.div2_binding(div2);
			useActions_action = useActions.call(null, div2, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, div2) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (!ctx.noLabel) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div2, t1);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			set_attributes(div2, get_spread_update(div2_levels, [
				(changed.className || changed.notched || changed.noLabel) && { class: "\n    mdc-notched-outline\n    " + ctx.className + "\n    " + (ctx.notched ? 'mdc-notched-outline--notched' : '') + "\n    " + (ctx.noLabel ? 'mdc-notched-outline--no-label' : '') + "\n  " },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'notched', 'noLabel'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div2);
			}

			if (if_block) if_block.d();
			ctx.div2_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$9.name, type: "component", source: "", ctx });
	return block;
}

function instance$9($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);

  let { use = [], class: className = '', notched = false, noLabel = false } = $$props;

  let element;
  let notchedOutline;

  onMount(() => {
    notchedOutline = new MDCNotchedOutline(element);
  });

  onDestroy(() => {
    notchedOutline && notchedOutline.destroy();
  });

  function notch(notchWidth, ...args) {
    return notchedOutline.notch(notchWidth, ...args);
  }

  function closeNotch(...args) {
    return notchedOutline.closeNotch(...args);
  }

	let { $$slots = {}, $$scope } = $$props;

	function div2_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('notched' in $$new_props) $$invalidate('notched', notched = $$new_props.notched);
		if ('noLabel' in $$new_props) $$invalidate('noLabel', noLabel = $$new_props.noLabel);
		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { use, className, notched, noLabel, element, notchedOutline };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('notched' in $$props) $$invalidate('notched', notched = $$new_props.notched);
		if ('noLabel' in $$props) $$invalidate('noLabel', noLabel = $$new_props.noLabel);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
		if ('notchedOutline' in $$props) notchedOutline = $$new_props.notchedOutline;
	};

	return {
		forwardEvents,
		use,
		className,
		notched,
		noLabel,
		element,
		notch,
		closeNotch,
		$$props,
		div2_binding,
		$$props: $$props = exclude_internal_props($$props),
		$$slots,
		$$scope
	};
}

class NotchedOutline extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["use", "class", "notched", "noLabel", "notch", "closeNotch"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "NotchedOutline", options, id: create_fragment$9.name });

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.notch === undefined && !('notch' in props)) {
			console.warn("<NotchedOutline> was created without expected prop 'notch'");
		}
		if (ctx.closeNotch === undefined && !('closeNotch' in props)) {
			console.warn("<NotchedOutline> was created without expected prop 'closeNotch'");
		}
	}

	get use() {
		throw new Error("<NotchedOutline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<NotchedOutline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get notched() {
		throw new Error("<NotchedOutline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set notched(value) {
		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noLabel() {
		throw new Error("<NotchedOutline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noLabel(value) {
		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get notch() {
		return this.$$.ctx.notch;
	}

	set notch(value) {
		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get closeNotch() {
		return this.$$.ctx.closeNotch;
	}

	set closeNotch(value) {
		throw new Error("<NotchedOutline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\@smui\textfield\Input.svelte generated by Svelte v3.12.1 */

const file$a = "node_modules\\@smui\\textfield\\Input.svelte";

function create_fragment$a(ctx) {
	var input, useActions_action, forwardEvents_action, dispose;

	var input_levels = [
		{ class: "mdc-text-field__input " + ctx.className },
		{ type: ctx.type },
		ctx.valueProp,
		exclude(ctx.$$props, ['use', 'class', 'type', 'value', 'files', 'dirty', 'invalid', 'updateInvalid'])
	];

	var input_data = {};
	for (var i = 0; i < input_levels.length; i += 1) {
		input_data = assign(input_data, input_levels[i]);
	}

	const block = {
		c: function create() {
			input = element("input");
			set_attributes(input, input_data);
			add_location(input, file$a, 0, 0, 0);

			dispose = [
				listen_dev(input, "change", ctx.change_handler),
				listen_dev(input, "input", ctx.input_handler),
				listen_dev(input, "change", ctx.changeHandler)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, input, anchor);
			ctx.input_binding(input);
			useActions_action = useActions.call(null, input, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, input) || {};
		},

		p: function update(changed, ctx) {
			set_attributes(input, get_spread_update(input_levels, [
				(changed.className) && { class: "mdc-text-field__input " + ctx.className },
				(changed.type) && { type: ctx.type },
				(changed.valueProp) && ctx.valueProp,
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'type', 'value', 'files', 'dirty', 'invalid', 'updateInvalid'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(input);
			}

			ctx.input_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
			run_all(dispose);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
	return block;
}

function toNumber(value) {
  if (value === '') {
    const nan = new Number(Number.NaN);
    nan.length = 0;
    return nan;
  }
  return +value;
}

function instance$a($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component, ['change', 'input']);

  let { use = [], class: className = '', type = 'text', value = '', files = undefined, dirty = false, invalid = false, updateInvalid = true } = $$props;

  let element;
  let valueProp = {};

  onMount(() => {
    if (updateInvalid) {
      $$invalidate('invalid', invalid = element.matches(':invalid'));
    }
  });

  function valueUpdater(e) {
    switch (type) {
      case 'number':
      case 'range':
        $$invalidate('value', value = toNumber(e.target.value));
        break;
      case 'file':
        $$invalidate('files', files = e.target.files);
        // Fall through.
      default:
        $$invalidate('value', value = e.target.value);
        break;
    }
  }

  function changeHandler(e) {
    $$invalidate('dirty', dirty = true);
    if (updateInvalid) {
      $$invalidate('invalid', invalid = element.matches(':invalid'));
    }
  }

	function input_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	const change_handler = (e) => (type === 'file' || type === 'range') && valueUpdater(e);

	const input_handler = (e) => type !== 'file' && valueUpdater(e);

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('type' in $$new_props) $$invalidate('type', type = $$new_props.type);
		if ('value' in $$new_props) $$invalidate('value', value = $$new_props.value);
		if ('files' in $$new_props) $$invalidate('files', files = $$new_props.files);
		if ('dirty' in $$new_props) $$invalidate('dirty', dirty = $$new_props.dirty);
		if ('invalid' in $$new_props) $$invalidate('invalid', invalid = $$new_props.invalid);
		if ('updateInvalid' in $$new_props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
	};

	$$self.$capture_state = () => {
		return { use, className, type, value, files, dirty, invalid, updateInvalid, element, valueProp };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('type' in $$props) $$invalidate('type', type = $$new_props.type);
		if ('value' in $$props) $$invalidate('value', value = $$new_props.value);
		if ('files' in $$props) $$invalidate('files', files = $$new_props.files);
		if ('dirty' in $$props) $$invalidate('dirty', dirty = $$new_props.dirty);
		if ('invalid' in $$props) $$invalidate('invalid', invalid = $$new_props.invalid);
		if ('updateInvalid' in $$props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
		if ('valueProp' in $$props) $$invalidate('valueProp', valueProp = $$new_props.valueProp);
	};

	$$self.$$.update = ($$dirty = { type: 1, valueProp: 1, value: 1 }) => {
		if ($$dirty.type || $$dirty.valueProp || $$dirty.value) { if (type === 'file') {
        delete valueProp.value;
      } else {
        $$invalidate('valueProp', valueProp.value = value === undefined ? '' : value, valueProp);
      } }
	};

	return {
		forwardEvents,
		use,
		className,
		type,
		value,
		files,
		dirty,
		invalid,
		updateInvalid,
		element,
		valueProp,
		valueUpdater,
		changeHandler,
		$$props,
		input_binding,
		change_handler,
		input_handler,
		$$props: $$props = exclude_internal_props($$props)
	};
}

class Input extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["use", "class", "type", "value", "files", "dirty", "invalid", "updateInvalid"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Input", options, id: create_fragment$a.name });
	}

	get use() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get type() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set type(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get files() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set files(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dirty() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dirty(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get invalid() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set invalid(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get updateInvalid() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set updateInvalid(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\@smui\textfield\Textarea.svelte generated by Svelte v3.12.1 */

const file$b = "node_modules\\@smui\\textfield\\Textarea.svelte";

function create_fragment$b(ctx) {
	var textarea, useActions_action, forwardEvents_action, dispose;

	var textarea_levels = [
		{ class: "mdc-text-field__input " + ctx.className },
		exclude(ctx.$$props, ['use', 'class', 'value', 'dirty', 'invalid', 'updateInvalid'])
	];

	var textarea_data = {};
	for (var i = 0; i < textarea_levels.length; i += 1) {
		textarea_data = assign(textarea_data, textarea_levels[i]);
	}

	const block = {
		c: function create() {
			textarea = element("textarea");
			set_attributes(textarea, textarea_data);
			add_location(textarea, file$b, 0, 0, 0);

			dispose = [
				listen_dev(textarea, "input", ctx.textarea_input_handler),
				listen_dev(textarea, "change", ctx.changeHandler)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, textarea, anchor);

			set_input_value(textarea, ctx.value);

			ctx.textarea_binding(textarea);
			useActions_action = useActions.call(null, textarea, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, textarea) || {};
		},

		p: function update(changed, ctx) {
			if (changed.value) set_input_value(textarea, ctx.value);

			set_attributes(textarea, get_spread_update(textarea_levels, [
				(changed.className) && { class: "mdc-text-field__input " + ctx.className },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'value', 'dirty', 'invalid', 'updateInvalid'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(textarea);
			}

			ctx.textarea_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
			run_all(dispose);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
	return block;
}

function instance$b($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component, ['change', 'input']);

  let { use = [], class: className = '', value = '', dirty = false, invalid = false, updateInvalid = true } = $$props;

  let element;

  onMount(() => {
    if (updateInvalid) {
      $$invalidate('invalid', invalid = element.matches(':invalid'));
    }
  });

  function changeHandler() {
    $$invalidate('dirty', dirty = true);
    if (updateInvalid) {
      $$invalidate('invalid', invalid = element.matches(':invalid'));
    }
  }

	function textarea_input_handler() {
		value = this.value;
		$$invalidate('value', value);
	}

	function textarea_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('value' in $$new_props) $$invalidate('value', value = $$new_props.value);
		if ('dirty' in $$new_props) $$invalidate('dirty', dirty = $$new_props.dirty);
		if ('invalid' in $$new_props) $$invalidate('invalid', invalid = $$new_props.invalid);
		if ('updateInvalid' in $$new_props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
	};

	$$self.$capture_state = () => {
		return { use, className, value, dirty, invalid, updateInvalid, element };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('value' in $$props) $$invalidate('value', value = $$new_props.value);
		if ('dirty' in $$props) $$invalidate('dirty', dirty = $$new_props.dirty);
		if ('invalid' in $$props) $$invalidate('invalid', invalid = $$new_props.invalid);
		if ('updateInvalid' in $$props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
	};

	return {
		forwardEvents,
		use,
		className,
		value,
		dirty,
		invalid,
		updateInvalid,
		element,
		changeHandler,
		$$props,
		textarea_input_handler,
		textarea_binding,
		$$props: $$props = exclude_internal_props($$props)
	};
}

class Textarea extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["use", "class", "value", "dirty", "invalid", "updateInvalid"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Textarea", options, id: create_fragment$b.name });
	}

	get use() {
		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dirty() {
		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dirty(value) {
		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get invalid() {
		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set invalid(value) {
		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get updateInvalid() {
		throw new Error("<Textarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set updateInvalid(value) {
		throw new Error("<Textarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\@smui\textfield\Textfield.svelte generated by Svelte v3.12.1 */

const file$c = "node_modules\\@smui\\textfield\\Textfield.svelte";

const get_label_slot_changes_1 = () => ({});
const get_label_slot_context_1 = () => ({});

const get_label_slot_changes$1 = () => ({});
const get_label_slot_context$1 = () => ({});

// (65:0) {:else}
function create_else_block_1$1(ctx) {
	var div, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var div_levels = [
		{ class: "\n      mdc-text-field\n      " + ctx.className + "\n      " + (ctx.disabled ? 'mdc-text-field--disabled' : '') + "\n      " + (ctx.fullwidth ? 'mdc-text-field--fullwidth' : '') + "\n      " + (ctx.textarea ? 'mdc-text-field--textarea' : '') + "\n      " + ((ctx.variant === 'outlined' && !ctx.fullwidth) ? 'mdc-text-field--outlined' : '') + "\n      " + ((ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea) ? 'smui-text-field--standard' : '') + "\n      " + (ctx.dense ? 'mdc-text-field--dense' : '') + "\n      " + (ctx.noLabel ? 'mdc-text-field--no-label' : '') + "\n      " + (ctx.withLeadingIcon ? 'mdc-text-field--with-leading-icon' : '') + "\n      " + (ctx.withTrailingIcon ? 'mdc-text-field--with-trailing-icon' : '') + "\n      " + (ctx.invalid ? 'mdc-text-field--invalid' : '') + "\n    " },
		ctx.props
	];

	var div_data = {};
	for (var i = 0; i < div_levels.length; i += 1) {
		div_data = assign(div_data, div_levels[i]);
	}

	const block = {
		c: function create() {
			div = element("div");

			if (default_slot) default_slot.c();

			set_attributes(div, div_data);
			add_location(div, file$c, 65, 2, 2082);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div_nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			ctx.div_binding(div);
			useActions_action = useActions.call(null, div, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, div) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			set_attributes(div, get_spread_update(div_levels, [
				(changed.className || changed.disabled || changed.fullwidth || changed.textarea || changed.variant || changed.dense || changed.noLabel || changed.withLeadingIcon || changed.withTrailingIcon || changed.invalid) && { class: "\n      mdc-text-field\n      " + ctx.className + "\n      " + (ctx.disabled ? 'mdc-text-field--disabled' : '') + "\n      " + (ctx.fullwidth ? 'mdc-text-field--fullwidth' : '') + "\n      " + (ctx.textarea ? 'mdc-text-field--textarea' : '') + "\n      " + ((ctx.variant === 'outlined' && !ctx.fullwidth) ? 'mdc-text-field--outlined' : '') + "\n      " + ((ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea) ? 'smui-text-field--standard' : '') + "\n      " + (ctx.dense ? 'mdc-text-field--dense' : '') + "\n      " + (ctx.noLabel ? 'mdc-text-field--no-label' : '') + "\n      " + (ctx.withLeadingIcon ? 'mdc-text-field--with-leading-icon' : '') + "\n      " + (ctx.withTrailingIcon ? 'mdc-text-field--with-trailing-icon' : '') + "\n      " + (ctx.invalid ? 'mdc-text-field--invalid' : '') + "\n    " },
				(changed.props) && ctx.props
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			if (default_slot) default_slot.d(detaching);
			ctx.div_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block_1$1.name, type: "else", source: "(65:0) {:else}", ctx });
	return block;
}

// (1:0) {#if valued}
function create_if_block$5(ctx) {
	var label_1, t0, current_block_type_index, if_block0, t1, t2, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var if_block_creators = [
		create_if_block_6,
		create_else_block$3
	];

	var if_blocks = [];

	function select_block_type_1(changed, ctx) {
		if (ctx.textarea) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_1(null, ctx);
	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	var if_block1 = (!ctx.textarea && ctx.variant !== 'outlined') && create_if_block_3$1(ctx);

	var if_block2 = (ctx.textarea || (ctx.variant === 'outlined' && !ctx.fullwidth)) && create_if_block_1$1(ctx);

	var label_1_levels = [
		{ class: "\n      mdc-text-field\n      " + ctx.className + "\n      " + (ctx.disabled ? 'mdc-text-field--disabled' : '') + "\n      " + (ctx.fullwidth ? 'mdc-text-field--fullwidth' : '') + "\n      " + (ctx.textarea ? 'mdc-text-field--textarea' : '') + "\n      " + ((ctx.variant === 'outlined' && !ctx.fullwidth) ? 'mdc-text-field--outlined' : '') + "\n      " + ((ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea) ? 'smui-text-field--standard' : '') + "\n      " + (ctx.dense ? 'mdc-text-field--dense' : '') + "\n      " + (ctx.noLabel || ctx.label == null ? 'mdc-text-field--no-label' : '') + "\n      " + (ctx.withLeadingIcon ? 'mdc-text-field--with-leading-icon' : '') + "\n      " + (ctx.withTrailingIcon ? 'mdc-text-field--with-trailing-icon' : '') + "\n      " + (ctx.invalid ? 'mdc-text-field--invalid' : '') + "\n    " },
		ctx.props
	];

	var label_1_data = {};
	for (var i = 0; i < label_1_levels.length; i += 1) {
		label_1_data = assign(label_1_data, label_1_levels[i]);
	}

	const block = {
		c: function create() {
			label_1 = element("label");

			if (default_slot) default_slot.c();
			t0 = space();
			if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			t2 = space();
			if (if_block2) if_block2.c();

			set_attributes(label_1, label_1_data);
			add_location(label_1, file$c, 1, 2, 15);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(label_1_nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, label_1, anchor);

			if (default_slot) {
				default_slot.m(label_1, null);
			}

			append_dev(label_1, t0);
			if_blocks[current_block_type_index].m(label_1, null);
			append_dev(label_1, t1);
			if (if_block1) if_block1.m(label_1, null);
			append_dev(label_1, t2);
			if (if_block2) if_block2.m(label_1, null);
			ctx.label_1_binding(label_1);
			useActions_action = useActions.call(null, label_1, ctx.use) || {};
			forwardEvents_action = ctx.forwardEvents.call(null, label_1) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(
					get_slot_changes(default_slot_template, ctx, changed, null),
					get_slot_context(default_slot_template, ctx, null)
				);
			}

			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_1(changed, ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block0 = if_blocks[current_block_type_index];
				if (!if_block0) {
					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block0.c();
				}
				transition_in(if_block0, 1);
				if_block0.m(label_1, t1);
			}

			if (!ctx.textarea && ctx.variant !== 'outlined') {
				if (if_block1) {
					if_block1.p(changed, ctx);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_3$1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(label_1, t2);
				}
			} else if (if_block1) {
				group_outros();
				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});
				check_outros();
			}

			if (ctx.textarea || (ctx.variant === 'outlined' && !ctx.fullwidth)) {
				if (if_block2) {
					if_block2.p(changed, ctx);
					transition_in(if_block2, 1);
				} else {
					if_block2 = create_if_block_1$1(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(label_1, null);
				}
			} else if (if_block2) {
				group_outros();
				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});
				check_outros();
			}

			set_attributes(label_1, get_spread_update(label_1_levels, [
				(changed.className || changed.disabled || changed.fullwidth || changed.textarea || changed.variant || changed.dense || changed.noLabel || changed.label || changed.withLeadingIcon || changed.withTrailingIcon || changed.invalid) && { class: "\n      mdc-text-field\n      " + ctx.className + "\n      " + (ctx.disabled ? 'mdc-text-field--disabled' : '') + "\n      " + (ctx.fullwidth ? 'mdc-text-field--fullwidth' : '') + "\n      " + (ctx.textarea ? 'mdc-text-field--textarea' : '') + "\n      " + ((ctx.variant === 'outlined' && !ctx.fullwidth) ? 'mdc-text-field--outlined' : '') + "\n      " + ((ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea) ? 'smui-text-field--standard' : '') + "\n      " + (ctx.dense ? 'mdc-text-field--dense' : '') + "\n      " + (ctx.noLabel || ctx.label == null ? 'mdc-text-field--no-label' : '') + "\n      " + (ctx.withLeadingIcon ? 'mdc-text-field--with-leading-icon' : '') + "\n      " + (ctx.withTrailingIcon ? 'mdc-text-field--with-trailing-icon' : '') + "\n      " + (ctx.invalid ? 'mdc-text-field--invalid' : '') + "\n    " },
				(changed.props) && ctx.props
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block2);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block2);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(label_1);
			}

			if (default_slot) default_slot.d(detaching);
			if_blocks[current_block_type_index].d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			ctx.label_1_binding(null);
			if (useActions_action && typeof useActions_action.destroy === 'function') useActions_action.destroy();
			if (forwardEvents_action && typeof forwardEvents_action.destroy === 'function') forwardEvents_action.destroy();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$5.name, type: "if", source: "(1:0) {#if valued}", ctx });
	return block;
}

// (34:4) {:else}
function create_else_block$3(ctx) {
	var updating_value, updating_files, updating_dirty, updating_invalid, current;

	var input_spread_levels = [
		{ type: ctx.type },
		{ disabled: ctx.disabled },
		{ updateInvalid: ctx.updateInvalid },
		((ctx.fullwidth && ctx.label) ? {placeholder: ctx.label} : {}),
		prefixFilter$1(ctx.$$props, 'input$')
	];

	function input_value_binding(value_1) {
		ctx.input_value_binding.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	function input_files_binding(value_2) {
		ctx.input_files_binding.call(null, value_2);
		updating_files = true;
		add_flush_callback(() => updating_files = false);
	}

	function input_dirty_binding(value_3) {
		ctx.input_dirty_binding.call(null, value_3);
		updating_dirty = true;
		add_flush_callback(() => updating_dirty = false);
	}

	function input_invalid_binding(value_4) {
		ctx.input_invalid_binding.call(null, value_4);
		updating_invalid = true;
		add_flush_callback(() => updating_invalid = false);
	}

	let input_props = {};
	for (var i = 0; i < input_spread_levels.length; i += 1) {
		input_props = assign(input_props, input_spread_levels[i]);
	}
	if (ctx.value !== void 0) {
		input_props.value = ctx.value;
	}
	if (ctx.files !== void 0) {
		input_props.files = ctx.files;
	}
	if (ctx.dirty !== void 0) {
		input_props.dirty = ctx.dirty;
	}
	if (ctx.invalid !== void 0) {
		input_props.invalid = ctx.invalid;
	}
	var input = new Input({ props: input_props, $$inline: true });

	binding_callbacks.push(() => bind(input, 'value', input_value_binding));
	binding_callbacks.push(() => bind(input, 'files', input_files_binding));
	binding_callbacks.push(() => bind(input, 'dirty', input_dirty_binding));
	binding_callbacks.push(() => bind(input, 'invalid', input_invalid_binding));
	input.$on("change", ctx.change_handler_1);
	input.$on("input", ctx.input_handler_1);

	const block = {
		c: function create() {
			input.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(input, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var input_changes = (changed.type || changed.disabled || changed.updateInvalid || changed.fullwidth || changed.label || changed.prefixFilter || changed.$$props) ? get_spread_update(input_spread_levels, [
									(changed.type) && { type: ctx.type },
			(changed.disabled) && { disabled: ctx.disabled },
			(changed.updateInvalid) && { updateInvalid: ctx.updateInvalid },
			(changed.fullwidth || changed.label) && get_spread_object(((ctx.fullwidth && ctx.label) ? {placeholder: ctx.label} : {})),
			(changed.prefixFilter || changed.$$props) && get_spread_object(prefixFilter$1(ctx.$$props, 'input$'))
								]) : {};
			if (!updating_value && changed.value) {
				input_changes.value = ctx.value;
			}
			if (!updating_files && changed.files) {
				input_changes.files = ctx.files;
			}
			if (!updating_dirty && changed.dirty) {
				input_changes.dirty = ctx.dirty;
			}
			if (!updating_invalid && changed.invalid) {
				input_changes.invalid = ctx.invalid;
			}
			input.$set(input_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(input.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(input.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(input, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$3.name, type: "else", source: "(34:4) {:else}", ctx });
	return block;
}

// (23:4) {#if textarea}
function create_if_block_6(ctx) {
	var updating_value, updating_dirty, updating_invalid, current;

	var textarea_1_spread_levels = [
		{ disabled: ctx.disabled },
		{ updateInvalid: ctx.updateInvalid },
		prefixFilter$1(ctx.$$props, 'input$')
	];

	function textarea_1_value_binding(value_1) {
		ctx.textarea_1_value_binding.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	function textarea_1_dirty_binding(value_2) {
		ctx.textarea_1_dirty_binding.call(null, value_2);
		updating_dirty = true;
		add_flush_callback(() => updating_dirty = false);
	}

	function textarea_1_invalid_binding(value_3) {
		ctx.textarea_1_invalid_binding.call(null, value_3);
		updating_invalid = true;
		add_flush_callback(() => updating_invalid = false);
	}

	let textarea_1_props = {};
	for (var i = 0; i < textarea_1_spread_levels.length; i += 1) {
		textarea_1_props = assign(textarea_1_props, textarea_1_spread_levels[i]);
	}
	if (ctx.value !== void 0) {
		textarea_1_props.value = ctx.value;
	}
	if (ctx.dirty !== void 0) {
		textarea_1_props.dirty = ctx.dirty;
	}
	if (ctx.invalid !== void 0) {
		textarea_1_props.invalid = ctx.invalid;
	}
	var textarea_1 = new Textarea({ props: textarea_1_props, $$inline: true });

	binding_callbacks.push(() => bind(textarea_1, 'value', textarea_1_value_binding));
	binding_callbacks.push(() => bind(textarea_1, 'dirty', textarea_1_dirty_binding));
	binding_callbacks.push(() => bind(textarea_1, 'invalid', textarea_1_invalid_binding));
	textarea_1.$on("change", ctx.change_handler);
	textarea_1.$on("input", ctx.input_handler);

	const block = {
		c: function create() {
			textarea_1.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(textarea_1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var textarea_1_changes = (changed.disabled || changed.updateInvalid || changed.prefixFilter || changed.$$props) ? get_spread_update(textarea_1_spread_levels, [
									(changed.disabled) && { disabled: ctx.disabled },
			(changed.updateInvalid) && { updateInvalid: ctx.updateInvalid },
			(changed.prefixFilter || changed.$$props) && get_spread_object(prefixFilter$1(ctx.$$props, 'input$'))
								]) : {};
			if (!updating_value && changed.value) {
				textarea_1_changes.value = ctx.value;
			}
			if (!updating_dirty && changed.dirty) {
				textarea_1_changes.dirty = ctx.dirty;
			}
			if (!updating_invalid && changed.invalid) {
				textarea_1_changes.invalid = ctx.invalid;
			}
			textarea_1.$set(textarea_1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(textarea_1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(textarea_1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(textarea_1, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_6.name, type: "if", source: "(23:4) {#if textarea}", ctx });
	return block;
}

// (49:4) {#if !textarea && variant !== 'outlined'}
function create_if_block_3$1(ctx) {
	var t, if_block1_anchor, current;

	var if_block0 = (!ctx.noLabel && ctx.label != null && !ctx.fullwidth) && create_if_block_5$1(ctx);

	var if_block1 = (ctx.ripple) && create_if_block_4$1(ctx);

	const block = {
		c: function create() {
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
		},

		m: function mount(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert_dev(target, t, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert_dev(target, if_block1_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (!ctx.noLabel && ctx.label != null && !ctx.fullwidth) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_5$1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(t.parentNode, t);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (ctx.ripple) {
				if (if_block1) {
					if_block1.p(changed, ctx);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_4$1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				group_outros();
				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block0) if_block0.d(detaching);

			if (detaching) {
				detach_dev(t);
			}

			if (if_block1) if_block1.d(detaching);

			if (detaching) {
				detach_dev(if_block1_anchor);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_3$1.name, type: "if", source: "(49:4) {#if !textarea && variant !== 'outlined'}", ctx });
	return block;
}

// (50:6) {#if !noLabel && label != null && !fullwidth}
function create_if_block_5$1(ctx) {
	var current;

	var floatinglabel_spread_levels = [
		{ wrapped: true },
		prefixFilter$1(ctx.$$props, 'label$')
	];

	let floatinglabel_props = {
		$$slots: { default: [create_default_slot_2] },
		$$scope: { ctx }
	};
	for (var i = 0; i < floatinglabel_spread_levels.length; i += 1) {
		floatinglabel_props = assign(floatinglabel_props, floatinglabel_spread_levels[i]);
	}
	var floatinglabel = new FloatingLabel({
		props: floatinglabel_props,
		$$inline: true
	});

	const block = {
		c: function create() {
			floatinglabel.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(floatinglabel, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var floatinglabel_changes = (changed.prefixFilter || changed.$$props) ? get_spread_update(floatinglabel_spread_levels, [
									floatinglabel_spread_levels[0],
			get_spread_object(prefixFilter$1(ctx.$$props, 'label$'))
								]) : {};
			if (changed.$$scope || changed.label) floatinglabel_changes.$$scope = { changed, ctx };
			floatinglabel.$set(floatinglabel_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(floatinglabel.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(floatinglabel.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(floatinglabel, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_5$1.name, type: "if", source: "(50:6) {#if !noLabel && label != null && !fullwidth}", ctx });
	return block;
}

// (51:8) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>
function create_default_slot_2(ctx) {
	var t, current;

	const label_slot_template = ctx.$$slots.label;
	const label_slot = create_slot(label_slot_template, ctx, get_label_slot_context$1);

	const block = {
		c: function create() {
			t = text(ctx.label);

			if (label_slot) label_slot.c();
		},

		l: function claim(nodes) {
			if (label_slot) label_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);

			if (label_slot) {
				label_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (!current || changed.label) {
				set_data_dev(t, ctx.label);
			}

			if (label_slot && label_slot.p && changed.$$scope) {
				label_slot.p(
					get_slot_changes(label_slot_template, ctx, changed, get_label_slot_changes$1),
					get_slot_context(label_slot_template, ctx, get_label_slot_context$1)
				);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(label_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(label_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(t);
			}

			if (label_slot) label_slot.d(detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2.name, type: "slot", source: "(51:8) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>", ctx });
	return block;
}

// (53:6) {#if ripple}
function create_if_block_4$1(ctx) {
	var current;

	var lineripple_spread_levels = [
		prefixFilter$1(ctx.$$props, 'ripple$')
	];

	let lineripple_props = {};
	for (var i = 0; i < lineripple_spread_levels.length; i += 1) {
		lineripple_props = assign(lineripple_props, lineripple_spread_levels[i]);
	}
	var lineripple = new LineRipple({ props: lineripple_props, $$inline: true });

	const block = {
		c: function create() {
			lineripple.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(lineripple, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var lineripple_changes = (changed.prefixFilter || changed.$$props) ? get_spread_update(lineripple_spread_levels, [
									get_spread_object(prefixFilter$1(ctx.$$props, 'ripple$'))
								]) : {};
			lineripple.$set(lineripple_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(lineripple.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(lineripple.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(lineripple, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_4$1.name, type: "if", source: "(53:6) {#if ripple}", ctx });
	return block;
}

// (57:4) {#if textarea || (variant === 'outlined' && !fullwidth)}
function create_if_block_1$1(ctx) {
	var current;

	var notchedoutline_spread_levels = [
		{ noLabel: ctx.noLabel || ctx.label == null },
		prefixFilter$1(ctx.$$props, 'outline$')
	];

	let notchedoutline_props = {
		$$slots: { default: [create_default_slot] },
		$$scope: { ctx }
	};
	for (var i = 0; i < notchedoutline_spread_levels.length; i += 1) {
		notchedoutline_props = assign(notchedoutline_props, notchedoutline_spread_levels[i]);
	}
	var notchedoutline = new NotchedOutline({
		props: notchedoutline_props,
		$$inline: true
	});

	const block = {
		c: function create() {
			notchedoutline.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(notchedoutline, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var notchedoutline_changes = (changed.noLabel || changed.label || changed.prefixFilter || changed.$$props) ? get_spread_update(notchedoutline_spread_levels, [
									(changed.noLabel || changed.label) && { noLabel: ctx.noLabel || ctx.label == null },
			(changed.prefixFilter || changed.$$props) && get_spread_object(prefixFilter$1(ctx.$$props, 'outline$'))
								]) : {};
			if (changed.$$scope || changed.noLabel || changed.label) notchedoutline_changes.$$scope = { changed, ctx };
			notchedoutline.$set(notchedoutline_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(notchedoutline.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(notchedoutline.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(notchedoutline, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$1.name, type: "if", source: "(57:4) {#if textarea || (variant === 'outlined' && !fullwidth)}", ctx });
	return block;
}

// (59:8) {#if !noLabel && label != null}
function create_if_block_2$1(ctx) {
	var current;

	var floatinglabel_spread_levels = [
		{ wrapped: true },
		prefixFilter$1(ctx.$$props, 'label$')
	];

	let floatinglabel_props = {
		$$slots: { default: [create_default_slot_1] },
		$$scope: { ctx }
	};
	for (var i = 0; i < floatinglabel_spread_levels.length; i += 1) {
		floatinglabel_props = assign(floatinglabel_props, floatinglabel_spread_levels[i]);
	}
	var floatinglabel = new FloatingLabel({
		props: floatinglabel_props,
		$$inline: true
	});

	const block = {
		c: function create() {
			floatinglabel.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(floatinglabel, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var floatinglabel_changes = (changed.prefixFilter || changed.$$props) ? get_spread_update(floatinglabel_spread_levels, [
									floatinglabel_spread_levels[0],
			get_spread_object(prefixFilter$1(ctx.$$props, 'label$'))
								]) : {};
			if (changed.$$scope || changed.label) floatinglabel_changes.$$scope = { changed, ctx };
			floatinglabel.$set(floatinglabel_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(floatinglabel.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(floatinglabel.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(floatinglabel, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2$1.name, type: "if", source: "(59:8) {#if !noLabel && label != null}", ctx });
	return block;
}

// (60:10) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>
function create_default_slot_1(ctx) {
	var t, current;

	const label_slot_template = ctx.$$slots.label;
	const label_slot = create_slot(label_slot_template, ctx, get_label_slot_context_1);

	const block = {
		c: function create() {
			t = text(ctx.label);

			if (label_slot) label_slot.c();
		},

		l: function claim(nodes) {
			if (label_slot) label_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);

			if (label_slot) {
				label_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (!current || changed.label) {
				set_data_dev(t, ctx.label);
			}

			if (label_slot && label_slot.p && changed.$$scope) {
				label_slot.p(
					get_slot_changes(label_slot_template, ctx, changed, get_label_slot_changes_1),
					get_slot_context(label_slot_template, ctx, get_label_slot_context_1)
				);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(label_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(label_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(t);
			}

			if (label_slot) label_slot.d(detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(60:10) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>", ctx });
	return block;
}

// (58:6) <NotchedOutline noLabel={noLabel || label == null} {...prefixFilter($$props, 'outline$')}>
function create_default_slot(ctx) {
	var if_block_anchor, current;

	var if_block = (!ctx.noLabel && ctx.label != null) && create_if_block_2$1(ctx);

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (!ctx.noLabel && ctx.label != null) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block_2$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach_dev(if_block_anchor);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(58:6) <NotchedOutline noLabel={noLabel || label == null} {...prefixFilter($$props, 'outline$')}>", ctx });
	return block;
}

function create_fragment$c(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$5,
		create_else_block_1$1
	];

	var if_blocks = [];

	function select_block_type(changed, ctx) {
		if (ctx.valued) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(null, ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(changed, ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach_dev(if_block_anchor);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
	return block;
}

function instance$c($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);
  let uninitializedValue = () => {};

  let { use = [], class: className = '', ripple = true, disabled = false, fullwidth = false, textarea = false, variant = 'standard', dense = false, withLeadingIcon = false, withTrailingIcon = false, noLabel = false, label = null, type = 'text', value = uninitializedValue, files = uninitializedValue, dirty = false, invalid = uninitializedValue, updateInvalid = invalid === uninitializedValue, useNativeValidation = updateInvalid } = $$props;

  let element;
  let textField;
  let addLayoutListener = getContext('SMUI:addLayoutListener');
  let removeLayoutListener;

  if (addLayoutListener) {
    removeLayoutListener = addLayoutListener(layout);
  }

  onMount(() => {
    $$invalidate('textField', textField = new MDCTextField(element));

    if (!ripple) {
      textField.ripple && textField.ripple.destroy();
    }
  });

  onDestroy(() => {
    textField && textField.destroy();

    if (removeLayoutListener) {
      removeLayoutListener();
    }
  });

  function focus(...args) {
    return textField.focus(...args);
  }

  function layout(...args) {
    return textField.layout(...args);
  }

	let { $$slots = {}, $$scope } = $$props;

	function change_handler(event) {
		bubble($$self, event);
	}

	function input_handler(event) {
		bubble($$self, event);
	}

	function change_handler_1(event) {
		bubble($$self, event);
	}

	function input_handler_1(event) {
		bubble($$self, event);
	}

	function textarea_1_value_binding(value_1) {
		value = value_1;
		$$invalidate('value', value);
	}

	function textarea_1_dirty_binding(value_2) {
		dirty = value_2;
		$$invalidate('dirty', dirty);
	}

	function textarea_1_invalid_binding(value_3) {
		invalid = value_3;
		$$invalidate('invalid', invalid), $$invalidate('textField', textField), $$invalidate('updateInvalid', updateInvalid), $$invalidate('value', value), $$invalidate('uninitializedValue', uninitializedValue), $$invalidate('disabled', disabled), $$invalidate('useNativeValidation', useNativeValidation);
	}

	function input_value_binding(value_1) {
		value = value_1;
		$$invalidate('value', value);
	}

	function input_files_binding(value_2) {
		files = value_2;
		$$invalidate('files', files);
	}

	function input_dirty_binding(value_3) {
		dirty = value_3;
		$$invalidate('dirty', dirty);
	}

	function input_invalid_binding(value_4) {
		invalid = value_4;
		$$invalidate('invalid', invalid), $$invalidate('textField', textField), $$invalidate('updateInvalid', updateInvalid), $$invalidate('value', value), $$invalidate('uninitializedValue', uninitializedValue), $$invalidate('disabled', disabled), $$invalidate('useNativeValidation', useNativeValidation);
	}

	function label_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('element', element = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$new_props) $$invalidate('use', use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
		if ('ripple' in $$new_props) $$invalidate('ripple', ripple = $$new_props.ripple);
		if ('disabled' in $$new_props) $$invalidate('disabled', disabled = $$new_props.disabled);
		if ('fullwidth' in $$new_props) $$invalidate('fullwidth', fullwidth = $$new_props.fullwidth);
		if ('textarea' in $$new_props) $$invalidate('textarea', textarea = $$new_props.textarea);
		if ('variant' in $$new_props) $$invalidate('variant', variant = $$new_props.variant);
		if ('dense' in $$new_props) $$invalidate('dense', dense = $$new_props.dense);
		if ('withLeadingIcon' in $$new_props) $$invalidate('withLeadingIcon', withLeadingIcon = $$new_props.withLeadingIcon);
		if ('withTrailingIcon' in $$new_props) $$invalidate('withTrailingIcon', withTrailingIcon = $$new_props.withTrailingIcon);
		if ('noLabel' in $$new_props) $$invalidate('noLabel', noLabel = $$new_props.noLabel);
		if ('label' in $$new_props) $$invalidate('label', label = $$new_props.label);
		if ('type' in $$new_props) $$invalidate('type', type = $$new_props.type);
		if ('value' in $$new_props) $$invalidate('value', value = $$new_props.value);
		if ('files' in $$new_props) $$invalidate('files', files = $$new_props.files);
		if ('dirty' in $$new_props) $$invalidate('dirty', dirty = $$new_props.dirty);
		if ('invalid' in $$new_props) $$invalidate('invalid', invalid = $$new_props.invalid);
		if ('updateInvalid' in $$new_props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
		if ('useNativeValidation' in $$new_props) $$invalidate('useNativeValidation', useNativeValidation = $$new_props.useNativeValidation);
		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { uninitializedValue, use, className, ripple, disabled, fullwidth, textarea, variant, dense, withLeadingIcon, withTrailingIcon, noLabel, label, type, value, files, dirty, invalid, updateInvalid, useNativeValidation, element, textField, addLayoutListener, removeLayoutListener, props, valued };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('uninitializedValue' in $$props) $$invalidate('uninitializedValue', uninitializedValue = $$new_props.uninitializedValue);
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('ripple' in $$props) $$invalidate('ripple', ripple = $$new_props.ripple);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$new_props.disabled);
		if ('fullwidth' in $$props) $$invalidate('fullwidth', fullwidth = $$new_props.fullwidth);
		if ('textarea' in $$props) $$invalidate('textarea', textarea = $$new_props.textarea);
		if ('variant' in $$props) $$invalidate('variant', variant = $$new_props.variant);
		if ('dense' in $$props) $$invalidate('dense', dense = $$new_props.dense);
		if ('withLeadingIcon' in $$props) $$invalidate('withLeadingIcon', withLeadingIcon = $$new_props.withLeadingIcon);
		if ('withTrailingIcon' in $$props) $$invalidate('withTrailingIcon', withTrailingIcon = $$new_props.withTrailingIcon);
		if ('noLabel' in $$props) $$invalidate('noLabel', noLabel = $$new_props.noLabel);
		if ('label' in $$props) $$invalidate('label', label = $$new_props.label);
		if ('type' in $$props) $$invalidate('type', type = $$new_props.type);
		if ('value' in $$props) $$invalidate('value', value = $$new_props.value);
		if ('files' in $$props) $$invalidate('files', files = $$new_props.files);
		if ('dirty' in $$props) $$invalidate('dirty', dirty = $$new_props.dirty);
		if ('invalid' in $$props) $$invalidate('invalid', invalid = $$new_props.invalid);
		if ('updateInvalid' in $$props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
		if ('useNativeValidation' in $$props) $$invalidate('useNativeValidation', useNativeValidation = $$new_props.useNativeValidation);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
		if ('textField' in $$props) $$invalidate('textField', textField = $$new_props.textField);
		if ('addLayoutListener' in $$props) addLayoutListener = $$new_props.addLayoutListener;
		if ('removeLayoutListener' in $$props) removeLayoutListener = $$new_props.removeLayoutListener;
		if ('props' in $$props) $$invalidate('props', props = $$new_props.props);
		if ('valued' in $$props) $$invalidate('valued', valued = $$new_props.valued);
	};

	let props, valued;

	$$self.$$.update = ($$dirty = { $$props: 1, value: 1, uninitializedValue: 1, files: 1, textField: 1, disabled: 1, invalid: 1, updateInvalid: 1, useNativeValidation: 1 }) => {
		$$invalidate('props', props = exclude($$props, ['use', 'class', 'ripple', 'disabled', 'fullwidth', 'textarea', 'variant', 'dense', 'withLeadingIcon', 'withTrailingIcon', 'noLabel', 'label', 'type', 'value', 'dirty', 'invalid', 'updateInvalid', 'useNativeValidation', 'input$', 'label$', 'ripple$', 'outline$']));
		if ($$dirty.value || $$dirty.uninitializedValue || $$dirty.files) { $$invalidate('valued', valued = value !== uninitializedValue || files !== uninitializedValue); }
		if ($$dirty.textField || $$dirty.value || $$dirty.uninitializedValue) { if (textField && value !== uninitializedValue && textField.value !== value) {
        $$invalidate('textField', textField.value = value, textField);
      } }
		if ($$dirty.textField || $$dirty.disabled) { if (textField && textField.disabled !== disabled) {
        $$invalidate('textField', textField.disabled = disabled, textField);
      } }
		if ($$dirty.textField || $$dirty.invalid || $$dirty.updateInvalid) { if (textField && textField.valid !== !invalid) {
        if (updateInvalid) {
          $$invalidate('invalid', invalid = !textField.valid);
        } else {
          $$invalidate('textField', textField.valid = !invalid, textField);
        }
      } }
		if ($$dirty.textField || $$dirty.useNativeValidation) { if (textField && textField.useNativeValidation !== useNativeValidation) {
        $$invalidate('textField', textField.useNativeValidation = useNativeValidation, textField);
      } }
	};

	return {
		forwardEvents,
		use,
		className,
		ripple,
		disabled,
		fullwidth,
		textarea,
		variant,
		dense,
		withLeadingIcon,
		withTrailingIcon,
		noLabel,
		label,
		type,
		value,
		files,
		dirty,
		invalid,
		updateInvalid,
		useNativeValidation,
		element,
		focus,
		layout,
		props,
		$$props,
		valued,
		change_handler,
		input_handler,
		change_handler_1,
		input_handler_1,
		textarea_1_value_binding,
		textarea_1_dirty_binding,
		textarea_1_invalid_binding,
		input_value_binding,
		input_files_binding,
		input_dirty_binding,
		input_invalid_binding,
		label_1_binding,
		div_binding,
		$$props: $$props = exclude_internal_props($$props),
		$$slots,
		$$scope
	};
}

class Textfield extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$c, create_fragment$c, safe_not_equal, ["use", "class", "ripple", "disabled", "fullwidth", "textarea", "variant", "dense", "withLeadingIcon", "withTrailingIcon", "noLabel", "label", "type", "value", "files", "dirty", "invalid", "updateInvalid", "useNativeValidation", "focus", "layout"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Textfield", options, id: create_fragment$c.name });

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.focus === undefined && !('focus' in props)) {
			console.warn("<Textfield> was created without expected prop 'focus'");
		}
		if (ctx.layout === undefined && !('layout' in props)) {
			console.warn("<Textfield> was created without expected prop 'layout'");
		}
	}

	get use() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set use(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ripple() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ripple(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get fullwidth() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set fullwidth(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get textarea() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set textarea(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get variant() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set variant(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dense() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dense(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get withLeadingIcon() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set withLeadingIcon(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get withTrailingIcon() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set withTrailingIcon(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noLabel() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noLabel(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get type() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set type(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get files() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set files(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dirty() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dirty(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get invalid() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set invalid(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get updateInvalid() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set updateInvalid(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get useNativeValidation() {
		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set useNativeValidation(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get focus() {
		return this.$$.ctx.focus;
	}

	set focus(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get layout() {
		return this.$$.ctx.layout;
	}

	set layout(value) {
		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\components\FullFrameDisplay.svelte generated by Svelte v3.12.1 */

const file$d = "src\\components\\FullFrameDisplay.svelte";

function get_each_context$2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx._ = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (1:0) {#each new Array($frameCount).fill(0) as _, i}
function create_each_block$2(ctx) {
	var div1, div0, t0_value = ctx.i + 1 + "", t0, t1;

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			t0 = text(t0_value);
			t1 = space();
			set_style(div0, "position", "absolute");
			set_style(div0, "top", "100%");
			set_style(div0, "left", "0");
			set_style(div0, "right", "0");
			set_style(div0, "margin", "auto");
			add_location(div0, file$d, 12, 4, 497);
			set_style(div1, "width", "" + ctx.$spritesheet.width / ctx.$frameCount + "px");
			set_style(div1, "height", "" + ctx.$spritesheet.height + "px");
			set_style(div1, "background-image", "url(" + ctx.$spritesheet.dataUrl + ")");
			set_style(div1, "background-position", "" + (ctx.$spritesheet.width / ctx.$frameCount) * -ctx.i + "px 0");
			set_style(div1, "opacity", (ctx.$currentFrame !== ctx.i && ctx.opacity ? '0.5' : '1'));
			set_style(div1, "display", "inline-block");
			set_style(div1, "border-right", ((ctx.i !== ctx.$frameCount - 1) ? '1px solid black' : 'none'));
			set_style(div1, "position", "relative");
			add_location(div1, file$d, 1, 2, 50);
		},

		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div0, t0);
			append_dev(div1, t1);
		},

		p: function update(changed, ctx) {
			if (changed.$spritesheet || changed.$frameCount) {
				set_style(div1, "width", "" + ctx.$spritesheet.width / ctx.$frameCount + "px");
			}

			if (changed.$spritesheet) {
				set_style(div1, "height", "" + ctx.$spritesheet.height + "px");
				set_style(div1, "background-image", "url(" + ctx.$spritesheet.dataUrl + ")");
			}

			if (changed.$spritesheet || changed.$frameCount) {
				set_style(div1, "background-position", "" + (ctx.$spritesheet.width / ctx.$frameCount) * -ctx.i + "px 0");
			}

			if (changed.$currentFrame || changed.opacity) {
				set_style(div1, "opacity", (ctx.$currentFrame !== ctx.i && ctx.opacity ? '0.5' : '1'));
			}

			if (changed.$frameCount) {
				set_style(div1, "border-right", ((ctx.i !== ctx.$frameCount - 1) ? '1px solid black' : 'none'));
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div1);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$2.name, type: "each", source: "(1:0) {#each new Array($frameCount).fill(0) as _, i}", ctx });
	return block;
}

function create_fragment$d(ctx) {
	var each_1_anchor;

	let each_value = new Array(ctx.$frameCount).fill(0);

	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert_dev(target, each_1_anchor, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.$spritesheet || changed.$frameCount || changed.$currentFrame || changed.opacity) {
				each_value = new Array(ctx.$frameCount).fill(0);

				let i;
				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			destroy_each(each_blocks, detaching);

			if (detaching) {
				detach_dev(each_1_anchor);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$d.name, type: "component", source: "", ctx });
	return block;
}

function instance$d($$self, $$props, $$invalidate) {
	let $frameCount, $spritesheet, $currentFrame;

	validate_store(frameCount, 'frameCount');
	component_subscribe($$self, frameCount, $$value => { $frameCount = $$value; $$invalidate('$frameCount', $frameCount); });
	validate_store(spritesheet, 'spritesheet');
	component_subscribe($$self, spritesheet, $$value => { $spritesheet = $$value; $$invalidate('$spritesheet', $spritesheet); });
	validate_store(currentFrame, 'currentFrame');
	component_subscribe($$self, currentFrame, $$value => { $currentFrame = $$value; $$invalidate('$currentFrame', $currentFrame); });

	let { opacity = false } = $$props;

	const writable_props = ['opacity'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<FullFrameDisplay> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('opacity' in $$props) $$invalidate('opacity', opacity = $$props.opacity);
	};

	$$self.$capture_state = () => {
		return { opacity, $frameCount, $spritesheet, $currentFrame };
	};

	$$self.$inject_state = $$props => {
		if ('opacity' in $$props) $$invalidate('opacity', opacity = $$props.opacity);
		if ('$frameCount' in $$props) frameCount.set($frameCount);
		if ('$spritesheet' in $$props) spritesheet.set($spritesheet);
		if ('$currentFrame' in $$props) currentFrame.set($currentFrame);
	};

	return {
		opacity,
		$frameCount,
		$spritesheet,
		$currentFrame
	};
}

class FullFrameDisplay extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$d, create_fragment$d, safe_not_equal, ["opacity"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "FullFrameDisplay", options, id: create_fragment$d.name });
	}

	get opacity() {
		throw new Error("<FullFrameDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set opacity(value) {
		throw new Error("<FullFrameDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\prompts\framecount.svelte generated by Svelte v3.12.1 */

const file$e = "src\\prompts\\framecount.svelte";

// (5:2) <FormField>
function create_default_slot_4(ctx) {
	var current;

	var textfield = new Textfield({
		props: {
		value: "1",
		class: "frame-count",
		type: "number",
		label: "# frames",
		input$min: "1",
		input$max: "99"
	},
		$$inline: true
	});
	textfield.$on("change", ctx.updateFrameCount);

	const block = {
		c: function create() {
			textfield.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(textfield, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(textfield.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(textfield.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(textfield, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4.name, type: "slot", source: "(5:2) <FormField>", ctx });
	return block;
}

// (22:8) <Label>
function create_default_slot_3(ctx) {
	var t;

	const block = {
		c: function create() {
			t = text("continue...");
		},

		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(t);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3.name, type: "slot", source: "(22:8) <Label>", ctx });
	return block;
}

// (21:6) <Button variant="outlined">
function create_default_slot_2$1(ctx) {
	var current;

	var label = new Label({
		props: {
		$$slots: { default: [create_default_slot_3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			label.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(label, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var label_changes = {};
			if (changed.$$scope) label_changes.$$scope = { changed, ctx };
			label.$set(label_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(label.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(label.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(label, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$1.name, type: "slot", source: "(21:6) <Button variant=\"outlined\">", ctx });
	return block;
}

// (20:4) <BtnGroup class="buttons">
function create_default_slot_1$1(ctx) {
	var current;

	var button = new Button({
		props: {
		variant: "outlined",
		$$slots: { default: [create_default_slot_2$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			button.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(button, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(button, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$1.name, type: "slot", source: "(20:4) <BtnGroup class=\"buttons\">", ctx });
	return block;
}

// (18:2) <FormField>
function create_default_slot$1(ctx) {
	var current;

	var btngroup = new Group({
		props: {
		class: "buttons",
		$$slots: { default: [create_default_slot_1$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			btngroup.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(btngroup, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var btngroup_changes = {};
			if (changed.$$scope) btngroup_changes.$$scope = { changed, ctx };
			btngroup.$set(btngroup_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(btngroup.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(btngroup.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(btngroup, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$1.name, type: "slot", source: "(18:2) <FormField>", ctx });
	return block;
}

function create_fragment$e(ctx) {
	var div, t0, h1, t2, t3, br0, t4, br1, t5, div_intro, div_outro, current;

	var fullframedisplay = new FullFrameDisplay({ $$inline: true });

	var formfield0 = new FormField({
		props: {
		$$slots: { default: [create_default_slot_4] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var formfield1 = new FormField({
		props: {
		$$slots: { default: [create_default_slot$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			div = element("div");
			fullframedisplay.$$.fragment.c();
			t0 = space();
			h1 = element("h1");
			h1.textContent = "How many frames are in this spritesheet?";
			t2 = space();
			formfield0.$$.fragment.c();
			t3 = space();
			br0 = element("br");
			t4 = space();
			br1 = element("br");
			t5 = space();
			formfield1.$$.fragment.c();
			attr_dev(h1, "class", "svelte-1cnrfbb");
			add_location(h1, file$e, 3, 2, 129);
			attr_dev(br0, "class", "svelte-1cnrfbb");
			add_location(br0, file$e, 15, 2, 410);
			attr_dev(br1, "class", "svelte-1cnrfbb");
			add_location(br1, file$e, 16, 2, 419);
			attr_dev(div, "class", "container svelte-1cnrfbb");
			add_location(div, file$e, 1, 0, 2);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(fullframedisplay, div, null);
			append_dev(div, t0);
			append_dev(div, h1);
			append_dev(div, t2);
			mount_component(formfield0, div, null);
			append_dev(div, t3);
			append_dev(div, br0);
			append_dev(div, t4);
			append_dev(div, br1);
			append_dev(div, t5);
			mount_component(formfield1, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var formfield0_changes = {};
			if (changed.$$scope) formfield0_changes.$$scope = { changed, ctx };
			formfield0.$set(formfield0_changes);

			var formfield1_changes = {};
			if (changed.$$scope) formfield1_changes.$$scope = { changed, ctx };
			formfield1.$set(formfield1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(fullframedisplay.$$.fragment, local);

			transition_in(formfield0.$$.fragment, local);

			transition_in(formfield1.$$.fragment, local);

			add_render_callback(() => {
				if (div_outro) div_outro.end(1);
				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 150, duration: 500 });
				div_intro.start();
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(fullframedisplay.$$.fragment, local);
			transition_out(formfield0.$$.fragment, local);
			transition_out(formfield1.$$.fragment, local);
			if (div_intro) div_intro.invalidate();

			div_outro = create_out_transition(div, fly, { y: -150, duration: 500 });

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			destroy_component(fullframedisplay);

			destroy_component(formfield0);

			destroy_component(formfield1);

			if (detaching) {
				if (div_outro) div_outro.end();
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
	return block;
}

function instance$e($$self) {
 
  const updateFrameCount = (evt) => {
    if (evt.target.value > 0) frameCount.set(parseInt(evt.target.value));
  };

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {};

	return { updateFrameCount };
}

class Framecount extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$e, create_fragment$e, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Framecount", options, id: create_fragment$e.name });
	}
}

/* src\prompts\image_confirmation.svelte generated by Svelte v3.12.1 */

const file$f = "src\\prompts\\image_confirmation.svelte";

// (1:0)   <div class="container" in:fly="{{ y: 150, duration: 500 }}
function create_catch_block(ctx) {
	const block = {
		c: noop,
		m: noop,
		p: noop,
		i: noop,
		o: noop,
		d: noop
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_catch_block.name, type: "catch", source: "(1:0)   <div class=\"container\" in:fly=\"{{ y: 150, duration: 500 }}", ctx });
	return block;
}

// (6:4) {:then data}
function create_then_block(ctx) {
	var img, img_src_value, br, t, current;

	var formfield = new FormField({
		props: {
		$$slots: { default: [create_default_slot$2] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			img = element("img");
			br = element("br");
			t = space();
			formfield.$$.fragment.c();
			attr_dev(img, "src", img_src_value = ctx.$spritesheet.dataUrl);
			attr_dev(img, "alt", "uploaded image");
			add_location(img, file$f, 6, 6, 229);
			add_location(br, file$f, 6, 60, 283);
		},

		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);
			insert_dev(target, br, anchor);
			insert_dev(target, t, anchor);
			mount_component(formfield, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.$spritesheet) && img_src_value !== (img_src_value = ctx.$spritesheet.dataUrl)) {
				attr_dev(img, "src", img_src_value);
			}

			var formfield_changes = {};
			if (changed.$$scope) formfield_changes.$$scope = { changed, ctx };
			formfield.$set(formfield_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(formfield.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(formfield.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(img);
				detach_dev(br);
				detach_dev(t);
			}

			destroy_component(formfield, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_then_block.name, type: "then", source: "(6:4) {:then data}", ctx });
	return block;
}

// (12:12) <Label>
function create_default_slot_5(ctx) {
	var t;

	const block = {
		c: function create() {
			t = text("yes");
		},

		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(t);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5.name, type: "slot", source: "(12:12) <Label>", ctx });
	return block;
}

// (11:10) <Button variant="outlined" on:click={() => dispatch('continue', Framecount)}>
function create_default_slot_4$1(ctx) {
	var current;

	var label = new Label({
		props: {
		$$slots: { default: [create_default_slot_5] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			label.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(label, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var label_changes = {};
			if (changed.$$scope) label_changes.$$scope = { changed, ctx };
			label.$set(label_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(label.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(label.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(label, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4$1.name, type: "slot", source: "(11:10) <Button variant=\"outlined\" on:click={() => dispatch('continue', Framecount)}>", ctx });
	return block;
}

// (15:12) <Label>
function create_default_slot_3$1(ctx) {
	var t;

	const block = {
		c: function create() {
			t = text("no, go back");
		},

		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(t);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$1.name, type: "slot", source: "(15:12) <Label>", ctx });
	return block;
}

// (14:10) <Button variant="outlined" on:click={() => dispatch('continue', Upload)}>
function create_default_slot_2$2(ctx) {
	var current;

	var label = new Label({
		props: {
		$$slots: { default: [create_default_slot_3$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			label.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(label, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var label_changes = {};
			if (changed.$$scope) label_changes.$$scope = { changed, ctx };
			label.$set(label_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(label.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(label.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(label, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$2.name, type: "slot", source: "(14:10) <Button variant=\"outlined\" on:click={() => dispatch('continue', Upload)}>", ctx });
	return block;
}

// (9:8) <BtnGroup class="buttons">
function create_default_slot_1$2(ctx) {
	var t, current;

	var button0 = new Button({
		props: {
		variant: "outlined",
		$$slots: { default: [create_default_slot_4$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button0.$on("click", ctx.click_handler);

	var button1 = new Button({
		props: {
		variant: "outlined",
		$$slots: { default: [create_default_slot_2$2] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button1.$on("click", ctx.click_handler_1);

	const block = {
		c: function create() {
			button0.$$.fragment.c();
			t = space();
			button1.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(button0, target, anchor);
			insert_dev(target, t, anchor);
			mount_component(button1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var button0_changes = {};
			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
			button0.$set(button0_changes);

			var button1_changes = {};
			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
			button1.$set(button1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);

			transition_in(button1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(button0, detaching);

			if (detaching) {
				detach_dev(t);
			}

			destroy_component(button1, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$2.name, type: "slot", source: "(9:8) <BtnGroup class=\"buttons\">", ctx });
	return block;
}

// (8:6) <FormField>
function create_default_slot$2(ctx) {
	var current;

	var btngroup = new Group({
		props: {
		class: "buttons",
		$$slots: { default: [create_default_slot_1$2] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			btngroup.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(btngroup, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var btngroup_changes = {};
			if (changed.$$scope) btngroup_changes.$$scope = { changed, ctx };
			btngroup.$set(btngroup_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(btngroup.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(btngroup.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(btngroup, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$2.name, type: "slot", source: "(8:6) <FormField>", ctx });
	return block;
}

// (4:25)         <LinearProgress indeterminate/>      {:then data}
function create_pending_block(ctx) {
	var current;

	var linearprogress = new LinearProgress({
		props: { indeterminate: true },
		$$inline: true
	});

	const block = {
		c: function create() {
			linearprogress.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(linearprogress, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(linearprogress.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(linearprogress.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(linearprogress, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_pending_block.name, type: "pending", source: "(4:25)         <LinearProgress indeterminate/>      {:then data}", ctx });
	return block;
}

function create_fragment$f(ctx) {
	var div, h1, t_1, promise, div_intro, div_outro, current;

	let info = {
		ctx,
		current: null,
		token: null,
		pending: create_pending_block,
		then: create_then_block,
		catch: create_catch_block,
		value: 'data',
		error: 'null',
		blocks: [,,,]
	};

	handle_promise(promise = ctx.$spritesheet, info);

	const block = {
		c: function create() {
			div = element("div");
			h1 = element("h1");
			h1.textContent = "Does this look correct?";
			t_1 = space();

			info.block.c();
			add_location(h1, file$f, 2, 2, 105);
			attr_dev(div, "class", "container svelte-rcpnnu");
			add_location(div, file$f, 1, 0, 2);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, h1);
			append_dev(div, t_1);

			info.block.m(div, info.anchor = null);
			info.mount = () => div;
			info.anchor = null;

			current = true;
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			info.ctx = ctx;

			if (('$spritesheet' in changed) && promise !== (promise = ctx.$spritesheet) && handle_promise(promise, info)) ; else {
				info.block.p(changed, assign(assign({}, ctx), info.resolved));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(info.block);

			add_render_callback(() => {
				if (div_outro) div_outro.end(1);
				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 150, duration: 500 });
				div_intro.start();
			});

			current = true;
		},

		o: function outro(local) {
			for (let i = 0; i < 3; i += 1) {
				const block = info.blocks[i];
				transition_out(block);
			}

			if (div_intro) div_intro.invalidate();

			div_outro = create_out_transition(div, fly, { y: -150, duration: 500 });

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			info.block.d();
			info.token = null;
			info = null;

			if (detaching) {
				if (div_outro) div_outro.end();
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
	return block;
}

function instance$f($$self, $$props, $$invalidate) {
	let $spritesheet;

	validate_store(spritesheet, 'spritesheet');
	component_subscribe($$self, spritesheet, $$value => { $spritesheet = $$value; $$invalidate('$spritesheet', $spritesheet); });

	

  const dispatch = createEventDispatcher();

	const click_handler = () => dispatch('continue', Framecount);

	const click_handler_1 = () => dispatch('continue', Upload);

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ('$spritesheet' in $$props) spritesheet.set($spritesheet);
	};

	return {
		dispatch,
		$spritesheet,
		click_handler,
		click_handler_1
	};
}

class Image_confirmation extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$f, create_fragment$f, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Image_confirmation", options, id: create_fragment$f.name });
	}
}

/* src\prompts\upload.svelte generated by Svelte v3.12.1 */

const file$g = "src\\prompts\\upload.svelte";

// (11:10) <Label>
function create_default_slot_3$2(ctx) {
	var t;

	const block = {
		c: function create() {
			t = text("Click to Upload");
		},

		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(t);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$2.name, type: "slot", source: "(11:10) <Label>", ctx });
	return block;
}

// (10:8) <Button on:click={() => upload.click()} variant="outlined">
function create_default_slot_2$3(ctx) {
	var current;

	var label = new Label({
		props: {
		$$slots: { default: [create_default_slot_3$2] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			label.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(label, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var label_changes = {};
			if (changed.$$scope) label_changes.$$scope = { changed, ctx };
			label.$set(label_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(label.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(label.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(label, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$3.name, type: "slot", source: "(10:8) <Button on:click={() => upload.click()} variant=\"outlined\">", ctx });
	return block;
}

// (9:6) <BtnGroup class="buttons">
function create_default_slot_1$3(ctx) {
	var current;

	var button = new Button({
		props: {
		variant: "outlined",
		$$slots: { default: [create_default_slot_2$3] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button.$on("click", ctx.click_handler);

	const block = {
		c: function create() {
			button.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(button, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(button, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$3.name, type: "slot", source: "(9:6) <BtnGroup class=\"buttons\">", ctx });
	return block;
}

// (3:2) <FormField>
function create_default_slot$3(ctx) {
	var div, input, t, current, dispose;

	var btngroup = new Group({
		props: {
		class: "buttons",
		$$slots: { default: [create_default_slot_1$3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			div = element("div");
			input = element("input");
			t = space();
			btngroup.$$.fragment.c();
			attr_dev(input, "type", "file");
			set_style(input, "opacity", "0");
			set_style(input, "position", "fixed");
			set_style(input, "pointer-events", "none");
			add_location(input, file$g, 4, 6, 164);
			add_location(div, file$g, 3, 4, 151);
			dispose = listen_dev(input, "change", ctx.change_handler);
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, input);
			ctx.input_binding(input);
			append_dev(div, t);
			mount_component(btngroup, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var btngroup_changes = {};
			if (changed.$$scope) btngroup_changes.$$scope = { changed, ctx };
			btngroup.$set(btngroup_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(btngroup.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(btngroup.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			ctx.input_binding(null);

			destroy_component(btngroup);

			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$3.name, type: "slot", source: "(3:2) <FormField>", ctx });
	return block;
}

function create_fragment$g(ctx) {
	var div, h1, t_1, div_intro, div_outro, current;

	var formfield = new FormField({
		props: {
		$$slots: { default: [create_default_slot$3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			div = element("div");
			h1 = element("h1");
			h1.textContent = "Upload Spritesheet";
			t_1 = space();
			formfield.$$.fragment.c();
			add_location(h1, file$g, 1, 2, 103);
			attr_dev(div, "class", "container svelte-1thgizp");
			add_location(div, file$g, 0, 0, 0);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, h1);
			append_dev(div, t_1);
			mount_component(formfield, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var formfield_changes = {};
			if (changed.$$scope || changed.upload) formfield_changes.$$scope = { changed, ctx };
			formfield.$set(formfield_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(formfield.$$.fragment, local);

			add_render_callback(() => {
				if (div_outro) div_outro.end(1);
				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 150, duration: 500 });
				div_intro.start();
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(formfield.$$.fragment, local);
			if (div_intro) div_intro.invalidate();

			div_outro = create_out_transition(div, fly, { y: -150, duration: 500 });

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			destroy_component(formfield);

			if (detaching) {
				if (div_outro) div_outro.end();
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
	return block;
}

let uploadFile = false;

function instance$g($$self, $$props, $$invalidate) {
	 

  const dispatch = createEventDispatcher();
  let upload;
  let statusMsg = '';

  const processImage = (file) => {   
    let spritesheetSrc = {};
    return new Promise(async (resolve) => {
      spritesheetSrc.file = file;
      spritesheetSrc.buffer = await file.arrayBuffer();

      let fileReader = new FileReader();

      statusMsg = 'reading file...';
      
      fileReader.onloadend = () => {
        statusMsg = 'getting image data...';

        spritesheetSrc.dataUrl = fileReader.result;
        let img = new Image();
        img.onload = function() {
          spritesheetSrc.width = this.width;
          spritesheetSrc.height = this.height;
          spritesheet.update(n => spritesheetSrc);
          resolve(spritesheetSrc);
        };
        img.src = fileReader.result;
      };
      fileReader.readAsDataURL(file);
    })
		
	};

	function input_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('upload', upload = $$value);
		});
	}

	const change_handler = (evt) => {
	        spritesheet.update(n => processImage(upload.files[0]));
	        dispatch('continue', Image_confirmation);
	      };

	const click_handler = () => upload.click();

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ('upload' in $$props) $$invalidate('upload', upload = $$props.upload);
		if ('uploadFile' in $$props) uploadFile = $$props.uploadFile;
		if ('statusMsg' in $$props) statusMsg = $$props.statusMsg;
	};

	return {
		dispatch,
		upload,
		processImage,
		input_binding,
		change_handler,
		click_handler
	};
}

class Upload extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$g, create_fragment$g, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Upload", options, id: create_fragment$g.name });
	}
}

/* src\prompts\begin.svelte generated by Svelte v3.12.1 */

const file$h = "src\\prompts\\begin.svelte";

// (7:8) <Label>
function create_default_slot_3$3(ctx) {
	var t;

	const block = {
		c: function create() {
			t = text("Start from Scratch");
		},

		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(t);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$3.name, type: "slot", source: "(7:8) <Label>", ctx });
	return block;
}

// (6:6) <Button on:click={() => dispatch('continue', Upload)} variant="outlined">
function create_default_slot_2$4(ctx) {
	var current;

	var label = new Label({
		props: {
		$$slots: { default: [create_default_slot_3$3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			label.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(label, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var label_changes = {};
			if (changed.$$scope) label_changes.$$scope = { changed, ctx };
			label.$set(label_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(label.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(label.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(label, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$4.name, type: "slot", source: "(6:6) <Button on:click={() => dispatch('continue', Upload)} variant=\"outlined\">", ctx });
	return block;
}

// (5:4) <BtnGroup class="buttons">
function create_default_slot_1$4(ctx) {
	var current;

	var button = new Button({
		props: {
		variant: "outlined",
		$$slots: { default: [create_default_slot_2$4] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button.$on("click", ctx.click_handler);

	const block = {
		c: function create() {
			button.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(button, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(button, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$4.name, type: "slot", source: "(5:4) <BtnGroup class=\"buttons\">", ctx });
	return block;
}

// (4:2) <FormField>
function create_default_slot$4(ctx) {
	var current;

	var btngroup = new Group({
		props: {
		class: "buttons",
		$$slots: { default: [create_default_slot_1$4] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	const block = {
		c: function create() {
			btngroup.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(btngroup, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var btngroup_changes = {};
			if (changed.$$scope) btngroup_changes.$$scope = { changed, ctx };
			btngroup.$set(btngroup_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(btngroup.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(btngroup.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(btngroup, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$4.name, type: "slot", source: "(4:2) <FormField>", ctx });
	return block;
}

function create_fragment$h(ctx) {
	var div, h1, t1, t2, div_intro, div_outro, current;

	var formfield = new FormField({
		props: {
		$$slots: { default: [create_default_slot$4] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var webfs = new WebFS({ $$inline: true });

	const block = {
		c: function create() {
			div = element("div");
			h1 = element("h1");
			h1.textContent = "How do you want to begin?";
			t1 = space();
			formfield.$$.fragment.c();
			t2 = space();
			webfs.$$.fragment.c();
			add_location(h1, file$h, 2, 2, 105);
			attr_dev(div, "class", "container svelte-rcpnnu");
			add_location(div, file$h, 1, 0, 2);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, h1);
			append_dev(div, t1);
			mount_component(formfield, div, null);
			append_dev(div, t2);
			mount_component(webfs, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var formfield_changes = {};
			if (changed.$$scope) formfield_changes.$$scope = { changed, ctx };
			formfield.$set(formfield_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(formfield.$$.fragment, local);

			transition_in(webfs.$$.fragment, local);

			add_render_callback(() => {
				if (div_outro) div_outro.end(1);
				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 150, duration: 500 });
				div_intro.start();
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(formfield.$$.fragment, local);
			transition_out(webfs.$$.fragment, local);
			if (div_intro) div_intro.invalidate();

			div_outro = create_out_transition(div, fly, { y: -150, duration: 500 });

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			destroy_component(formfield);

			destroy_component(webfs);

			if (detaching) {
				if (div_outro) div_outro.end();
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$h.name, type: "component", source: "", ctx });
	return block;
}

function instance$h($$self) {
	

  const dispatch = createEventDispatcher();

	const click_handler = () => dispatch('continue', Upload);

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {};

	return { dispatch, click_handler };
}

class Begin extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$h, create_fragment$h, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Begin", options, id: create_fragment$h.name });
	}
}

/* src\App.svelte generated by Svelte v3.12.1 */

const file$i = "src\\App.svelte";

function create_fragment$i(ctx) {
	var div, current;

	var switch_value = ctx.page;

	function switch_props(ctx) {
		return { $$inline: true };
	}

	if (switch_value) {
		var switch_instance = new switch_value(switch_props());
		switch_instance.$on("continue", ctx.continue_handler);
	}

	const block = {
		c: function create() {
			div = element("div");
			if (switch_instance) switch_instance.$$.fragment.c();
			attr_dev(div, "id", "app");
			attr_dev(div, "class", "svelte-1p8phu0");
			add_location(div, file$i, 0, 0, 0);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (switch_instance) {
				mount_component(switch_instance, div, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (switch_value !== (switch_value = ctx.page)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;
					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});
					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					switch_instance.$on("continue", ctx.continue_handler);

					switch_instance.$$.fragment.c();
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, div, null);
				} else {
					switch_instance = null;
				}
			}
		},

		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			if (switch_instance) destroy_component(switch_instance);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$i.name, type: "component", source: "", ctx });
	return block;
}

function instance$i($$self, $$props, $$invalidate) {
	let page = Begin;

	const continue_handler = (evt) => $$invalidate('page', page = evt.detail);

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ('page' in $$props) $$invalidate('page', page = $$props.page);
	};

	return { page, continue_handler };
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$i, create_fragment$i, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$i.name });
	}
}

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;
//# sourceMappingURL=main.js.map
