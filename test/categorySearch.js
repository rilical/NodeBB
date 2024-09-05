'use strict';

console.log('OMAR_GHABAYEN: categorySearch called');

const assert = require('assert');
const { JSDOM } = require('jsdom');

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
const $ = require('jquery')(window);

// Mock the required modules
const alerts = {
	error: () => {},
};
const api = {
	get: (url, params, callback) => {
		callback(null, { categories: [] });
	},
};

// Mock the `utils` module to keep things simple for testing
const utils = {
	params: () => ({}),
	debounce: fn => fn, // No real debounce needed for test
	findBootstrapEnvironment: () => 'lg',
};

// Mock `ajaxify` and `app`
global.ajaxify = {
	data: {
		selectedCids: [],
		selectedCategory: null,
		allCategoriesUrl: '/categories',
	},
};

global.app = {
	parseAndTranslate: (template, data, callback) => {
		callback($('<div><ul component="category/list"></ul></div>'));
	},
};

// Load the module under test
const categorySearch = require('../public/src/modules/categorySearch');

describe('Category Search', () => {
	let el;

	beforeEach(() => {
		// Set up a mock DOM element with jQuery
		el = $('<div><input component="category-selector-search"/></div>');
	});

	it('should initialize with default options', () => {
		const options = {}; // Empty options object
		categorySearch.init(el, options);

		// Assert default options are applied
		assert.strictEqual(options.privilege, 'topics:read', 'Default privilege should be topics:read');
		assert.deepEqual(options.states, ['watching', 'tracking', 'notwatching', 'ignoring'], 'Default states should be set');
		assert.strictEqual(options.cacheList, true, 'Default cacheList should be true');
	});
	// USED CHATGPT 4.0
});
