(() => {
  const itemsContainer = document.querySelector('#items');
  const addButton = document.querySelector('#add-item');
  const previewButton = document.querySelector('#preview-charge');
  const currency = document.querySelector('meta[name="app-currency"]').content;
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  const formatMoney = (value) => new Intl.NumberFormat('en', { style: 'currency', currency }).format(Number(value || 0));

  function bindRemoveButtons() {
    document.querySelectorAll('.remove-item').forEach((button) => {
      button.onclick = () => {
        if (document.querySelectorAll('.item-row').length === 1) return;
        button.closest('.item-row').remove();
        updateItemsTotal();
      };
    });
  }

  function updateItemsTotal() {
    const total = [...document.querySelectorAll('.item-price')].reduce((sum, input) => sum + (Number(input.value) || 0), 0);
    document.querySelector('#items-total').textContent = formatMoney(total);
    const chargeText = document.querySelector('#service-charge').dataset.value;
    document.querySelector('#grand-total').textContent = chargeText ? formatMoney(total + Number(chargeText)) : '—';
  }

  addButton.addEventListener('click', () => {
    if (document.querySelectorAll('.item-row').length >= 100) return;
    const row = document.createElement('div');
    row.className = 'item-row row g-2 align-items-end mb-2';
    row.innerHTML = '<div class="col-md-7"><label class="form-label">Item name</label><input class="form-control" name="itemName" required maxlength="180"></div><div class="col-md-4"><label class="form-label">Target price</label><input class="form-control item-price" name="targetPrice" type="number" min="0" step="0.01" required></div><div class="col-md-1"><button type="button" class="btn btn-outline-danger remove-item" aria-label="Remove item">&times;</button></div>';
    itemsContainer.appendChild(row);
    bindRemoveButtons();
    row.querySelector('.item-price').addEventListener('input', updateItemsTotal);
  });

  document.querySelectorAll('.item-price').forEach((input) => input.addEventListener('input', updateItemsTotal));
  bindRemoveButtons();
  updateItemsTotal();

  previewButton.addEventListener('click', async () => {
    const payload = {
      address: document.querySelector('#address').value,
      latitude: document.querySelector('#latitude').value,
      longitude: document.querySelector('#longitude').value,
      itemCount: document.querySelectorAll('.item-row').length,
    };
    const message = document.querySelector('#quote-message');
    message.textContent = 'Calculating…';
    previewButton.disabled = true;
    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Charge calculation failed.');
      document.querySelector('#distance-fee').textContent = formatMoney(result.charge.distanceFee);
      document.querySelector('#item-fee').textContent = formatMoney(result.charge.itemFee);
      const serviceCharge = document.querySelector('#service-charge');
      serviceCharge.textContent = formatMoney(result.charge.total);
      serviceCharge.dataset.value = result.charge.total;
      message.textContent = `${result.location.distanceKm} km from the company location.`;
      updateItemsTotal();
    } catch (error) {
      message.textContent = error.message;
      document.querySelector('#distance-fee').textContent = '—';
      document.querySelector('#item-fee').textContent = '—';
      document.querySelector('#service-charge').textContent = '—';
    } finally {
      previewButton.disabled = false;
    }
  });
})();
