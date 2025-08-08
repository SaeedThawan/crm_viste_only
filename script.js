// الروابط والمتغيرات العامة
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyounw2-fv8EZeuKGpSKizMdZnmUnwdj7Nhf_O-6mMiWpgfDZbml9DIuMTkIuTIIxvgsQ/exec';
let productsData = [];
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = [];

// عناصر DOM
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

// ==================== الدوال المساعدة ====================

function showAlert(title, text, icon) {
  Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: 'حسناً'
  });
}

function showSuccessMessage() {
  showAlert('✅ تم الإرسال!', 'تم إرسال النموذج بنجاح.', 'success');
}

function showErrorMessage(message) {
  showAlert('❌ فشل الإرسال', message || 'حدث خطأ أثناء إرسال النموذج. حاول مجددًا.', 'error');
}

function showWarningMessage(message) {
  showAlert('⚠️ تنبيه', message, 'warning');
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
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatTimestamp(date) {
  return date.toLocaleString('ar-SA', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// ==================== دوال تحميل البيانات ====================

async function fetchJsonData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`خطأ في الاتصال: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`فشل تحميل ${url}:`, error);
    showErrorMessage(`تعذر تحميل البيانات من ${url}`);
    return [];
  }
}

async function loadAllData() {
  try {
    [productsData, salesRepresentatives, customersMain, visitOutcomes, visitPurposes, visitTypes] = 
      await Promise.all([
        fetchJsonData('products.json'),
        fetchJsonData('sales_representatives.json'),
        fetchJsonData('customers_main.json'),
        fetchJsonData('visit_outcomes.json'),
        fetchJsonData('visit_purposes.json'),
        fetchJsonData('visit_types.json')
      ]);
    
    populateSelects();
    setupProductCategories();
  } catch (error) {
    console.error('فشل تحميل البيانات:', error);
  }
}

function populateSelects() {
  populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR', 'Sales_Rep_Name_AR');
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitOutcomeSelect, visitOutcomes);
}

function populateSelect(selectElement, dataArray, valueKey, textKey) {
  const defaultOption = selectElement.querySelector('option[value=""]');
  selectElement.innerHTML = '';
  if (defaultOption) selectElement.appendChild(defaultOption);
  
  dataArray.forEach(item => {
    const option = document.createElement('option');
    option.value = typeof item === 'object' ? item[valueKey] : item;
    option.textContent = typeof item === 'object' ? item[textKey || valueKey] : item;
    selectElement.appendChild(option);
  });
}

function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.Customer_Name_AR;
    option.dataset.code = customer.Customer_Code;
    customerListDatalist.appendChild(option);
  });
}

// ==================== إدارة المنتجات ====================

let productCategories = {};

function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productCategories = {};
  
  // تصنيف المنتجات
  productsData.forEach(product => {
    if (!productCategories[product.Category]) {
      productCategories[product.Category] = [];
    }
    productCategories[product.Category].push(product);
  });

  // إنشاء واجهة التصنيفات
  const categoryNames = {
    'المشروبات': 'المشروبات',
    '5فايف ستار': '5فايف ستار',
    'تيارا': 'تيارا',
    'البسكويت': 'البسكويت',
    'الشوكولاتة': 'الشوكولاتة',
    'الحلويات': 'الحلويات'
  };

  for (const category in productCategories) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.innerHTML = `
      <input type="checkbox" id="cat-${category}" value="${category}">
      <label for="cat-${category}">${categoryNames[category] || category}</label>
    `;
    div.querySelector('input').addEventListener('change', (e) => 
      toggleProductsDisplay(e.target.value, e.target.checked));
    productCategoriesDiv.appendChild(div);
  }
}

function toggleProductsDisplay(category, isChecked) {
  const categoryProducts = productCategories[category];
  if (!categoryProducts) return;

  if (isChecked) {
    categoryProducts.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.className = 'product-item';
      productDiv.dataset.category = category;
      productDiv.innerHTML = `
        <label>${product.Product_Name_AR}</label>
        <div class="radio-group">
          <label>
            <input type="radio" name="status-${product.Product_ID}" value="متوفر" required>
            متوفر
          </label>
          <label>
            <input type="radio" name="status-${product.Product_ID}" value="غير متوفر" required>
            غير متوفر
          </label>
        </div>
      `;
      productsDisplayDiv.appendChild(productDiv);
    });
  } else {
    document.querySelectorAll(`.product-item[data-category="${category}"]`)
      .forEach(el => el.remove());
  }
}

function validateProductStatuses() {
  const items = productsDisplayDiv.querySelectorAll('.product-item');
  if (items.length === 0) return true;

  let allValid = true;
  items.forEach(item => {
    const checked = item.querySelector('input[type="radio"]:checked');
    if (!checked) {
      allValid = false;
      item.style.border = '1px solid red';
      setTimeout(() => item.style.border = '', 2000);
    }
  });

  if (!allValid) {
    showWarningMessage('الرجاء تحديد حالة التوفر لجميع المنتجات المحددة');
  }
  return allValid;
}

// ==================== إرسال النموذج ====================

async function handleSubmit(event) {
  event.preventDefault();
  
  // التحقق من صحة النموذج
  if (!visitForm.checkValidity()) {
    visitForm.reportValidity();
    showWarningMessage('الرجاء تعبئة جميع الحقول المطلوبة');
    return;
  }

  // التحقق من حالة المنتجات
  if (!validateProductStatuses()) return;

  // تعطيل الزر أثناء المعالجة
  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');

  const now = new Date();
  const selectedCustomer = customersMain.find(c => c.Customer_Name_AR === customerNameInput.value);

  // جمع حالات توفر المنتجات
  const productStatus = {
    available: {
      'المشروبات': [], '5فايف ستار': [], 'تيارا': [],
      'البسكويت': [], 'الشوكولاتة': [], 'الحلويات': []
    },
    unavailable: {
      'المشروبات': [], '5فايف ستار': [], 'تيارا': [],
      'البسكويت': [], 'الشوكولاتة': [], 'الحلويات': []
    }
  };

  document.querySelectorAll('.product-item').forEach(item => {
    const category = item.dataset.category;
    const productName = item.querySelector('label').textContent;
    const status = item.querySelector('input[type="radio"]:checked').value;
    
    if (status === 'متوفر') {
      productStatus.available[category].push(productName);
    } else {
      productStatus.unavailable[category].push(productName);
    }
  });

  // بناء كائن البيانات للإرسال بالترتيب الصحيح
  const dataToSubmit = {
    visitID: generateVisitID(),
    customerCode: selectedCustomer?.Customer_Code || '',
    customerName: customerNameInput.value,
    salesRepName: salesRepNameSelect.value,
    visitDate: formatDate(now),
    visitTime: formatTime(now),
    visitPurpose: visitPurposeSelect.value,
    visitOutcome: visitOutcomeSelect.value,
    visitType: visitTypeSelect.value,
    availableDrinks: (productStatus.available['المشروبات'] || []).join('، '),
    unavailableDrinks: (productStatus.unavailable['المشروبات'] || []).join('، '),
    available5Star: (productStatus.available['5فايف ستار'] || []).join('، '),
    unavailable5Star: (productStatus.unavailable['5فايف ستار'] || []).join('، '),
    availableTiara: (productStatus.available['تيارا'] || []).join('، '),
    unavailableTiara: (productStatus.unavailable['تيارا'] || []).join('، '),
    availableBiscuits: (productStatus.available['البسكويت'] || []).join('، '),
    unavailableBiscuits: (productStatus.unavailable['البسكويت'] || []).join('، '),
    availableChocolates: (productStatus.available['الشوكولاتة'] || []).join('، '),
    unavailableChocolates: (productStatus.unavailable['الشوكولاتة'] || []).join('، '),
    availableSweets: (productStatus.available['الحلويات'] || []).join('، '),
    unavailableSweets: (productStatus.unavailable['الحلويات'] || []).join('، '),
    entryUserName: entryUserNameInput.value,
    timestamp: formatTimestamp(now),
    customerType: customerTypeInput.value,
    notes: notesInput.value || ''
  };

  console.log('بيانات الإرسال:', dataToSubmit);

  try {
    // إرسال البيانات
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSubmit),
      redirect: 'follow'
    });

    // معالجة الرد
    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error('رد غير متوقع من الخادم');
    }

    console.log('رد الخادم:', result);
    
    if (result && result.success) {
      showSuccessMessage();
      visitForm.reset();
      productsDisplayDiv.innerHTML = '';
      document.querySelectorAll('#productCategories input[type="checkbox"]')
        .forEach(cb => cb.checked = false);
    } else {
      showErrorMessage(result.error || 'فشل في حفظ البيانات');
    }
  } catch (error) {
    console.error('خطأ في الإرسال:', error);
    showErrorMessage(error.message);
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}

// ==================== تهيئة الصفحة ====================

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  visitForm.addEventListener('submit', handleSubmit);
});
