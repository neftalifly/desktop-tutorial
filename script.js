const displayEl = document.getElementById("display");
const expressionEl = document.getElementById("expression");
const keysEl = document.querySelector(".calculator__keys");

let currentValue = "0";
let previousValue = "";
let operator = null;
let shouldResetDisplay = false;

function updateDisplay() {
  displayEl.textContent = currentValue;
  displayEl.classList.toggle("calculator__result--error", currentValue === "Error");
}

function updateExpression() {
  if (operator && previousValue !== "") {
    const symbol = { "+": "+", "-": "−", "*": "×", "/": "÷" }[operator];
    expressionEl.textContent = `${previousValue} ${symbol}`;
  } else {
    expressionEl.textContent = "";
  }
}

function clearAll() {
  currentValue = "0";
  previousValue = "";
  operator = null;
  shouldResetDisplay = false;
  updateDisplay();
  updateExpression();
}

function deleteLast() {
  if (currentValue === "Error") {
    clearAll();
    return;
  }

  if (currentValue.length <= 1) {
    currentValue = "0";
  } else {
    currentValue = currentValue.slice(0, -1);
  }
  updateDisplay();
}

function appendNumber(digit) {
  if (currentValue === "Error" || shouldResetDisplay) {
    currentValue = digit;
    shouldResetDisplay = false;
  } else if (currentValue === "0") {
    currentValue = digit;
  } else if (currentValue.length < 12) {
    currentValue += digit;
  }
  updateDisplay();
}

function appendDecimal() {
  if (currentValue === "Error" || shouldResetDisplay) {
    currentValue = "0.";
    shouldResetDisplay = false;
  } else if (!currentValue.includes(".")) {
    currentValue += ".";
  }
  updateDisplay();
}

function applyPercent() {
  if (currentValue === "Error") return;

  const value = parseFloat(currentValue);
  if (Number.isNaN(value)) return;

  currentValue = String(value / 100);
  updateDisplay();
}

function setOperator(nextOperator) {
  if (currentValue === "Error") return;

  if (operator && !shouldResetDisplay) {
    calculate();
    if (currentValue === "Error") return;
  }

  previousValue = currentValue;
  operator = nextOperator;
  shouldResetDisplay = true;
  updateExpression();
}

function calculate() {
  if (!operator || previousValue === "" || currentValue === "Error") return;

  const a = parseFloat(previousValue);
  const b = parseFloat(currentValue);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    currentValue = "Error";
    updateDisplay();
    return;
  }

  let result;

  switch (operator) {
    case "+":
      result = a + b;
      break;
    case "-":
      result = a - b;
      break;
    case "*":
      result = a * b;
      break;
    case "/":
      if (b === 0) {
        currentValue = "Error";
        previousValue = "";
        operator = null;
        updateDisplay();
        updateExpression();
        return;
      }
      result = a / b;
      break;
    default:
      return;
  }

  currentValue = formatResult(result);
  previousValue = "";
  operator = null;
  shouldResetDisplay = true;
  updateDisplay();
  updateExpression();
}

function formatResult(value) {
  const rounded = Math.round(value * 1e10) / 1e10;
  const text = String(rounded);

  if (text.length > 12) {
    return rounded.toExponential(5);
  }

  return text;
}

function handleKeyClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, value } = button.dataset;

  switch (action) {
    case "clear":
      clearAll();
      break;
    case "delete":
      deleteLast();
      break;
    case "percent":
      applyPercent();
      break;
    case "number":
      appendNumber(value);
      break;
    case "decimal":
      appendDecimal();
      break;
    case "operator":
      setOperator(value);
      break;
    case "equals":
      calculate();
      break;
  }
}

function handleKeyboard(event) {
  const { key } = event;

  if (/^\d$/.test(key)) {
    appendNumber(key);
    return;
  }

  if (key === ".") {
    appendDecimal();
    return;
  }

  if (key === "+" || key === "-" || key === "*" || key === "/") {
    setOperator(key);
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
    return;
  }

  if (key === "Escape") {
    clearAll();
    return;
  }

  if (key === "Backspace") {
    deleteLast();
    return;
  }

  if (key === "%") {
    applyPercent();
  }
}

keysEl.addEventListener("click", handleKeyClick);
document.addEventListener("keydown", handleKeyboard);

updateDisplay();
