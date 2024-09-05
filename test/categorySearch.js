'use strict';

const assert = require('assert');
const { JSDOM } = require('jsdom');

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
const $ = require('jquery')(window);

// Mock the required modules
const alerts = { error: () => {} };
const api = {
	get: (url, params, callback) => {
		console.log('API called with:', url, params);
		callback(null, { categories: [{ cid: 1, name: 'Test Category' }] });
	},
};
const bootstrap = { Dropdown: { getInstance: () => ({ update: () => {} }) } };
const utils = {
	debounce: fn => fn,
	findBootstrapEnvironment: () => 'lg',
	params: () => ({}),
};
const app = {
	parseAndTranslate: (template, data, callback) => {
		console.log('parseAndTranslate called with:', template, data);
		callback($('<div><ul component="category/list"><li>Test Category</li></ul></div>'));
	},
};

const ajaxify = {
	data: {
		template: {},
		selectedCids: [],
		selectedCategory: {},
		allCategoriesUrl: '',
	},
};

const categorySearchFactory = require('../public/src/modules/categorySearch');

$.fn.html = function (content) {
	if (content !== undefined) {
		console.log('jQuery html method called with:', content);
		this.empty().append(content);
	}
	return this;
};

const categorySearch = categorySearchFactory(alerts, bootstrap, api, utils, app, $, ajaxify);

describe('Category Search', () => {
	let el;

	beforeEach(() => {
		el = $('<div><div component="category-selector-search"><input type="text"/></div><div component="category/list"></div></div>');
		$('body').empty().append(el);
	});

	it('should handle search input and render results', (done) => {
		const options = { template: 'some-template' };
		categorySearch.init(el, options);
		el.trigger('show.bs.dropdown');
		const searchInput = el.find('input');
		assert.strictEqual(searchInput.length, 1, 'Search input not found');
		searchInput.val('test');
		searchInput.trigger('keyup');

		setTimeout(() => {
			console.log('DOM after timeout:', $('body').html());
			const categoryList = $('[component="category/list"]');
			console.log('Category list:', categoryList.length, categoryList.html());
			assert.strictEqual(categoryList.find('li').length, 1, 'Category item not found');
			assert.strictEqual(categoryList.find('li').text(), 'Test Category', 'Incorrect category text');
			done();
		}, 500);
	});
	// CHATGPT WAS USED
});
