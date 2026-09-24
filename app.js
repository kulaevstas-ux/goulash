(function () {
  "use strict";

  if (document.documentElement.dataset.goulashReady === "true") {
    return;
  }
  document.documentElement.dataset.goulashReady = "true";

  var DESKTOP_QUERY = "(min-width: 1000px)";
  var NAV_QUERY = "(min-width: 860px)";

  function initTabs() {
    var lists = document.querySelectorAll("[data-tabs]");
    var groups = [];

    Array.prototype.forEach.call(lists, function (list) {
      if (list.dataset.ready === "true") {
        return;
      }
      list.dataset.ready = "true";

      var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      var panels = tabs.map(function (tab) {
        return document.getElementById(tab.getAttribute("aria-controls"));
      });

      function activate(index, animate) {
        tabs.forEach(function (tab, i) {
          var selected = i === index;
          var panel = panels[i];
          tab.setAttribute("aria-selected", selected ? "true" : "false");
          tab.tabIndex = selected ? 0 : -1;
          if (!panel) {
            return;
          }
          if (selected) {
            panel.hidden = false;
            if (animate) {
              panel.classList.remove("is-shown");
              void panel.offsetWidth;
              panel.classList.add("is-shown");
            }
          } else {
            panel.hidden = true;
            panel.classList.remove("is-shown");
          }
        });
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () {
          activate(index, true);
        });

        tab.addEventListener("keydown", function (event) {
          var key = event.key;
          var next = null;
          if (key === "ArrowRight") {
            next = (index + 1) % tabs.length;
          } else if (key === "ArrowLeft") {
            next = (index - 1 + tabs.length) % tabs.length;
          } else if (key === "Home") {
            next = 0;
          } else if (key === "End") {
            next = tabs.length - 1;
          } else {
            return;
          }
          event.preventDefault();
          activate(next, true);
          tabs[next].focus({ preventScroll: true });
        });
      });

      groups.push(panels);
    });

    function measurePanel(panel) {
      var parent = panel.parentElement;
      var width = parent.clientWidth;
      var snapshot = {
        hidden: panel.hidden,
        position: panel.style.position,
        visibility: panel.style.visibility,
        width: panel.style.width,
        left: panel.style.left,
        minHeight: panel.style.minHeight
      };

      panel.hidden = false;
      panel.style.minHeight = "0px";
      panel.style.position = "absolute";
      panel.style.left = "0";
      panel.style.width = width + "px";
      panel.style.visibility = "hidden";
      var height = panel.offsetHeight;

      panel.style.position = snapshot.position;
      panel.style.visibility = snapshot.visibility;
      panel.style.width = snapshot.width;
      panel.style.left = snapshot.left;
      panel.style.minHeight = snapshot.minHeight;
      panel.hidden = snapshot.hidden;
      return height;
    }

    function stabilizeAll() {
      var desktop = window.matchMedia(DESKTOP_QUERY).matches;
      groups.forEach(function (panels) {
        if (!desktop) {
          panels.forEach(function (panel) {
            if (panel) {
              panel.style.minHeight = "";
            }
          });
          return;
        }
        var max = 0;
        panels.forEach(function (panel) {
          if (!panel) {
            return;
          }
          var height = measurePanel(panel);
          if (height > max) {
            max = height;
          }
        });
        panels.forEach(function (panel) {
          if (panel) {
            panel.style.minHeight = max + "px";
          }
        });
      });
    }

    stabilizeAll();

    var frame = 0;
    window.addEventListener("resize", function () {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        stabilizeAll();
      });
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(stabilizeAll);
    }
  }

  function initMobileMenu() {
    var button = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!button || !nav || button.dataset.ready === "true") {
      return;
    }
    button.dataset.ready = "true";
    var label = button.querySelector(".sr-only");

    function setOpen(open) {
      button.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      if (label) {
        label.textContent = open ? "Закрыть меню" : "Открыть меню";
      }
    }

    button.addEventListener("click", function () {
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });

    Array.prototype.forEach.call(nav.querySelectorAll("a"), function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        button.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (button.getAttribute("aria-expanded") !== "true") {
        return;
      }
      if (nav.contains(event.target) || button.contains(event.target)) {
        return;
      }
      setOpen(false);
    });

    var desktopNav = window.matchMedia(NAV_QUERY);
    function closeOnDesktop() {
      if (desktopNav.matches) {
        setOpen(false);
      }
    }
    if (desktopNav.addEventListener) {
      desktopNav.addEventListener("change", closeOnDesktop);
    }
  }

  var NAME_PATTERN = /^[A-Za-zА-Яа-яЁё]+(?:[ '\-][A-Za-zА-Яа-яЁё]+)*$/;
  var PHONE_LENGTH = 11;

  function validateName(value) {
    var trimmed = String(value).trim().replace(/\s+/g, " ");
    if (!trimmed) {
      return "Введите имя";
    }
    if (trimmed.length < 2 || trimmed.length > 60) {
      return "Имя должно содержать от 2 до 60 символов";
    }
    if (!NAME_PATTERN.test(trimmed)) {
      return "Используйте только буквы, пробел, дефис или апостроф";
    }
    return "";
  }

  function phoneDigits(value) {
    var digits = String(value).replace(/\D/g, "");
    if (!digits) {
      return "";
    }
    if (digits.charAt(0) === "8") {
      digits = "7" + digits.slice(1);
    } else if (digits.charAt(0) !== "7") {
      digits = "7" + digits;
    }
    return digits.slice(0, PHONE_LENGTH);
  }

  function formatPhone(digits) {
    if (!digits) {
      return "";
    }
    var local = digits.slice(1);
    var out = "+7";
    if (local.length > 0) {
      out += " (" + local.slice(0, 3);
    }
    if (local.length >= 3) {
      out += ")";
    }
    if (local.length > 3) {
      out += " " + local.slice(3, 6);
    }
    if (local.length > 6) {
      out += "-" + local.slice(6, 8);
    }
    if (local.length > 8) {
      out += "-" + local.slice(8, 10);
    }
    return out;
  }

  function validatePhone(value) {
    var digits = phoneDigits(value);
    if (digits.length <= 1) {
      return "Введите номер телефона";
    }
    if (digits.length < PHONE_LENGTH) {
      return "Введите номер полностью: +7 (XXX) XXX-XX-XX";
    }
    if (!/^[3489]$/.test(digits.charAt(1))) {
      return "Проверьте код: номер РФ начинается с +7 (3…), (4…), (8…) или (9…)";
    }
    return "";
  }

  function bindPhoneMask(input) {
    var previous = phoneDigits(input.value);

    function caretForDigits(formatted, count) {
      if (count <= 0) {
        return formatted.length ? 2 : 0;
      }
      var seen = 0;
      for (var i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted.charAt(i))) {
          seen += 1;
          if (seen === count) {
            return i + 1;
          }
        }
      }
      return formatted.length;
    }

    input.addEventListener("input", function (event) {
      var raw = input.value;
      var caret = input.selectionStart == null ? raw.length : input.selectionStart;
      var atEnd = caret >= raw.length;
      var rawDigits = raw.replace(/\D/g, "");
      var before = raw.slice(0, caret).replace(/\D/g, "").length;
      if (rawDigits.length > PHONE_LENGTH && /^7[78]/.test(rawDigits)) {
        rawDigits = rawDigits.slice(1);
        before = Math.max(0, before - 1);
      }
      if (before > 0 && rawDigits.charAt(0) !== "7" && rawDigits.charAt(0) !== "8") {
        before += 1;
      }
      var digits = phoneDigits(rawDigits);

      if (event.inputType === "deleteContentBackward" && digits === previous && before > 0) {
        digits = digits.slice(0, before - 1) + digits.slice(before);
        before -= 1;
      }
      if (digits === "7" && event.inputType && event.inputType.indexOf("delete") === 0) {
        digits = "";
      }

      var formatted = formatPhone(digits);
      input.value = formatted;
      previous = digits;

      if (document.activeElement === input) {
        var pos = atEnd ? formatted.length : caretForDigits(formatted, Math.min(before, digits.length));
        input.setSelectionRange(pos, pos);
      }
    });

    input.addEventListener("focus", function () {
      if (!input.value) {
        input.value = "+7 (";
        previous = "7";
      }
    });

    input.addEventListener("blur", function () {
      if (phoneDigits(input.value).length <= 1) {
        input.value = "";
        previous = "";
      }
    });
  }

  var CITY_PATTERN = /^[A-Za-zА-Яа-яЁё]+(?:[ .'\-]+[A-Za-zА-Яа-яЁё]+)*\.?$/;
  var COMPANY_PATTERN = /[A-Za-zА-Яа-яЁё0-9]/;

  function normalizeText(value) {
    return String(value).trim().replace(/\s+/g, " ");
  }

  function validateCompany(value) {
    var trimmed = normalizeText(value);
    if (!trimmed) {
      return "Введите название компании";
    }
    if (trimmed.length < 2 || trimmed.length > 100) {
      return "Название должно содержать от 2 до 100 символов";
    }
    if (!COMPANY_PATTERN.test(trimmed)) {
      return "Название должно содержать буквы или цифры";
    }
    return "";
  }

  function validateCity(value) {
    var trimmed = normalizeText(value);
    if (!trimmed) {
      return "Введите город";
    }
    if (trimmed.length < 2 || trimmed.length > 60) {
      return "Название города должно содержать от 2 до 60 символов";
    }
    if (!CITY_PATTERN.test(trimmed)) {
      return "Используйте только буквы, пробел, точку или дефис";
    }
    return "";
  }

  function validateLocations(value) {
    if (value !== "2-5" && value !== "6-15" && value !== "16-plus") {
      return "Выберите количество точек";
    }
    return "";
  }

  function validateLead(values) {
    return {
      name: validateName(values.name),
      phone: validatePhone(values.phone),
      company: validateCompany(values.company),
      city: validateCity(values.city),
      locations: validateLocations(values.locations)
    };
  }

  // Пока адрес не задан, заявка не покидает браузер.
  var LEAD_ENDPOINT = "";

  function submitLead(lead) {
    if (navigator.onLine === false) {
      return Promise.reject(new Error("offline"));
    }
    if (!LEAD_ENDPOINT) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, 900);
      });
    }
    return fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("http-" + response.status);
      }
      return response;
    });
  }

  function initLeadForm() {
    var form = document.getElementById("lead-form");
    if (!form || form.dataset.ready === "true") {
      return;
    }
    form.dataset.ready = "true";

    var nameInput = document.getElementById("lead-name");
    var phoneInput = document.getElementById("lead-phone");
    var companyInput = document.getElementById("lead-company");
    var cityInput = document.getElementById("lead-city");
    var locationsInput = document.getElementById("lead-locations");
    var inputs = [nameInput, phoneInput, companyInput, cityInput, locationsInput];
    var submitBtn = document.getElementById("lead-submit");
    var submitLabel = document.getElementById("lead-submit-label");
    var spinner = document.getElementById("lead-spinner");
    var preface = document.getElementById("form-preface");
    var success = document.getElementById("form-success");
    var card = form.closest(".form-card");
    var main = document.getElementById("form-main");
    var title = document.getElementById("request-title");
    var errorBox = document.getElementById("form-error");
    var errorTitle = document.getElementById("form-error-title");
    var state = "idle";

    function setFieldError(input, message) {
      var error = document.getElementById(input.id + "-error");
      if (!error) {
        return;
      }
      var text = error.querySelector("[data-error-text]");
      if (message) {
        text.textContent = message;
        error.hidden = false;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", error.id);
      } else {
        text.textContent = "";
        error.hidden = true;
        input.setAttribute("aria-invalid", "false");
        input.removeAttribute("aria-describedby");
      }
    }

    function applyErrors(errors, shouldFocus) {
      var pairs = [
        [nameInput, errors.name],
        [phoneInput, errors.phone],
        [companyInput, errors.company],
        [cityInput, errors.city],
        [locationsInput, errors.locations]
      ];
      var first = null;
      pairs.forEach(function (pair) {
        setFieldError(pair[0], pair[1]);
        if (pair[1] && !first) {
          first = pair[0];
        }
      });
      if (shouldFocus && first) {
        first.focus();
      }
      return !first;
    }

    function bindText(input, validator) {
      input.addEventListener("blur", function () {
        input.dataset.touched = "true";
        setFieldError(input, validator(input.value));
      });
      input.addEventListener("input", function () {
        if (input.dataset.touched === "true") {
          setFieldError(input, validator(input.value));
        }
      });
    }

    function bindSelect(input, validator) {
      input.addEventListener("blur", function () {
        input.dataset.touched = "true";
        setFieldError(input, validator(input.value));
      });
      input.addEventListener("change", function () {
        input.dataset.touched = "true";
        setFieldError(input, validator(input.value));
      });
    }

    bindPhoneMask(phoneInput);
    bindText(nameInput, validateName);
    bindText(phoneInput, validatePhone);
    bindText(companyInput, validateCompany);
    bindText(cityInput, validateCity);
    bindSelect(locationsInput, validateLocations);

    function setLocked(locked) {
      form.setAttribute("aria-busy", locked ? "true" : "false");
      inputs.forEach(function (input) {
        input.disabled = locked;
      });
      submitBtn.disabled = locked;
      submitBtn.classList.toggle("is-loading", locked);
      if (spinner) {
        spinner.hidden = !locked;
      }
    }

    function clearFields() {
      inputs.forEach(function (input) {
        input.value = "";
        input.dataset.touched = "";
        setFieldError(input, "");
      });
    }

    function onSubmit(event) {
      if (event) {
        event.preventDefault();
      }
      if (state === "submitting") {
        return;
      }

      state = "validating";
      errorBox.hidden = true;
      var current = {
        name: nameInput.value,
        phone: phoneInput.value,
        company: companyInput.value,
        city: cityInput.value,
        locations: locationsInput.value
      };
      inputs.forEach(function (input) {
        input.dataset.touched = "true";
      });
      var errors = validateLead(current);
      if (!applyErrors(errors, true)) {
        state = "idle";
        return;
      }

      state = "submitting";
      setLocked(true);
      submitLabel.textContent = "Отправляем заявку…";

      submitLead({
        name: normalizeText(current.name),
        phone: "+" + phoneDigits(current.phone),
        company: normalizeText(current.company),
        city: normalizeText(current.city),
        locations: current.locations
      }).then(function () {
        setLocked(false);
        clearFields();
        errorBox.hidden = true;
        main.hidden = true;
        preface.hidden = true;
        success.hidden = false;
        card.classList.add("is-sent");
        title.textContent = "Заявка отправлена";
        state = "success";
        submitLabel.textContent = "Запросить демонстрацию";
        title.focus();
      }).catch(function () {
        setLocked(false);
        errorBox.hidden = false;
        state = "idle";
        submitLabel.textContent = "Повторить отправку";
        errorTitle.focus();
      });
    }

    form.addEventListener("submit", onSubmit);

    submitBtn.disabled = false;
  }

  initTabs();
  initMobileMenu();
  initLeadForm();
})();
