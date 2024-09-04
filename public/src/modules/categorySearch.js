'use strict';

define('categorySearch', ['alerts', 'bootstrap', 'api'], function (alerts, bootstrap, api) {
	const categorySearch = {};

	categorySearch.init = function (el, options) {
		initializeOptions(options);
		const searchEl = initializeSearchElement(el);
		if (!searchEl) return;

		const toggleVisibility = shouldToggleVisibility(searchEl);
		setupEventHandlers(el, searchEl, toggleVisibility, options);
	};

	function initializeOptions(options) {
		options = options || {};
		options.privilege = options.privilege || 'topics:read';
		options.states = options.states || ['watching', 'tracking', 'notwatching', 'ignoring'];
		options.cacheList = options.hasOwnProperty('cacheList') ? options.cacheList : true;
		options.selectedCids = options.selectedCids || ajaxify.data.selectedCids || [];
	}

	function initializeSearchElement(el) {
		const searchEl = el.find('[component="category-selector-search"]');
		return searchEl.length ? searchEl : null;
	}

	function shouldToggleVisibility(searchEl) {
		return searchEl.parent('[component="category/dropdown"]').length > 0 ||
			searchEl.parent('[component="category-selector"]').length > 0;
	}

	function setupEventHandlers(el, searchEl, toggleVisibility, options) {
		const categoriesList = null;
		const localCategories = initializeLocalCategories(options);

		el.on('show.bs.dropdown', () => onShowDropdown(el, searchEl, toggleVisibility, options, localCategories, categoriesList));
		el.on('shown.bs.dropdown', () => onShownDropdown(searchEl));
		el.on('hide.bs.dropdown', () => onHideDropdown(el, searchEl, toggleVisibility));
	}

	function initializeLocalCategories(options) {
		return Array.isArray(options.localCategories) ?
			options.localCategories.map(c => ({ ...c })) :
			[];
	}

	function onShowDropdown(el, searchEl, toggleVisibility, options, localCategories, categoriesList) {
		if (toggleVisibility) {
			toggleSearchVisibility(el, searchEl);
		}
		setupSearch(searchEl, options, localCategories, categoriesList);
	}

	function toggleSearchVisibility(el, searchEl) {
		el.find('.dropdown-toggle').css({ visibility: 'hidden' });
		searchEl.removeClass('hidden').css({
			'z-index': el.find('.dropdown-toggle').css('z-index') + 1,
		});
	}

	function setupSearch(searchEl, options, localCategories, categoriesList) {
		const doSearch = createSearchFunction(searchEl, options, localCategories, categoriesList);
		searchEl.on('click', (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
		});
		searchEl.find('input').val('').on('keyup', utils.debounce(doSearch, 300));
		doSearch();
	}

	function createSearchFunction(searchEl, options, localCategories, categoriesList) {
		return function () {
			const val = searchEl.find('input').val();
			if (val.length > 1 || (!val && !categoriesList)) {
				loadList(val, options, localCategories, (categories) => {
					categoriesList = options.cacheList ? (categoriesList || categories) : categories;
					renderList(categories, options);
				});
			} else if (!val && categoriesList) {
				renderList(categoriesList, options);
			}
		};
	}

	function onShownDropdown(searchEl) {
		if (!['xs', 'sm'].includes(utils.findBootstrapEnvironment())) {
			searchEl.find('input').focus();
		}
	}

	function onHideDropdown(el, searchEl, toggleVisibility) {
		if (toggleVisibility) {
			resetVisibility(el, searchEl);
		}
		searchEl.off('click');
		searchEl.find('input').off('keyup');
	}

	function resetVisibility(el, searchEl) {
		el.find('.dropdown-toggle').css({ visibility: 'inherit' });
		searchEl.addClass('hidden');
	}

	function loadList(search, options, localCategories, callback) {
		api.get('/search/categories', {
			search: search,
			query: utils.params(),
			parentCid: options.parentCid || 0,
			selectedCids: options.selectedCids,
			privilege: options.privilege,
			states: options.states,
			showLinks: options.showLinks,
		}, function (err, { categories }) {
			if (err) {
				return alerts.error(err);
			}
			callback(localCategories.concat(categories));
		});
	}

	function renderList(categories, options) {
		const selectedCids = options.selectedCids.map(String);
		categories.forEach(function (c) {
			c.selected = selectedCids.includes(String(c.cid));
		});

		app.parseAndTranslate(options.template, {
			categoryItems: categories.slice(0, 200),
			selectedCategory: ajaxify.data.selectedCategory,
			allCategoriesUrl: ajaxify.data.allCategoriesUrl,
		}, function (html) {
			updateDOM(html, categories);
		});
	}

	function updateDOM(html, categories) {
		const el = $('[component="category/list"]');
		el.html(html.find('[component="category/list"]').html());
		el.find('[component="category/no-matches"]').toggleClass('hidden', !!categories.length);
		const dropdownToggle = $('.dropdown-toggle').get(0);
		const bsDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
		if (bsDropdown) {
			bsDropdown.update();
		}
	}

	return categorySearch;
});
