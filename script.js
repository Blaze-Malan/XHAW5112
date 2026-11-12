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

	// Fail clearly if the page markup no longer matches the calculator.
	if (
		packageInputs.length === 0 ||
		!(bookingCountInput instanceof HTMLInputElement) ||
		!(discountValue instanceof HTMLElement) ||
		!(subtotalOutput instanceof HTMLElement) ||
		!(discountOutput instanceof HTMLElement) ||
		!(totalOutput instanceof HTMLElement) ||
		!(summaryOutput instanceof HTMLElement) ||
		!(bookButton instanceof HTMLButtonElement)
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
		renderSummary(getBooking());
	}

	form.addEventListener('input', updateEstimate);
	form.addEventListener('change', updateEstimate);

	// Calculate on submit and direct the user to missing or invalid fields.
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
		summaryOutput.textContent = `Total calculated: ${currency.format(booking.total)}. Select BOOK NOW to prepare your booking request.`;
	});

	// Prepare an email request with the current booking details.
	bookButton.addEventListener('click', () => {
		if (!currentBooking) {
			return;
		}

		const subject = 'Gaming booking request';
		const body = [
			'Hello, I would like to request a booking.',
			'',
			`Package: ${currentBooking.packageName}`,
			`Number of bookings: ${currentBooking.bookingCount}`,
			`Subtotal: ${currency.format(currentBooking.subtotal)}`,
			`Discount: ${currency.format(currentBooking.discount)} (${currentBooking.discountRate * 100}%)`,
			`Total: ${currency.format(currentBooking.total)}`,
			'',
			'Please contact me to confirm availability and complete my booking.'
		].join('\n');

		window.location.href = `mailto:info@nextlevlarena.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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