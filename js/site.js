/**
 * JAINUDDIN CHICKEN SHOP — Client-Side Core
 * Floating Nav, Infinite Horizontal Gallery Ticker, 1kg/2kg/3kg Live Price Calc & Drawer
 */

document.addEventListener('DOMContentLoaded', () => {
  initFloatingNav();
  initInfiniteGallery();
  initOrderDrawer();
  initQuickWeightSelectors();
  initCateringEstimator();
});

/* --------------------------------------------------------------------------
   1. FLOATING PILL NAVIGATION
   -------------------------------------------------------------------------- */
function initFloatingNav() {
  const pill = document.getElementById('floatingPill');
  const panel = document.getElementById('floatingMenuPanel');
  if (!pill || !panel) return;

  function toggleMenu(e) {
    if (e) e.stopPropagation();
    const isOpen = pill.classList.toggle('is-open');
    panel.classList.toggle('is-active', isOpen);
    pill.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function closeMenu() {
    pill.classList.remove('is-open');
    panel.classList.remove('is-active');
    pill.setAttribute('aria-expanded', 'false');
  }

  pill.addEventListener('click', toggleMenu);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!pill.contains(e.target) && !panel.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      closeDrawer();
    }
  });

  // Close on menu link click
  panel.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
}

/* --------------------------------------------------------------------------
   2. CONTINUOUS HORIZONTAL CUT GALLERY TICKER
   -------------------------------------------------------------------------- */
function initInfiniteGallery() {
  const track = document.getElementById('galleryStripTrack');
  const wrapper = document.querySelector('.gallery-strip-wrapper');
  if (!track || !wrapper) return;

  // Clone items to guarantee zero seam across multiple loops
  const items = Array.from(track.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    track.appendChild(clone);
  });

  let scrollPos = 0;
  let isPaused = false;
  let animationFrameId;
  const speed = 0.75; // ~45px per second at 60fps

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step() {
    if (!isPaused && !prefersReducedMotion) {
      scrollPos += speed;
      const singleSetWidth = track.scrollWidth / 2;
      if (scrollPos >= singleSetWidth) {
        scrollPos = 0;
      }
      track.style.transform = `translate3d(-${scrollPos}px, 0, 0)`;
    }
    animationFrameId = requestAnimationFrame(step);
  }

  if (!prefersReducedMotion) {
    animationFrameId = requestAnimationFrame(step);

    // Pause on hover
    wrapper.addEventListener('mouseenter', () => { isPaused = true; });
    wrapper.addEventListener('mouseleave', () => { isPaused = false; });

    // Touch support
    let touchStartX = 0;
    wrapper.addEventListener('touchstart', (e) => {
      isPaused = true;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      const touchX = e.touches[0].clientX;
      const diff = touchStartX - touchX;
      scrollPos += diff * 0.4;
      touchStartX = touchX;
      const singleSetWidth = track.scrollWidth / 2;
      if (scrollPos >= singleSetWidth) scrollPos = 0;
      if (scrollPos < 0) scrollPos = singleSetWidth;
      track.style.transform = `translate3d(-${scrollPos}px, 0, 0)`;
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
      isPaused = false;
    });
  }
}

/* --------------------------------------------------------------------------
   3. SLIDE-OVER ORDER & CATERING DRAWER
   -------------------------------------------------------------------------- */
let activeCutData = {};

function initOrderDrawer() {
  const backdrop = document.getElementById('drawerBackdrop');
  const panel = document.getElementById('drawerPanel');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const tabRetail = document.getElementById('tabRetail');
  const tabBulk = document.getElementById('tabBulk');
  const bodyRetail = document.getElementById('drawerBodyRetail');
  const bodyBulk = document.getElementById('drawerBodyBulk');

  if (!backdrop) return;

  // Open / Close Drawer Triggers
  document.querySelectorAll('[data-open-drawer]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = btn.getAttribute('data-drawer-mode') || 'retail';
      openDrawer(mode);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeDrawer();
    }
  });

  // Tab switching
  if (tabRetail && tabBulk) {
    tabRetail.addEventListener('click', () => switchDrawerTab('retail'));
    tabBulk.addEventListener('click', () => switchDrawerTab('bulk'));
  }

  // Weight Pill selection in drawer
  const weightPills = document.querySelectorAll('.drawer-weight-pill');
  const customWeightInput = document.getElementById('drawerCustomWeight');

  weightPills.forEach(pill => {
    pill.addEventListener('click', () => {
      weightPills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      const val = pill.getAttribute('data-weight');
      if (customWeightInput) {
        customWeightInput.value = val;
      }
      calculateRetailTotal();
    });
  });

  if (customWeightInput) {
    customWeightInput.addEventListener('input', () => {
      weightPills.forEach(p => p.classList.remove('is-active'));
      calculateRetailTotal();
    });
  }

  const cutSelect = document.getElementById('drawerCutSelect');
  if (cutSelect) {
    cutSelect.addEventListener('change', calculateRetailTotal);
  }

  // Submit Retail Order Form
  const retailForm = document.getElementById('drawerRetailForm');
  if (retailForm) {
    retailForm.addEventListener('submit', handleRetailOrderSubmit);
  }

  // Submit Bulk Catering Form
  const bulkForm = document.getElementById('drawerBulkForm');
  if (bulkForm) {
    bulkForm.addEventListener('submit', handleBulkCateringSubmit);
  }
}

function openDrawer(mode = 'retail') {
  const backdrop = document.getElementById('drawerBackdrop');
  if (!backdrop) return;
  backdrop.classList.add('is-visible');
  document.body.style.overflow = 'hidden';
  switchDrawerTab(mode);
  calculateRetailTotal();
}

function closeDrawer() {
  const backdrop = document.getElementById('drawerBackdrop');
  if (!backdrop) return;
  backdrop.classList.remove('is-visible');
  document.body.style.overflow = '';
}

function switchDrawerTab(tab) {
  const tabRetail = document.getElementById('tabRetail');
  const tabBulk = document.getElementById('tabBulk');
  const bodyRetail = document.getElementById('drawerBodyRetail');
  const bodyBulk = document.getElementById('drawerBodyBulk');

  if (tab === 'bulk') {
    tabRetail.classList.remove('is-active');
    tabBulk.classList.add('is-active');
    bodyRetail.style.display = 'none';
    bodyBulk.style.display = 'block';
  } else {
    tabBulk.classList.remove('is-active');
    tabRetail.classList.add('is-active');
    bodyBulk.style.display = 'none';
    bodyRetail.style.display = 'block';
  }
}

function calculateRetailTotal() {
  const cutSelect = document.getElementById('drawerCutSelect');
  const customWeightInput = document.getElementById('drawerCustomWeight');
  const displayTotal = document.getElementById('drawerDisplayTotal');
  const displayCalc = document.getElementById('drawerDisplayCalc');

  if (!cutSelect || !displayTotal) return;

  const selectedOption = cutSelect.options[cutSelect.selectedIndex];
  const rate = parseFloat(selectedOption?.getAttribute('data-rate')) || 220;
  const cutName = selectedOption?.text || 'Fresh Cut Chicken';

  let weight = 1;
  if (customWeightInput && customWeightInput.value) {
    weight = parseFloat(customWeightInput.value);
    if (isNaN(weight) || weight <= 0) weight = 1;
  }

  const total = Math.round(rate * weight);
  displayTotal.textContent = `₹${total}`;
  if (displayCalc) {
    displayCalc.textContent = `${weight} kg × ₹${rate}/kg`;
  }
}

/* --------------------------------------------------------------------------
   4. QUICK WEIGHT SELECTORS (From Homepage Specification Table)
   -------------------------------------------------------------------------- */
function initQuickWeightSelectors() {
  document.querySelectorAll('.btn-weight-tier').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cutId = btn.getAttribute('data-cut-id');
      const weight = btn.getAttribute('data-weight');

      // Pre-select cut in drawer
      const cutSelect = document.getElementById('drawerCutSelect');
      if (cutSelect) {
        cutSelect.value = cutId;
      }

      // Pre-select weight
      const weightPills = document.querySelectorAll('.drawer-weight-pill');
      const customWeightInput = document.getElementById('drawerCustomWeight');

      weightPills.forEach(p => {
        if (p.getAttribute('data-weight') === weight) {
          p.classList.add('is-active');
        } else {
          p.classList.remove('is-active');
        }
      });

      if (customWeightInput) {
        customWeightInput.value = weight;
      }

      // Open drawer in retail mode and calculate
      openDrawer('retail');
      calculateRetailTotal();
    });
  });
}

/* --------------------------------------------------------------------------
   5. ASYNC ORDER SUBMISSION HANDLERS
   -------------------------------------------------------------------------- */
async function handleRetailOrderSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing Order...';

  const cutSelect = document.getElementById('drawerCutSelect');
  const selectedOption = cutSelect.options[cutSelect.selectedIndex];
  const cutId = cutSelect.value;
  const ratePerKg = parseFloat(selectedOption.getAttribute('data-rate'));
  const weightKg = parseFloat(document.getElementById('drawerCustomWeight').value) || 1;

  const payload = {
    orderType: 'retail',
    customerName: document.getElementById('retailCustomerName').value,
    phone: document.getElementById('retailPhone').value,
    cutId: cutId,
    weightKg: weightKg,
    ratePerKg: ratePerKg,
    prepNote: document.getElementById('retailPrepNote').value,
    fulfillmentType: form.querySelector('input[name="fulfillment"]:checked')?.value || 'delivery',
    address: document.getElementById('retailAddress').value
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.order) {
        showOrderSuccess(data.order, 'retail');
        form.reset();
        return;
      }
    }
    throw new Error('API unavailable, switching to direct WhatsApp booking');
  } catch (err) {
    console.warn('Backend API note:', err.message);
    // Offline / GitHub Pages fallback: generate order and direct to WhatsApp
    const fallbackOrder = {
      id: `JCS-RT-${Date.now().toString().slice(-4)}`,
      customerName: payload.customerName,
      phone: payload.phone,
      cutName: selectedOption?.text?.split('—')[0]?.trim() || 'Fresh Cut Chicken',
      weightKg: payload.weightKg,
      totalPrice: Math.round(payload.weightKg * payload.ratePerKg),
      prepNote: payload.prepNote,
      address: payload.address
    };
    showOrderSuccess(fallbackOrder, 'retail');
    form.reset();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function handleBulkCateringSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Recording Event Booking...';

  const payload = {
    orderType: 'catering',
    hostName: document.getElementById('bulkHostName').value,
    phone: document.getElementById('bulkPhone').value,
    eventDate: document.getElementById('bulkEventDate').value,
    eventTime: document.getElementById('bulkEventTime').value,
    venue: document.getElementById('bulkVenue').value,
    guestCount: document.getElementById('bulkGuestCount').value,
    totalBulkKg: document.getElementById('bulkTotalKg').value,
    breakdown: document.getElementById('bulkBreakdown').value,
    notes: document.getElementById('bulkNotes').value
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.booking) {
        showOrderSuccess(data.booking, 'catering');
        form.reset();
        return;
      }
    }
    throw new Error('API unavailable, switching to direct WhatsApp booking');
  } catch (err) {
    console.warn('Backend API note:', err.message);
    const fallbackBooking = {
      id: `JCS-CAT-${Date.now().toString().slice(-4)}`,
      hostName: payload.hostName,
      phone: payload.phone,
      eventDate: payload.eventDate,
      eventTime: payload.eventTime,
      venue: payload.venue,
      totalBulkKg: payload.totalBulkKg,
      breakdown: payload.breakdown
    };
    showOrderSuccess(fallbackBooking, 'catering');
    form.reset();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function showOrderSuccess(item, type) {
  const formWrapper = type === 'catering' ? document.getElementById('drawerBodyBulk') : document.getElementById('drawerBodyRetail');
  const successBox = document.getElementById('orderSuccessBox');
  const successOrderId = document.getElementById('successOrderId');
  const successDetails = document.getElementById('successDetails');
  const waBtn = document.getElementById('whatsappConfirmBtn');

  if (!successBox) return;

  if (formWrapper) formWrapper.style.display = 'none';
  successBox.classList.add('is-active');

  if (successOrderId) {
    successOrderId.textContent = item.id;
  }

  let waText = '';
  if (type === 'catering') {
    if (successDetails) {
      successDetails.textContent = `${item.totalBulkKg} kg bulk poultry for event on ${item.eventDate} at ${item.venue}.`;
    }
    waText = `Assalam Alaikum Jainuddin Chicken Shop, I booked catering supply ID ${item.id} for ${item.totalBulkKg}kg on date ${item.eventDate} at ${item.venue}. Name: ${item.hostName}. Please confirm morning delivery slot.`;
  } else {
    if (successDetails) {
      successDetails.textContent = `${item.weightKg} kg ${item.cutName} (₹${item.totalPrice}). Prep: ${item.prepNote}.`;
    }
    waText = `Assalam Alaikum Jainuddin Chicken Shop, I placed daily order ID ${item.id} for ${item.weightKg}kg ${item.cutName} (₹${item.totalPrice}). Customer: ${item.customerName}, Address: ${item.address}. Please confirm fresh cut status.`;
  }

  if (waBtn) {
    waBtn.href = `https://wa.me/919820154321?text=${encodeURIComponent(waText)}`;
  }
}

/* --------------------------------------------------------------------------
   6. WEDDING & PARTY MEAT ESTIMATOR (/catering)
   -------------------------------------------------------------------------- */
function initCateringEstimator() {
  const slider = document.getElementById('guestSlider');
  const display = document.getElementById('guestDisplayVal');
  if (!slider || !display) return;

  const eventPills = document.querySelectorAll('.event-pill');
  let selectedEvent = 'dawat'; // default

  eventPills.forEach(pill => {
    pill.addEventListener('click', () => {
      eventPills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      selectedEvent = pill.getAttribute('data-event');
      updateCalculations();
    });
  });

  slider.addEventListener('input', () => {
    display.textContent = slider.value;
    updateCalculations();
  });

  function updateCalculations() {
    const guests = parseInt(slider.value, 10) || 100;
    let meatPerGuest = 0.28; // kg per guest base for Shaadi Dawat

    if (selectedEvent === 'biryani') meatPerGuest = 0.25;
    if (selectedEvent === 'tandoor') meatPerGuest = 0.35;
    if (selectedEvent === 'reception') meatPerGuest = 0.30;

    const totalKg = Math.round(guests * meatPerGuest);

    // Breakdown
    const curryCutKg = Math.round(totalKg * 0.60);
    const bonelessKg = Math.round(totalKg * 0.25);
    const starterKg = totalKg - curryCutKg - bonelessKg; // remaining for lollipops or legs
    const approxLollipops = Math.round(starterKg * 14); // ~14 frenched pcs per kg

    const estRate = 225; // average wholesale mandi price
    const estTotalCost = totalKg * estRate;
    const estSavings = Math.round(totalKg * 35); // wholesale margin vs retail

    const elTotalKg = document.getElementById('estTotalKg');
    const elCurryCut = document.getElementById('estCurryCut');
    const elBoneless = document.getElementById('estBoneless');
    const elStarters = document.getElementById('estStarters');
    const elWholesale = document.getElementById('estWholesaleTotal');
    const elSavings = document.getElementById('estSavings');

    if (elTotalKg) elTotalKg.textContent = `${totalKg} KG`;
    if (elCurryCut) elCurryCut.textContent = `${curryCutKg} KG (Wedding Deg Cut)`;
    if (elBoneless) elBoneless.textContent = `${bonelessKg} KG (Tikka Cubes)`;
    if (elStarters) elStarters.textContent = `${starterKg} KG (~${approxLollipops} Lollipops / Tangdi)`;
    if (elWholesale) elWholesale.textContent = `₹${estTotalCost.toLocaleString('en-IN')}`;
    if (elSavings) elSavings.textContent = `₹${estSavings.toLocaleString('en-IN')} Saved`;

    // Button to book this calculation
    const bookBtn = document.getElementById('btnBookEstimator');
    if (bookBtn) {
      bookBtn.onclick = () => {
        openDrawer('bulk');
        const bulkGuestInput = document.getElementById('bulkGuestCount');
        const bulkTotalInput = document.getElementById('bulkTotalKg');
        const bulkBreakdown = document.getElementById('bulkBreakdown');

        if (bulkGuestInput) bulkGuestInput.value = guests;
        if (bulkTotalInput) bulkTotalInput.value = totalKg;
        if (bulkBreakdown) {
          bulkBreakdown.value = `${totalKg}kg Total: ${curryCutKg}kg Curry Cut (Deg Size) + ${bonelessKg}kg Boneless Tikka + ${starterKg}kg Starters (${selectedEvent.toUpperCase()})`;
        }
      };
    }
  }

  // Initial calculation
  updateCalculations();
}
