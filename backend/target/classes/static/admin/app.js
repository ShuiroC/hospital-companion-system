(() => {
  const ADMIN_ACCOUNT = "root";
  const ADMIN_PASSWORD = "123456";
  const TOKEN_KEY = "backend_admin_token";
  const ACCOUNT_KEY = "backend_admin_account";

  const STATUS_TEXT = {
    UNPAID: "待支付",
    WAITING_ACCEPT: "待接单",
    ACCEPTED: "已接单",
    IN_SERVICE: "服务中",
    TO_CONFIRM: "待确认",
    COMPLETED: "已完成",
    CANCELED: "已取消",
    REFUNDING: "退款中",
    REFUNDED: "已退款"
  };

  const COMPANION_STATUS_TEXT = {
    PENDING: "待审核",
    APPROVED: "已通过",
    REJECTED: "已驳回",
    UNKNOWN: "未知"
  };

  const PIE_COLOR = {
    APPROVED: "#22c55e",
    PENDING: "#f59e0b",
    REJECTED: "#ef4444",
    UNKNOWN: "#94a3b8"
  };

  const el = {
    loginPanel: document.getElementById("loginPanel"),
    appPanel: document.getElementById("appPanel"),
    loginAccount: document.getElementById("loginAccount"),
    loginPassword: document.getElementById("loginPassword"),
    loginBtn: document.getElementById("loginBtn"),
    authMessage: document.getElementById("authMessage"),
    currentUser: document.getElementById("currentUser"),
    logoutBtn: document.getElementById("logoutBtn"),

    ordersBody: document.getElementById("ordersBody"),
    companionsBody: document.getElementById("companionsBody"),
    hospitalsBody: document.getElementById("hospitalsBody"),

    refreshOrdersBtn: document.getElementById("refreshOrdersBtn"),
    refreshCompanionsBtn: document.getElementById("refreshCompanionsBtn"),
    refreshHospitalsBtn: document.getElementById("refreshHospitalsBtn"),

    statTotal: document.getElementById("statTotal"),
    statActive: document.getElementById("statActive"),
    statDone: document.getElementById("statDone"),
    statIncome: document.getElementById("statIncome"),

    companionPieChart: document.getElementById("companionPieChart"),
    companionPieLegend: document.getElementById("companionPieLegend"),
    incomeLineChart: document.getElementById("incomeLineChart"),

    formHospital: document.getElementById("formHospital"),
    formServiceType: document.getElementById("formServiceType"),
    formReserveTime: document.getElementById("formReserveTime"),
    formPatientName: document.getElementById("formPatientName"),
    formPatientPhone: document.getElementById("formPatientPhone"),
    formAmount: document.getElementById("formAmount"),
    createOrderForm: document.getElementById("createOrderForm"),
    createMessage: document.getElementById("createMessage"),

    navButtons: Array.from(document.querySelectorAll(".nav-btn")),
    views: {
      dashboard: document.getElementById("dashboardView"),
      orders: document.getElementById("ordersView"),
      companions: document.getElementById("companionsView"),
      createOrder: document.getElementById("createOrderView"),
      hospitals: document.getElementById("hospitalsView")
    }
  };

  let orders = [];
  let companions = [];
  let hospitals = [];

  async function api(path, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({ code: -1, message: "Invalid response" }));
    if (data.code !== 0) throw new Error(data.message || "Request failed");
    return data.data;
  }

  function showAuthMessage(text, isError = true) {
    el.authMessage.textContent = text;
    el.authMessage.style.color = isError ? "#dc2626" : "#16a34a";
  }

  function setAppVisible(isLogin) {
    if (isLogin) {
      el.loginPanel.classList.add("hidden");
      el.appPanel.classList.remove("hidden");
      el.currentUser.textContent = `当前账号：${localStorage.getItem(ACCOUNT_KEY) || ADMIN_ACCOUNT}`;
      return;
    }

    el.loginPanel.classList.remove("hidden");
    el.appPanel.classList.add("hidden");
    el.currentUser.textContent = "未登录";
  }

  function showView(viewName) {
    Object.keys(el.views).forEach((key) => {
      el.views[key].classList.toggle("active", key === viewName);
    });
    el.navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    if (viewName === "dashboard") {
      renderCompanionPieChart();
      renderIncomeLineChart();
    }
  }

  function formatMoney(value) {
    return `¥${Number(value || 0).toFixed(2)}`;
  }

  function parseDateKey(raw) {
    const text = String(raw || "").trim();
    const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
  }

  function getCanvasContext(canvas) {
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width || canvas.clientWidth || 320));
    const height = Math.max(220, Math.floor(rect.height || canvas.clientHeight || 260));
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  }

  function drawEmpty(canvas, text) {
    const result = getCanvasContext(canvas);
    if (!result) return;

    const { ctx, width, height } = result;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, width / 2, height / 2);
  }

  function renderCompanionPieChart() {
    const countByStatus = { APPROVED: 0, PENDING: 0, REJECTED: 0, UNKNOWN: 0 };
    companions.forEach((item) => {
      const key = item.statusText || "UNKNOWN";
      if (Object.prototype.hasOwnProperty.call(countByStatus, key)) {
        countByStatus[key] += 1;
      } else {
        countByStatus.UNKNOWN += 1;
      }
    });

    const segments = Object.keys(countByStatus)
      .map((key) => ({
        key,
        label: COMPANION_STATUS_TEXT[key] || key,
        value: countByStatus[key],
        color: PIE_COLOR[key] || PIE_COLOR.UNKNOWN
      }))
      .filter((item) => item.value > 0);

    const total = segments.reduce((sum, item) => sum + item.value, 0);
    if (!total) {
      if (el.companionPieLegend) {
        el.companionPieLegend.innerHTML = '<span class="legend-item muted">暂无陪诊师数据</span>';
      }
      drawEmpty(el.companionPieChart, "暂无数据");
      return;
    }

    const result = getCanvasContext(el.companionPieChart);
    if (!result) return;
    const { ctx, width, height } = result;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.34;

    let start = -Math.PI / 2;
    segments.forEach((item) => {
      const rad = (item.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, start + rad);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      start += rad;
    });

    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(cx, cy, radius * 0.58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#334155";
    ctx.font = "13px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("总人数", cx, cy - 8);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 20px Microsoft YaHei, sans-serif";
    ctx.fillText(String(total), cx, cy + 18);

    if (el.companionPieLegend) {
      el.companionPieLegend.innerHTML = segments
        .map((item) => `
          <span class="legend-item">
            <i class="legend-dot" style="background:${item.color}"></i>
            ${item.label}：${item.value}
          </span>
        `)
        .join("");
    }
  }

  function renderIncomeLineChart() {
    const completedOrders = orders.filter((item) => item.status === "COMPLETED");
    const dailyIncomeMap = {};

    completedOrders.forEach((item) => {
      const dateKey = parseDateKey(item.createTime || item.reserveTime);
      if (!dateKey) return;
      dailyIncomeMap[dateKey] = (dailyIncomeMap[dateKey] || 0) + Number(item.amount || 0);
    });

    const labels = Object.keys(dailyIncomeMap).sort();
    const values = labels.map((dateKey) => Number(dailyIncomeMap[dateKey] || 0));

    if (!labels.length) {
      drawEmpty(el.incomeLineChart, "暂无已完成订单金额数据");
      return;
    }

    const result = getCanvasContext(el.incomeLineChart);
    if (!result) return;

    const { ctx, width, height } = result;
    const left = 46;
    const right = 18;
    const top = 20;
    const bottom = 38;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...values, 1);
    const yTicks = 4;

    ctx.strokeStyle = "#e2e8f0";
    ctx.fillStyle = "#64748b";
    ctx.font = "12px Microsoft YaHei, sans-serif";

    for (let i = 0; i <= yTicks; i += 1) {
      const y = top + (chartHeight / yTicks) * i;
      const val = maxVal - (maxVal / yTicks) * i;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(width - right, y);
      ctx.stroke();
      ctx.fillText(`¥${val.toFixed(0)}`, 6, y + 4);
    }

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((value, index) => {
      const x = labels.length === 1
        ? left + chartWidth / 2
        : left + (chartWidth / (labels.length - 1)) * index;
      const y = top + chartHeight - (value / maxVal) * chartHeight;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    values.forEach((value, index) => {
      const x = labels.length === 1
        ? left + chartWidth / 2
        : left + (chartWidth / (labels.length - 1)) * index;
      const y = top + chartHeight - (value / maxVal) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#1d4ed8";
      ctx.fill();
    });

    const xLabelStep = Math.max(1, Math.ceil(labels.length / 7));
    ctx.fillStyle = "#64748b";
    labels.forEach((dateKey, index) => {
      if (index % xLabelStep !== 0 && index !== labels.length - 1) return;

      const x = labels.length === 1
        ? left + chartWidth / 2
        : left + (chartWidth / (labels.length - 1)) * index;
      ctx.fillText(dateKey.slice(5), x - 16, height - 12);
    });
  }

  function renderHospitals() {
    el.hospitalsBody.innerHTML = hospitals
      .map((item) => `
        <tr>
          <td>${item.id || ""}</td>
          <td>${item.name || ""}</td>
          <td>${item.level || ""}</td>
          <td>${item.address || ""}</td>
          <td>${item.phone || ""}</td>
        </tr>
      `)
      .join("");

    el.formHospital.innerHTML = hospitals
      .map((item) => `<option value="${item.id}">${item.name}</option>`)
      .join("");
  }

  function renderOrders() {
    el.ordersBody.innerHTML = orders
      .map((item) => `
        <tr>
          <td>${item.orderNo || ""}</td>
          <td>${item.hospital || ""}</td>
          <td>${item.serviceType || ""}</td>
          <td>${STATUS_TEXT[item.status] || item.status || ""}</td>
          <td>${item.reserveTime || ""}</td>
          <td>${item.amount ?? ""}</td>
          <td>${item.patientName || ""}</td>
          <td>
            <button class="action-btn primary" data-next="${item.orderNo}">推进</button>
            <button class="action-btn danger" data-cancel="${item.orderNo}">取消</button>
            <button class="action-btn danger" data-delete="${item.orderNo}">删除</button>
          </td>
        </tr>
      `)
      .join("");

    const total = orders.length;
    const done = orders.filter((item) => item.status === "COMPLETED").length;
    const active = orders.filter((item) => !["COMPLETED", "CANCELED"].includes(item.status)).length;
    const income = orders
      .filter((item) => item.status === "COMPLETED")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    el.statTotal.textContent = String(total);
    el.statDone.textContent = String(done);
    el.statActive.textContent = String(active);
    el.statIncome.textContent = formatMoney(income);

    renderIncomeLineChart();
  }

  function renderCompanions() {
    if (!companions.length) {
      el.companionsBody.innerHTML = `
        <tr>
          <td colspan="5" class="muted">暂无陪诊师申请记录</td>
        </tr>
      `;
      renderCompanionPieChart();
      return;
    }

    el.companionsBody.innerHTML = companions
      .map((item) => `
        <tr>
          <td>${item.id || ""}</td>
          <td>${item.phone || ""}</td>
          <td>${COMPANION_STATUS_TEXT[item.statusText] || item.statusText || ""}</td>
          <td>${item.createTime || ""}</td>
          <td>
            <button class="action-btn" data-detail="${item.id}">详情</button>
            <button class="action-btn primary" data-approve="${item.id}" ${item.statusText === "PENDING" ? "" : "disabled"}>通过</button>
            <button class="action-btn danger" data-reject="${item.id}" ${item.statusText === "PENDING" ? "" : "disabled"}>驳回</button>
          </td>
        </tr>
      `)
      .join("");

    renderCompanionPieChart();
  }

  function showCompanionDetail(item) {
    if (!item) {
      alert("未找到该陪诊员详情");
      return;
    }

    const statusText = COMPANION_STATUS_TEXT[item.statusText] || item.statusText || "UNKNOWN";
    alert(
      `陪诊员详情\n\n` +
      `ID: ${item.id ?? ""}\n` +
      `姓名: ${item.username || "-"}\n` +
      `年龄: ${item.age ?? "-"}\n` +
      `学历: ${item.education || "-"}\n` +
      `工龄: ${item.workYears ?? "-"} 年\n` +
      `手机号: ${item.phone || "-"}\n` +
      `状态: ${statusText}\n` +
      `申请时间: ${item.createTime || "-"}`
    );
  }

  async function loadHospitals() {
    hospitals = await api("/api/hospitals");
    renderHospitals();
  }

  async function loadOrders() {
    orders = await api("/api/orders");
    renderOrders();
  }

  async function loadCompanions() {
    companions = await api("/api/admin/companions");
    renderCompanions();
  }

  async function login() {
    const account = el.loginAccount.value.trim();
    const password = el.loginPassword.value.trim();

    if (account !== ADMIN_ACCOUNT || password !== ADMIN_PASSWORD) {
      showAuthMessage("管理员账号或密码错误");
      return;
    }

    localStorage.setItem(TOKEN_KEY, "root-admin-token");
    localStorage.setItem(ACCOUNT_KEY, ADMIN_ACCOUNT);
    showAuthMessage("");
    setAppVisible(true);

    try {
      await Promise.all([loadHospitals(), loadOrders(), loadCompanions()]);
    } catch (error) {
      showAuthMessage(error.message || "加载后台数据失败");
    }
  }

  async function createOrder(event) {
    event.preventDefault();

    const payload = {
      hospital: el.formHospital.value,
      serviceType: el.formServiceType.value,
      reserveTime: el.formReserveTime.value.trim(),
      patientName: el.formPatientName.value.trim(),
      patientPhone: el.formPatientPhone.value.trim(),
      amount: Number(el.formAmount.value)
    };

    if (!/^1\d{10}$/.test(payload.patientPhone)) {
      el.createMessage.style.color = "#dc2626";
      el.createMessage.textContent = "患者手机号格式不正确";
      return;
    }

    try {
      const data = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      el.createMessage.style.color = "#16a34a";
      el.createMessage.textContent = `创建成功：${data.orderNo}`;
      el.createOrderForm.reset();
      el.formServiceType.value = "1";
      await loadOrders();
      showView("orders");
    } catch (error) {
      el.createMessage.style.color = "#dc2626";
      el.createMessage.textContent = error.message || "创建失败";
    }
  }

  async function orderAction(event) {
    const nextNo = event.target.getAttribute("data-next");
    const cancelNo = event.target.getAttribute("data-cancel");
    const deleteNo = event.target.getAttribute("data-delete");
    if (!nextNo && !cancelNo && !deleteNo) return;

    try {
      if (nextNo) await api(`/api/orders/${nextNo}/next`, { method: "PUT" });
      if (cancelNo) await api(`/api/orders/${cancelNo}/cancel`, { method: "PUT" });
      if (deleteNo) {
        if (!window.confirm(`确认删除订单 ${deleteNo} 吗？`)) return;
        await api(`/api/orders/${deleteNo}`, { method: "DELETE" });
      }
      await loadOrders();
    } catch (error) {
      alert(error.message || "操作失败");
    }
  }

  async function companionAction(event) {
    const detailId = event.target.getAttribute("data-detail");
    const approveId = event.target.getAttribute("data-approve");
    const rejectId = event.target.getAttribute("data-reject");
    if (!detailId && !approveId && !rejectId) return;

    try {
      if (detailId) {
        const item = companions.find((row) => String(row.id) === String(detailId));
        showCompanionDetail(item);
        return;
      }
      if (approveId) await api(`/api/admin/companions/${approveId}/approve`, { method: "PUT" });
      if (rejectId) await api(`/api/admin/companions/${rejectId}/reject`, { method: "PUT" });
      await loadCompanions();
    } catch (error) {
      alert(error.message || "操作失败");
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
    setAppVisible(false);
    showAuthMessage("");
  }

  function debounce(fn, wait = 120) {
    let timer = null;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  function bindEvents() {
    el.loginBtn.addEventListener("click", login);
    el.logoutBtn.addEventListener("click", logout);

    el.navButtons.forEach((btn) => {
      btn.addEventListener("click", () => showView(btn.dataset.view));
    });

    el.refreshOrdersBtn.addEventListener("click", loadOrders);
    el.refreshCompanionsBtn.addEventListener("click", loadCompanions);
    el.refreshHospitalsBtn.addEventListener("click", loadHospitals);

    el.createOrderForm.addEventListener("submit", createOrder);
    el.ordersBody.addEventListener("click", orderAction);
    el.companionsBody.addEventListener("click", companionAction);

    window.addEventListener(
      "resize",
      debounce(() => {
        renderCompanionPieChart();
        renderIncomeLineChart();
      })
    );
  }

  async function init() {
    bindEvents();

    const account = localStorage.getItem(ACCOUNT_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (account !== ADMIN_ACCOUNT || !token) {
      logout();
      return;
    }

    setAppVisible(true);
    try {
      await Promise.all([loadHospitals(), loadOrders(), loadCompanions()]);
    } catch {
      logout();
    }
  }

  init();
})();
