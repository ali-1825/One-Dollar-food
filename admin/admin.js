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

  function notificationLabel(status) {
    if (status === 'sent') return 'Sent';
    if (status === 'not_configured') return 'Not configured';
    return 'Failed';
  }

  function resolveNotificationStatus(notification) {
    if (notification && notification.status) {
      return notification.status;
    }
    return 'failed';
  }

  async function readJsonResponse(response) {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      return { success: false, error: 'Invalid server response.' };
    }
  }

  async function postJson(url, payload) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload || {})
      });

      const data = await readJsonResponse(response);
      return { ok: response.ok, status: response.status, data: data };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        data: { success: false, error: 'Could not reach the server. Please try again.' }
      };
    }
  }

  async function patchJson(url, payload) {
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload || {})
      });

      const data = await readJsonResponse(response);
      return { ok: response.ok, status: response.status, data: data };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        data: { success: false, error: 'Could not reach the server. Please try again.' }
      };
    }
  }

  async function getJson(url) {
    try {
      const response = await fetch(url, {
        credentials: 'same-origin'
      });

      const data = await readJsonResponse(response);
      return { ok: response.ok, status: response.status, data: data };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        data: { success: false, error: 'Could not reach the server. Please try again.' }
      };
    }
  }

  function showWarning(container, enabled) {
    if (!container) return;
    container.classList.toggle('hidden', !enabled);
  }

  function initLoginPage() {
    var form = document.getElementById('login-form');
    var statusEl = document.getElementById('login-status');
    var loginBtn = document.getElementById('login-btn');

    if (!form || !statusEl || !loginBtn || form.dataset.bound === 'true') {
      return;
    }

    form.dataset.bound = 'true';
    form.setAttribute('action', '/admin/login');
    form.setAttribute('method', 'post');
    form.setAttribute('novalidate', 'novalidate');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (loginBtn.disabled) {
        return false;
      }

      setText(statusEl, 'Signing in...');
      loginBtn.disabled = true;

      postJson('/api/admin/login', {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
      }).then(function (result) {
        if (result.status === 0) {
          setText(statusEl, result.data.error || 'Could not reach the server. Please try again.');
          loginBtn.disabled = false;
          return;
        }

        if (result.ok && result.data.success) {
          window.location.assign('/admin/orders');
          return;
        }

        setText(statusEl, result.data.error || 'Invalid username or password.');
        loginBtn.disabled = false;
      });

      return false;
    });
  }

  window.DollarsFoodAdmin = {
    setText: setText,
    formatMoney: formatMoney,
    formatDate: formatDate,
    notificationLabel: notificationLabel,
    resolveNotificationStatus: resolveNotificationStatus,
    postJson: postJson,
    patchJson: patchJson,
    getJson: getJson,
    showWarning: showWarning,
    initLoginPage: initLoginPage
  };

  if (document.getElementById('login-form')) {
    initLoginPage();
  }
})();
