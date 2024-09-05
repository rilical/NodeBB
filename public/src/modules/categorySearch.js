const categorySearch = {};


console.log('OMAR_GHABAYEN: categorySearch called in Module');
categorySearch.init = function (el, options = {}) {
	options.privilege = options.privilege || 'topics:read';
	options.states = options.states || ['watching', 'tracking', 'notwatching', 'ignoring'];
	options.cacheList = options.hasOwnProperty('cacheList') ? options.cacheList : true;
	options.selectedCids = options.selectedCids || ajaxify.data.selectedCids || [];

	const localCategories = categorySearch.initializeLocalCategories(options);
	const searchEl = categorySearch.initializeSearchElement(el);

	if (!searchEl) {
		return;
	}

	const toggleVisibility = categorySearch.shouldToggleVisibility(searchEl);
	categorySearch.setupEventHandlers(el, searchEl, toggleVisibility, options, localCategories, null);
};

categorySearch.initializeLocalCategories = function (options) {
	return Array.isArray(options.localCategories) ?
		options.localCategories.map(c => ({ ...c })) :
		[];
};

categorySearch.initializeSearchElement = function (el) {
	const searchEl = el.find('[component="category-selector-search"]');
	return searchEl.length ? searchEl : null;
};

categorySearch.shouldToggleVisibility = function (searchEl) {
	return searchEl.parent('[component="category/dropdown"]').length > 0 ||
           searchEl.parent('[component="category-selector"]').length > 0;
};

categorySearch.setupEventHandlers = function (el, searchEl,
	toggleVisibility, options, localCategories, categoriesList) {
	el.on('show.bs.dropdown', () => {
		categorySearch.handleDropdownShow(el, searchEl, toggleVisibility);
		categorySearch.setupSearchHandlers(searchEl, options, localCategories, categoriesList);
	});

	el.on('shown.bs.dropdown', () => {
		categorySearch.handleDropdownShown(searchEl);
	});

	el.on('hide.bs.dropdown', () => {
		categorySearch.handleDropdownHide(el, searchEl, toggleVisibility);
	});
};

categorySearch.handleDropdownShow = function (el, searchEl, toggleVisibility) {
	if (toggleVisibility) {
		el.find('.dropdown-toggle').css({ visibility: 'hidden' });
		searchEl.removeClass('hidden').css({
			'z-index': el.find('.dropdown-toggle').css('z-index') + 1,
		});
	}
};

categorySearch.handleDropdownShown = function (searchEl) {
	if (!['xs', 'sm'].includes(utils.findBootstrapEnvironment())) {
		searchEl.find('input').focus();
	}
};

categorySearch.handleDropdownHide = function (el, searchEl, toggleVisibility) {
	if (toggleVisibility) {
		el.find('.dropdown-toggle').css({ visibility: 'inherit' });
		searchEl.addClass('hidden');
	}

	searchEl.off('click');
	searchEl.find('input').off('keyup');
};

categorySearch.setupSearchHandlers = function (searchEl, options, localCategories, categoriesList) {
	const doSearch = categorySearch.createSearchFunction(searchEl, options, localCategories, categoriesList);

	searchEl.on('click', (ev) => {
		ev.preventDefault();
		ev.stopPropagation();
	});

	searchEl.find('input').val('').on('keyup', utils.debounce(doSearch, 300));
	doSearch();
};

categorySearch.createSearchFunction = function (searchEl, options, localCategories, categoriesList) {
	return function () {
		const val = searchEl.find('input').val();

		if (val.length > 1 || (!val && !categoriesList)) {
			categorySearch.loadList(val, options, localCategories, function (categories) {
				categoriesList = options.cacheList && (categoriesList || categories);
				categorySearch.renderList(categories, options);
			});
		} else if (!val && categoriesList) {
			categorySearch.renderList(categoriesList, options);
		}
	};
};

categorySearch.loadList = function (search, options, localCategories, callback) {
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
};

categorySearch.renderList = function (categories, options) {
	const selectedCids = options.selectedCids.map(String);
	categories.forEach((c) => {
		c.selected = selectedCids.includes(String(c.cid));
	});

	app.parseAndTranslate(options.template, {
		categoryItems: categories.slice(0, 200),
		selectedCategory: ajaxify.data.selectedCategory,
		allCategoriesUrl: ajaxify.data.allCategoriesUrl,
	}, function (html) {
		categorySearch.updateDOM(html, categories);
	});
};

categorySearch.updateDOM = function (html, categories) {
	console.log('OMAR_GHABAYEN: updateDOM called', { categories });
	$('[component="category/list"]').html(html.find('[component="category/list"]').html());
	$('[component="category/list"] [component="category/no-matches"]')
		.toggleClass('hidden', !!categories.length);

	if (bootstrap && bootstrap.Dropdown) {
		const bsDropdown = bootstrap.Dropdown.getInstance($('[component="category/dropdown"]').get(0));
		if (bsDropdown) {
			bsDropdown.update();
		}
	}
//USED GPT-3
};

module.exports = categorySearch;
