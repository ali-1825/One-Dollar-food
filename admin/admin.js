(function () {
  function setText(element, value) {
    if (!element) return;
    element.textContent = value == null ? '' : String(value);
  }

  function formatMoney(amount) {
    return 'PKR ' + Number(amount || 0).toFixed(2);
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
  }

  function statusBadge(success) {
    return success ? 'Sent' : 'Failed';
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload || {})
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      data = { success: false, error: 'Invalid server response.' };
    }

    return { ok: response.ok, status: response.status, data: data };
  }

  async function getJson(url) {
    const response = await fetch(url, {
      credentials: 'same-origin'
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      data = { success: false, error: 'Invalid server response.' };
    }

    return { ok: response.ok, status: response.status, data: data };
  }

  function showWarning(container, enabled) {
    if (!container) return;
    container.classList.toggle('hidden', !enabled);
  }

  window.DollarsFoodAdmin = {
    setText: setText,
    formatMoney: formatMoney,
    formatDate: formatDate,
    statusBadge: statusBadge,
    postJson: postJson,
    getJson: getJson,
    showWarning: showWarning
  };
})();
