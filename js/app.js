(function () {
  const STORAGE = {
    session: "buildcore_session",
    cart: "buildcore_cart",
    messages: "buildcore_messages",
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async function api(path, options) {
    const config = options || {};
    const response = await fetch(path, {
      headers: Object.assign(
        { "Content-Type": "application/json" },
        config.headers || {}
      ),
      method: config.method || "GET",
      body: config.body,
    });

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const detail = data && data.detail;
      let message = "Ошибка запроса";
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail) && detail[0] && detail[0].msg) message = detail[0].msg;
      throw new Error(message);
    }
    return data;
  }

  function getSession() {
    return readJson(STORAGE.session, null);
  }

  function setSession(user) {
    if (user) writeJson(STORAGE.session, user);
    else localStorage.removeItem(STORAGE.session);
  }

  function getCart() {
    return readJson(STORAGE.cart, []);
  }

  function setCart(items) {
    writeJson(STORAGE.cart, items);
    updateCartBadge();
  }

  function toast(message, type) {
    let box = document.querySelector(".toast-box");
    if (!box) {
      box = document.createElement("div");
      box.className = "toast-box";
      document.body.appendChild(box);
    }
    const item = document.createElement("div");
    item.className = "toast" + (type === "error" ? " toast-error" : "");
    item.textContent = message;
    box.appendChild(item);
    setTimeout(function () {
      item.remove();
    }, 2800);
  }

  function ensureUiChrome() {
    const headerInner = document.querySelector(".header-inner");
    if (!headerInner || headerInner.querySelector(".header-tools")) return;

    const tools = document.createElement("div");
    tools.className = "header-tools";
    tools.innerHTML =
      '<a class="cart-link" href="cart.html">Сборка <span class="cart-badge" data-cart-badge>0</span></a>' +
      '<span class="user-chip" data-user-chip hidden></span>' +
      '<button type="button" class="button button-secondary button-small auth-toggle" data-auth-toggle>Войти</button>';
    headerInner.appendChild(tools);

    if (!document.getElementById("auth-modal")) {
      const modal = document.createElement("div");
      modal.id = "auth-modal";
      modal.className = "modal";
      modal.hidden = true;
      modal.innerHTML =
        '<div class="modal-backdrop" data-auth-close></div>' +
        '<div class="modal-dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">' +
        '<button type="button" class="modal-close" data-auth-close aria-label="Закрыть">×</button>' +
        '<h2 id="auth-title">Аккаунт</h2>' +
        '<div class="auth-tabs" role="tablist">' +
        '<button type="button" class="auth-tab is-active" data-auth-tab="login" role="tab" aria-selected="true">Вход</button>' +
        '<button type="button" class="auth-tab" data-auth-tab="register" role="tab" aria-selected="false">Регистрация</button>' +
        "</div>" +
        '<div class="auth-pane" data-auth-pane="login">' +
        '<form id="login-form" class="auth-form">' +
        '<div class="field"><label for="login-email">Email или логин</label><input id="login-email" type="text" required placeholder="ivan@mail.ru"></div>' +
        '<div class="field"><label for="login-password">Пароль</label><input id="login-password" type="password" required minlength="4" placeholder="Не менее 4 символов"></div>' +
        '<button class="button button-primary" type="submit">Войти</button>' +
        '<p class="form-status" data-login-status></p>' +
        "</form>" +
        "</div>" +
        '<div class="auth-pane" data-auth-pane="register" hidden>' +
        '<form id="register-form" class="auth-form">' +
        '<div class="field"><label for="register-name">Имя</label><input id="register-name" type="text" required minlength="2" placeholder="Иван"></div>' +
        '<div class="field"><label for="register-email">Email</label><input id="register-email" type="email" required placeholder="ivan@mail.ru"></div>' +
        '<div class="field"><label for="register-password">Пароль</label><input id="register-password" type="password" required minlength="4" placeholder="Например, qwerty123"></div>' +
        '<button class="button button-primary" type="submit">Создать аккаунт</button>' +
        '<p class="form-status" data-register-status></p>' +
        "</form>" +
        "</div>" +
        "</div>";
      document.body.appendChild(modal);
    }
  }

  function updateCartBadge() {
    const count = getCart().reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
    document.querySelectorAll("[data-cart-badge]").forEach(function (el) {
      el.textContent = String(count);
    });
  }

  function syncAdminNav(isAdmin) {
    const navList = document.querySelector(".site-nav ul");
    if (!navList) return;

    let item = document.getElementById("nav-bd");
    if (isAdmin) {
      if (!item) {
        item = document.createElement("li");
        item.id = "nav-bd";
        item.className = "nav-bd-item";
        item.innerHTML = '<a href="admin.html#bd">БД</a>';
        navList.appendChild(item);
      }
      item.hidden = false;
    } else if (item) {
      item.hidden = true;
    }
  }

  function updateAuthUi() {
    const session = getSession();
    const toggleBtn = document.querySelector("[data-auth-toggle]");
    const chip = document.querySelector("[data-user-chip]");
    if (!toggleBtn || !chip) return;

    if (session) {
      toggleBtn.textContent = "Выйти";
      toggleBtn.setAttribute("data-auth-mode", "logout");
      if (session.is_admin) {
        chip.hidden = true;
        chip.textContent = "";
      } else {
        chip.hidden = false;
        chip.textContent = session.name;
      }
      syncAdminNav(!!session.is_admin);
      const adminLink = document.querySelector("[data-admin-link]");
      if (adminLink) adminLink.hidden = !session.is_admin;
    } else {
      toggleBtn.textContent = "Войти";
      toggleBtn.setAttribute("data-auth-mode", "login");
      chip.hidden = true;
      chip.textContent = "";
      syncAdminNav(false);
      const adminLink = document.querySelector("[data-admin-link]");
      if (adminLink) adminLink.hidden = true;
    }
  }

  function setAuthTab(mode) {
    document.querySelectorAll("[data-auth-tab]").forEach(function (btn) {
      const active = btn.getAttribute("data-auth-tab") === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-auth-pane]").forEach(function (pane) {
      pane.hidden = pane.getAttribute("data-auth-pane") !== mode;
    });
  }

  function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    setAuthTab("login");
    modal.hidden = false;
  }

  function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.hidden = true;
  }

  function bindAuth() {
    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const toggle = target.closest("[data-auth-toggle]");
      if (toggle) {
        if (toggle.getAttribute("data-auth-mode") === "logout" || getSession()) {
          setSession(null);
          updateAuthUi();
          toast("Вы вышли из аккаунта");
        } else {
          openAuthModal();
        }
      }
      if (target.closest("[data-auth-close]")) closeAuthModal();

      const tab = target.closest("[data-auth-tab]");
      if (tab) {
        setAuthTab(tab.getAttribute("data-auth-tab"));
      }
    });

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm) {
      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        const status = document.querySelector("[data-login-status]");
        status.textContent = "Проверяем…";
        status.className = "form-status";
        try {
          const data = await api("/api/login", {
            method: "POST",
            body: JSON.stringify({ email: email, password: password }),
          });
          setSession(data.user);
          status.textContent = "Вход выполнен.";
          status.className = "form-status is-ok";
          updateAuthUi();
          toast("Добро пожаловать, " + data.user.name);
          setTimeout(closeAuthModal, 400);
        } catch (error) {
          status.textContent = error.message || "Неверный email или пароль.";
          status.className = "form-status is-error";
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const name = document.getElementById("register-name").value.trim();
        const email = document.getElementById("register-email").value.trim().toLowerCase();
        const password = document.getElementById("register-password").value;
        const status = document.querySelector("[data-register-status]");
        status.textContent = "Создаём аккаунт…";
        status.className = "form-status";
        try {
          const data = await api("/api/register", {
            method: "POST",
            body: JSON.stringify({ name: name, email: email, password: password }),
          });
          setSession(data.user);
          status.textContent = "Аккаунт создан.";
          status.className = "form-status is-ok";
          updateAuthUi();
          toast("Регистрация успешна");
          setTimeout(closeAuthModal, 400);
        } catch (error) {
          status.textContent = error.message || "Не удалось зарегистрироваться.";
          status.className = "form-status is-error";
        }
      });
    }
  }

  function addToCart(productId, qty) {
    const product = BuildCore.getProduct(productId);
    if (!product) return;
    const cart = getCart();
    const existing = cart.find(function (item) {
      return item.id === productId;
    });
    if (existing) existing.qty += qty;
    else cart.push({ id: productId, qty: qty });
    setCart(cart);
    toast(product.name + " добавлен в сборку");
  }

  function removeFromCart(productId) {
    setCart(
      getCart().filter(function (item) {
        return item.id !== productId;
      })
    );
    toast("Позиция удалена из сборки");
  }

  function renderCatalog() {
    const grid = document.querySelector("[data-catalog-grid]");
    if (!grid) return;

    const filters = document.querySelector(".filters");
    const category = document.getElementById("category");
    const price = document.getElementById("price");
    const sort = document.getElementById("sort");
    const search = document.getElementById("search");
    const countEl = document.querySelector("[data-catalog-count]");

    if (filters) {
      filters.addEventListener("submit", function (event) {
        event.preventDefault();
      });
    }

    function apply() {
      let list = BuildCore.PRODUCTS.slice();
      const categoryValue = category.value;
      const maxPrice = Number(price.value) || Infinity;
      const query = search.value.trim().toLowerCase();

      if (categoryValue !== "all") {
        list = list.filter(function (item) {
          return item.category === categoryValue;
        });
      }
      list = list.filter(function (item) {
        return item.price <= maxPrice;
      });
      if (query) {
        list = list.filter(function (item) {
          return (
            item.name.toLowerCase().includes(query) ||
            item.short.toLowerCase().includes(query) ||
            item.categoryLabel.toLowerCase().includes(query)
          );
        });
      }

      if (sort.value === "price-asc") {
        list.sort(function (a, b) { return a.price - b.price; });
      } else if (sort.value === "price-desc") {
        list.sort(function (a, b) { return b.price - a.price; });
      } else {
        list.sort(function (a, b) { return a.name.localeCompare(b.name, "ru"); });
      }

      if (countEl) countEl.textContent = "Найдено: " + list.length;

      grid.innerHTML = list
        .map(function (item) {
          return (
            '<article class="card">' +
            '<div class="card-media"><img src="' + item.image + '" alt="' + item.name + '"></div>' +
            '<div class="card-body">' +
            '<span class="badge">' + item.categoryLabel + "</span>" +
            "<h2>" + item.name + "</h2>" +
            '<p class="muted">' + item.short + "</p>" +
            '<p class="price">' + BuildCore.formatPrice(item.price) + "</p>" +
            '<div class="actions">' +
            '<a class="button button-secondary" href="product.html?id=' + item.id + '">Открыть</a>' +
            '<button type="button" class="button button-primary" data-add="' + item.id + '">В сборку</button>' +
            "</div></div></article>"
          );
        })
        .join("");
    }

    ["change", "input"].forEach(function (eventName) {
      category.addEventListener(eventName, apply);
      price.addEventListener(eventName, apply);
      sort.addEventListener(eventName, apply);
      search.addEventListener(eventName, apply);
    });

    grid.addEventListener("click", function (event) {
      const button = event.target.closest("[data-add]");
      if (!button) return;
      addToCart(button.getAttribute("data-add"), 1);
    });

    apply();
  }

  function renderProductPage() {
    const root = document.querySelector("[data-product-root]");
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const product = BuildCore.getProduct(params.get("id") || "cpu-i5") || BuildCore.PRODUCTS[0];

    document.title = product.name + " — BuildCore";
    root.innerHTML =
      '<div class="page-intro">' +
      '<p class="badge">' + product.categoryLabel + " · детальная карточка</p>" +
      "<h1>" + product.name + "</h1>" +
      "<p>" + product.description + "</p>" +
      "</div>" +
      '<section class="product-layout">' +
      '<div class="product-gallery"><img src="' + product.image + '" alt="Изображение ' + product.name + '"></div>' +
      '<article class="panel">' +
      '<p class="price">' + BuildCore.formatPrice(product.price) + "</p>" +
      '<p data-fx-price class="muted"></p>' +
      '<table class="specs"><tbody>' +
      Object.keys(product.specs)
        .map(function (key) {
          return "<tr><th scope=\"row\">" + key + "</th><td>" + product.specs[key] + "</td></tr>";
        })
        .join("") +
      "</tbody></table>" +
      '<form id="buy-form" class="buy-form">' +
      '<div class="field"><label for="buy-qty">Количество</label><input id="buy-qty" type="number" min="1" max="5" value="1" required></div>' +
      '<div class="field"><label for="buy-note">Комментарий к сборке</label><input id="buy-note" type="text" placeholder="Например: нужна проверка совместимости"></div>' +
      '<button class="button button-primary" type="submit">Добавить в сборку</button>' +
      '<a class="button button-secondary" href="catalog.html">Назад в каталог</a>' +
      '<p class="form-status" data-buy-status></p>' +
      "</form></article></section>";

    document.getElementById("buy-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const qty = Number(document.getElementById("buy-qty").value) || 1;
      const note = document.getElementById("buy-note").value.trim();
      addToCart(product.id, qty);
      const status = document.querySelector("[data-buy-status]");
      status.textContent = note
        ? "Добавлено. Комментарий: " + note
        : "Позиция добавлена в сборку.";
      status.className = "form-status is-ok";
      if (note) {
        writeJson("buildcore_last_note", { productId: product.id, note: note, at: Date.now() });
      }
    });

    loadCurrency(product.price);
  }

  function renderCartPage() {
    const tableBody = document.querySelector("[data-cart-body]");
    if (!tableBody) return;

    const summary = document.querySelector("[data-cart-summary]");
    const empty = document.querySelector("[data-cart-empty]");
    const form = document.getElementById("order-form");

    function draw() {
      const cart = getCart();
      if (!cart.length) {
        tableBody.innerHTML = "";
        if (empty) empty.hidden = false;
        if (summary) summary.hidden = true;
        if (form) form.hidden = true;
        return;
      }

      if (empty) empty.hidden = true;
      if (summary) summary.hidden = false;
      if (form) form.hidden = false;

      let total = 0;
      tableBody.innerHTML = cart
        .map(function (item) {
          const product = BuildCore.getProduct(item.id);
          if (!product) return "";
          const line = product.price * item.qty;
          total += line;
          return (
            "<tr>" +
            '<td data-label="Категория">' + product.categoryLabel + "</td>" +
            '<td data-label="Комплектующее"><a href="product.html?id=' + product.id + '">' + product.name + "</a></td>" +
            '<td data-label="Кол-во">' +
            '<div class="qty-controls">' +
            '<button type="button" data-qty-dec="' + product.id + '">−</button>' +
            "<span>" + item.qty + "</span>" +
            '<button type="button" data-qty-inc="' + product.id + '">+</button>' +
            "</div></td>" +
            '<td data-label="Цена">' + BuildCore.formatPrice(line) + "</td>" +
            '<td data-label=""><button type="button" class="linkish" data-remove="' + product.id + '">Удалить</button></td>' +
            "</tr>"
          );
        })
        .join("");

      const discount = total >= 100000 ? Math.round(total * 0.08) : 0;
      const pay = total - discount;
      document.querySelector("[data-sum-items]").textContent = String(
        cart.reduce(function (sum, item) { return sum + item.qty; }, 0)
      );
      document.querySelector("[data-sum-raw]").textContent = BuildCore.formatPrice(total);
      document.querySelector("[data-sum-discount]").textContent =
        discount > 0 ? "−" + BuildCore.formatPrice(discount) : "0 ₽";
      document.querySelector("[data-sum-total]").textContent = BuildCore.formatPrice(pay);
      document.querySelector("[data-fx-total]").textContent = "";
      loadCurrency(pay, "[data-fx-total]");
    }

    tableBody.addEventListener("click", function (event) {
      const target = event.target.closest("button");
      if (!target) return;
      const cart = getCart();
      const id = target.getAttribute("data-remove") || target.getAttribute("data-qty-inc") || target.getAttribute("data-qty-dec");
      const row = cart.find(function (item) { return item.id === id; });
      if (!row) return;

      if (target.hasAttribute("data-remove")) removeFromCart(id);
      if (target.hasAttribute("data-qty-inc")) row.qty += 1;
      if (target.hasAttribute("data-qty-dec")) row.qty = Math.max(1, row.qty - 1);
      if (!target.hasAttribute("data-remove")) setCart(cart);
      draw();
    });

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const session = getSession();
        const status = document.querySelector("[data-order-status]");
        if (!session || !session.id) {
          status.textContent = "Сначала войдите или зарегистрируйтесь.";
          status.className = "form-status is-error";
          openAuthModal();
          return;
        }
        const cart = getCart();
        if (!cart.length) {
          status.textContent = "Сборка пуста.";
          status.className = "form-status is-error";
          return;
        }

        let total = 0;
        const items = cart.map(function (item) {
          const product = BuildCore.getProduct(item.id);
          const line = product ? product.price * item.qty : 0;
          total += line;
          return {
            id: item.id,
            name: product ? product.name : item.id,
            qty: item.qty,
            price: product ? product.price : 0,
          };
        });
        const discount = total >= 100000 ? Math.round(total * 0.08) : 0;
        const pay = total - discount;

        status.textContent = "Отправляем заявку…";
        status.className = "form-status";
        try {
          await api("/api/orders", {
            method: "POST",
            body: JSON.stringify({
              user_id: session.id,
              phone: document.getElementById("order-phone").value.trim(),
              comment: document.getElementById("order-comment").value.trim(),
              items: items,
              total: pay,
            }),
          });
          setCart([]);
          form.reset();
          status.textContent = "Заявка принята. Мы свяжемся с вами для подтверждения.";
          status.className = "form-status is-ok";
          toast("Заявка отправлена");
          draw();
        } catch (error) {
          status.textContent = error.message || "Не удалось сохранить заявку.";
          status.className = "form-status is-error";
        }
      });
    }

    draw();
  }

  function bindContactsForm() {
    const form = document.getElementById("feedback-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const payload = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        topic: document.getElementById("topic").value,
        message: document.getElementById("message").value.trim(),
        createdAt: new Date().toISOString(),
      };
      const messages = readJson(STORAGE.messages, []);
      messages.push(payload);
      writeJson(STORAGE.messages, messages);
      form.reset();
      const status = document.querySelector("[data-feedback-status]");
      status.textContent = "Сообщение сохранено. Спасибо, " + payload.name + "!";
      status.className = "form-status is-ok";
      toast("Обратная связь отправлена");
    });
  }

  async function loadCurrency(amountRub, targetSelector) {
    const priceTargets = document.querySelectorAll(targetSelector || "[data-fx-price]");
    if (!priceTargets.length) return;
    if (!(typeof amountRub === "number" && amountRub > 0)) return;

    try {
      const response = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
      if (!response.ok) throw new Error("CBR unavailable");
      const data = await response.json();
      const usd = data.Valute.USD.Value;
      const eur = data.Valute.EUR.Value;
      const text =
        "≈ " +
        (amountRub / usd).toFixed(2) +
        " USD · " +
        (amountRub / eur).toFixed(2) +
        " EUR";
      priceTargets.forEach(function (el) {
        el.textContent = text;
      });
    } catch (error) {
      // курс на карточке товара необязателен
    }
  }

  function init() {
    ensureUiChrome();
    updateCartBadge();
    updateAuthUi();
    bindAuth();
    renderCatalog();
    renderProductPage();
    renderCartPage();
    bindContactsForm();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
