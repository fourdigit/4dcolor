(function () {
  // get all data in form and return object
  function getFormData(form) {
    var elements = form.elements;
    var honeypot;

    var fields = Object.keys(elements)
      .filter(function (k) {
        if (elements[k].name === "honeypot") {
          honeypot = elements[k].value;
          return false;
        }
        return true;
      })
      .map(function (k) {
        if (elements[k].name !== undefined) {
          return elements[k].name;
          // special case for Edge's html collection
        } else if (elements[k].length > 0) {
          return elements[k].item(0).name;
        }
      })
      .filter(function (item, pos, self) {
        return self.indexOf(item) == pos && item;
      });

    var formData = {};
    fields.forEach(function (name) {
      var element = elements[name];

      // singular form elements just have one value
      formData[name] = element.value;

      // when our element has multiple items, get their values
      if (element.length) {
        var data = [];
        for (var i = 0; i < element.length; i++) {
          var item = element.item(i);
          if (item.checked || item.selected) {
            data.push(item.value);
          }
        }
        formData[name] = data.join(", ");
      }
    });

    // add form-specific values into the data
    formData.formDataNameOrder = JSON.stringify(fields);
    formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name
    formData.formGoogleSendEmail = form.dataset.email || ""; // no email by default

    return { data: formData, honeypot: honeypot };
  }

  function handleFormSubmit(event) {
    // handles form submit without any jquery
    event.preventDefault(); // we are submitting via xhr below
    var form = event.target;
    var formData = getFormData(form);
    var data = formData.data;
    var message = document.querySelector(".message");
    var messageText = document.querySelector(".message-text");
    var ellipsis = document.querySelector(".ellipsis");
    // If a honeypot field is filled, assume it was done so by a spam bot.
    if (formData.honeypot) {
      return false;
    }

    resetPicker();
    disableAllButtons(form);
    var url = form.action;
    var xhr = new XMLHttpRequest();
    messageText.innerHTML = "Sending";
    ellipsis.style.display = "block";
    xhr.open("POST", url);
    // xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        form.reset();
        var formElements = form.querySelector(".form-elements");
        if (formElements) {
          formElements.style.display = "none"; // hide form --- not working
        }

        var formConfirm = document.getElementById("fConfirm");
        if (message) {
          messageText.innerHTML = "Thank you!";
          message.style.display = "flex";
          ellipsis.style.display = "none";
        }
        formConfirm.style.opacity = 0;
        formConfirm.style.transform = "scale(0)";
      }
    };
    // url encode form data for sending as post data
    var encoded = Object.keys(data)
      .map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
      })
      .join("&");
    xhr.send(encoded);
  }

  function loaded() {
    // bind to the submit event of our form
    var forms = document.querySelectorAll("form.gform");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", handleFormSubmit, false);
    }
    var message = document.querySelector(".message");
    var messageText = document.querySelector(".message-text");
    var buttonSubmitConfirm = document.getElementById("submitConfirm");
    var formSubmitConfirm = document.getElementById("fSubmitConfirm");
    var formConfirm = document.getElementById("fConfirm");
    buttonSubmitConfirm.addEventListener("click", function () {
      if (!buttonSubmitConfirm.disabled) {
        messageText.innerHTML = "Are you sure?";
        message.style.display = "flex";
        formSubmitConfirm.style.opacity = 0;
        formSubmitConfirm.style.transform = "scale(0)";
        formConfirm.style.opacity = 1;
        formConfirm.style.transform = "scale(1)";
        setTimeout(function () {
          message.style.opacity = 1;
          formSubmitConfirm.style.display = "none";
          formConfirm.style.display = "flex";
        }, 310);
      }
    });
    var buttonConfirmCancel = document.getElementById("fButtonCancel");
    buttonConfirmCancel.addEventListener("click", function () {
      message.style.opacity = 0;
      formConfirm.style.opacity = 0;
      formConfirm.style.transform = "scale(0)";
      formSubmitConfirm.style.opacity = 1;
      formSubmitConfirm.style.transform = "scale(1)";
      setTimeout(function () {
        message.style.display = "none";
        formSubmitConfirm.style.display = "block";
        formConfirm.style.display = "none";
      }, 310);
    });
  }

  function resetPicker() {
    const picker = new Picker(document.getElementById("color-picker"));
    picker.draw();
  }

  document.addEventListener("DOMContentLoaded", loaded, false);

  function disableAllButtons(form) {
    var buttons = form.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  }
})();
