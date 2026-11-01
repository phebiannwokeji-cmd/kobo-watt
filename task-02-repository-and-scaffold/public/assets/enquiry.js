'use strict';
const form = document.querySelector('#enquiry-form');
const button = form.querySelector('button');
const status = document.querySelector('#enquiry-status');
button.disabled = false;
let pending = false;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending || !form.reportValidity()) return;
  pending = true;
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  status.dataset.state = 'pending';
  status.textContent = 'Saving demonstration enquiry…';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/api/enquiries', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))), signal: controller.signal
    });
    const result = await response.json();
    if (response.status !== 201 || !Number.isSafeInteger(result.id)) {
      status.dataset.state = 'error';
      status.textContent = result.error || 'Unable to save this demonstration enquiry. Your details remain below.';
      return;
    }
    status.dataset.state = 'success';
    status.textContent = `Demonstration enquiry saved. Reference ${result.id}. No real callback will be arranged.`;
    form.reset();
  } catch {
    status.dataset.state = 'error';
    status.textContent = 'We could not confirm whether your enquiry was saved. Your details remain below. Check before trying again.';
  } finally {
    clearTimeout(timer);
    pending = false;
    button.disabled = false;
    form.removeAttribute('aria-busy');
  }
});
