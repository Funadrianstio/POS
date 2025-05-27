const sheetID = '1NpL7Ip_oaj8FEi_zTTl-7t9hdWSGWrtHyfRYUvLyons';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?`;
const sheetName = 'Prices';
const qu = '';  // Empty query to select all data
const query = encodeURIComponent(qu);
const url = `${base}&sheet=${sheetName}&tq=${query}`;
const data = [];

let rightEyeData = [];
let leftEyeData = [];

const selections = {
  newEst: null,
  selfPay: null,
  fittingType: null,
  newToBrand: null
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  fetch(url)
    .then(res => res.text())
    .then(rep => {
      const jsData = JSON.parse(rep.substr(47).slice(0, -2));
      const colz = [];
      jsData.table.cols.forEach(heading => {
        if (heading.label) {
          colz.push(heading.label.toLowerCase().replace(/\s/g, ''));
        }
      });
      jsData.table.rows.forEach(main => {
        const row = {};
        colz.forEach((ele, ind) => {
          row[ele] = (main.c[ind] != null) ? main.c[ind].v : '';
        });
        data.push(row);
      });

      setupInputs();
      enableButtons();

      // --- NEW: auto-populate dropdowns on load ---

      // Get unique manufacturers from data
      const manufacturers = [...new Set(data.map(item => item.manufacturer).filter(Boolean))];

      if (manufacturers.length) {
        const defaultManufacturer = manufacturers[0];
        // Filter brands for default manufacturer
        const brands = [...new Set(data.filter(item => item.manufacturer === defaultManufacturer).map(item => item.brand).filter(Boolean))];

        // Populate right and left eye dropdowns with this default data
        populateDropdown('right-eye-dropdown', brands, defaultManufacturer, 'right');
        populateDropdown('left-eye-dropdown', brands, defaultManufacturer, 'left');
      }
    });
}

function enableButtons() {
  const manufacturerButtons = document.querySelectorAll('.manufacturer-btn');
  
  // Attach click events to manufacturer buttons
  manufacturerButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedEye = button.dataset.eye;  // Get which eye the button is for
      const selectedManufacturer = button.dataset.manufacturer;
      console.log(`Selected ${selectedEye} eye manufacturer: ${selectedManufacturer}`);

      // Filter data based on selected manufacturer
      const filtered = data.filter(item => item.manufacturer === selectedManufacturer);
      const uniqueBrands = [...new Set(filtered.map(item => item.brand))].filter(Boolean);
      
      console.log("Unique Brands:", uniqueBrands);  // Log brands for debugging

      // Populate the corresponding dropdown (right or left)
      if (selectedEye === 'right') {
        populateDropdown('right-eye-dropdown', uniqueBrands, selectedManufacturer, 'right');
      } else {
        populateDropdown('left-eye-dropdown', uniqueBrands, selectedManufacturer, 'left');
      }
    });
  });
}

function populateDropdown(containerId, uniqueBrands, selectedManufacturer, eye) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';  // Clear any existing dropdown

  const select = document.createElement('select');
  select.innerHTML = `<option value="">Select a brand</option>`;
  
  uniqueBrands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    select.appendChild(option);
  });

  container.appendChild(select);  // Append the dropdown to the container

  // Add event listener for when a brand is selected
  select.addEventListener('change', () => {
    const selectedBrand = select.value;
    console.log(`Selected Brand for ${eye} Eye: ${selectedBrand}`);

    // Find the data corresponding to the selected brand and manufacturer
    const brandData = data.find(item =>
      item.brand === selectedBrand && item.manufacturer === selectedManufacturer
    );

    if (brandData) {
      if (eye === 'right') {
        rightEyeData = brandData;  // Save the selected brand data
        document.getElementById('brand1').textContent = rightEyeData.brand || "—";
        document.getElementById('boxes1').textContent = (rightEyeData['#ofboxesforyearsupply'])/2 || "—";
        document.getElementById('price1').textContent = rightEyeData.priceperbox || "—";
        tryUpdateRebateDisplay(rightEyeData, selections.newToBrand);
      } else {
        leftEyeData = brandData;
        document.getElementById('brand2').textContent = leftEyeData.brand || "—";
        document.getElementById('boxes2').textContent = (leftEyeData['#ofboxesforyearsupply'])/2 || "—";
        document.getElementById('price2').textContent = leftEyeData.priceperbox || "—"; 
      }
    }
  });
}


// This is getting the info from the buttons to put in the object "Selections"
document.querySelectorAll('.toggle-button-group').forEach(group => {
  const groupKey = group.dataset.group; // e.g., 'new-est'

 group.querySelectorAll('.toggle-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Save selected value
    const value = button.dataset.value;
    const camelCaseKey = groupKey.replace(/-([a-z])/g, g => g[1].toUpperCase()); // e.g., 'new-est' => 'newEst'
    selections[camelCaseKey] = value;

    // Update button UI
document.querySelectorAll('.toggle-button-group').forEach(group => {
  const groupKey = group.dataset.group; // e.g., 'new-est'

  group.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.dataset.value;
      const camelCaseKey = groupKey.replace(/-([a-z])/g, g => g[1].toUpperCase());

      if (button.classList.contains('selected')) {
        // Deselect if already selected
        button.classList.remove('selected');
        selections[camelCaseKey] = null;
      } else {
        // Deselect all buttons in this group
        group.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('selected'));
        // Select this button
        button.classList.add('selected');
        selections[camelCaseKey] = value;
      }

      console.log(`${camelCaseKey} selected: ${selections[camelCaseKey]}`);

      // Call rebate update if it's the newToBrand toggle group
      if (camelCaseKey === 'newToBrand') {
        tryUpdateRebateDisplay(rightEyeData, selections.newToBrand);
      }
    });
  });
});



    console.log(`${camelCaseKey} selected: ${value}`);

    // If this is the newToBrand group, update rebate display too
    if (camelCaseKey === 'newToBrand') {
      tryUpdateRebateDisplay(rightEyeData, selections.newToBrand);
    }
  }); // end of button.addEventListener
}); // end of forEach
}
); // end of querySelectorAll



function setupInputs() {
  const additionalFees = parseFloat(document.getElementById('additional-fees').value) || 0;
  const fittingCopay = parseFloat(document.getElementById('fitting-copay').value) || 0;
  const contactlensAllowance = parseFloat(document.getElementById('contact-lens-allowance').value) || 0;
  const fittingDiscountAmount = parseFloat(document.getElementById('fitting-discount-amount').value) || 0;
  const fittingDiscountPercent = parseFloat(document.getElementById('fitting-discount-percent').value) || 0;
  const irTraining = parseFloat(document.getElementById('ir-training').value) || 0;
  const additionalSavings = parseFloat(document.getElementById('additional-savings').value) || 0;

  // Save or use the values as needed here
  console.log({ additionalFees, fittingCopay, contactlensAllowance, fittingDiscountAmount });
}



function updateExamDetailsTable() {
  const examCopay = parseFloat(document.getElementById("exam-copay").value) || 0;
  const clExam = parseFloat(document.getElementById("contact-lens-exam").value) || 0;
  const retinalImage = parseFloat(document.getElementById("retinal-price").value) || 0;
  const irTraining = parseFloat(document.getElementById("ir-training").value) || 0;

  const totalExamOOP = examCopay + clExam + retinalImage + irTraining;

  document.getElementById("examCopay").textContent = `$${examCopay.toFixed(2)}`;
  document.getElementById("clExam").textContent = `$${clExam.toFixed(2)}`;
  document.getElementById("retinalImage").textContent = `$${retinalImage.toFixed(2)}`;
  document.getElementById("irTraining").textContent = `$${irTraining.toFixed(2)}`;
  document.getElementById("oopExam").textContent = `$${totalExamOOP.toFixed(2)}`;
}

//Exam Detail Table Data Insertion

  function setupCurrencyInputListener(inputId, displayId) {
  const inputEl = document.getElementById(inputId);
  const displayEl = document.getElementById(displayId);

  if (!inputEl || !displayEl) {
    console.warn(`Elements not found: ${inputId}, ${displayId}`);
    return;
  }

  inputEl.addEventListener('input', () => {
    const value = parseFloat(inputEl.value);
    displayEl.textContent = isNaN(value) ? '---' : `$${value.toFixed(2)}`;
  });
}


setupCurrencyInputListener('exam-copay', 'examCopay');
setupCurrencyInputListener('retinal-image', 'retinalImage');
setupCurrencyInputListener('ir-training', 'irTraining');
setupCurrencyInputListener('ir-training', 'irTraining');
setupCurrencyInputListener('contact-lens-allowance', 'contactLensAllowanceDisplay');
setupCurrencyInputListener('additional-fees', 'additionalFeesDisplay');
setupCurrencyInputListener('additional-savings', 'additionalSavingsDisplay');
updateRebateDisplay('rightEyeData', 'newToBrand');

const ids = [
  'exam-copay',
  'contact-lens-exam-copay',
  'retinal-image',
  'ir-training',
  'additional-fees'
];

function updateOOPExamTotal() {
  let total = 0;

  ids.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        total += value;
      }
    }
  });

  const oopExamDisplay = document.getElementById('oopExam');
  if (oopExamDisplay) {
    oopExamDisplay.textContent = total > 0 ? `$${total.toFixed(2)}` : '---';
  }
}

// Attach event listeners to update total on input change
ids.forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener('input', updateOOPExamTotal);
  }
});

// Initialize total on page load
updateOOPExamTotal();

// Rebate function
function updateRebateDisplay(rightEyeData, newToBrand) {
  console.log('rightEyeData:', rightEyeData);
  console.log('newToBrand:', newToBrand);

  const rebateDisplay = document.getElementById('rebateDisplay');

  let rebate = 0;

  if (newToBrand === 'yes') {
    rebate = parseFloat('rightEyeData.rebatesfornewwearer')
  } else if (newToBrand === 'no') {
    rebate = parseFloat('rightEyeData.yearsupplycurrent');
  }

  rebateDisplay.textContent = `$${rebate.toFixed(2)}`;
  console.log(`rebate is $${rebate}`);

  return rebate;  // <-- Return rebate value for use elsewhere
}

// Safe wrapper to avoid errors if data is missing
function tryUpdateRebateDisplay(data, newToBrand) {
  if (!data) {
    console.log("No data available.");
    return;
  }

  let rebate = 0;
  if (newToBrand === 'Yes' && data.yearsupplynew) {
    rebate = parseFloat(data.yearsupplynew);
  } else if (data.yearsupplycurrent) {
    rebate = parseFloat(data.yearsupplycurrent);
  }

  console.log(`rebate is $${rebate}`);
  document.getElementById('rebate-display-cell').textContent = `$${rebate.toFixed(2)}`;
}

document.querySelectorAll('.toggle-button-group').forEach(group => {
  group.addEventListener('click', e => {
    if (e.target.classList.contains('toggle-btn')) {
      // Deselect all buttons in this group
      group.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('selected'));
      // Select clicked button
      e.target.classList.add('selected');
    }
  });
});