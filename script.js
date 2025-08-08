// الروابط والمتغيرات العامة
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyounw2-fv8EZeuKGpSKizMdZnmUnwdj7Nhf_O-6mMiWpgfDZbml9DIuMTkIuTIIxvgsQ/exec';

let productsData = [];
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = [];

const visitForm = document.getElementById('visitForm');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const entryUserNameInput = document.getElementById('entryUserName');
const customerTypeInput = document.getElementById('customerType');
const notesInput = document.getElementById('notes');
const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

function showSuccessMessage() {
  Swal.fire({
    title: '✅ تم الإرسال!',
    text: 'تم إرسال النموذج بنجاح.',
    icon: 'success',
    confirmButtonText: 'ممتاز'
  });
}

function showErrorMessage(message) {
  Swal.fire({
    title: '❌ فشل الإرسال',
    text: message || 'حدث خطأ أثناء إرسال النموذج. حاول مجددًا.',
    icon: 'error',
    confirmButtonText: 'موافق'
  });
}

function showWarningMessage(message) {
  Swal.fire({
    title: '⚠️ تنبيه',
    text: message,
    icon: 'warning',
    confirmButtonText: 'موافق'
  });
}

function generateVisitID() {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `VISIT-${timestamp}-${randomString}`;
}

function formatDate(date) {
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(date) {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatTimestamp(date) {
  return date.toLocaleString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

async function fetchJsonData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`خطأ في تحميل ${url}:`, error);
    showErrorMessage(`فشل تحميل البيانات من ${url}`);
    return [];
  }
}

async function loadAllData() {
  [
    productsData,
    salesRepresentatives,
    customersMain,
    visitOutcomes,
    visitPurposes,
    visitTypes
  ] = await Promise.all([
    fetchJsonData('products.json'),
    fetchJsonData('sales_representatives.json'),
    fetchJsonData('customers_main.json'),
    fetchJsonData('visit_outcomes.json'),
    fetchJsonData('visit_purposes.json'),
    fetchJsonData('visit_types.json')
  ]);
  populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR', 'Sales_Rep_Name_AR');
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitOutcomeSelect, visitOutcomes);
  setupProductCategories();
}

function populateSelect(selectElement, dataArray, valueKey, textKey) {
  while (selectElement.children.length > 1) selectElement.removeChild(selectElement.lastChild);
  dataArray.forEach(item => {
    const option = document.createElement('option');
    if (typeof item === 'object') {
      option.value = item[valueKey];
      option.textContent = item[textKey];
    } else {
      option.value = item;
      option.textContent = item;
    }
    selectElement.appendChild(option);
  });
}

function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.Customer_Name_AR;
    customerListDatalist.appendChild(option);
  });
}

let productCategories = {};
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productCategories = {};
  productsData.forEach(product => {
    const categoryName = product.Category;
    if (!productCategories[categoryName]) productCategories[categoryName] = [];
    productCategories[categoryName].push(product);
  });

  const categoryNames = {
    'المشروبات': 'Drinks',
    '5فايف ستار': '5Star',
    'تيارا': 'Tiara',
    'البسكويت': 'Biscuits',
    'الشوكولاتة': 'Chocolates',
    'الحلويات': 'Sweets'
  };

  for (const category in productCategories) {
    const div = document.createElement('div');
    div.className = 'flex items-center';
    const safeId = `cat-${categoryNames[category] || category.replace(/\s/g, '-')}`;
    div.innerHTML = `
      <input type="checkbox" id="${safeId}" value="${category}" class="h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer">
      <label for="${safeId}" class="ml-2 text-sm font-medium text-gray-700">${categoryNames[category] ? categoryNames[category].replace(/_/g, ' ') : category}</label>
    `;
    productCategoriesDiv.appendChild(div);
    div.querySelector('input').addEventListener('change', e => toggleProductsDisplay(e.target.value, e.target.checked));
  }
}

function toggleProductsDisplay(category, isChecked) {
  const categoryProducts = productCategories[category];
  if (!categoryProducts) return;

  if (isChecked) {
    categoryProducts.forEach(product => {
      const safeName = product.Product_Name_AR.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '');
      const productId = `product-${safeName}-${Math.random().toString(36).substring(2, 6)}`;
      const productDiv = document.createElement('div');
      productDiv.id = productId;
      productDiv.className = 'product-item';
      productDiv.setAttribute('data-category', category);
      productDiv.innerHTML = `
        <label>${product.Product_Name_AR}</label>
        <div class="radio-group">
          <label><input type="radio" name="status-${productId}" value="متوفر" required> متوفر</label>
          <label><input type="radio" name="status-${productId}" value="غير متوفر" required> غير متوفر</label>
        </div>
      `;
      productsDisplayDiv.appendChild(productDiv);
    });
  } else {
    const toRemove = productsDisplayDiv.querySelectorAll(`[data-category="${category}"]`);
    toRemove.forEach(div => div.remove());
  }
}

function validateProductStatuses() {
  const items = productsDisplayDiv.querySelectorAll('.product-item');
  if (items.length === 0) return true;

  let allValid = true;
  items.forEach(div => {
    const radios = div.querySelectorAll('input[type="radio"]');
    const checked = [...radios].some(r => r.checked);
    if (!checked) {
      allValid = false;
      div.style.border = '2px solid red';
      div.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => (div.style.border = ''), 3000);
    }
  });

  if (!allValid) {
    showWarningMessage('يرجى تحديد حالة التوفر لكل المنتجات الظاهرة.');
  }

  return allValid;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!visitForm.checkValidity()) {
    visitForm.reportValidity();
    showWarningMessage('يرجى تعبئة جميع الحقول المطلوبة.');
    return;
  }

  if (!validateProductStatuses()) return;

  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');

  const now = new Date();
  const selectedCustomer = customersMain.find(c => c.Customer_Name_AR === customerNameInput.value);
  const customerCode = selectedCustomer ? selectedCustomer.Customer_Code : '';

  const dataToSubmit = {
    visitID: generateVisitID(),
    customerCode: customerCode,
    customerName: customerNameInput.value,
    salesRepName: salesRepNameSelect.value,
    visitDate: formatDate(now),
    visitTime: formatTime(now),
    visitPurpose: visitPurposeSelect.value,
    visitOutcome: visitOutcomeSelect.value,
    visitType: visitTypeSelect.value,
    entryUserName: entryUserNameInput.value,
    timestamp: formatTimestamp(now),
    customerType: customerTypeInput.value,
    notes: notesInput.value || ''
  };

  const available = {
    'المشروبات': [],
    '5فايف ستار': [],
    'تيارا': [],
    'البسكويت': [],
    'الشوكولاتة': [],
    'الحلويات': []
  };
  const unavailable = {
    'المشروبات': [],
    '5فايف ستار': [],
    'تيارا': [],
    'البسكويت': [],
    'الشوكولاتة': [],
    'الحلويات': []
  };

  const items = productsDisplayDiv.querySelectorAll('.product-item');
  items.forEach(div => {
    const name = div.querySelector('label').textContent;
    const category = div.getAttribute('data-category');
    const selected = div.querySelector('input[type="radio"]:checked');
    
    if (selected) {
      if (selected.value === 'متوفر') {
        available[category].push(name);
      } else {
        unavailable[category].push(name);
      }
    }
  });

  dataToSubmit.availableDrinks = available['المشروبات'].join(', ');
  dataToSubmit.unavailableDrinks = unavailable['المشروبات'].join(', ');
  dataToSubmit.available5Star = available['5فايف ستار'].join(', ');
  dataToSubmit.unavailable5Star = unavailable['5فايف ستار'].join(', ');
  dataToSubmit.availableTiara = available['تيارا'].join(', ');
  dataToSubmit.unavailableTiara = unavailable['تيارا'].join(', ');
  dataToSubmit.availableBiscuits = available['البسكويت'].join(', ');
  dataToSubmit.unavailableBiscuits = unavailable['البسكويت'].join(', ');
  dataToSubmit.availableChocolates = available['الشوكولاتة'].join(', ');
  dataToSubmit.unavailableChocolates = unavailable['الشوكولاتة'].join(', ');
  dataToSubmit.availableSweets = available['الحلويات'].join(', ');
  dataToSubmit.unavailableSweets = unavailable['الحلويات'].join(', ');

  console.log('✅ البيانات النهائية للإرسال:', dataToSubmit);

  try {
    console.log('ℹ️ إرسال الطلب الآن...');
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // ✅ تم تصحيح هذا السطر
      },
      body: JSON.stringify(dataToSubmit),
      redirect: "follow"
    });

    console.log('✅ تم استلام رد من الخادم. حالة الرد:', response.status);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ استجابة الخادم بنجاح:', result);
    
    if (result.success) {
      showSuccessMessage();
      visitForm.reset();
      productsDisplayDiv.innerHTML = '';
      const checkboxes = productCategoriesDiv.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(c => c.checked = false);
    } else {
      showErrorMessage(result.error);
    }

  } catch (error) {
    console.error('❌ فشل الإرسال. الخطأ هو:', error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  visitForm.addEventListener('submit', handleSubmit);
});
