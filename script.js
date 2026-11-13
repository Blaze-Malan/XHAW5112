(() => {
	// Only initialize the calculator on pages that contain it.
	const form = document.querySelector('#fees-calculator');
	if (!(form instanceof HTMLFormElement)) {
		return;
	}

	const packageInputs = Array.from(form.querySelectorAll('input[name="package"]'));
	const bookingCountInput = form.querySelector('#booking-count');
	const discountValue = form.querySelector('#fees-discount-value');
	const subtotalOutput = form.querySelector('#fees-subtotal');
	const discountOutput = form.querySelector('#fees-discount');
	const totalOutput = form.querySelector('#fees-total');
	const summaryOutput = form.querySelector('#fees-summary-output');
	const bookButton = form.querySelector('#fees-book-button');
	const bookingStatus = document.querySelector('#fees-booking-status');

	if (
		packageInputs.length === 0 ||
		!(bookingCountInput instanceof HTMLInputElement) ||
		!(discountValue instanceof HTMLElement) ||
		!(subtotalOutput instanceof HTMLElement) ||
		!(discountOutput instanceof HTMLElement) ||
		!(totalOutput instanceof HTMLElement) ||
		!(summaryOutput instanceof HTMLElement) ||
		!(bookButton instanceof HTMLButtonElement) ||
		!(bookingStatus instanceof HTMLElement)
	) {
		throw new Error('The fee calculator markup is incomplete.');
	}

	const currency = new Intl.NumberFormat('en-ZA', {
		style: 'currency',
		currency: 'ZAR',
		maximumFractionDigits: 2
	});

	let currentBooking = null;
	let isCalculated = false;
	let bookingToastTimeout;

	// Read the current selection and apply the booking-count discount tiers.
	function getBooking() {
		const selectedPackage = packageInputs.find((input) => input.checked);
		const bookingCount = Number(bookingCountInput.value);
		const price = selectedPackage ? Number(selectedPackage.dataset.price) : NaN;

		if (
			!selectedPackage ||
			!Number.isFinite(price) ||
			!Number.isInteger(bookingCount) ||
			bookingCount < 1
		) {
			return null;
		}

		const discountRate = bookingCount >= 4 ? 0.15 : bookingCount === 3 ? 0.1 : bookingCount === 2 ? 0.05 : 0;
		const subtotal = price * bookingCount;
		const discount = subtotal * discountRate;

		return {
			packageName: selectedPackage.value,
			bookingCount,
			discountRate,
			subtotal,
			discount,
			total: subtotal - discount
		};
	}

	// Keep the discount, totals, status message, and booking button in sync.
	function renderSummary(booking) {
		currentBooking = booking;
		bookButton.disabled = !booking || !isCalculated;

		if (!booking) {
			discountValue.textContent = '0%';
			subtotalOutput.textContent = currency.format(0);
			discountOutput.textContent = currency.format(0);
			totalOutput.textContent = currency.format(0);
			summaryOutput.textContent = 'Choose a package and enter a whole number of bookings to calculate your total.';
			return;
		}

		discountValue.textContent = `${booking.discountRate * 100}%`;
		subtotalOutput.textContent = currency.format(booking.subtotal);
		discountOutput.textContent = booking.discount > 0
			? `-${currency.format(booking.discount)}`
			: currency.format(0);
		totalOutput.textContent = currency.format(booking.total);
		summaryOutput.textContent = `Estimated total for ${booking.bookingCount} booking${booking.bookingCount === 1 ? '' : 's'}: ${currency.format(booking.total)}. Select CALCULATE YOUR FEES to confirm the estimate.`;
	}

	// Any edits invalidate the previous calculation until the user recalculates.
	function updateEstimate() {
		isCalculated = false;
		window.clearTimeout(bookingToastTimeout);
		bookingStatus.hidden = true;
		renderSummary(getBooking());
	}

	form.addEventListener('input', updateEstimate);
	form.addEventListener('change', updateEstimate);

	// Direct the user to missing or invalid fields.
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const booking = getBooking();

		if (!booking) {
			isCalculated = false;
			renderSummary(null);
			summaryOutput.textContent = 'Choose a package and enter a whole number of bookings before calculating.';
			form.querySelector('input[name="package"]:checked')?.focus();
			if (!form.querySelector('input[name="package"]:checked')) {
				packageInputs[0].focus();
			} else {
				bookingCountInput.focus();
			}
			return;
		}

		isCalculated = true;
		renderSummary(booking);
		summaryOutput.textContent = `Total calculated: ${currency.format(booking.total)}. Select BOOK NOW to complete the demo.`;
	});

	// Show a demo confirmation without sending or storing a booking.
	bookButton.addEventListener('click', () => {
		if (!currentBooking || !isCalculated) {
			bookingStatus.textContent = 'Please calculate your fees before completing the demo.';
			bookingStatus.hidden = false;
			return;
		}

		window.clearTimeout(bookingToastTimeout);
		bookingStatus.textContent = 'Demo complete! No booking or payment was processed.';
		bookingStatus.hidden = false;
		bookingToastTimeout = window.setTimeout(() => {
			bookingStatus.hidden = true;
		}, 7000);
	});

	renderSummary(getBooking());
})();

(() => {
	// Each button opens its associated dialog; the browser handles closing and focus.
	document.querySelectorAll('button[data-dialog-open]').forEach((button) => {
		const dialog = document.getElementById(button.getAttribute('aria-controls'));
		if (!(dialog instanceof HTMLDialogElement)) {
			throw new Error('A dialog is missing or invalid.');
		}
		button.addEventListener('click', () => dialog.showModal());
	});
})();

(() => {
	const category = document.querySelector('#game-category');
	if (!category) {
		return;
	}

	const library = document.querySelector('#game-library');
	const status = document.querySelector('#game-filter-status');
	if (!(category instanceof HTMLSelectElement) || !(library instanceof HTMLElement) || !(status instanceof HTMLElement)) {
		throw new Error('The game library filter markup is incomplete.');
	}

	const games = Array.from(library.querySelectorAll('.equipment-game-card'));
	if (games.length === 0 || games.some((game) => !game.dataset.categories)) {
		throw new Error('The game library is missing games or categories.');
	}

	// A game can appear in more than one category.
	function filterGames() {
		let visibleCount = 0;
		games.forEach((game) => {
			const categories = game.dataset.categories.split(/\s+/);
			game.hidden = category.value !== 'all' && !categories.includes(category.value);
			if (!game.hidden) {
				visibleCount += 1;
			}
		});
		status.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? 'game' : 'games'}.`;
	}

	category.addEventListener('change', filterGames);
	filterGames();
	category.disabled = false;
})();

(() => {
	const searchForm = document.querySelector('#faq-search-form');
	if (!searchForm) {
		return;
	}

	const searchInput = document.querySelector('#faq-search-input');
	const searchButton = searchForm.querySelector('button[type="submit"]');
	const questionList = document.querySelector('#faq-list');
	const status = document.querySelector('#faq-filter-status');
	const emptyState = document.querySelector('#faq-empty-state');
	const topicButtons = Array.from(document.querySelectorAll('[data-faq-topic]'));

	if (
		!(searchForm instanceof HTMLFormElement) ||
		!(searchInput instanceof HTMLInputElement) ||
		!(searchButton instanceof HTMLButtonElement) ||
		!(questionList instanceof HTMLElement) ||
		!(status instanceof HTMLElement) ||
		!(emptyState instanceof HTMLElement) ||
		topicButtons.length === 0 ||
		topicButtons.some((button) => !(button instanceof HTMLButtonElement))
	) {
		throw new Error('The FAQ search and topic filter markup is incomplete.');
	}

	const questions = Array.from(questionList.querySelectorAll('[data-faq-item]'));
	if (questions.length === 0 || questions.some((question) => !question.dataset.topic)) {
		throw new Error('The FAQ list is missing questions or topic categories.');
	}

	let activeTopic = 'all';

	// Match the search and selected topic together.
	function filterQuestions() {
		const query = searchInput.value.trim().toLocaleLowerCase();
		let visibleCount = 0;

		questions.forEach((question) => {
			const matchesTopic = activeTopic === 'all' || question.dataset.topic === activeTopic;
			const matchesSearch = !query || question.textContent.toLocaleLowerCase().includes(query);
			question.hidden = !matchesTopic || !matchesSearch;
			if (!question.hidden) {
				visibleCount += 1;
			}
		});

		emptyState.hidden = visibleCount > 0;
		status.textContent = `Showing ${visibleCount} of ${questions.length} questions.`;
	}

	searchForm.addEventListener('submit', (event) => {
		event.preventDefault();
		filterQuestions();
	});
	searchInput.addEventListener('input', filterQuestions);

	topicButtons.forEach((button) => {
		button.addEventListener('click', () => {
			activeTopic = button.dataset.faqTopic;
			topicButtons.forEach((topicButton) => {
				topicButton.setAttribute('aria-pressed', String(topicButton === button));
			});
			filterQuestions();
		});
		button.disabled = false;
	});

	searchInput.disabled = false;
	searchButton.disabled = false;
	filterQuestions();
})();

(() => {
	const form = document.querySelector('#contact-form');
	if (!form) {
		return;
	}

	const nameInput = form.querySelector('#contact-name');
	const emailInput = form.querySelector('#contact-email');
	const subjectInput = form.querySelector('#contact-subject');
	const messageInput = form.querySelector('#contact-message');
	const status = form.querySelector('#contact-form-status');
	const submitButton = form.querySelector('button[type="submit"]');
	const fields = [nameInput, emailInput, subjectInput, messageInput];

	if (
		!(form instanceof HTMLFormElement) ||
		fields.some((field) => !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) ||
		!(status instanceof HTMLElement) ||
		!(submitButton instanceof HTMLButtonElement)
	) {
		throw new Error('The contact form markup is incomplete.');
	}

	let toastTimeout;

	function showToast(message, type) {
		window.clearTimeout(toastTimeout);
		status.classList.toggle('is-success', type === 'success');
		status.classList.toggle('is-error', type === 'error');
		status.textContent = message;
		status.hidden = false;
		toastTimeout = window.setTimeout(() => {
			status.hidden = true;
		}, 7000);
	}

	fields.forEach((field) => {
		field.addEventListener('input', (event) => {
			event.currentTarget.setCustomValidity('');
			if (!status.hidden) {
				window.clearTimeout(toastTimeout);
				status.hidden = true;
			}
		});
		field.addEventListener('invalid', () => {
			showToast('Please complete each field and enter a valid email address.', 'error');
		});
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();

		const blankField = fields.find((field) => !field.value.trim());
		if (blankField) {
			blankField.setCustomValidity('Please complete this field.');
			showToast('Please complete each field before submitting.', 'error');
			blankField.reportValidity();
			return;
		}

		if (!form.reportValidity()) {
			showToast('Please check the form fields and enter a valid email address.', 'error');
			return;
		}

		form.reset();
		showToast('Thanks! Your message has been sent successfully.', 'success');
		nameInput.focus();
	});

	submitButton.disabled = false;
})();

(() => {
	const header = document.querySelector('.site-header, .equipment-header');
	if (!header || document.querySelector('.site-menu-toggle')) {
		return;
	}

	const pages = [
		{ href: 'index.html', label: 'Home' },
		{ href: 'about.html', label: 'About Us' },
		{ href: 'services.html', label: 'Services' },
		{ href: 'experiences.html', label: 'Experiences' },
		{ href: 'events.html', label: 'Events' },
		{ href: 'equipment.html', label: 'Equipment' },
		{ href: 'community.html', label: 'Community' },
		{ href: 'tournament.html', label: 'Tournament' },
		{ href: 'faqs.html', label: 'FAQs' },
		{ href: 'fees.html', label: 'Fees & Booking' },
		{ href: 'locations.html', label: 'Locations' },
		{ href: 'contact.html', label: 'Contact' }
	];

	const currentPage = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
	const menuButton = document.createElement('button');
	menuButton.className = 'site-menu-toggle';
	menuButton.type = 'button';
	menuButton.setAttribute('aria-label', 'Open site menu');
	menuButton.setAttribute('aria-haspopup', 'dialog');
	menuButton.setAttribute('aria-expanded', 'false');
	menuButton.setAttribute('aria-controls', 'site-menu-dialog');

	for (let index = 0; index < 3; index += 1) {
		const bar = document.createElement('span');
		bar.className = 'site-menu-toggle-bar';
		bar.setAttribute('aria-hidden', 'true');
		menuButton.append(bar);
	}

	const dialog = document.createElement('dialog');
	dialog.className = 'site-menu-dialog';
	dialog.id = 'site-menu-dialog';
	dialog.setAttribute('aria-labelledby', 'site-menu-title');

	const dialogHeader = document.createElement('div');
	dialogHeader.className = 'site-menu-dialog-header';
	const title = document.createElement('h2');
	title.id = 'site-menu-title';
	title.textContent = 'EXPLORE';
	const closeButton = document.createElement('button');
	closeButton.className = 'site-menu-close';
	closeButton.type = 'button';
	closeButton.textContent = 'CLOSE';
	dialogHeader.append(title, closeButton);

	const navigation = document.createElement('nav');
	navigation.className = 'site-menu-links';
	navigation.setAttribute('aria-label', 'All website pages');

	pages.forEach((page) => {
		const link = document.createElement('a');
		link.className = 'site-menu-link';
		link.href = page.href;
		link.textContent = page.label;
		if (page.href.toLowerCase() === currentPage) {
			link.setAttribute('aria-current', 'page');
		}
		navigation.append(link);
	});

	dialog.append(dialogHeader, navigation);
	document.body.append(dialog);
	header.append(menuButton);

	function closeMenu() {
		dialog.classList.remove('is-open');
		const closeDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260;
		window.setTimeout(() => {
			if (dialog.open && !dialog.classList.contains('is-open')) {
				dialog.close();
			}
		}, closeDelay);
	}

	menuButton.addEventListener('click', () => {
		dialog.showModal();
		menuButton.setAttribute('aria-expanded', 'true');
		menuButton.setAttribute('aria-label', 'Site menu open');
		window.requestAnimationFrame(() => dialog.classList.add('is-open'));
	});
	closeButton.addEventListener('click', closeMenu);
	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) {
			closeMenu();
		}
	});
	dialog.addEventListener('cancel', (event) => {
		event.preventDefault();
		closeMenu();
	});
	dialog.addEventListener('close', () => {
		dialog.classList.remove('is-open');
		menuButton.setAttribute('aria-expanded', 'false');
		menuButton.setAttribute('aria-label', 'Open site menu');
		menuButton.focus();
	});
})();