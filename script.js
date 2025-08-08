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

  console.log('Final data to submit:', dataToSubmit);

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // هذا هو التعديل المطلوب
      },
      body: JSON.stringify(dataToSubmit),
      redirect: "follow"
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Server response:', result);
    
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
    console.error('فشل الإرسال:', error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}
