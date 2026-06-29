/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./resources/js/welcome/modals.js":
/*!****************************************!*\
  !*** ./resources/js/welcome/modals.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   closeAllModals: () => (/* binding */ closeAllModals),
/* harmony export */   closeModal: () => (/* binding */ closeModal),
/* harmony export */   initModals: () => (/* binding */ initModals),
/* harmony export */   openModal: () => (/* binding */ openModal),
/* harmony export */   switchModal: () => (/* binding */ switchModal)
/* harmony export */ });
function openModal(type) {
  var modal = document.getElementById("".concat(type, "Modal"));
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(type) {
  var modal = document.getElementById("".concat(type, "Modal"));
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}
function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(function (modal) {
    modal.classList.remove('active');
  });
  document.body.style.overflow = '';
}
function switchModal(type) {
  closeModal('login');
  closeModal('register');
  openModal(type);
}
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        closeAllModals();
      }
    });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });
  var initialModal = document.body.dataset.openModal;
  if (initialModal) {
    openModal(initialModal);
  }
}

/***/ }),

/***/ "./resources/js/welcome/navbar.js":
/*!****************************************!*\
  !*** ./resources/js/welcome/navbar.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initNavbar: () => (/* binding */ initNavbar)
/* harmony export */ });
function initNavbar() {
  var mobileToggle = document.getElementById('mobileToggle');
  var navLinks = document.getElementById('navLinks');
  var navActions = document.getElementById('navActions');
  if (!mobileToggle || !navLinks || !navActions) {
    return;
  }
  mobileToggle.addEventListener('click', function () {
    navLinks.classList.toggle('open');
    navActions.classList.toggle('open');
  });
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***************************************!*\
  !*** ./resources/js/welcome/index.js ***!
  \***************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _modals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./modals */ "./resources/js/welcome/modals.js");
/* harmony import */ var _navbar__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./navbar */ "./resources/js/welcome/navbar.js");


window.openModal = _modals__WEBPACK_IMPORTED_MODULE_0__.openModal;
window.closeModal = _modals__WEBPACK_IMPORTED_MODULE_0__.closeModal;
window.switchModal = _modals__WEBPACK_IMPORTED_MODULE_0__.switchModal;
document.addEventListener('DOMContentLoaded', function () {
  (0,_modals__WEBPACK_IMPORTED_MODULE_0__.initModals)();
  (0,_navbar__WEBPACK_IMPORTED_MODULE_1__.initNavbar)();
});
})();

/******/ })()
;