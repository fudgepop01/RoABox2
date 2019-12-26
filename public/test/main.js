
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(document);
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
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
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

function Ripple(node, [ripple, props = {unbounded: false, color: null}]) {
  let instance = null;

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
    }
  }
}

/* node_modules\@smui\button\Button.svelte generated by Svelte v3.12.1 */

const file = "node_modules\\@smui\\button\\Button.svelte";

// (23:0) {:else}
function create_else_block(ctx) {
	var button, useActions_action, forwardEvents_action, Ripple_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var button_levels = [
		{ class: "mdc-button " + ctx.className },
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
			toggle_class(button, "mdc-button--raised", ctx.variant === 'raised');
			toggle_class(button, "mdc-button--unelevated", ctx.variant === 'unelevated');
			toggle_class(button, "mdc-button--outlined", ctx.variant === 'outlined');
			toggle_class(button, "mdc-button--dense", ctx.dense);
			toggle_class(button, "smui-button--color-secondary", ctx.color === 'secondary');
			toggle_class(button, "mdc-card__action", ctx.context === 'card:action');
			toggle_class(button, "mdc-card__action--button", ctx.context === 'card:action');
			toggle_class(button, "mdc-dialog__button", ctx.context === 'dialog:action');
			toggle_class(button, "mdc-top-app-bar__navigation-icon", ctx.context === 'top-app-bar:navigation');
			toggle_class(button, "mdc-top-app-bar__action-item", ctx.context === 'top-app-bar:action');
			toggle_class(button, "mdc-snackbar__action", ctx.context === 'snackbar');
			add_location(button, file, 23, 2, 898);
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
				(changed.className) && { class: "mdc-button " + ctx.className },
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

			if ((changed.className || changed.variant)) {
				toggle_class(button, "mdc-button--raised", ctx.variant === 'raised');
				toggle_class(button, "mdc-button--unelevated", ctx.variant === 'unelevated');
				toggle_class(button, "mdc-button--outlined", ctx.variant === 'outlined');
			}

			if ((changed.className || changed.dense)) {
				toggle_class(button, "mdc-button--dense", ctx.dense);
			}

			if ((changed.className || changed.color)) {
				toggle_class(button, "smui-button--color-secondary", ctx.color === 'secondary');
			}

			if ((changed.className || changed.context)) {
				toggle_class(button, "mdc-card__action", ctx.context === 'card:action');
				toggle_class(button, "mdc-card__action--button", ctx.context === 'card:action');
				toggle_class(button, "mdc-dialog__button", ctx.context === 'dialog:action');
				toggle_class(button, "mdc-top-app-bar__navigation-icon", ctx.context === 'top-app-bar:navigation');
				toggle_class(button, "mdc-top-app-bar__action-item", ctx.context === 'top-app-bar:action');
				toggle_class(button, "mdc-snackbar__action", ctx.context === 'snackbar');
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(23:0) {:else}", ctx });
	return block;
}

// (1:0) {#if href}
function create_if_block(ctx) {
	var a, useActions_action, forwardEvents_action, Ripple_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var a_levels = [
		{ class: "mdc-button " + ctx.className },
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
			toggle_class(a, "mdc-button--raised", ctx.variant === 'raised');
			toggle_class(a, "mdc-button--unelevated", ctx.variant === 'unelevated');
			toggle_class(a, "mdc-button--outlined", ctx.variant === 'outlined');
			toggle_class(a, "mdc-button--dense", ctx.dense);
			toggle_class(a, "smui-button--color-secondary", ctx.color === 'secondary');
			toggle_class(a, "mdc-card__action", ctx.context === 'card:action');
			toggle_class(a, "mdc-card__action--button", ctx.context === 'card:action');
			toggle_class(a, "mdc-dialog__button", ctx.context === 'dialog:action');
			toggle_class(a, "mdc-top-app-bar__navigation-icon", ctx.context === 'top-app-bar:navigation');
			toggle_class(a, "mdc-top-app-bar__action-item", ctx.context === 'top-app-bar:action');
			toggle_class(a, "mdc-snackbar__action", ctx.context === 'snackbar');
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
				(changed.className) && { class: "mdc-button " + ctx.className },
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

			if ((changed.className || changed.variant)) {
				toggle_class(a, "mdc-button--raised", ctx.variant === 'raised');
				toggle_class(a, "mdc-button--unelevated", ctx.variant === 'unelevated');
				toggle_class(a, "mdc-button--outlined", ctx.variant === 'outlined');
			}

			if ((changed.className || changed.dense)) {
				toggle_class(a, "mdc-button--dense", ctx.dense);
			}

			if ((changed.className || changed.color)) {
				toggle_class(a, "smui-button--color-secondary", ctx.color === 'secondary');
			}

			if ((changed.className || changed.context)) {
				toggle_class(a, "mdc-card__action", ctx.context === 'card:action');
				toggle_class(a, "mdc-card__action--button", ctx.context === 'card:action');
				toggle_class(a, "mdc-dialog__button", ctx.context === 'dialog:action');
				toggle_class(a, "mdc-top-app-bar__navigation-icon", ctx.context === 'top-app-bar:navigation');
				toggle_class(a, "mdc-top-app-bar__action-item", ctx.context === 'top-app-bar:action');
				toggle_class(a, "mdc-snackbar__action", ctx.context === 'snackbar');
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
		{ class: "smui-button__group " + ctx.className },
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
			toggle_class(div, "smui-button__group--raised", ctx.variant === 'raised');
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
				(changed.className) && { class: "smui-button__group " + ctx.className },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'variant'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if ((changed.className || changed.variant)) {
				toggle_class(div, "smui-button__group--raised", ctx.variant === 'raised');
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
		{ class: ctx.className },
		ctx.snackbarProps,
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
			toggle_class(span, "mdc-button__label", ctx.context === 'button');
			toggle_class(span, "mdc-fab__label", ctx.context === 'fab');
			toggle_class(span, "mdc-chip__text", ctx.context === 'chip');
			toggle_class(span, "mdc-tab__text-label", ctx.context === 'tab');
			toggle_class(span, "mdc-image-list__label", ctx.context === 'image-list');
			toggle_class(span, "mdc-snackbar__label", ctx.context === 'snackbar');
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
				(changed.className) && { class: ctx.className },
				(changed.snackbarProps) && ctx.snackbarProps,
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if ((changed.className || changed.context)) {
				toggle_class(span, "mdc-button__label", ctx.context === 'button');
				toggle_class(span, "mdc-fab__label", ctx.context === 'fab');
				toggle_class(span, "mdc-chip__text", ctx.context === 'chip');
				toggle_class(span, "mdc-tab__text-label", ctx.context === 'tab');
				toggle_class(span, "mdc-image-list__label", ctx.context === 'image-list');
				toggle_class(span, "mdc-snackbar__label", ctx.context === 'snackbar');
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
		return { use, className, snackbarProps };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
		if ('use' in $$props) $$invalidate('use', use = $$new_props.use);
		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
		if ('snackbarProps' in $$props) $$invalidate('snackbarProps', snackbarProps = $$new_props.snackbarProps);
	};

	let snackbarProps;

	$$invalidate('snackbarProps', snackbarProps = (context === 'snackbar') ? {role: 'status', 'aria-live': 'polite'} : {});

	return {
		forwardEvents,
		use,
		className,
		context,
		snackbarProps,
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
		exclude(prefixFilter(ctx.$$props, 'label$'), ['use'])
	];

	var label_data = {};
	for (var i = 0; i < label_levels.length; i += 1) {
		label_data = assign(label_data, label_levels[i]);
	}

	var div_levels = [
		{ class: "mdc-form-field " + ctx.className },
		exclude(ctx.$$props, ['use', 'class', 'alignEnd', 'inputId', 'label$'])
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
			add_location(label, file$3, 9, 2, 254);
			set_attributes(div, div_data);
			toggle_class(div, "mdc-form-field--align-end", ctx.align === 'end');
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

			useActions_action = useActions.call(null, label, ctx.label$use) || {};
			ctx.div_binding(div);
			useActions_action_1 = useActions.call(null, div, ctx.use) || {};
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
				(changed.exclude || changed.prefixFilter || changed.$$props) && exclude(prefixFilter(ctx.$$props, 'label$'), ['use'])
			]));

			if (typeof useActions_action.update === 'function' && changed.label$use) {
				useActions_action.update.call(null, ctx.label$use);
			}

			set_attributes(div, get_spread_update(div_levels, [
				(changed.className) && { class: "mdc-form-field " + ctx.className },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'alignEnd', 'inputId', 'label$'])
			]));

			if (typeof useActions_action_1.update === 'function' && changed.use) {
				useActions_action_1.update.call(null, ctx.use);
			}

			if ((changed.className || changed.align)) {
				toggle_class(div, "mdc-form-field--align-end", ctx.align === 'end');
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
	

  const forwardEvents = forwardEventsBuilder(current_component);

  let { use = [], class: className = '', align = 'start', inputId = 'SMUI-form-field-'+(counter++), label$use = [] } = $$props;

  let element;
  let formField;

  setContext('SMUI:form-field', () => formField);
  setContext('SMUI:generic:input:props', {id: inputId});

  onMount(() => {
    formField = new MDCFormField(element);
  });

  onDestroy(() => {
    if (formField) {
      formField && formField.destroy();
    }
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

/* node_modules\@smui\linear-progress\LinearProgress.svelte generated by Svelte v3.12.1 */

const file$4 = "node_modules\\@smui\\linear-progress\\LinearProgress.svelte";

function create_fragment$4(ctx) {
	var div4, div0, t0, div1, t1, div2, span0, t2, div3, span1, useActions_action, forwardEvents_action;

	var div4_levels = [
		{ class: "mdc-linear-progress " + ctx.className },
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
			add_location(div0, file$4, 11, 2, 383);
			attr_dev(div1, "class", "mdc-linear-progress__buffer");
			add_location(div1, file$4, 12, 2, 441);
			attr_dev(span0, "class", "mdc-linear-progress__bar-inner");
			add_location(span0, file$4, 14, 4, 567);
			attr_dev(div2, "class", "mdc-linear-progress__bar mdc-linear-progress__primary-bar");
			add_location(div2, file$4, 13, 2, 491);
			attr_dev(span1, "class", "mdc-linear-progress__bar-inner");
			add_location(span1, file$4, 17, 4, 709);
			attr_dev(div3, "class", "mdc-linear-progress__bar mdc-linear-progress__secondary-bar");
			add_location(div3, file$4, 16, 2, 631);
			set_attributes(div4, div4_data);
			toggle_class(div4, "mdc-linear-progress--indeterminate", ctx.indeterminate);
			toggle_class(div4, "mdc-linear-progress--reversed", ctx.reversed);
			toggle_class(div4, "mdc-linear-progress--closed", ctx.closed);
			add_location(div4, file$4, 0, 0, 0);
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
				(changed.className) && { class: "mdc-linear-progress " + ctx.className },
				{ role: "progressbar" },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'indeterminate', 'reversed', 'closed', 'progress'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if ((changed.className || changed.indeterminate)) {
				toggle_class(div4, "mdc-linear-progress--indeterminate", ctx.indeterminate);
			}

			if ((changed.className || changed.reversed)) {
				toggle_class(div4, "mdc-linear-progress--reversed", ctx.reversed);
			}

			if ((changed.className || changed.closed)) {
				toggle_class(div4, "mdc-linear-progress--closed", ctx.closed);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
	return block;
}

function instance$4($$self, $$props, $$invalidate) {
	

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
		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["use", "class", "indeterminate", "reversed", "closed", "progress", "buffer"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LinearProgress", options, id: create_fragment$4.name });
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

const spritesheet = writable({});

const frameCount = writable(1);

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

/* node_modules\@smui\floating-label\FloatingLabel.svelte generated by Svelte v3.12.1 */

const file$5 = "node_modules\\@smui\\floating-label\\FloatingLabel.svelte";

// (9:0) {:else}
function create_else_block$1(ctx) {
	var label, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var label_levels = [
		{ class: "mdc-floating-label " + ctx.className },
		ctx.forProp,
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
			add_location(label, file$5, 9, 2, 225);
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
				(changed.forProp) && ctx.forProp,
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$1.name, type: "else", source: "(9:0) {:else}", ctx });
	return block;
}

// (1:0) {#if wrapped}
function create_if_block$1(ctx) {
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
			add_location(span, file$5, 1, 2, 16);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(1:0) {#if wrapped}", ctx });
	return block;
}

function create_fragment$5(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$1,
		create_else_block$1
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
	return block;
}

function instance$5($$self, $$props, $$invalidate) {
	

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
		return { use, className, forId, wrapped, element, floatingLabel, inputProps, forProp };
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
		if ('forProp' in $$props) $$invalidate('forProp', forProp = $$new_props.forProp);
	};

	let forProp;

	$$self.$$.update = ($$dirty = { forId: 1, inputProps: 1 }) => {
		if ($$dirty.forId || $$dirty.inputProps) { $$invalidate('forProp', forProp = (forId || inputProps && inputProps.id) ? {for: forId || inputProps && inputProps.id} : {}); }
	};

	return {
		forwardEvents,
		use,
		className,
		forId,
		wrapped,
		element,
		shake,
		float,
		getWidth,
		forProp,
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
		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["use", "class", "for", "wrapped", "shake", "float", "getWidth"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "FloatingLabel", options, id: create_fragment$5.name });

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

const file$6 = "node_modules\\@smui\\line-ripple\\LineRipple.svelte";

function create_fragment$6(ctx) {
	var div, useActions_action, forwardEvents_action;

	var div_levels = [
		{ class: "mdc-line-ripple " + ctx.className },
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
			toggle_class(div, "mdc-line-ripple--active", ctx.active);
			add_location(div, file$6, 0, 0, 0);
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
				(changed.className) && { class: "mdc-line-ripple " + ctx.className },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'active'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if ((changed.className || changed.active)) {
				toggle_class(div, "mdc-line-ripple--active", ctx.active);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
	return block;
}

function instance$6($$self, $$props, $$invalidate) {
	

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
		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["use", "class", "active", "activate", "deactivate", "setRippleCenter"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LineRipple", options, id: create_fragment$6.name });

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

const file$7 = "node_modules\\@smui\\notched-outline\\NotchedOutline.svelte";

// (11:2) {#if !noLabel}
function create_if_block$2(ctx) {
	var div, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	const block = {
		c: function create() {
			div = element("div");

			if (default_slot) default_slot.c();

			attr_dev(div, "class", "mdc-notched-outline__notch");
			add_location(div, file$7, 11, 4, 345);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$2.name, type: "if", source: "(11:2) {#if !noLabel}", ctx });
	return block;
}

function create_fragment$7(ctx) {
	var div2, div0, t0, t1, div1, useActions_action, forwardEvents_action, current;

	var if_block = (!ctx.noLabel) && create_if_block$2(ctx);

	var div2_levels = [
		{ class: "mdc-notched-outline " + ctx.className },
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
			add_location(div0, file$7, 9, 2, 275);
			attr_dev(div1, "class", "mdc-notched-outline__trailing");
			add_location(div1, file$7, 13, 2, 415);
			set_attributes(div2, div2_data);
			toggle_class(div2, "mdc-notched-outline--notched", ctx.notched);
			toggle_class(div2, "mdc-notched-outline--no-label", ctx.noLabel);
			add_location(div2, file$7, 0, 0, 0);
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
					if_block = create_if_block$2(ctx);
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
				(changed.className) && { class: "mdc-notched-outline " + ctx.className },
				(changed.exclude || changed.$$props) && exclude(ctx.$$props, ['use', 'class', 'notched', 'noLabel'])
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if ((changed.className || changed.notched)) {
				toggle_class(div2, "mdc-notched-outline--notched", ctx.notched);
			}

			if ((changed.className || changed.noLabel)) {
				toggle_class(div2, "mdc-notched-outline--no-label", ctx.noLabel);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
	return block;
}

function instance$7($$self, $$props, $$invalidate) {
	

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
		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["use", "class", "notched", "noLabel", "notch", "closeNotch"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "NotchedOutline", options, id: create_fragment$7.name });

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

const file$8 = "node_modules\\@smui\\textfield\\Input.svelte";

function create_fragment$8(ctx) {
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
			add_location(input, file$8, 0, 0, 0);

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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
	return block;
}

function toNumber(value) {
  return value === '' ? undefined : +value;
}

function instance$8($$self, $$props, $$invalidate) {
	

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
        $$invalidate('valueProp', valueProp.value = value, valueProp);
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
		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["use", "class", "type", "value", "files", "dirty", "invalid", "updateInvalid"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Input", options, id: create_fragment$8.name });
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

const file$9 = "node_modules\\@smui\\textfield\\Textarea.svelte";

function create_fragment$9(ctx) {
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
			add_location(textarea, file$9, 0, 0, 0);

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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$9.name, type: "component", source: "", ctx });
	return block;
}

function instance$9($$self, $$props, $$invalidate) {
	

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
		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["use", "class", "value", "dirty", "invalid", "updateInvalid"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Textarea", options, id: create_fragment$9.name });
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

const file$a = "node_modules\\@smui\\textfield\\Textfield.svelte";

const get_label_slot_changes_1 = () => ({});
const get_label_slot_context_1 = () => ({});

const get_label_slot_changes$1 = () => ({});
const get_label_slot_context$1 = () => ({});

// (61:0) {:else}
function create_else_block_1(ctx) {
	var div, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var div_levels = [
		{ class: "mdc-text-field " + ctx.className },
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
			toggle_class(div, "mdc-text-field--disabled", ctx.disabled);
			toggle_class(div, "mdc-text-field--fullwidth", ctx.fullwidth);
			toggle_class(div, "mdc-text-field--textarea", ctx.textarea);
			toggle_class(div, "mdc-text-field--outlined", ctx.variant === 'outlined' && !ctx.fullwidth);
			toggle_class(div, "smui-text-field--standard", ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea);
			toggle_class(div, "mdc-text-field--dense", ctx.dense);
			toggle_class(div, "mdc-text-field--no-label", ctx.noLabel);
			toggle_class(div, "mdc-text-field--with-leading-icon", ctx.withLeadingIcon);
			toggle_class(div, "mdc-text-field--with-trailing-icon", ctx.withTrailingIcon);
			toggle_class(div, "mdc-text-field--invalid", ctx.invalid);
			add_location(div, file$a, 61, 2, 1956);
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
				(changed.className) && { class: "mdc-text-field " + ctx.className },
				(changed.props) && ctx.props
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if ((changed.className || changed.disabled)) {
				toggle_class(div, "mdc-text-field--disabled", ctx.disabled);
			}

			if ((changed.className || changed.fullwidth)) {
				toggle_class(div, "mdc-text-field--fullwidth", ctx.fullwidth);
			}

			if ((changed.className || changed.textarea)) {
				toggle_class(div, "mdc-text-field--textarea", ctx.textarea);
			}

			if ((changed.className || changed.variant || changed.fullwidth)) {
				toggle_class(div, "mdc-text-field--outlined", ctx.variant === 'outlined' && !ctx.fullwidth);
			}

			if ((changed.className || changed.variant || changed.fullwidth || changed.textarea)) {
				toggle_class(div, "smui-text-field--standard", ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea);
			}

			if ((changed.className || changed.dense)) {
				toggle_class(div, "mdc-text-field--dense", ctx.dense);
			}

			if ((changed.className || changed.noLabel)) {
				toggle_class(div, "mdc-text-field--no-label", ctx.noLabel);
			}

			if ((changed.className || changed.withLeadingIcon)) {
				toggle_class(div, "mdc-text-field--with-leading-icon", ctx.withLeadingIcon);
			}

			if ((changed.className || changed.withTrailingIcon)) {
				toggle_class(div, "mdc-text-field--with-trailing-icon", ctx.withTrailingIcon);
			}

			if ((changed.className || changed.invalid)) {
				toggle_class(div, "mdc-text-field--invalid", ctx.invalid);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block_1.name, type: "else", source: "(61:0) {:else}", ctx });
	return block;
}

// (1:0) {#if valued}
function create_if_block$3(ctx) {
	var label_1, t0, current_block_type_index, if_block0, t1, t2, useActions_action, forwardEvents_action, current;

	const default_slot_template = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_template, ctx, null);

	var if_block_creators = [
		create_if_block_6,
		create_else_block$2
	];

	var if_blocks = [];

	function select_block_type_1(changed, ctx) {
		if (ctx.textarea) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_1(null, ctx);
	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	var if_block1 = (!ctx.textarea && ctx.variant !== 'outlined') && create_if_block_3(ctx);

	var if_block2 = (ctx.textarea || (ctx.variant === 'outlined' && !ctx.fullwidth)) && create_if_block_1(ctx);

	var label_1_levels = [
		{ class: "mdc-text-field " + ctx.className },
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
			toggle_class(label_1, "mdc-text-field--disabled", ctx.disabled);
			toggle_class(label_1, "mdc-text-field--fullwidth", ctx.fullwidth);
			toggle_class(label_1, "mdc-text-field--textarea", ctx.textarea);
			toggle_class(label_1, "mdc-text-field--outlined", ctx.variant === 'outlined' && !ctx.fullwidth);
			toggle_class(label_1, "smui-text-field--standard", ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea);
			toggle_class(label_1, "mdc-text-field--dense", ctx.dense);
			toggle_class(label_1, "mdc-text-field--no-label", ctx.noLabel || ctx.label == null);
			toggle_class(label_1, "mdc-text-field--with-leading-icon", ctx.withLeadingIcon);
			toggle_class(label_1, "mdc-text-field--with-trailing-icon", ctx.withTrailingIcon);
			toggle_class(label_1, "mdc-text-field--invalid", ctx.invalid);
			add_location(label_1, file$a, 1, 2, 15);
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
					if_block1 = create_if_block_3(ctx);
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
					if_block2 = create_if_block_1(ctx);
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
				(changed.className) && { class: "mdc-text-field " + ctx.className },
				(changed.props) && ctx.props
			]));

			if (typeof useActions_action.update === 'function' && changed.use) {
				useActions_action.update.call(null, ctx.use);
			}

			if ((changed.className || changed.disabled)) {
				toggle_class(label_1, "mdc-text-field--disabled", ctx.disabled);
			}

			if ((changed.className || changed.fullwidth)) {
				toggle_class(label_1, "mdc-text-field--fullwidth", ctx.fullwidth);
			}

			if ((changed.className || changed.textarea)) {
				toggle_class(label_1, "mdc-text-field--textarea", ctx.textarea);
			}

			if ((changed.className || changed.variant || changed.fullwidth)) {
				toggle_class(label_1, "mdc-text-field--outlined", ctx.variant === 'outlined' && !ctx.fullwidth);
			}

			if ((changed.className || changed.variant || changed.fullwidth || changed.textarea)) {
				toggle_class(label_1, "smui-text-field--standard", ctx.variant === 'standard' && !ctx.fullwidth && !ctx.textarea);
			}

			if ((changed.className || changed.dense)) {
				toggle_class(label_1, "mdc-text-field--dense", ctx.dense);
			}

			if ((changed.className || changed.noLabel || changed.label)) {
				toggle_class(label_1, "mdc-text-field--no-label", ctx.noLabel || ctx.label == null);
			}

			if ((changed.className || changed.withLeadingIcon)) {
				toggle_class(label_1, "mdc-text-field--with-leading-icon", ctx.withLeadingIcon);
			}

			if ((changed.className || changed.withTrailingIcon)) {
				toggle_class(label_1, "mdc-text-field--with-trailing-icon", ctx.withTrailingIcon);
			}

			if ((changed.className || changed.invalid)) {
				toggle_class(label_1, "mdc-text-field--invalid", ctx.invalid);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$3.name, type: "if", source: "(1:0) {#if valued}", ctx });
	return block;
}

// (31:4) {:else}
function create_else_block$2(ctx) {
	var updating_value, updating_dirty, updating_invalid, current;

	var input_spread_levels = [
		{ type: ctx.type },
		{ disabled: ctx.disabled },
		{ updateInvalid: ctx.updateInvalid },
		ctx.placeholderProp,
		prefixFilter(ctx.$$props, 'input$')
	];

	function input_value_binding(value_1) {
		ctx.input_value_binding.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	function input_dirty_binding(value_2) {
		ctx.input_dirty_binding.call(null, value_2);
		updating_dirty = true;
		add_flush_callback(() => updating_dirty = false);
	}

	function input_invalid_binding(value_3) {
		ctx.input_invalid_binding.call(null, value_3);
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
	if (ctx.dirty !== void 0) {
		input_props.dirty = ctx.dirty;
	}
	if (ctx.invalid !== void 0) {
		input_props.invalid = ctx.invalid;
	}
	var input = new Input({ props: input_props, $$inline: true });

	binding_callbacks.push(() => bind(input, 'value', input_value_binding));
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
			var input_changes = (changed.type || changed.disabled || changed.updateInvalid || changed.placeholderProp || changed.prefixFilter || changed.$$props) ? get_spread_update(input_spread_levels, [
									(changed.type) && { type: ctx.type },
			(changed.disabled) && { disabled: ctx.disabled },
			(changed.updateInvalid) && { updateInvalid: ctx.updateInvalid },
			(changed.placeholderProp) && get_spread_object(ctx.placeholderProp),
			(changed.prefixFilter || changed.$$props) && get_spread_object(prefixFilter(ctx.$$props, 'input$'))
								]) : {};
			if (!updating_value && changed.value) {
				input_changes.value = ctx.value;
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$2.name, type: "else", source: "(31:4) {:else}", ctx });
	return block;
}

// (20:4) {#if textarea}
function create_if_block_6(ctx) {
	var updating_value, updating_dirty, updating_invalid, current;

	var textarea_1_spread_levels = [
		{ disabled: ctx.disabled },
		{ updateInvalid: ctx.updateInvalid },
		prefixFilter(ctx.$$props, 'input$')
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
			(changed.prefixFilter || changed.$$props) && get_spread_object(prefixFilter(ctx.$$props, 'input$'))
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_6.name, type: "if", source: "(20:4) {#if textarea}", ctx });
	return block;
}

// (45:4) {#if !textarea && variant !== 'outlined'}
function create_if_block_3(ctx) {
	var t, if_block1_anchor, current;

	var if_block0 = (!ctx.noLabel && ctx.label != null && !ctx.fullwidth) && create_if_block_5(ctx);

	var if_block1 = (ctx.ripple) && create_if_block_4(ctx);

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
					if_block0 = create_if_block_5(ctx);
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
					if_block1 = create_if_block_4(ctx);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_3.name, type: "if", source: "(45:4) {#if !textarea && variant !== 'outlined'}", ctx });
	return block;
}

// (46:6) {#if !noLabel && label != null && !fullwidth}
function create_if_block_5(ctx) {
	var current;

	var floatinglabel_spread_levels = [
		{ wrapped: true },
		prefixFilter(ctx.$$props, 'label$')
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
			get_spread_object(prefixFilter(ctx.$$props, 'label$'))
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_5.name, type: "if", source: "(46:6) {#if !noLabel && label != null && !fullwidth}", ctx });
	return block;
}

// (47:8) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2.name, type: "slot", source: "(47:8) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>", ctx });
	return block;
}

// (49:6) {#if ripple}
function create_if_block_4(ctx) {
	var current;

	var lineripple_spread_levels = [
		prefixFilter(ctx.$$props, 'ripple$')
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
									get_spread_object(prefixFilter(ctx.$$props, 'ripple$'))
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_4.name, type: "if", source: "(49:6) {#if ripple}", ctx });
	return block;
}

// (53:4) {#if textarea || (variant === 'outlined' && !fullwidth)}
function create_if_block_1(ctx) {
	var current;

	var notchedoutline_spread_levels = [
		{ noLabel: ctx.noLabel || ctx.label == null },
		prefixFilter(ctx.$$props, 'outline$')
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
			(changed.prefixFilter || changed.$$props) && get_spread_object(prefixFilter(ctx.$$props, 'outline$'))
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(53:4) {#if textarea || (variant === 'outlined' && !fullwidth)}", ctx });
	return block;
}

// (55:8) {#if !noLabel && label != null}
function create_if_block_2(ctx) {
	var current;

	var floatinglabel_spread_levels = [
		{ wrapped: true },
		prefixFilter(ctx.$$props, 'label$')
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
			get_spread_object(prefixFilter(ctx.$$props, 'label$'))
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(55:8) {#if !noLabel && label != null}", ctx });
	return block;
}

// (56:10) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(56:10) <FloatingLabel wrapped {...prefixFilter($$props, 'label$')}>", ctx });
	return block;
}

// (54:6) <NotchedOutline noLabel={noLabel || label == null} {...prefixFilter($$props, 'outline$')}>
function create_default_slot(ctx) {
	var if_block_anchor, current;

	var if_block = (!ctx.noLabel && ctx.label != null) && create_if_block_2(ctx);

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
					if_block = create_if_block_2(ctx);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(54:6) <NotchedOutline noLabel={noLabel || label == null} {...prefixFilter($$props, 'outline$')}>", ctx });
	return block;
}

function create_fragment$a(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$3,
		create_else_block_1
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
	return block;
}

function instance$a($$self, $$props, $$invalidate) {
	

  const forwardEvents = forwardEventsBuilder(current_component);
  let uninitializedValue = () => {};

  let { use = [], class: className = '', ripple = true, disabled = false, fullwidth = false, textarea = false, variant = 'standard', dense = false, withLeadingIcon = false, withTrailingIcon = false, noLabel = false, label = null, type = 'text', value = uninitializedValue, dirty = false, invalid = uninitializedValue, updateInvalid = invalid === uninitializedValue, useNativeValidation = updateInvalid } = $$props;

  let element;
  let textField;

  onMount(() => {
    $$invalidate('textField', textField = new MDCTextField(element));

    if (!ripple) {
      textField.ripple && textField.ripple.destroy();
    }
  });

  onDestroy(() => {
    textField && textField.destroy();
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
		$$invalidate('invalid', invalid), $$invalidate('textField', textField), $$invalidate('updateInvalid', updateInvalid), $$invalidate('valued', valued), $$invalidate('value', value), $$invalidate('disabled', disabled), $$invalidate('useNativeValidation', useNativeValidation), $$invalidate('uninitializedValue', uninitializedValue);
	}

	function input_value_binding(value_1) {
		value = value_1;
		$$invalidate('value', value);
	}

	function input_dirty_binding(value_2) {
		dirty = value_2;
		$$invalidate('dirty', dirty);
	}

	function input_invalid_binding(value_3) {
		invalid = value_3;
		$$invalidate('invalid', invalid), $$invalidate('textField', textField), $$invalidate('updateInvalid', updateInvalid), $$invalidate('valued', valued), $$invalidate('value', value), $$invalidate('disabled', disabled), $$invalidate('useNativeValidation', useNativeValidation), $$invalidate('uninitializedValue', uninitializedValue);
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
		if ('dirty' in $$new_props) $$invalidate('dirty', dirty = $$new_props.dirty);
		if ('invalid' in $$new_props) $$invalidate('invalid', invalid = $$new_props.invalid);
		if ('updateInvalid' in $$new_props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
		if ('useNativeValidation' in $$new_props) $$invalidate('useNativeValidation', useNativeValidation = $$new_props.useNativeValidation);
		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { uninitializedValue, use, className, ripple, disabled, fullwidth, textarea, variant, dense, withLeadingIcon, withTrailingIcon, noLabel, label, type, value, dirty, invalid, updateInvalid, useNativeValidation, element, textField, props, valued, placeholderProp };
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
		if ('dirty' in $$props) $$invalidate('dirty', dirty = $$new_props.dirty);
		if ('invalid' in $$props) $$invalidate('invalid', invalid = $$new_props.invalid);
		if ('updateInvalid' in $$props) $$invalidate('updateInvalid', updateInvalid = $$new_props.updateInvalid);
		if ('useNativeValidation' in $$props) $$invalidate('useNativeValidation', useNativeValidation = $$new_props.useNativeValidation);
		if ('element' in $$props) $$invalidate('element', element = $$new_props.element);
		if ('textField' in $$props) $$invalidate('textField', textField = $$new_props.textField);
		if ('props' in $$props) $$invalidate('props', props = $$new_props.props);
		if ('valued' in $$props) $$invalidate('valued', valued = $$new_props.valued);
		if ('placeholderProp' in $$props) $$invalidate('placeholderProp', placeholderProp = $$new_props.placeholderProp);
	};

	let props, valued, placeholderProp;

	$$self.$$.update = ($$dirty = { $$props: 1, value: 1, uninitializedValue: 1, fullwidth: 1, label: 1, textField: 1, valued: 1, disabled: 1, invalid: 1, updateInvalid: 1, useNativeValidation: 1 }) => {
		$$invalidate('props', props = exclude($$props, ['use', 'class', 'ripple', 'disabled', 'fullwidth', 'textarea', 'variant', 'dense', 'withLeadingIcon', 'withTrailingIcon', 'noLabel', 'label', 'type', 'value', 'dirty', 'invalid', 'updateInvalid', 'useNativeValidation', 'input$', 'label$', 'ripple$', 'outline$']));
		if ($$dirty.value || $$dirty.uninitializedValue) { $$invalidate('valued', valued = value !== uninitializedValue); }
		if ($$dirty.fullwidth || $$dirty.label) { $$invalidate('placeholderProp', placeholderProp = (fullwidth && label) ? {placeholder: label} : {}); }
		if ($$dirty.textField || $$dirty.valued || $$dirty.value) { if (textField && valued && textField.value !== value) {
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
		placeholderProp,
		change_handler,
		input_handler,
		change_handler_1,
		input_handler_1,
		textarea_1_value_binding,
		textarea_1_dirty_binding,
		textarea_1_invalid_binding,
		input_value_binding,
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
		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["use", "class", "ripple", "disabled", "fullwidth", "textarea", "variant", "dense", "withLeadingIcon", "withTrailingIcon", "noLabel", "label", "type", "value", "dirty", "invalid", "updateInvalid", "useNativeValidation", "focus", "layout"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Textfield", options, id: create_fragment$a.name });

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

const file$b = "src\\components\\FullFrameDisplay.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx._ = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (1:0) {#each new Array($frameCount).fill(0) as _, i}
function create_each_block(ctx) {
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
			add_location(div0, file$b, 12, 4, 441);
			set_style(div1, "width", "" + ctx.$spritesheet.width / ctx.$frameCount + "px");
			set_style(div1, "height", "" + ctx.$spritesheet.height + "px");
			set_style(div1, "background-image", "url(" + ctx.$spritesheet.dataUrl + ")");
			set_style(div1, "background-position", "" + (ctx.$spritesheet.width / ctx.$frameCount) * -ctx.i + "px 0");
			set_style(div1, "display", "inline-block");
			set_style(div1, "border-right", ((ctx.i !== ctx.$frameCount - 1) ? '1px solid black' : 'none'));
			set_style(div1, "position", "relative");
			add_location(div1, file$b, 1, 2, 50);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(1:0) {#each new Array($frameCount).fill(0) as _, i}", ctx });
	return block;
}

function create_fragment$b(ctx) {
	var each_1_anchor;

	let each_value = new Array(ctx.$frameCount).fill(0);

	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
			if (changed.$spritesheet || changed.$frameCount) {
				each_value = new Array(ctx.$frameCount).fill(0);

				let i;
				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
	return block;
}

function instance$b($$self, $$props, $$invalidate) {
	let $frameCount, $spritesheet;

	validate_store(frameCount, 'frameCount');
	component_subscribe($$self, frameCount, $$value => { $frameCount = $$value; $$invalidate('$frameCount', $frameCount); });
	validate_store(spritesheet, 'spritesheet');
	component_subscribe($$self, spritesheet, $$value => { $spritesheet = $$value; $$invalidate('$spritesheet', $spritesheet); });

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ('$frameCount' in $$props) frameCount.set($frameCount);
		if ('$spritesheet' in $$props) spritesheet.set($spritesheet);
	};

	return { $frameCount, $spritesheet };
}

class FullFrameDisplay extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$b, create_fragment$b, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "FullFrameDisplay", options, id: create_fragment$b.name });
	}
}

/* src\prompts\framecount.svelte generated by Svelte v3.12.1 */

const file$c = "src\\prompts\\framecount.svelte";

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

function create_fragment$c(ctx) {
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
			add_location(h1, file$c, 3, 2, 129);
			attr_dev(br0, "class", "svelte-1cnrfbb");
			add_location(br0, file$c, 15, 2, 410);
			attr_dev(br1, "class", "svelte-1cnrfbb");
			add_location(br1, file$c, 16, 2, 419);
			attr_dev(div, "class", "container svelte-1cnrfbb");
			add_location(div, file$c, 1, 0, 2);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
	return block;
}

function instance$c($$self) {
 
  const updateFrameCount = (evt) => {
    frameCount.set(parseInt(evt.target.value));
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
		init(this, options, instance$c, create_fragment$c, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Framecount", options, id: create_fragment$c.name });
	}
}

/* src\prompts\image_confirmation.svelte generated by Svelte v3.12.1 */

const file$d = "src\\prompts\\image_confirmation.svelte";

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
			add_location(img, file$d, 6, 6, 229);
			add_location(br, file$d, 6, 60, 283);
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

function create_fragment$d(ctx) {
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
			add_location(h1, file$d, 2, 2, 105);
			attr_dev(div, "class", "container svelte-rcpnnu");
			add_location(div, file$d, 1, 0, 2);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$d.name, type: "component", source: "", ctx });
	return block;
}

function instance$d($$self, $$props, $$invalidate) {
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
		init(this, options, instance$d, create_fragment$d, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Image_confirmation", options, id: create_fragment$d.name });
	}
}

/* src\prompts\upload.svelte generated by Svelte v3.12.1 */

const file$e = "src\\prompts\\upload.svelte";

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
			add_location(input, file$e, 4, 6, 164);
			add_location(div, file$e, 3, 4, 151);
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

function create_fragment$e(ctx) {
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
			add_location(h1, file$e, 1, 2, 103);
			attr_dev(div, "class", "container svelte-1thgizp");
			add_location(div, file$e, 0, 0, 0);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
	return block;
}

let uploadFile = false;

function instance$e($$self, $$props, $$invalidate) {
	 

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
		init(this, options, instance$e, create_fragment$e, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Upload", options, id: create_fragment$e.name });
	}
}

/* src\components\monaco\monaco-editor.svelte generated by Svelte v3.12.1 */

const file$f = "src\\components\\monaco\\monaco-editor.svelte";

function create_fragment$f(ctx) {
	var div;

	const block = {
		c: function create() {
			div = element("div");
			attr_dev(div, "class", "monaco-container");
			set_style(div, "height", "500px");
			set_style(div, "text-align", "left");
			add_location(div, file$f, 50, 0, 1043);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			ctx.div_binding(div);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			ctx.div_binding(null);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
	return block;
}

let monaco_promise;
let _monaco;

monaco_promise = import('./monaco-a1addfdd.js');
monaco_promise.then(mod => {
  _monaco = mod.default;
});

function instance$f($$self, $$props, $$invalidate) {
	let monaco;
  let container;
  let editor;

  onMount(() => {
		if (_monaco) {
      monaco = _monaco;
      editor = monaco.editor.create(
        container
      );
			// createEditor(mode || 'svelte').then(() => {
			// 	if (editor) editor.setValue(code || '');
      // });
		} else {
			monaco_promise.then(async mod => {
        console.log(container);
        monaco = mod.default;
        editor = monaco.editor.create(
          container,
          {
            value: [
              'var thing = 12345678.98765;'
            ].join('\n'),
            language: 'gamemaker'
          }
        );
        window['editor'] = editor;
      });
		}
		return () => {
			destroyed = true;
			// if (editor) editor.toTextArea();
		}
  });
  //butts2

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('container', container = $$value);
		});
	}

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ('monaco' in $$props) monaco = $$props.monaco;
		if ('container' in $$props) $$invalidate('container', container = $$props.container);
		if ('editor' in $$props) editor = $$props.editor;
	};

	return { container, div_binding };
}

class Monaco_editor extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$f, create_fragment$f, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Monaco_editor", options, id: create_fragment$f.name });
	}
}

/* src\prompts\begin.svelte generated by Svelte v3.12.1 */

const file$g = "src\\prompts\\begin.svelte";

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

function create_fragment$g(ctx) {
	var div, h1, t1, t2, div_intro, div_outro, current;

	var formfield = new FormField({
		props: {
		$$slots: { default: [create_default_slot$4] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var editor = new Monaco_editor({ $$inline: true });

	const block = {
		c: function create() {
			div = element("div");
			h1 = element("h1");
			h1.textContent = "How do you want to begin?";
			t1 = space();
			formfield.$$.fragment.c();
			t2 = space();
			editor.$$.fragment.c();
			add_location(h1, file$g, 2, 2, 105);
			attr_dev(div, "class", "container svelte-rcpnnu");
			add_location(div, file$g, 1, 0, 2);
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
			mount_component(editor, div, null);
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

			transition_in(editor.$$.fragment, local);

			add_render_callback(() => {
				if (div_outro) div_outro.end(1);
				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 150, duration: 500 });
				div_intro.start();
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(formfield.$$.fragment, local);
			transition_out(editor.$$.fragment, local);
			if (div_intro) div_intro.invalidate();

			div_outro = create_out_transition(div, fly, { y: -150, duration: 500 });

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(div);
			}

			destroy_component(formfield);

			destroy_component(editor);

			if (detaching) {
				if (div_outro) div_outro.end();
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
	return block;
}

function instance$g($$self) {
	

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
		init(this, options, instance$g, create_fragment$g, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Begin", options, id: create_fragment$g.name });
	}
}

/* src\App.svelte generated by Svelte v3.12.1 */

const file$h = "src\\App.svelte";

function create_fragment$h(ctx) {
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
			attr_dev(div, "class", "svelte-4l7xfm");
			add_location(div, file$h, 0, 0, 0);
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
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$h.name, type: "component", source: "", ctx });
	return block;
}

function instance$h($$self, $$props, $$invalidate) {
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
		init(this, options, instance$h, create_fragment$h, safe_not_equal, []);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$h.name });
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
