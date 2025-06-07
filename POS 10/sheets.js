const sheetID = '1NpL7Ip_oaj8FEi_zTTl-7t9hdWSGWrtHyfRYUvLyons';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?`;
const sheetName = 'Prices';
const qu = '';  // Empty query to select all data
const query = encodeURIComponent(qu);
const url = `${base}&sheet=${sheetName}&tq=${query}`;
const data = [];

let rightEyeData = [];
let leftEyeData = [];
let rebate = [];

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

      setupInputs?.(); // Only call if defined
      enableButtons();

      // Auto-populate manufacturer/brand dropdowns
      const manufacturers = [...new Set(data.map(item => item.manufacturer).filter(Boolean))];
      if (manufacturers.length) {
        const defaultManufacturer = manufacturers[0];
        const brands = [...new Set(data.filter(item => item.manufacturer === defaultManufacturer).map(item => item.brand).filter(Boolean))];
        populateDropdown('right-eye-dropdown', brands, defaultManufacturer, 'right');
        populateDropdown('left-eye-dropdown', brands, defaultManufacturer, 'left');
      }

      // ✅ Load fitting fees here
      loadFittingFees();
    });
}


const fittingFeesSheet = 'Fitting Fees';
const fittingFeesURL = `${base}&sheet=${encodeURIComponent(fittingFeesSheet)}&tq=`;
const fittingFeesData = [];

//Loading fitting fee data
function loadFittingFees() {
  fetch(fittingFeesURL)
    .then(res => res.text())
    .then(rep => {
      const jsData = JSON.parse(rep.substr(47).slice(0, -2));
      const colz = jsData.table.cols.map((col, idx) => {
        // Use a fallback name for empty columns to maintain alignment
        return col.label ? col.label.toLowerCase().replace(/\s/g, '') : `col${idx}`;
      });

      jsData.table.rows.forEach(main => {
        const row = {};
        colz.forEach((colName, i) => {
          row[colName] = main.c[i] ? main.c[i].v : '';
        });
        fittingFeesData.push(row);
      });

      console.log("Fitting Fees Loaded:", fittingFeesData);
    });
}


function enableButtons() {
  const manufacturerButtons = document.querySelectorAll('.manufacturer-btn');

  manufacturerButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedEye = button.dataset.eye;
      const selectedManufacturer = button.dataset.manufacturer;

      // Remove 'selected' from all buttons for the same eye
      manufacturerButtons.forEach(btn => {
        if (btn.dataset.eye === selectedEye) {
          btn.classList.remove('selected');
        }
      });

      // Add 'selected' class to the clicked button
      button.classList.add('selected');

      // Filter and populate dropdown
      const filtered = data.filter(item => item.manufacturer === selectedManufacturer);
      const uniqueBrands = [...new Set(filtered.map(item => item.brand))].filter(Boolean);

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

    const brandData = data.find(item =>
      item.brand === selectedBrand && item.manufacturer === selectedManufacturer
    );

    if (brandData) {
      if (eye === 'right') {
        rightEyeData = brandData;

        document.getElementById('brand1').textContent = rightEyeData.brand || "—";
        document.getElementById('boxes1').textContent = (rightEyeData['#ofboxesforyearsupply']) / 2 || "—";
        document.getElementById('price1').textContent = rightEyeData.priceperbox || "—";

        // ✅ Trigger rebate update if newToBrand is selected
        const normalizedValue = selections.newToBrand?.toLowerCase() === 'yes' ? 'Yes' : 'No';
        updateRebateDisplay(rightEyeData, normalizedValue);
      } else {
        leftEyeData = brandData;

        document.getElementById('brand2').textContent = leftEyeData.brand || "—";
        document.getElementById('boxes2').textContent = (leftEyeData['#ofboxesforyearsupply']) / 2 || "—";
        document.getElementById('price2').textContent = leftEyeData.priceperbox || "—";
      }
    }
  });
}



// This is getting the info from the buttons to put in the object "Selections"
// ...existing code...

// Only ONE event handler for toggle buttons!
document.querySelectorAll('.toggle-button-group').forEach(group => {
  const groupKey = group.dataset.group; // e.g., 'new-est'
  group.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.dataset.value;
      const camelCaseKey = groupKey.replace(/-([a-z])/g, g => g[1].toUpperCase());

      // Deselect all buttons in this group
      group.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('selected'));
      // Select this button
      button.classList.add('selected');
      // Save selected value
      selections[camelCaseKey] = value;

      console.log(`${camelCaseKey} selected: ${selections[camelCaseKey]}`);

      // Call rebate update if it's the newToBrand toggle group
      if (camelCaseKey === 'newToBrand') {
        const normalizedValue = selections.newToBrand?.toLowerCase() === 'yes' ? 'Yes' : 'No';

        if (rightEyeData && Object.keys(rightEyeData).length > 0) {
          updateRebateDisplay(rightEyeData, normalizedValue);
        }
      }

      // Run fitting fee logic automatically
      determineFittingFee(selections, fittingFeesData);
    });
  });
});



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
  const examCopay = parseFloat(document.getElementById("exam-copay")?.value) || 0;
  const retinalImage = parseFloat(document.getElementById("retinal-image")?.value) || 0;
  const irTraining = parseFloat(document.getElementById("ir-training")?.value) || 0;
  const additionalFees = parseFloat(document.getElementById("additional-fees")?.value) || 0;

  const finalFittingFee = calculateFinalFittingFee(fittingFee);

  const totalExamOOP = examCopay + finalFittingFee + retinalImage + irTraining + additionalFees;

  const formatCurrency = val => `$${val.toFixed(2)}`;
  document.getElementById("examCopay").textContent = formatCurrency(examCopay);
  document.getElementById("clExam").textContent = formatCurrency(finalFittingFee);
  document.getElementById("retinalImage").textContent = formatCurrency(retinalImage);
  document.getElementById("irTraining").textContent = formatCurrency(irTraining);
  document.getElementById("additionalFeesDisplay").textContent = formatCurrency(additionalFees);
  document.getElementById("oopExam").textContent = formatCurrency(totalExamOOP);


 
  console.log(`Fitting Fee: ${fittingFee}`)
  console.log(`Final Fitting Fee: ${finalFittingFee}`)
  console.log(`Exam copay: ${examCopay}`);
  console.log(`Retinal Image: ${retinalImage}`);
  console.log(`IR: ${irTraining}`);
  console.log(`More Fees: ${additionalFees}`);
  console.log(`Total OOP: ${totalExamOOP}`);

}


// 🔁 Auto-update whenever related fields change
const examInputs = [
  "exam-copay",
  "retinal-price",
  "ir-training",
  "fitting-copay",
  "fitting-discount-amount",
  "fitting-discount-percent",
  "additional-fees",
];

examInputs.forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener("input", updateExamDetailsTable);
  }
});


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
setupCurrencyInputListener('contact-lens-allowance', 'contactLensAllowanceDisplay');
setupCurrencyInputListener('additional-fees', 'additionalFeesDisplay');
setupCurrencyInputListener('additional-savings', 'additionalSavingsDisplay');
updateRebateDisplay(rightEyeData, selections.newToBrand);


['fitting-copay', 'fitting-discount-amount', 'fitting-discount-percent'].forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener('input', () => {
      updateFittingFeeDisplay();
    });
  }
});


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
function updateRebateDisplay(data, newToBrand) {
  if (!data) {
    console.warn("Missing data.");
    return;
  }

  const isNewToBrand = newToBrand?.toLowerCase() === "yes";
 
  rebate = parseFloat(
    isNewToBrand ? data.rebatesfornewwearer : data.yearsupplycurrent
  ) || 0;

  console.log(
    `Rebate (${isNewToBrand ? "New Wearer" : "Current Wearer"}): $${rebate}`
  );

  // Update existing display element
  const rebateDisplay = document.getElementById("rebateDisplay");
  if (rebateDisplay) {
    rebateDisplay.textContent = `$${rebate.toFixed(2)}`;
  }

  // ✅ ALSO update table cell
  const rebateTableCell = document.getElementById("rebate-display-cell");
  if (rebateTableCell) {
    rebateTableCell.textContent = `$${rebate.toFixed(2)}`;
  }

  return rebate;
}



let fittingFee = null;

function determineFittingFee(selections, fittingFeesData) {
  const { fittingType, selfPay, newEst } = selections;

  if ([fittingType, selfPay, newEst].some(val => val === undefined)) return;

  let dataIndex;
  if (fittingType === 'Sphere') {
    dataIndex = 0;
  } else if (fittingType === 'Toric') {
    dataIndex = 1;
  } else if (fittingType === 'MF/Mono') {
    dataIndex = 2;
  } else {
    console.warn("Invalid fittingType provided.");
    return;
  }

  const feeData = fittingFeesData[dataIndex];

  if (selfPay === 'Yes') {
    fittingFee = feeData.selfpay;
  } else if (selfPay === 'No') {
    if (newEst === 'New') {
      fittingFee = feeData.insnew;
    } else if (newEst === 'Est') {
      fittingFee = feeData.insestablished;
    }
  } else {
    console.warn("Invalid selections.selfPay");
  }

  updateFittingFeeDisplay();
}



let finalFittingFee= null;

function calculateFinalFittingFee(fittingFee) {
  const copay = parseFloat(document.getElementById("fitting-copay").value) || 0;
  const discountAmount = parseFloat(document.getElementById("fitting-discount-amount").value) || 0;
  const discountPercent = parseFloat(document.getElementById("fitting-discount-percent").value) || 0;

  if (copay > 0) {
    finalFittingFee = copay;
  } else if (discountAmount > 0) {
    finalFittingFee = fittingFee - discountAmount;
  } else if (discountPercent > 0) {
    finalFittingFee = fittingFee * (1 - discountPercent / 100);
  } else {
    finalFittingFee = fittingFee;
  }

  return finalFittingFee;
}

function updateFittingFeeDisplay() {
  if (fittingFee == null) return; // wait till fittingFee is set

  const finalFee = calculateFinalFittingFee(fittingFee);
  document.getElementById("clExam").textContent = `$${finalFee.toFixed(2)}`;
}
