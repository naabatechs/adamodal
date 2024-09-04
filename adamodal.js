
/*!
 * adamodal.js v6.1.24
 * https://naaba.github.io/adamodal.js
 *
 * Licensed MIT © Naaba Technologies
**/

'use strict';

// Polyfills

// SEE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, 'assign', {
        value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target == null) { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            let to = Object(target);

            for (let index = 1; index < arguments.length; index++) {
                let nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                    for (let nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}

Error.stackTraceLimit = 50

window.adamodal = function () {
    let dialogs = [];
    let perspectiveCounter = 0;
    let zIndex = 10000;
    let utils = {
        newId: function () {
            return 'adam-id-' + Math.random().toString(36).substring(2);
        },
        newZIndex: function () {
            zIndex += 1;
            return zIndex;
        },
        isString: function (v) {
            return typeof v === 'string' || v instanceof String;
        },
        isArray: function (v) {
            return Array.isArray(v)
        },
        getCenterPosition: function (element) {
            return {
                x: element.offsetLeft + element.offsetWidth / 2,
                y: element.offsetTop + element.offsetHeight / 2
            }
        },
        setCenterPosition: function (element, pos) {
            element.style.left = (pos.x - element.offsetWidth / 2) + 'px';
            element.style.top = (pos.y - element.offsetHeight / 2) + 'px';
        },
        debugTrace: function () {
            let trace = ''

            try {
                throw new Error()
            } catch (e) {
                trace = e.stack
            }

            trace = trace.replace(/^Error/, 'Trace')

            return trace
        }
    };

    // all transitions should end in 1 second, then some cleanup work or fix will be done
    let transitionTimeout = 1000;

    let dragAsClick = {
        timeout: 300,
        distance: 5
    }

    let spinOverlayElement = null;
    let spinCount = 0;

    window.addEventListener("DOMContentLoaded", function () {
        spinOverlayElement = createSpin();
    });

    return {
        // adamodal.init(options)
        // initialize adamodal
        // options.zIndex0 - initial z index to use, default value is 10000
        init: init,

        // adamodal.create(options)
        // create a dialog
        // SEE: [default options](#default_options)
        create: create,

        // adamodal.open(options)
        // create a dialog and show it
        // SEE: [default options](#default_options)
        open: open,

        // adamodal.alert(text, options)
        // display an alert dialog, please view the source for details
        alert: alert,

        // adamodal.confirm(text, onyes, options)
        // display a confirm dialog, please view the source for details
        confirm: confirm,

        // adamodal.info(text, options)
        // display an information dialog, please view the source for details
        info: info,

        // adamodal.warn(text, options)
        // display a warning dialog, please view the source for details
        warn: warn,

        // adamodal.error(text, options)
        // display an error dialog, please view the source for details
        error: error,

        // adamodal.fatal(text, options)
        // display a fatal error dialog, please view the source for details
        fatal: fatal,

        // adamodal.dialogs()
        // get all dialog instances
        dialogs: dialogs,

        // adamodal.startSpin()
        // start spin animation
        startSpin: startSpin,

        // adamodal.stopSpin()
        // stop spin animation
        stopSpin: stopSpin,
    };

    function defaultOptions() {
        return {
            // dialog title
            // use null value to remove title
            title: 'Dialog Title',

            // dialog close button
            // Visibility is controlled by a boolean statement closeButton ? true : false
            closeButton: true,

            // dialog Dark mode
            // Add dark mode support to the modals
            // Supported modes are 'dark', 'light', 'system'
            darkMode: 'system',

            // Niel theme support
            // A modern themed styles inspired by Daniel Abugre [Dclaud] controlled by a boolean statement nielTheme ? true : false
            nielTheme: true,

            // dialog body
            //
            // valid values:
            // - null
            //      no body
            //
            // - string
            //      body html
            //
            // - object
            //      src: body source selector
            //      element: body source dom element
            //
            //      please use element when selector not usable
            //
            //      example:
            //      {
            //          src: '#demo6-content'
            //          element: document.getElementById('demo6-content')
            //      }
            body: '<p>Dialog body</p>',

            // dialog buttons
            //
            // valid values:
            // - null
            //      no buttons
            //
            // - array
            //      predefined button name or user defined button html like
            //      example: ['ok', 'cancel', 'delete', '<button id="my-button-id" class="my-button-class">Button-text</button>']
            //
            // - object
            //      button name to button text(predefined) or button html(user defined) or attribute object map like
            //      example: {
            //          ok: {
            //              text: 'okay',
            //              style: 'background:#4336f4;',
            //              clazz: 'adam-button adam-ok demo-copy-button'
            //          },
            //          delete: 'Delete',
            //          cancel: 'Cancel',
            //          other: '<button id="my-button-id" class="my-button-class">Button-text</button>'
            //      }
            buttons: ['ok', 'cancel'],

            // dialog extra classes
            // for example 'adam-fatal my-dialog-class'
            extraClass: '',

            // dialog extra style
            // for example 'width: 640px;'
            style: '',

            // dialog show/hide effect, one of the following values
            // - fade_in_and_scale
            // - slide_in_right
            // - slide_in_bottom
            // - sticky_up
            // - 3d_flip_vertical
            // - 3d_sign
            // - super_scaled
            // - just_me
            // - blur
            // - let_me_in
            // - make_way
            // - slip_from_top
            //
            // use '' or null value to disable effect
            effect: 'blur',

            // fix dialog blur for chrome browser with/without transform and/or with/without perspective
            //
            // true: to fix
            // false: not to fix
            //
            fixChromeBlur: true,

            // modal or not
            modal: true,

            // timeout in seconds to close dialog automatically
            // use 0 value to disable closing dialog automatically
            timeout: 0,

            // listen enter key press or not
            listenEnterKey: true,

            // listen ESC key press or not
            listenESCKey: true,

            // callback when dialog element is about to be created
            // return false to stop creating process
            beforecreate: null,

            // callback when dialog element has been created
            aftercreate: null,

            // callback before show
            // return false to stop showing process
            beforeshow: null,

            // callback after show
            aftershow: null,

            // callback before hide
            // return false to stop hidding process
            beforehide: null,

            // callback after hide
            afterhide: null,

            // callback when OK button pressed
            // return false to avoid to be closed
            onok: null,

            // callback when Cancel button pressed
            // return false to avoid to be closed
            oncancel: null,

            // callback when Delete button pressed
            // return false to avoid to be closed
            ondelete: null,

            // callback when dialog is about to be destroyed
            // return false to avoid to be destroyed
            ondestroy: null,

            // callback when drag will start
            // return false to avoid being dragged by default process
            // return true to allow being dragged
            // otherwise to go default process
            ondrag: null,
        };
    }

    function callbackParam(dialogElement, dialog, overlayElement, event) {
        return {
            id: dialogElement.id,
            element: dialogElement,
            dialog: dialog,
            overlay: overlayElement,
            event: event
        };
    }

    function defaultAlertOptions(text) {
        text = text || 'alert text';

        return {
            title: null,
            body: '<p style="text-align:center;">' + text + '</p>',
            buttons: ['ok'],
            effect: 'sticky_up',
        };
    }

    function defaultConfirmOptions(text, onyes) {
        text = text || 'Are you sure?';

        return {
            title: 'Confirm',
            body: '<p style="text-align:center;">' + text + '</p>',
            buttons: {
                ok: 'Yes',
                cancel: 'No'
            },
            effect: '3d_sign',
            onok: onyes,
        };
    }

    function defaultInfoOptions(text) {
        text = text || 'some information';

        return {
            title: null,
            body: '<div style="text-align:center;">' + text + '</div>',
            buttons: null,
            extraClass: 'adam-info',
            effect: 'sticky_up',
            modal: false,
            timeout: 5
        };
    }

    function defaultWarnOptions(text) {
        text = text || 'Some warning';

        return {
            title: null,
            body: '<div style="text-align:center;">' + text + '</div>',
            buttons: null,
            extraClass: 'adam-warn',
            effect: 'sticky_up',
            modal: false,
            timeout: 10
        };
    }

    function defaultErrorOptions(text) {
        text = text || 'An error occured!';

        return {
            title: 'Error',
            body: '<div style="text-align:center;">' + text + '</div>',
            buttons: ['ok'],
            extraClass: 'adam-error',
            effect: 'slide_in_bottom'
        };
    }

    function defaultFatalOptions(text) {
        text = text || 'A fatal error occured!';

        return {
            title: 'Fatal Error',
            body: '<div style="text-align:center;">' + text + '</div>',
            buttons: null,
            extraClass: 'adam-fatal',
            effect: null,
            ondrag: function () {
                return false;
            },
            beforehide: function () {
                return false;
            },
        };
    }

    function getEffect(effectName) {
        if (!effectName) {
            return { clazz: '', perspective: false };
        }

        switch (effectName) {
            case 'fade_in_and_scale':
            default:
                return { clazz: 'adaffect-1', perspective: false };
            case 'slide_in_right':
                return { clazz: 'adaffect-2', perspective: false };
            case 'slide_in_bottom':
                return { clazz: 'adaffect-3', perspective: false };
            case 'sticky_up':
                return { clazz: 'adaffect-7', perspective: false };
            case '3d_flip_vertical':
                return { clazz: 'adaffect-9', perspective: false };
            case '3d_sign':
                return { clazz: 'adaffect-10', perspective: false };
            case 'super_scaled':
                return { clazz: 'adaffect-11', perspective: false };
            case 'just_me':
                return { clazz: 'adaffect-12', perspective: false };
            case 'blur':
                return { clazz: 'adaffect-16', perspective: false };
            case 'let_me_in':
                return { clazz: 'adaffect-17', perspective: true };
            case 'make_way':
                return { clazz: 'adaffect-18', perspective: true };
            case 'slip_from_top':
                return { clazz: 'adaffect-19', perspective: true };
        }
    }
    
    function getDark(darkMode) {
        if (!darkMode) {
            return { clazz: '', perspective: false };
        }
    
        switch (darkMode) {
            case 'dark':
            default:
                return { clazz: 'ada-dark', perspective: false };
            case 'light':
                return { clazz: '', perspective: false };
            case 'system':
                const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                return { clazz: isDarkMode ? 'ada-dark' : '', perspective: false };
        }
    }

    function getNielTheme(nielTheme) {
        if (!nielTheme) {
            return { clazz: '', perspective: false };
        }
    
        return { clazz: 'ada-niel', perspective: false };
    }    

    function createOverlay(params) {
        params = Object.assign({
            zIndex: utils.newZIndex()
        }, params);

        let overlayElement = document.createElement('div');

        overlayElement.classList.add('adam-overlay');
        overlayElement.style['z-index'] = params.zIndex;

        document.body.insertAdjacentElement('beforeend', overlayElement);
        return overlayElement;
    }

    function createDialog(options, overlayElement) {
        // Create element
        let dialogElement = document.createElement('div');
        let effect = getEffect(options.effect);
        let dark = getDark(options.darkMode);
        let niel = getNielTheme(options.nielTheme);
    
        dialogElement.id = utils.newId();
        dialogElement.effect = effect;
        dialogElement.dark = dark;
        dialogElement.niel = niel;
        
        dialogElement.setAttribute('class', 'adam-dialog adam-center ' + effect.clazz + ' ' + dark.clazz + ' ' + niel.clazz + ' ' + options.extraClass);
        dialogElement.setAttribute('style', 'z-index:' + utils.newZIndex() + ';' + options.style);
    
        // Create innerHTML
        let innerHTML = '<div class="adam-content">';
    
        if (options.title) {
            innerHTML += '<div class="adam-title">' + options.title;
            if (options.closeButton) {
                innerHTML += '<div class="adam-close-button">×</div>';
            }
            innerHTML += '</div>';
        }    
    
        if (options.body) {
            if (utils.isString(options.body)) {
                innerHTML += '<div class="adam-body"><div class="adam-body-inner">' + options.body + '</div></div>';
            } else {
                let srcElement = null;
    
                if (options.body.src) {
                    srcElement = document.querySelector(options.body.src);
                } else if (options.body.element) {
                    srcElement = options.body.element;
                }
    
                if (srcElement) {
                    dialogElement.srcOriginalParent = srcElement.parentElement;
                    dialogElement.srcElement = srcElement;
    
                    innerHTML += '<div class="adam-body"><div class="adam-body-inner"></div></div>';
                } else {
                    console.warn('Element of selector not found: ' + options.body.src);
                }
            }
        }
    
        if (options.buttons) {
            innerHTML += createButtons(options);
        }
    
        innerHTML += '</div>';
        dialogElement.innerHTML = innerHTML;
    
        if (dialogElement.srcElement) {
            dialogElement.querySelector('.adam-body-inner').appendChild(dialogElement.srcElement);
        }
    
        if (options.beforecreate) {
            if (options.beforecreate(callbackParam(dialogElement, null, overlayElement, null)) === false) {
                return null;
            }
        }
    
        document.body.insertAdjacentElement('afterbegin', dialogElement);
        options.aftercreate && options.aftercreate(callbackParam(dialogElement, null, overlayElement, null));
    
        return dialogElement;
    }    

    function predefinedButtonInfo(name) {
        switch (name) {
            case 'ok':
                return {
                    text: 'OK',
                    clazz: 'adam-button adam-ok'
                };
            case 'cancel':
                return {
                    text: 'Cancel',
                    clazz: 'adam-button adam-cancel'
                };
            case 'delete':
                return {
                    text: 'Delete',
                    clazz: 'adam-button adam-delete'
                };
            default:
                return null;
        }
    }

    function createButtons(options) {
        let html = '';
        let buttonInfos = {};

        if (utils.isArray(options.buttons)) {
            options.buttons.forEach(function (name, i) {
                let buttonInfo = predefinedButtonInfo(name);

                if (buttonInfo) {
                    // predefined
                    buttonInfos[name] = buttonInfo;
                } else {
                    // non-predefined
                    buttonInfos['button' + i] = {
                        html: name // name is html
                    };
                }
            });
        } else {
            Object.keys(options.buttons).forEach(function (name) {
                let buttonInfo = predefinedButtonInfo(name);
                let value = options.buttons[name];

                if (buttonInfo) {
                    // predefined
                    if (utils.isString(value)) {
                        // value is a string, set text attribute
                        buttonInfo.text = value;
                        buttonInfos[name] = buttonInfo;
                    } else {
                        // value is an object, merge attributes
                        buttonInfos[name] = Object.assign(buttonInfo, value);
                    }
                } else {
                    // non-predefined
                    buttonInfos[name] = {
                        html: value
                    };
                }
            });
        }

        html += '<div class="adam-buttons">';

        Object.keys(buttonInfos).forEach(function (name) {
            if (buttonInfos[name].html) {
                // html defined
                html += buttonInfos[name].html;
            } else {
                let style = buttonInfos[name].style || '';
                html += '<button style="' + style + '" class="' + buttonInfos[name].clazz + '">' + buttonInfos[name].text + '</button>';
            }
        });

        html += '</div>';

        return html;
    }

    /**
     * init adamodal
     *
     * @param {object} options
     * @param {number} options.zIndex0
     */
    function init(options) {
        zIndex = options.zIndex0 || zIndex;
    }

    function create(options) {
        let dialog = {};
        options = Object.assign(defaultOptions(), options);

        let overlayElement = null;
        options.modal && (overlayElement = createOverlay());

        let dialogElement = createDialog(options, overlayElement);

        if (dialogElement === null) {
            return null;
        }

        let okButton = dialogElement.querySelector('.adam-ok');
        let cancelButton = dialogElement.querySelector('.adam-cancel');
        let closeButton = dialogElement.querySelector('.adam-close-button');
        let deleteButton = dialogElement.querySelector('.adam-delete');

        addEventListeners();

        // load all iframes before showing
        let preparedForShow = false;
        handleIFrame();

        dialog = {
            // dialog.id
            // dialog html element id
            id: dialogElement.id,

            // dialog.element
            // dialog html element
            element: dialogElement,

            // dialog.show()
            // show dialog
            show: show,

            // dialog.hide()
            // hide dialog
            hide: hide,

            // dialog.destroy()
            // destroy dialog
            destroy: destroy,

            // dialog.close()
            // hide dialog and destroy it
            close: close,

            // dialog.adjust()
            // adjust dialog to make the whole dialog visible
            adjust: adjust,

            // dialog.fixChromeBlur()
            // fix chrome blur
            fixChromeBlur: fixChromeBlur
        };

        dialogs.push(dialog);
        return dialog;

        function handleIFrame() {
            let iframes = dialogElement.querySelectorAll('iframe');

            if (iframes.length === 0) {
                preparedForShow = true;
                return;
            }

            let loadCount = 0;

            [].slice.call(iframes).forEach(function (iframe) {
                iframe.addEventListener('load', function listener(ev) {
                    iframe.removeEventListener('load', listener);
                    loadCount += 1;

                    if (loadCount === iframes.length) {
                        preparedForShow = true;
                    }
                })
            });
        }

        function addEventListeners() {
            okButton && okButton.addEventListener('click', doOk);
            cancelButton && cancelButton.addEventListener('click', doCancel);
            closeButton && closeButton.addEventListener('click', doCancel);
            deleteButton && deleteButton.addEventListener('click', doDelete);

            dragElement(options.ondrag, dialogElement)

            if (overlayElement) {
                dragElement(options.ondrag, dialogElement, overlayElement, doCancel);
            }
        }

        function show() {
            checkStatusAndShow();

            function checkStatusAndShow() {
                if (preparedForShow) {
                    if (options.beforeshow) {
                        if (options.beforeshow(callbackParam(dialogElement, dialog, overlayElement, null)) === false) {
                            return;
                        }
                    }

                    showMe();
                    options.aftershow && options.aftershow(callbackParam(dialogElement, dialog, overlayElement, null));
                } else {
                    // wait for preparedForShow
                    setTimeout(checkStatusAndShow, 0);
                }
            }

            function showMe() {
                // remove foucs from original active element to avoid it response to enter key pressing
                // 'blur not supported in IE 11' occurred, so check it
                if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                }

                // use setTimeout to enable css transition
                setTimeout(function () {
                    if (dialogElement.effect.perspective) {
                        perspectiveCounter++;

                        if (perspectiveCounter === 1) {
                            document.documentElement.classList.add('adam-perspective');
                        }
                    }

                    dialogElement.classList.add('adam-show');
                    overlayElement && overlayElement.classList.add('adam-show-overlay');

                    listenEnterAndEscKey();
                    fixEnterKeyEventInTextarea();

                    if (options.timeout > 0) {
                        dialogElement.addEventListener('mouseenter', stopCloseTimer);
                        dialogElement.addEventListener('mouseleave', startCloseTimer);
                        startCloseTimer();
                    }
                }, 200);

                // NOTE: fix chrome blur
                if (options.fixChromeBlur) {
                    if (!dialogElement.effect.clazz) {
                        // dialogs without effect
                        fixChromeBlur();
                    } else {
                        dialogElement.addEventListener('transitionend', function listener(ev) {
                            if (ev.propertyName === 'transform') {
                                dialogElement.removeEventListener('transitionend', listener);

                                // dialogs with effect on transform end
                                fixChromeBlur();
                            }
                        });

                        // event transitionend not always reliable, so also use setTimeout
                        setTimeout(function () {
                            fixChromeBlur();
                        }, transitionTimeout);
                    }
                }
            }
        }

        function hide() {
            if (options.beforehide) {
                if (options.beforehide(callbackParam(dialogElement, dialog, overlayElement, null)) === false) {
                    return false;
                }
            }

            // save center position for after adjusting
            dialog.centerPosition = utils.getCenterPosition(dialogElement);

            unlistenEnterAndEscKey();
            cleanEnterKeyEventInTextarea();

            if (options.timeout > 0) {
                dialogElement.removeEventListener('mouseenter', stopCloseTimer);
                dialogElement.removeEventListener('mouseleave', startCloseTimer);
            }

            restorePerspective();

            if (dialogElement.effect.perspective) {
                setTimeout(function () {
                    if (perspectiveCounter === 1) {
                        document.documentElement.classList.remove('adam-perspective');
                    }

                    perspectiveCounter--;
                }, transitionTimeout);
            }

            dialogElement.classList.remove('adam-show');
            overlayElement && overlayElement.classList.remove('adam-show-overlay');

            options.afterhide && options.afterhide(callbackParam(dialogElement, dialog, overlayElement, null));
        }

        function listenEnterAndEscKey() {
            if (options.listenEnterKey) {
                dialogElement.enterKeyListener = function listener(ev) {
                    if (ev.key !== 'Enter') {
                        return;
                    }

                    let topMostDialogElement = document.querySelector('.adam-dialog.adam-show');

                    if (topMostDialogElement === dialogElement) {
                        doOk(ev);
                    }
                };

                document.addEventListener('keyup', dialogElement.enterKeyListener);
            }

            if (options.listenESCKey) {
                dialogElement.escKeyListener = function listener(ev) {
                    if (ev.key !== 'Escape' && ev.key !== 'Esc') {
                        return;
                    }

                    let topMostDialogElement = document.querySelector('.adam-dialog.adam-show');

                    if (topMostDialogElement === dialogElement) {
                        doCancel(ev);
                    }
                };

                document.addEventListener('keyup', dialogElement.escKeyListener);
            }
        }

        function fixEnterKeyEventInTextarea() {
            [].slice.call(dialogElement.querySelectorAll('textarea')).forEach(function (textarea) {
                textarea.addEventListener('keypress', fixEnterKeyEvent);
            });
        }

        function cleanEnterKeyEventInTextarea() {
            [].slice.call(dialogElement.querySelectorAll('textarea')).forEach(function (textarea) {
                textarea.removeEventListener('keypress', fixEnterKeyEvent);
            });
        }

        // SEE: https://stackoverflow.com/a/14020398/1440174
        function fixEnterKeyEvent(ev) {
            if (ev.which === 13) {
                ev.stopPropagation();
            }
        }

        function unlistenEnterAndEscKey() {
            if (options.listenEnterKey) {
                document.removeEventListener('keyup', dialogElement.enterKeyListener);
                dialogElement.enterKeyListener = null;
            }

            if (options.listenESCKey) {
                document.removeEventListener('keyup', dialogElement.escKeyListener);
                dialogElement.escKeyListener = null;
            }
        }

        function startCloseTimer() {
            stopCloseTimer();

            dialog.closeTimerId = setTimeout(function () {
                dialog.closeTimerId = null;
                close();
            }, options.timeout * 1000);
        }

        function stopCloseTimer() {
            if (dialog.closeTimerId) {
                clearTimeout(dialog.closeTimerId);
                dialog.closeTimerId = null;
            }
        }

        function fixChromeBlur() {
            if (dialogElement.style.transform === 'none') {
                return;
            }

            // 1. keep current position
            // SEE: https://stackoverflow.com/a/11396681/1440174
            let rect = dialogElement.getBoundingClientRect();
            dialogElement.style.top = rect.top + 'px';
            dialogElement.style.left = rect.left + 'px';

            // 2. set 'transform' and 'perspective' to none, which may make dialog blurry in chrome browser
            dialogElement.style.transform = 'none';
            dialogElement.style.perspective = 'none';
        }

        // restore perspective to enable 3D transform
        function restorePerspective() {
            // remove inline perspective
            // NOTE: do not remove 'top', 'left' and 'transform' to keep dialog position after user's drag
            dialogElement.style.removeProperty('perspective');
        }

        function doOk(e) {
            if (options.onok && options.onok(callbackParam(dialogElement, dialog, overlayElement, e)) === false) {
                return;
            }

            close();
        }

        function doCancel(e) {
            if (options.oncancel && options.oncancel(callbackParam(dialogElement, dialog, overlayElement, e)) === false) {
                return;
            }

            close();
        }

        function doDelete(e) {
            if (options.ondelete && options.ondelete(callbackParam(dialogElement, dialog, overlayElement, e)) === false) {
                return;
            }

            close();
        }

        function destroy() {
            if (options.ondestroy && options.ondestroy(callbackParam(dialogElement, dialog, overlayElement, null)) === false) {
                return;
            }

            if (dialogElement.srcElement) {
                // return src element earlier as soon as animation end
                setTimeout(checkAndReturnSrcElement, 300);
            }

            setTimeout(function () {
                let index = dialogs.indexOf(dialog);

                if (index === -1) {
                    // user may call destroy() or click OK/Cancle/Delete button multi times
                    return;
                }

                doDestroy(index);
            }, transitionTimeout);

            function doDestroy(index) {
                okButton && okButton.removeEventListener('click', doOk);
                cancelButton && cancelButton.removeEventListener('click', doCancel);
                deleteButton && deleteButton.removeEventListener('click', doDelete);

                dialogs.splice(index, 1);

                document.body.removeChild(dialogElement);
                overlayElement && document.body.removeChild(overlayElement);
            }

            function checkAndReturnSrcElement() {
                if (dialogElement.contains(dialogElement.srcElement)) {
                    dialogElement.srcOriginalParent.appendChild(dialogElement.srcElement);
                } else {
                    setTimeout(checkAndReturnSrcElement, 1000);
                }
            }
        }

        function close() {
            let hideOk = hide();

            if (hideOk !== false) {
                destroy();
            }
        }

        function adjust() {
            if (dialog.status === 'adjusting') {
                // do nothing on adjusting to avoid set style.transition incorrectly
                return;
            }

            if (dialog.centerPosition) {
                // restore dialog center postion before hidding
                utils.setCenterPosition(dialogElement, dialog.centerPosition);
            }

            let rect = dialogElement.getBoundingClientRect();
            let clientWidth = document.documentElement.clientWidth;
            let clientHeight = document.documentElement.clientHeight;

            if (rect.left >= 0 && rect.top >= 0 && rect.right < clientWidth && rect.bottom < clientHeight) {
                return;
            }

            dialog.status = 'adjusting';

            let old = dialogElement.style.transition;
            dialogElement.style.transition = 'all .3s ease-in-out';

            if (rect.width > clientWidth) {
                dialogElement.style['max-width'] = clientWidth + 'px';
            }

            if (rect.height > clientHeight) {
                dialogElement.style['max-height'] = clientHeight + 'px';
            }

            let rect2 = dialogElement.getBoundingClientRect();

            if (!(rect.left >= 0 && rect.right < clientWidth)) {
                dialogElement.style.left = (clientWidth - rect2.width) / 2 + 'px';
            }

            if (!(rect.top >= 0 && rect.bottom < clientHeight)) {
                dialogElement.style.top = (clientHeight - rect2.height) / 2 + 'px';
            }

            dialogElement.addEventListener('transitionend', function listener() {
                dialogElement.removeEventListener('transitionend', listener);
                dialogElement.style.transition = old;
                dialog.status = 'adjusted';
            });
        }
    }

    function open(options) {
        let dialog = create(options);

        if (dialog) {
            dialog.show();
            return dialog;
        }

        return null;
    }

    function alert(text, options) {
        options = Object.assign(defaultAlertOptions(text), options);
        return open(options);
    }

    function confirm(text, onyes, options) {
        options = Object.assign(defaultConfirmOptions(text, onyes), options);
        return open(options);
    }

    function info(text, options) {
        options = Object.assign(defaultInfoOptions(text), options);
        return open(options);
    }

    function warn(text, options) {
        options = Object.assign(defaultWarnOptions(text), options);
        return open(options);
    }

    function error(text, options) {
        options = Object.assign(defaultErrorOptions(text), options);
        return open(options);
    }

    function fatal(text, options) {
        options = Object.assign(defaultFatalOptions(text), options);
        return open(options);
    }

    function createSpin() {
        // create spin element
        let spinElement = document.createElement('div');
        let innerHTML = '';

        spinElement.classList.add('sk-fading-circle');

        for (let i = 1; i <= 12; i++) {
            innerHTML += '<div class="sk-circle sk-circle' + i + '"></div>';
        }

        spinElement.innerHTML = innerHTML;

        // create debug info element
        let debugInfoElement = document.createElement('div');
        debugInfoElement.classList.add('adam-debug-info');

        // create overley element
        let spinOverlayElement = createOverlay({
            zIndex: 2147483647
        });
        spinOverlayElement.classList.add('adam-spin-overlay');
        spinOverlayElement.classList.add('adam-center-child');
        spinOverlayElement.appendChild(spinElement);
        spinOverlayElement.appendChild(debugInfoElement);

        return spinOverlayElement;
    }

    /**
     * start a spin
     *
     * NOTE: use localStorage for debugging, set in browser console, for example:
     *
     *      localStorage['x-debug-info'] = 1    // show debug info
     *      localStorage['x-debug-info'] = 0    // hide debug info
     */
    function startSpin() {
        if (spinOverlayElement === null) {
            // console.info("Wait a moment, spinOverlayElement has not been created yet ...");
            setTimeout(startSpin, 1);
            return;
        }

        let debugInfoElement = spinOverlayElement.querySelector('.adam-debug-info')

        if (localStorage['x-debug-info'] === '1') {
            debugInfoElement.innerHTML = '<pre>' + utils.debugTrace() + '</pre>'
        } else {
            debugInfoElement.innerHTML = ''
        }

        if (spinCount === 0) {
            spinOverlayElement.classList.add('adam-show-overlay');
        }

        spinCount++;
    }

    /**
     * stop a spin
     */
    function stopSpin() {
        spinCount--;

        if (spinCount === 0) {
            spinOverlayElement.classList.remove('adam-show-overlay');
        }
    }

    /**
     * drag on srcElement to move destElement
     *
     * @param {Element} destElement - element to be moved
     * @param {Element} srcElement - element to drag on
     * @param {Function} onclick - callback function when user clicked
     *
     * SEE: https://www.w3schools.com/howto/howto_js_draggable.asp
     */
    function dragElement(ondrag, destElement, srcElement, onclick) {
        // use destElement as srcElement if srcElement not supplied
        srcElement = srcElement || destElement;

        srcElement.addEventListener('mousedown', dragMouseDown);

        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        let mouseDownEvent = null;
        let oldTransition = null;

        // SEE: https://api.jquery.com/input-selector/
        function isDraggableElement(element) {
            if (ondrag) {
                let res = ondrag(element, destElement, srcElement);

                if (res === false || res === true) {
                    return res;
                }
            }

            // do not start drag when click on inputs
            if (element instanceof HTMLInputElement) {
                return false;
            }

            // do not start drag when click on buttons, selects and textareas
            if (['BUTTON', 'SELECT', 'TEXTAREA'].indexOf(element.tagName) >= 0) {
                return false;
            }

            return true;
        }

        function dragMouseDown(e) {
            // NOTE: In IE 11 clicking on scrollbars does not fire 'mouseup' event
            // see also: http://help.dimsemenov.com/discussions/problems/65378-in-ie11-the-mouseup-event-not-fired-when-clicking-on-a-scrollbar-causes-sliding-to-stick
            //
            // To avoid dragging when clicking on IE 11 scrollbar, do nothing when clicking on scrollbar detected
            if (e.offsetX > e.target.clientWidth || e.offsetY > e.target.clientHeight) {
                return;
            }

            mouseDownEvent = e;

            if (isDraggableElement(e.target) === false) {
                return;
            }

            // save current destElement transition
            // clear transition to make sure smooth dragging
            oldTransition = destElement.style.transition;
            destElement.style.transition = '';

            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;

            // call a function whenever the cursor moves:
            document.addEventListener('mousemove', elementDrag);
            document.addEventListener('mouseup', closeDragElement);

            // Temporarily disable mouse events for IFRAME for smooth dragging
            // SEE: https://www.gyrocode.com/articles/how-to-detect-mousemove-event-over-iframe-element/
            [].slice.call(srcElement.querySelectorAll('iframe')).forEach(function (iframe) {
                iframe.style['pointer-events'] = 'none';
            });
        }

        function elementDrag(e) {
            e.preventDefault();

            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // set the destElement's new position:
            destElement.style.top = (destElement.offsetTop - pos2) + 'px';
            destElement.style.left = (destElement.offsetLeft - pos1) + 'px';
        }

        function closeDragElement(e) {
            // restore destElement transition
            destElement.style.transition = oldTransition;

            // trigger click when dragging a litter quickly
            if (Math.abs(e.clientX - mouseDownEvent.clientX) + Math.abs(e.clientY - mouseDownEvent.clientY) < dragAsClick.distance && e.timeStamp - mouseDownEvent.timeStamp < dragAsClick.timeout) {
                onclick && onclick(e);
            }

            // stop moving when mouse button is released:
            document.removeEventListener('mousemove', elementDrag);
            document.removeEventListener('mouseup', closeDragElement);

            // Re-enable mouse events for IFRAME
            [].slice.call(srcElement.querySelectorAll('iframe')).forEach(function (iframe) {
                iframe.style['pointer-events'] = 'auto';
            });
        }
    }
}();
