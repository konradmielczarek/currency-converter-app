const RatesController = (() => {
  class Rates {
    constructor(baseCurrency) {
      this.baseCurrency = baseCurrency;
    }

    async getRates() {
      const BASE_URL = 'http://data.fixer.io/api';
      const API_KEY = '31942ca112edbc249ad2f33b9e4cbcb7';

      try {
        const res = await fetch(`${BASE_URL}/latest?access_key=${API_KEY}&base=${this.baseCurrency}`);
        const json = await res.json();
        this.result = json.rates;
      } catch (error) {
        console.error(error);
      }
    }

    async getNames() {
      const BASE_URL = 'http://data.fixer.io/api';
      const API_KEY = '31942ca112edbc249ad2f33b9e4cbcb7';

      try {
        const res = await fetch(`${BASE_URL}/symbols?access_key=${API_KEY}`);
        const json = await res.json();
        this.names = json.symbols;
      } catch (error) {
        console.error(error);
      }
    }
  }

  return {
    getRates: async baseCurr => {
      const rates = new Rates(baseCurr);
      await rates.getRates();
      await rates.getNames();
      return rates;
    },

    prepareData: obj => {
      const {result, names} = obj;
      const codes = Object.keys(result); // Get codes array
      // const values = Object.values(result); // Get rates values array
      const values = Object.keys(result).map(key => ({'code': key, 'rate': result[key]})); // Create array of objects containing currency code and rate
      const currArr = Object.keys(names).map(key => ({'code': key, 'name': names[key]})); // Create array of objects containing currency code and name
      const filteredCurrencies = currArr.filter(el => codes.includes(el.code)); // Filter currencies to be displayed from entire names array
      
      // Add rate property to each currency object
      filteredCurrencies.forEach(curr => {
        values.forEach(val => {
          if (curr.code === val.code) {
            curr.rate = val.rate;
          }
        });
      });

      return filteredCurrencies;
    },

    filterDataToBeDisplayed: (allRatesData, selectedCurrencies) => {
      const data = allRatesData.filter(el => selectedCurrencies.includes(el.code));
      return data;
    },

    convert: (data, from, to, amount) => {
      let fromRate, toRate;

      data.forEach(el => {
        if (from === el.code) {
          fromRate = el.rate;
        }
      });

      data.forEach(el => {
        if (to === el.code) {
          toRate = el.rate;
        }
      });

      return amount * (toRate / fromRate );
    }
  }
})();


const UIController = (() => {
  const domStrings = {
    // Navbar
    tabs: document.querySelectorAll('.navbar__view'),
    contents: document.querySelectorAll('.app-content'),
    navbarContainer: document.querySelector('.navbar__container'),
    // Rates content
    captionDiv: document.querySelector('.caption'),
    ratesDiv: document.querySelector('.rates'),
    updateRatesBtn: document.querySelector('.rates__update-rates-btn'),
    ratesTable: document.querySelector('.rates__table'),
    ratesTableBody: document.querySelector('.rates-table__body'),
    loaderDiv: document.querySelector('.loader'),
    appContentContainer: document.querySelector('.app-content__container'),
    // Converter content
    firstConverterInput: document.querySelector('.converter__input'),
    currencyFromList: document.getElementById('currencies-from'),
    currencyToList: document.getElementById('currencies-to'),
    amountInput: document.getElementById('amount'),
    changeBtn: document.querySelector('.converter__change-btn'),
    calculateBtn: document.querySelector('.converter__calculate-btn'),
    resultDiv: document.querySelector('.result'),
    // Settings content
    saveBtn: document.querySelector('.settings__save-btn'),
    checkboxList: document.querySelector('.settings__checkbox-list'),
    selectRatesDiv: document.querySelector('.settings__select-rates'),
    checkAllBtn: document.querySelector('.settings__check-all-btn'),
    uncheckAllBtn: document.querySelector('.settings__uncheck-all-btn')
  };

  const getCode = currency => {
    const curArray = currency.value.split(' ');

    return curArray[0];
  };

  return {
    getDomStrings: () => {
      return domStrings;
    },

    changeView: (e) => {
      if (e.target.classList.contains('navbar__view')) {
        let clickedTab;
        const {tabs, contents} = domStrings;

        [...contents].forEach(el => {
          el.style.display = 'none';
        });

        [...tabs].forEach(el => {
          el.className = el.className.replace('navbar__view navbar__view--selected', 'navbar__view');
        });

        clickedTab = e.target.id;

        document.querySelector('.' + clickedTab).style.display = 'block';
        e.target.className = e.target.className.replace('navbar__view', 'navbar__view navbar__view--selected');

        window.scrollTo(0, 0);
      }
    },

    insertRatesToUI: (chosenCurrencies, baseCurrency) => {
      const {ratesTable, ratesTableBody, captionDiv, updateRatesBtn} = domStrings;
      const baseCurrInfo = `
        <div class="app-content__caption">
          Presented rates have been calculated for 1 ${baseCurrency} as base currency.
        </div>
      `;
      
      ratesTable.style.display = 'block';
      updateRatesBtn.style.display = 'block';
      ratesTableBody.innerHTML = '';
      captionDiv.innerHTML = '';
      captionDiv.insertAdjacentHTML('afterbegin', baseCurrInfo);

      // Insert rates array into UI
      chosenCurrencies.forEach(el => {
        const html = `
          <tr>
            <td class="name">${el.name}</td>
            <td class="code">${el.code}</td>
            <td class="rate">${el.rate.toFixed(4)}</td>
          </tr>
        `;
    
        ratesTableBody.insertAdjacentHTML('beforeend', html);
      });
    },

    insertCurrenciesToSettings: ratesArr => {
      const {checkboxList} = domStrings;

      checkboxList.innerHTML = '';

      ratesArr.forEach(el => {
        const html = `
        <div class="settings__checkbox-div">
          <input class="settings__checkbox" type="checkbox" value="${el.code}"><span>${el.code} (${el.name})</span>
        </div>
        `;

        checkboxList.insertAdjacentHTML('beforeend', html);
      });
    },

    getCurrenciesChoice: () => {
      const checkbox = document.querySelectorAll('.settings__checkbox');
      const arr = [];

      [...checkbox].forEach(el => {
        if (el.checked === true) {
          arr.push(el.value);
          el.checked = true;
        }
      });
      
      return arr;
    },

    checkCurrencies: checkedArr => {
      const checkbox = document.querySelectorAll('.settings__checkbox');

      // 1. Clear settings firstly
      [...checkbox].forEach(el => {
        el.checked = false;
      });

      // 2. Check which currencies were saved before and check them again
      [...checkbox].forEach(checkVal => {
        checkedArr.forEach(elVal => {
          if(checkVal.value === elVal) {
            checkVal.checked = true;
          }
        });
      });
    },

    renderSavedInfo: () => {
      const {selectRatesDiv} = domStrings;
      const html = `<span id="saved-info">Saved!</span>`

      selectRatesDiv.insertAdjacentHTML('beforeend', html);

      setTimeout(() => {
        document.getElementById('saved-info').remove();
      }, 2000);
    },

    renderValidationError: () => {
      const {firstConverterInput} = domStrings;

      firstConverterInput.classList.add('converter__input--error');

      setTimeout(() => {
        firstConverterInput.classList.remove('converter__input--error');
      }, 2000);
    },

    renderStartView: () => {
      const {captionDiv, ratesTable, updateRatesBtn} = domStrings;
      const startText = `
        <div class="app-content__caption">
        Go to Settings and select the currencies you are interested in.
        </div>
      `;

      captionDiv.innerHTML = '';
      captionDiv.insertAdjacentHTML('afterbegin', startText);
      ratesTable.style.display = 'none';
      updateRatesBtn.style.display = 'none';
    },

    renderLoader: (place) => {
      const {ratesDiv, resultDiv} = domStrings;
      const html = `
        <div class="loader">
          <div class="lds-ring t-center"><div></div><div></div><div></div><div></div></div>
        </div>
      `;

      if (place === 'converter') {
        resultDiv.insertAdjacentHTML('afterbegin', html);
      } else {
        ratesDiv.insertAdjacentHTML('beforeend', html);
      }
    },
    
    removeLoader: () => {
      const loaderDiv = document.querySelector('.loader');
    
      loaderDiv.remove();
    },

    fillDataLists: (ratesArr, type) => {
      const {currencyFromList, currencyToList} = domStrings;

      ratesArr.forEach(cur => {
        const option = document.createElement('option');
        option.textContent = `${cur.code} | ${cur.name}`;
        type === 'from' ? currencyFromList.appendChild(option) : currencyToList.appendChild(option);
      })
    },

    displayResult: (obj, result) => {
      const {resultDiv} = domStrings;

      resultDiv.innerHTML = `
        <div class="result__from">${obj.amount} ${obj.fromValue}</div>
        <span>=</span>
        <div class="result__to">${result.toFixed(2)} ${obj.toValue}</div>
      `;
    },

    changeConverterValues: () => {
      const {currencyFromList, currencyToList} = domStrings;
      const fromValue = currencyFromList.value;
      const toValue = currencyToList.value;

      currencyFromList.value = toValue;
      currencyToList.value = fromValue;
    },

    clearResult: () => {
      const {resultDiv} = domStrings;

      resultDiv.innerHTML = '';
    },

    clearTableBody: () => {
      const {ratesTableBody} = domStrings;

      ratesTableBody.innerHTML = '';
    },

    checkAllCurrencies: () => {
      const checkbox = document.querySelectorAll('.settings__checkbox');

      [...checkbox].forEach(el => {
        el.checked = true;
      });
    },

    uncheckAllCurrencies: () => {
      const checkbox = document.querySelectorAll('.settings__checkbox');

      [...checkbox].forEach(el => {
        el.checked = false;
      });
    },

    getInputs: () => {
      let {currencyFromList, currencyToList, amountInput} = domStrings;
      const fromCode = getCode(currencyFromList);
      const toCode = getCode(currencyToList);
      
      return {
        fromValue: fromCode,
        toValue: toCode,
        amount: parseFloat(amountInput.value).toFixed(2)
      }
    }
  }
})();


const AppController = ((ratesCtrl, uiCtrl) => {
  const setupEventListeners = () => {
    const dom = uiCtrl.getDomStrings();

    dom.calculateBtn.addEventListener('click', convertRate);

    dom.navbarContainer.addEventListener('click', e => {
      uiCtrl.changeView(e);
      if (e.target.id === 'settings__content') {
        uiCtrl.checkCurrencies(state.selectedCurrenciesInSettings);
      }
    });

    dom.saveBtn.addEventListener('click', () => {
      getSelectedCurrencies();
      displayRates();
      uiCtrl.renderSavedInfo();
    });

    dom.checkAllBtn.addEventListener('click', uiCtrl.checkAllCurrencies);

    dom.uncheckAllBtn.addEventListener('click', uiCtrl.uncheckAllCurrencies);

    dom.changeBtn.addEventListener('click', uiCtrl.changeConverterValues);

    dom.updateRatesBtn.addEventListener('click', updateRates);
  }

  const state = {
    rates: {},
    baseCurrency: '',
    preparedData: {},
    selectedCurrenciesInSettings: [],
    dataToBeDisplayed: [],
    converterInput: {}
  };

  const getSelectedCurrencies = () => {
    state.selectedCurrenciesInSettings = uiCtrl.getCurrenciesChoice();
    state.dataToBeDisplayed = ratesCtrl.filterDataToBeDisplayed(state.preparedData, state.selectedCurrenciesInSettings);
  }

  const prepareConverter = (rates) => {
    uiCtrl.fillDataLists(rates, 'from');
    uiCtrl.fillDataLists(rates, 'to');
  }

  const retrieveData = async () => {
    // 1. Get data from API
    state.rates = await ratesCtrl.getRates('EUR');
    state.baseCurrency = state.rates.baseCurrency;

    // 2. Transform and prepare data
    state.preparedData = ratesCtrl.prepareData(state.rates);

    // 3. Prepare converter by filling datalists with currencies names
    prepareConverter(state.preparedData);

    // 4. Insert currencies to settings view
    uiCtrl.insertCurrenciesToSettings(state.preparedData);
  }

  const displayRates = () => {
    // 1. Clear table body
    uiCtrl.clearTableBody();

    // 2. Display loader before receiving data from API if it's not exist in document already
    if (!document.querySelector('.loader')) uiCtrl.renderLoader();

    // 3. Mark selected currencies in settings again after view cleaning
    uiCtrl.checkCurrencies(state.selectedCurrenciesInSettings);

    // 4. Insert data into UI and remove loader when data is displayed
    setTimeout(() => {
      uiCtrl.insertRatesToUI(state.dataToBeDisplayed, state.baseCurrency);
      uiCtrl.removeLoader();
      displayStartView();
    }, 1500);
  }

  const displayStartView = () => {
    if (state.selectedCurrenciesInSettings.length === 0) {
      uiCtrl.renderStartView();
    }
  }

  const convertRate =  () => {
    // 1. Get inputs
    state.converterInput = uiCtrl.getInputs();
    const {fromValue, toValue, amount} = state.converterInput;

    // 2. Validate inputs and go through converting
    if (fromValue && toValue && amount > 0) {
      state.converterResult =  ratesCtrl.convert(state.preparedData, fromValue, toValue, amount);
      uiCtrl.clearResult();
      uiCtrl.renderLoader('converter');

      setTimeout(() => {
        uiCtrl.removeLoader();
        uiCtrl.displayResult(state.converterInput, state.converterResult);
      }, 1500);
    } else {
      uiCtrl.renderValidationError();
    }
  }

  const updateRates = async () => {
    // 1. Display loader after clicking the button
    uiCtrl.renderLoader();

    // 2. Clear table body 
    uiCtrl.clearTableBody();

    // 3. Retrieve new data from API
    await retrieveData();

    // 4. Mark currencies in settings as checked basing on selected currencies info from state object
    uiCtrl.checkCurrencies(state.selectedCurrenciesInSettings);

    // 5. Get these selected currencies from settings
    getSelectedCurrencies();

    // 6. Display rates selected in settings view 
    displayRates();
  }

  return {
    init: () => {
      setupEventListeners();
      retrieveData();
      displayStartView();
    },

    getState: () => {
      console.log(state);
    }
  }
})(RatesController, UIController);

AppController.init();