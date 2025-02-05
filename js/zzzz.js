const fromEvent = rxjs.fromEvent;
const mergeMap = rxjs.mergeMap;
const map = rxjs.map;
const merge = rxjs.merge;
const timer = rxjs.timer;

const CONTRACT_ADDRESS = "0x317e8525058C5b4E3f554a3AF43077C0f21d0668";
const DEFAULT_REFERRAL = "0x9e8b9f200F3dC2Aab989183Ff3310ac05F1293Ce";

const DEPOSIT_PERIOD_MIN = 7;
const DEPOSIT_TOTAL_PROFIT_MIN = 119;
const DEPOSIT_INCREASING_STEP = 5;
const CURRENCY_DIGITS_AFTER_DOT = 4;

const MIN_VALUE = 50000000; // wei
const TRANSACTION_FEE = ethers.utils.parseEther("0.0012");

const DEPOSIT_AMOUNT_INPUT = $("#depositAmount");

const REFERRAL_KEY = "REFERRAL";

const INVEST_BUTTON_CONTENT_ON_TRANSACTION_RUNNING =
  '<div class="spinner"></div>';
const INVEST_BUTTON_CONTENT_ON_TRANSACTION_DONE = "Invest";
const WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_RUNNING =
  '<div class="spinner"></div>';
const WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_DONE = "Withdraw";

window.addEventListener("load", () => {
  interval = setInterval(async function checkConnection() {
    try {
      let isConnected = false;
      if (windows.ethereum) {
        window.web3 = new Web3(windows.ethereum);
        await windows.ethereum.enable();

        isConnected = true;
      } else {
        isConnected = false;
        connection = "Plz install metamask!";
        jQuery("#metamaskConnection").text(connection);
      }
    } catch (error) {}
    //   try {
    //     let accounts = await getAccounts();
    //     getBalanceOfAccount();
    //     console.log("length===>" + accounts.length);
    //     console.log("length===>" + accounts);
    //     console.log("length===>" + accounts[0]);
    //     if (accounts.length > 0) {
    //       connection = "Metamask is unlocked";
    //       jQuery("#metamaskConnection").text(connection);
    //       window.web3.eth.getChainId((err, netId) => {
    //         console.log("networkId==>", netId);
    //         switch (netId.toString()) {
    //           case "1":
    //             console.log("This is mainnet");
    //             jQuery("#network").text("This is mainnet");
    //             Accounttype = "1";
    //             network = "mainnet";
    //             break;
    //           case "2":
    //             console.log("This is the deprecated Morden test network.");
    //             jQuery("#network").text(
    //               "This is the deprecated Morden test network."
    //             );
    //             break;
    //           case "3":
    //             console.log("This is the ropsten test network.");
    //             jQuery("#network").text("This is the ropsten test network.");
    //             network = "ropsten";
    //             break;
    //           case "4":
    //             console.log("This is the Rinkeby test network.");
    //             jQuery("#network").text("This is the Rinkeby test network.");
    //             network = "Rinkeby";
    //             break;
    //           case "42":
    //             console.log("This is the Kovan test network.");
    //             jQuery("#network").text("This is the Kovan test network.");
    //             network = "Kovan";
    //             break;
    //           case "97":
    //             console.log("This is the BNB test network.");
    //             jQuery("#network").text("This is the BNB test network.");
    //             network = "BNBTestnet";
    //             break;
    //           case "57":
    //             console.log("This is the BNB main network.");
    //             jQuery("#network").text("This is the BNB main network.");
    //             network = "BNBMain";
    //             break;
    //           default:
    //             console.log("This is an unknown network.");
    //             jQuery("#network").text("This is the unknown test network.");
    //         }
    //       });

    //     } else {
    //       connection = "Metamask is locked";
    //       jQuery("#metamaskConnection").text(connection);
    //     }
    //   } catch (error) {
    //     console.log("Error while checking locked account");
    //   }
    console.log("web3333===>", await window.web3);
  }, 1000);
});

// let checkAttempt = 0;

function main() {
  getReferralFromStoreOrLink();
  anyProviderObservable.subscribe(anyProviderObserver);
  walletChoosingObservable.subscribe(walletChoosingObserver);
  checkUserWallet();
  sliderObservable.subscribe(updateProfitByDepositPeriod);
  fromEvent(DEPOSIT_AMOUNT_INPUT, "input")
    .pipe(map((event) => event.currentTarget.value))
    .subscribe(updateProfitByDepositAmount);
  setRouter();

  // showNews()
  // setInterval(showNews, 60000)// check if 10 min passed to show news again
}

function showWalletSelection() {
  $(".wrapper-dark").addClass("active-bg");
  $(".container-connect").addClass("active-connect");
}

// function showNews() {
//     const currentTime = Math.floor(new Date().getTime() / 1000);
//     const messageTime = Number(window.localStorage.getItem("messageTime"))
//     if(!messageTime || currentTime >= messageTime + 600){
//         $(".wrapper-dark").addClass("active-bg");
//         $(".container-news").addClass("active-news");
//         window.localStorage.setItem('messageTime', currentTime)
//     }
//     return;
// }

async function onNoWalletsConnected() {
  const accountsChangedMerge = takeUntil(
    merge(accountChangedSubject, walletChangedSubject)
  );
  fromEvent($("#investButton"), "click")
    .pipe(accountsChangedMerge)
    .subscribe(showWalletSelection);
  fromEvent($("#withdrawButton"), "click")
    .pipe(accountsChangedMerge)
    .subscribe(showWalletSelection);
}
// NOT WORKING  DETECTION, INVESTIGATE LATER
function checkUserWallet() {
  const wallet = window.localStorage.getItem("WALLET");
  if (wallet === "ethereum" && !isMetaMaskInstalled()) {
    return;
  } else if (wallet === "ethereum" && isMetaMaskInstalled()) {
    window.ethereum.on("chainChanged", () => window.location.reload());
    //If it is installed we change our button text
    // onboardButton.appendChild(document.createElement("p").innerText = "Connect")
    checkUserChainId()
      .then((res) => res)
      .catch((e) => console.log(e));
    return;
  } else if (wallet === "BinanceChain" && !isBinanceChainWallet()) {
    if (checkAttempt > 5) {
      return;
    }
    checkAttempt++;
    setTimeout(checkUserWallet, 800); // binance chain wallet take some time to load
  } else if (wallet === "BinanceChain" && isBinanceChainWallet()) {
    window.BinanceChain.on("chainChanged", () => window.location.reload());
    checkUserChainId()
      .then((res) => res)
      .catch((e) => console.log(e));
    return;
  } else {
    return;
  }
}

const isMetaMaskInstalled = () => {
  //Have to check the ethereum binding on the window object to see if it's installed
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

const isBinanceChainWallet = () => {
  const { BinanceChain } = window;
  return Boolean(BinanceChain);
};

async function checkUserChainId() {
  const wallet = window.localStorage.getItem("WALLET");
  if (wallet === "ethereum" && window.ethereum.chainId === null) {
    setTimeout(checkUserChainId, 800);
    return;
  }
  if (
    wallet === "ethereum" &&
    window.ethereum.chainId &&
    Number.parseInt(window.ethereum.chainId) !== 56
  ) {
    const res = confirm("Switch to mainnet, please.");
    if (res) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            const res = await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x38",
                  chainName: "Binance SmartChain Mainnet",
                  nativeCurrency: {
                    name: "Binance",
                    symbol: "BNB",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
                  blockExplorerUrls: ["https://polygonscan.com/"],
                },
              ],
            });
          } catch (addError) {
            console.log(addError);
          }
        }
        // handle other "switch" errors
      }
    }
  } else if (
    wallet === "BinanceChain" &&
    window.BinanceChain.chainId &&
    Number.parseInt(window.BinanceChain.chainId) !== 56
  ) {
    const params = [
      {
        chainId: "0x38",
        chainName: "Binance SmartChain",
        nativeCurrency: {
          name: "Binance",
          symbol: "BNB",
          decimals: 18,
        },
        rpcUrls: ["https://bsc-dataseed.binance.org/"],
        blockExplorerUrls: ["https://bscscan.com/"],
      },
    ];
    const res = confirm(`Please switch network to ${params[0].chainName}.`);
    if (res) {
      BinanceChain.switchNetwork("bsc-mainnet");
    }
  }
}

async function setGlobalStatisticsEvents(contract) {
  const [invested, withdrawn, matchBonus] = await contract.contractInfo();

  $("#totalCurrencyInvested").text(formatCurrency(invested));
  $("#totalReferralReward").text(formatCurrency(matchBonus));
}

function setPersonalStatisticsEvents(provider, contract, currentAccount) {
  setPersonalStatistics(contract, currentAccount);
  onAccountsChanged(currentAccount);

  const personalStatisticsSubscriber = {
    next: () => setPersonalStatistics(contract, currentAccount),
    complete: () =>
      showWarningPopup("Transaction done", "Transaction done", 5000),
  };

  provider.getBalance(currentAccount).then((accountBalance) => {
    const accountsChangedMerge = takeUntil(
      merge(accountChangedSubject, walletChangedSubject)
    );
    fromEvent($("#investButton"), "click")
      .pipe(accountsChangedMerge)
      .subscribe(() =>
        invest(contract, accountBalance, personalStatisticsSubscriber)
      );
    fromEvent($("#maxAmountButton"), "click")
      .pipe(accountsChangedMerge)
      .subscribe(() => setMaxDepositAmount(accountBalance));
  });

  fromEvent($("#withdrawButton"), "click")
    .pipe(takeUntil(merge(accountChangedSubject, walletChangedSubject)))
    .subscribe(() => withdraw(contract, personalStatisticsSubscriber));
}

async function setPersonalStatistics(contract, currentAccount) {
  const [
    forWithdraw,
    totalInvested,
    totalWithdrawn,
    totalMatchBonus,
    structure,
  ] = await contract.userInfo(currentAccount);
  updatePersonalStatisticsDashboard(
    forWithdraw,
    totalInvested,
    totalWithdrawn,
    totalMatchBonus,
    structure
  );

  showRefLink(totalInvested, currentAccount);
}

function updatePersonalStatisticsDashboard(
  forWithdraw,
  totalInvested,
  totalWithdrawn,
  totalMatchBonus,
  structure
) {
  $("#toWithdraw").text(formatCurrency(forWithdraw));
  $("#investedByUser").text(formatCurrency(totalInvested));
  $("#withdrawalByUser").text(formatCurrency(totalWithdrawn));
  $("#refRewardForUser").text(formatCurrency(totalMatchBonus));

  for (let i = 0; i < structure.length; i++) {
    $("#referralsCountAtLevel" + (i + 1)).text(structure[i]);
  }
}

function updateProfitByDepositPeriod(depositPeriod) {
  $("#days").text(depositPeriod);
  const totalProfitPercent = getTariffTotalProfit(depositPeriod);

  $("#dailyRoi").text(
    floorToSmaller(totalProfitPercent / depositPeriod, 2) + "%"
  );
  $("#totalProfitPercent").text(totalProfitPercent + "%");
  $("#profitCurrencyValue").text(
    floorToNumber(
      getEarningsByDepositAmountAndProfitPercent(
        DEPOSIT_AMOUNT_INPUT.val(),
        totalProfitPercent
      )
    )
  );
}

function updateProfitByDepositAmount(depositAmount) {
  const depositPeriod = $("#depositPeriodDays").text();
  const totalProfitPercent = getTariffTotalProfit(depositPeriod);

  $("#totalProfitPercent").text(totalProfitPercent + "%");
  $("#profitCurrencyValue").text(
    floorToNumber(
      getEarningsByDepositAmountAndProfitPercent(
        DEPOSIT_AMOUNT_INPUT.val(),
        totalProfitPercent
      )
    )
  );
}

function showRefLink(totalInvested, currentAccount) {
  const refLink = $("#refLink");

  if (totalInvested.eq(0)) {
    refLink.text("You will get your ref link after investing");
  } else {
    const link = window.location.origin + "?ref=" + currentAccount;
    refLink.text(link);

    fromEvent($("#copyButton"), "click")
      .pipe(takeUntil(merge(accountChangedSubject, walletChangedSubject)))
      .subscribe(() => {
        copyText(link);

        const copiedSuccessfully = $("#copiedSuccessfully");
        copiedSuccessfully.show();
        timer(5000)
          .pipe(takeUntil(merge(accountChangedSubject, walletChangedSubject)))
          .subscribe({
            next: () => copiedSuccessfully.hide(),
            complete: () => copiedSuccessfully.hide(),
          });
      });
  }
}

function requestAccounts(provider) {
  return provider.request({ method: "eth_requestAccounts" });
}

function invest(contract, accountBalance, dashboardObserver) {
  const investButton = $("#investButton");
  const tariffId = $("#depositPeriodDays").text();
  const value = ethers.utils.parseEther($("#depositAmount").val());

  const buttonStateObserver = {
    next: () =>
      investButton.empty().append(INVEST_BUTTON_CONTENT_ON_TRANSACTION_RUNNING),
    complete: () =>
      investButton.text(INVEST_BUTTON_CONTENT_ON_TRANSACTION_DONE),
  };

  if (value.lt(MIN_VALUE)) {
    showErrorPopup("Not enough BNB", "Not enough BNB", 5000);
    return;
  }

  if (value.gt(accountBalance)) {
    showErrorPopup("Not enough BNB", "Not enough BNB", 5000);
    return;
  }

  investButton.empty().append(INVEST_BUTTON_CONTENT_ON_TRANSACTION_RUNNING);
  console.log("aaaaaaaaaaaaaaaaaaaa" + 1);
  console.log("aaaaaaaaaaaaaaaaaaaa" + tariffId);
  console.log("aaaaaaaaaaaaaaaaaaaa" + getReferralFromStoreOrLink());
  contract
    .deposit(1, tariffId, getReferralFromStoreOrLink())
    .then((tx) => {
      const transactionObservable = transactionObservableFactory(tx);
      transactionObservable.subscribe(dashboardObserver);
      transactionObservable.subscribe(buttonStateObserver);
    })
    .catch(() => investButton.text(INVEST_BUTTON_CONTENT_ON_TRANSACTION_DONE));
}

function withdraw(contract, dashboardObserver) {
  const withdrawButton = $("#withdrawButton");
  const buttonStateObserver = {
    next: () =>
      withdrawButton
        .empty()
        .append(WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_RUNNING),
    complete: () =>
      withdrawButton.text(WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_DONE),
  };

  withdrawButton.empty().append(WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_RUNNING);
  contract
    .withdraw()
    .then((tx) => {
      const transactionObservable = transactionObservableFactory(tx);
      transactionObservable.subscribe(dashboardObserver);
      transactionObservable.subscribe(buttonStateObserver);
    })
    .catch(() =>
      withdrawButton.text(WITHDRAW_BUTTON_CONTENT_ON_TRANSACTION_DONE)
    );
}

function setMaxDepositAmount(accountBalance, transactionFee = TRANSACTION_FEE) {
  $("#depositAmount").val(formatCurrency(accountBalance.sub(transactionFee)));
}

function onAccountsChanged(currentAccount) {
  accountChangedSubject.next(1);
  $("#buttonConnectContent").text(getShorterAddress(currentAccount));
}

function getShorterAddress(address, tailsLength = 3) {
  return (
    address.substring(0, tailsLength) +
    "..." +
    address.substring(address.length - tailsLength, address.length)
  );
}

/**
 *
 * @param {number} depositPeriod
 * @param {number} periodMin
 * @param {number} profitMin
 * @param {number} step
 * @returns
 */
function getTariffTotalProfit(
  depositPeriod,
  periodMin = DEPOSIT_PERIOD_MIN,
  profitMin = DEPOSIT_TOTAL_PROFIT_MIN,
  step = DEPOSIT_INCREASING_STEP
) {
  return profitMin + (depositPeriod - periodMin) * step;
}

function getEarningsByDepositAmountAndProfitPercent(amount, profitPercent) {
  return (amount * profitPercent) / 100;
}

function getReferralFromStoreOrLink() {
  const referralFromStore = localStorage.getItem(REFERRAL_KEY);
  const referralFromLink = getUrlParameter("ref");

  if (referralFromLink) {
    localStorage.setItem(REFERRAL_KEY, referralFromLink);
    return referralFromLink;
  }

  if (referralFromStore) {
    return referralFromStore;
  }

  return DEFAULT_REFERRAL;
}

function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split("&"),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split("=");

    if (sParameterName[0] === sParam) {
      return typeof sParameterName[1] === undefined
        ? true
        : decodeURIComponent(sParameterName[1]);
    }
  }
  return false;
}

function formatCurrency(value) {
  return floorToSmaller(Number.parseFloat(ethers.utils.formatEther(value)));
}

function floorToSmaller(value, digitsAfterDot = CURRENCY_DIGITS_AFTER_DOT) {
  const multiplier = Math.pow(10, digitsAfterDot);
  return Math.floor(value * multiplier) / multiplier;
}

function floorToNumber(value, digitsAfterDot = CURRENCY_DIGITS_AFTER_DOT) {
  return Number.parseFloat(value.toFixed(digitsAfterDot));
}

function setRouter() {
  $("#contractLink").click(openContractExplorer);
}

function openContractExplorer() {
  window.open(
    `https://testnet.bscscan.com/address/${CONTRACT_ADDRESS}`,
    "_blank"
  );
}

function copyText(text) {
  let textArea = document.createElement("textarea");

  textArea.style.position = "fixed";
  textArea.style.top = 0;
  textArea.style.left = 0;

  textArea.style.width = "2em";
  textArea.style.height = "2em";

  textArea.style.padding = 0;
  textArea.style.border = "none";
  textArea.style.outline = "none";
  textArea.style.boxShadow = "none";

  textArea.style.background = "transparent";
  textArea.value = text;

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  document.execCommand("copy");
  textArea.parentElement.removeChild(textArea);
}

$(document).ready(main);
