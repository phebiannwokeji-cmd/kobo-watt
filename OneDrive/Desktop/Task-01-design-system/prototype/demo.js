/*
  Demonstration-only payment form behaviour for the account-summary screen.
  It never contacts a payment provider and never changes account data.
*/
(function () {
  "use strict";

  var form = document.getElementById("demo-payment-form");
  if (!form) {
    return;
  }

  var amountInput = document.getElementById("amount");
  var payButton = document.getElementById("pay-button");
  var errorMessage = document.getElementById("amount-error");
  var paymentMessage = document.getElementById("payment-message");

  var minimum = 3540;
  var remainingBalance = 2538180;

  function readAmount() {
    var digits = amountInput.value.replace(/[^0-9]/g, "");
    if (digits === "") {
      return NaN;
    }
    return Number(digits);
  }

  function formatNaira(amount) {
    return "₦" + amount.toLocaleString("en-NG");
  }

  function clearMessages() {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
    paymentMessage.hidden = true;
    paymentMessage.textContent = "";
  }

  function updateButton() {
    var amount = readAmount();
    payButton.textContent = Number.isFinite(amount) && amount > 0
      ? "Pay " + formatNaira(amount)
      : "Pay";
  }

  amountInput.addEventListener("input", function () {
    clearMessages();
    updateButton();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearMessages();

    var amount = readAmount();

    if (!Number.isFinite(amount) || amount < 1) {
      errorMessage.textContent = "Enter an amount greater than zero.";
      errorMessage.hidden = false;
      amountInput.focus();
      return;
    }

    if (amount > remainingBalance) {
      errorMessage.textContent = "That is more than the remaining purchase balance of " + formatNaira(remainingBalance) + ".";
      errorMessage.hidden = false;
      amountInput.focus();
      return;
    }

    if (amount < minimum && amount !== remainingBalance) {
      errorMessage.textContent = "The minimum access payment is " + formatNaira(minimum) + ", or the exact final balance.";
      errorMessage.hidden = false;
      amountInput.focus();
      return;
    }

    paymentMessage.textContent = "Demonstration only: " + formatNaira(amount) + " was not charged. No payment was sent and no account data changed.";
    paymentMessage.hidden = false;
  });

  updateButton();
}());
